"""
SPARK -- Flask Application
Smart Power Analytics & Recommendation for Kilowatt Optimization

Serves the trained Gradient Boosting model via a REST API
and hosts the Jinja2 multi-page frontend dashboard.
"""

import os
import json
import pickle
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS

# -- paths ------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "models")
REPORT_DIR = os.path.join(BASE_DIR, "reports")
DATA_DIR = os.path.join(BASE_DIR, "data")
STATIC_DIR = os.path.join(BASE_DIR, "static")
TEMPLATE_DIR = os.path.join(BASE_DIR, "templates")

# -- load artifacts once at startup -----------------------------------------
with open(os.path.join(MODEL_DIR, "best_model.pkl"), "rb") as f:
    model = pickle.load(f)

with open(os.path.join(MODEL_DIR, "scaler.pkl"), "rb") as f:
    scaler = pickle.load(f)

with open(os.path.join(MODEL_DIR, "label_encoders.pkl"), "rb") as f:
    label_encoders = pickle.load(f)

with open(os.path.join(MODEL_DIR, "model_meta.json")) as f:
    model_meta = json.load(f)

MODEL_FEATURES = model_meta["model_features"]

# -- wattage map (mirrors 05_feature_engineering.py) -------------------------
WATTAGE = {
    "Fan": 75,
    "Refrigerator": 150,
    "AirConditioner": 1500,
    "Television": 100,
    "Monitor": 30,
}

# -- city tariff lookup (from dataset) ---------------------------------------
CITY_TARIFFS = {
    "Ahmedabad": 7.9, "Chennai": 8.8, "Dahej": 7.6, "Faridabad": 8.1,
    "Gurgaon": 8.3, "Hyderabad": 8.4, "Kolkata": 8.7, "Mumbai": 9.2,
    "Nagpur": 8.9, "Navi Mumbai": 9.3, "New Delhi": 8.5, "Noida": 8.2,
    "Pune": 9.1, "Ratnagiri": 7.4, "Shimla": 7.7, "Vadodara": 7.8,
}

# -- season mapping (mirrors 05_feature_engineering.py) ----------------------
def to_season(m: int) -> str:
    if m in (12, 1, 2):
        return "Winter"
    elif m in (3, 4, 5, 6):
        return "Summer"
    elif m in (7, 8, 9):
        return "Monsoon"
    else:
        return "Post_Monsoon"


# -- efficiency score (0-100) based on predicted consumption -----------------
def efficiency_score(predicted_hours: float) -> int:
    """
    Maps predicted monthly hours to a 0-100 score.
    Lower consumption = higher score.
    Uses the dataset's observed range (95-926 hrs).
    """
    MIN_HOURS, MAX_HOURS = 95, 926
    clamped = max(MIN_HOURS, min(MAX_HOURS, predicted_hours))
    score = 100 * (1 - (clamped - MIN_HOURS) / (MAX_HOURS - MIN_HOURS))
    return int(round(score))


# -- personalized recommendations -------------------------------------------
def get_recommendations(data: dict, predicted_hours: float) -> list:
    """Generate actionable energy-saving recommendations."""
    recs = []
    fan = data.get("Fan", 0)
    fridge = data.get("Refrigerator", 0)
    ac = data.get("AirConditioner", 0)
    tv = data.get("Television", 0)
    monitor = data.get("Monitor", 0)

    # AC -- biggest wattage contributor
    if ac >= 2:
        recs.append({
            "icon": "snowflake",
            "title": "Optimize Air Conditioner Usage",
            "detail": f"Your AC runs ~{ac} hrs/day. Setting the thermostat to 24 degrees C instead of lower temps can cut AC power by ~20%. Consider using a timer to avoid running it overnight.",
            "potential_saving": "15-25%"
        })

    # Fan
    if fan >= 15:
        recs.append({
            "icon": "fan",
            "title": "Switch to Energy-Efficient Fans",
            "detail": f"With {fan} hrs/day of fan usage, upgrading to BLDC fans (28W vs 75W) would cut fan electricity by ~63%.",
            "potential_saving": "5-10%"
        })

    # Television
    if tv >= 12:
        recs.append({
            "icon": "tv",
            "title": "Reduce Television Standby Time",
            "detail": f"Your TV runs ~{tv} hrs/day. Unplugging when not in use and enabling auto-off timers can save 3-5% of total consumption.",
            "potential_saving": "3-5%"
        })

    # Monitor
    if monitor >= 5:
        recs.append({
            "icon": "desktop",
            "title": "Enable Monitor Power Saving",
            "detail": f"Monitor usage at {monitor} hrs/day. Use auto-sleep after 5 minutes of inactivity and lower screen brightness.",
            "potential_saving": "1-3%"
        })

    # Refrigerator (always on but tips still help)
    if fridge >= 22:
        recs.append({
            "icon": "temperature-low",
            "title": "Optimize Refrigerator Efficiency",
            "detail": "Keep your refrigerator at 3-5 degrees C (fridge) and -18 degrees C (freezer). Ensure door seals are tight and don't place hot food directly inside.",
            "potential_saving": "2-4%"
        })

    # General high-consumption
    if predicted_hours > 600:
        recs.append({
            "icon": "bolt",
            "title": "Consider a Home Energy Audit",
            "detail": "Your predicted consumption is above average. An energy audit can identify hidden inefficiencies in wiring, insulation, or old appliances.",
            "potential_saving": "10-20%"
        })

    # Season-aware
    month = data.get("Month", 6)
    season = to_season(month)
    if season == "Summer":
        recs.append({
            "icon": "sun",
            "title": "Summer Peak Management",
            "detail": "Summer months drive peak consumption. Use curtains/blinds during the day and shift heavy appliance usage to early morning or late night.",
            "potential_saving": "5-8%"
        })
    elif season == "Winter":
        recs.append({
            "icon": "mitten",
            "title": "Winter Energy Tips",
            "detail": "Leverage natural sunlight for warmth during winter days. Reduce heater usage by using warm clothing indoors.",
            "potential_saving": "3-5%"
        })

    # Always include a general tip
    recs.append({
        "icon": "lightbulb",
        "title": "Switch to LED Lighting",
        "detail": "If you haven't already, replacing CFL/incandescent bulbs with LED can reduce lighting costs by up to 80%.",
        "potential_saving": "3-7%"
    })

    return recs


# -- normalize payload keys --------------------------------------------------
def normalize_payload(data: dict) -> dict:
    """
    Accept both PascalCase (Fan, AirConditioner) and
    snake_case (fan, air_conditioner) keys from the frontend.
    Returns a dict with canonical PascalCase keys.
    """
    KEY_MAP = {
        "fan": "Fan",
        "refrigerator": "Refrigerator",
        "air_conditioner": "AirConditioner",
        "airconditioner": "AirConditioner",
        "television": "Television",
        "monitor": "Monitor",
        "month": "Month",
        "city": "City",
        "company": "Company",
        "tariffrate": "TariffRate",
        "tariff_rate": "TariffRate",
    }
    normalized = {}
    for k, v in data.items():
        canonical = KEY_MAP.get(k.lower(), k)
        normalized[canonical] = v
    return normalized


# -- Flask app ---------------------------------------------------------------
app = Flask(
    __name__,
    static_folder=STATIC_DIR,
    template_folder=TEMPLATE_DIR,
)
CORS(app)


# ═══════════════ PAGE ROUTES (Jinja2 Templates) ═══════════════

@app.route("/")
def home():
    return render_template("index.html")


@app.route("/predict")
def predictor():
    return render_template("predict.html")


@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")


@app.route("/insights")
def insights():
    return render_template("insights.html")


@app.route("/model")
def model_benchmarks():
    return render_template("model.html")


@app.route("/about")
def about():
    return render_template("about.html")


# ═══════════════ API ROUTES (Backend ML) ═══════════════

@app.route("/api/metadata", methods=["GET"])
def metadata():
    """Return model info, cities, companies for the frontend dropdowns."""
    cities = sorted(label_encoders["City"].classes_.tolist())
    companies = sorted(label_encoders["Company"].classes_.tolist())

    # Feature importance
    fi_path = os.path.join(REPORT_DIR, "feature_importance.csv")
    fi = pd.read_csv(fi_path).to_dict(orient="records") if os.path.exists(fi_path) else []

    # Model performance
    mp_path = os.path.join(REPORT_DIR, "model_performance_comparison.csv")
    mp = pd.read_csv(mp_path).to_dict(orient="records") if os.path.exists(mp_path) else []

    return jsonify({
        "cities": cities,
        "companies": companies,
        "model_name": model_meta.get("best_model", "Gradient Boosting"),
        "model_metrics": model_meta.get("best_model_metrics", {}),
        "feature_importance": fi,
        "model_comparison": mp,
        "feature_ranges": {
            "Fan": {"min": 5, "max": 23, "default": 14, "unit": "hrs/day"},
            "Refrigerator": {"min": 17, "max": 23, "default": 22, "unit": "hrs/day"},
            "AirConditioner": {"min": 0, "max": 3, "default": 2, "unit": "hrs/day"},
            "Television": {"min": 3, "max": 22, "default": 13, "unit": "hrs/day"},
            "Monitor": {"min": 1, "max": 12, "default": 1, "unit": "hrs/day"},
        }
    })


@app.route("/api/predict", methods=["POST"])
def predict_api():
    """
    Accepts JSON with either PascalCase or snake_case keys:
      { Fan, Refrigerator, AirConditioner, Television, Monitor, Month, City, Company, TariffRate }
      or
      { fan, refrigerator, air_conditioner, television, monitor, month, city, company }
    Returns predicted consumption, bill, efficiency score, and recommendations.
    """
    raw_data = request.get_json(force=True)
    data = normalize_payload(raw_data)

    # Auto-resolve TariffRate from city if not explicitly provided
    if "TariffRate" not in data and "City" in data:
        data["TariffRate"] = CITY_TARIFFS.get(data["City"], 8.4)

    # -- validate required fields --
    required = ["Fan", "Refrigerator", "AirConditioner", "Television",
                 "Monitor", "Month", "City", "Company", "TariffRate"]
    missing = [f for f in required if f not in data]
    if missing:
        return jsonify({"error": f"Missing fields: {missing}"}), 400

    try:
        fan = float(data["Fan"])
        fridge = float(data["Refrigerator"])
        ac = float(data["AirConditioner"])
        tv = float(data["Television"])
        monitor = float(data["Monitor"])
        month = int(data["Month"])
        tariff = float(data["TariffRate"])
        city = str(data["City"])
        company = str(data["Company"])
    except (ValueError, TypeError) as e:
        return jsonify({"error": f"Invalid field value: {e}"}), 400

    # -- guard: if all appliance hours are zero, skip model (out-of-distribution) --
    total_appliance_hours = fan + fridge + ac + tv + monitor
    if total_appliance_hours <= 0:
        season = to_season(month)
        return jsonify({
            "predicted_monthly_hours": 0,
            "predicted_hours": 0,
            "predicted_monthly_bill": 0,
            "estimated_bill": 0,
            "efficiency_score": 100,
            "tariff_rate": tariff,
            "tariff": tariff,
            "season": season,
            "total_appliance_hours": 0,
            "estimated_load_kwh": 0,
            "appliance_breakdown": [],
            "appliance_kwh": {},
            "recommendations": [{"icon": "bolt", "title": "No Appliances Active", "detail": "All appliance hours are set to zero. Adjust the sliders to see a prediction.", "potential_saving": "N/A"}],
            "city": city,
            "company": company,
            "month": month,
            "input_summary": {"city": city, "company": company, "month": month},
            "isMock": False,
        })

    # -- feature engineering (identical to 05_feature_engineering.py) --
    total_appliance_hours = fan + fridge + ac + tv + monitor
    estimated_load_kwh = (
        fan * WATTAGE["Fan"]
        + fridge * WATTAGE["Refrigerator"]
        + ac * WATTAGE["AirConditioner"]
        + tv * WATTAGE["Television"]
        + monitor * WATTAGE["Monitor"]
    ) / 1000

    month_sin = np.sin(2 * np.pi * month / 12)
    month_cos = np.cos(2 * np.pi * month / 12)

    season = to_season(month)

    # -- encode categoricals --
    try:
        city_enc = label_encoders["City"].transform([city])[0]
    except ValueError:
        return jsonify({"error": f"Unknown city: '{city}'. Valid: {sorted(label_encoders['City'].classes_.tolist())}"}), 400

    try:
        company_enc = label_encoders["Company"].transform([company])[0]
    except ValueError:
        return jsonify({"error": f"Unknown company: '{company}'. Valid: {sorted(label_encoders['Company'].classes_.tolist())}"}), 400

    try:
        season_enc = label_encoders["Season"].transform([season])[0]
    except ValueError:
        return jsonify({"error": f"Unknown season: '{season}'"}), 400

    # -- build feature vector in model order --
    feature_values = {
        "Fan": fan,
        "Refrigerator": fridge,
        "AirConditioner": ac,
        "Television": tv,
        "Monitor": monitor,
        "Total_Appliance_Hours": total_appliance_hours,
        "Estimated_Load_kWh": estimated_load_kwh,
        "Month_sin": month_sin,
        "Month_cos": month_cos,
        "City_Encoded": city_enc,
        "Company_Encoded": company_enc,
        "Season_Encoded": season_enc,
    }

    X_raw = pd.DataFrame([feature_values])[MODEL_FEATURES]

    # -- scale --
    X_scaled = scaler.transform(X_raw)

    # -- predict --
    predicted_hours = float(model.predict(X_scaled)[0])
    predicted_hours = max(0, predicted_hours)  # clamp to non-negative

    # -- derived outputs --
    predicted_bill = round(predicted_hours * tariff, 2)
    eff_score = efficiency_score(predicted_hours)
    recs = get_recommendations(data, predicted_hours)

    # -- appliance-level breakdown (proportional to wattage-weighted hours) --
    appliance_kwh = {
        "Fan": fan * WATTAGE["Fan"] / 1000,
        "Refrigerator": fridge * WATTAGE["Refrigerator"] / 1000,
        "Air Conditioner": ac * WATTAGE["AirConditioner"] / 1000,
        "Television": tv * WATTAGE["Television"] / 1000,
        "Monitor": monitor * WATTAGE["Monitor"] / 1000,
    }
    total_kwh = sum(appliance_kwh.values()) or 1
    breakdown = [
        {"name": name, "kwh": round(kwh, 2), "percentage": round(100 * kwh / total_kwh, 1)}
        for name, kwh in sorted(appliance_kwh.items(), key=lambda x: -x[1])
    ]

    return jsonify({
        "predicted_monthly_hours": round(predicted_hours, 2),
        "predicted_hours": round(predicted_hours, 2),
        "predicted_monthly_bill": predicted_bill,
        "estimated_bill": predicted_bill,
        "efficiency_score": eff_score,
        "tariff_rate": tariff,
        "tariff": tariff,
        "season": season,
        "total_appliance_hours": round(total_appliance_hours, 1),
        "estimated_load_kwh": round(estimated_load_kwh, 2),
        "appliance_breakdown": breakdown,
        "appliance_kwh": appliance_kwh,
        "recommendations": recs,
        "city": city,
        "company": company,
        "month": month,
        "input_summary": {
            "city": city,
            "company": company,
            "month": month,
        },
        "isMock": False,
    })


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model": model_meta.get("best_model")})


# -- entry point -------------------------------------------------------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"
    print(f"\n[SPARK] Running at http://localhost:{port}\n")
    app.run(host="0.0.0.0", port=port, debug=debug)
