"""
SPARK - Smart Power Analytics & Recommendation for Kilowatt Optimization
Standalone ML Pipeline Script

Runs the full pipeline end-to-end:
  1. Weather climatology (Month-level aggregation from single-location Open-Meteo export)
  2. Merge weather onto the bill dataset (join key: Month)
  3. Data cleaning (duplicates, constant columns, IQR outlier report)
  4. EDA (correlations + business insights, printed + saved)
  5. Feature engineering (Total_Appliance_Hours, Estimated_Load_kWh,
     cyclical Month, Season, categorical encoding)
  6. Train/test split + scaling
  7. Model training (7 models compared)
  8. Evaluation (plots + feature importance)

Design decisions baked into this pipeline (see README for full reasoning):
  - Target = MonthlyHours (consumption), NOT ElectricityBill.
    ElectricityBill = MonthlyHours * TariffRate exactly, so using Bill as the
    target (or MonthlyHours/TariffRate as features for it) is leakage.
    Bill is computed AFTER prediction: predicted_bill = pred_hours * tariff.
  - Weather is a single-location NATIONAL/SEASONAL proxy, not per-city -
    documented simplification, not an error.

Usage:
    python pipeline.py                      # run all steps
    python pipeline.py --skip-plots         # skip matplotlib (faster, headless-safe)
    python pipeline.py --bill-csv path.csv --weather-csv path.csv
"""
import argparse
import io
import json
import pickle
import time
import warnings
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.svm import SVR
from sklearn.tree import DecisionTreeRegressor

warnings.filterwarnings("ignore")

try:
    from xgboost import XGBRegressor
    HAS_XGB = True
except ImportError:
    HAS_XGB = False

# --- Project layout (resolved relative to this file, so it runs from anywhere) ---
ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
MODELS_DIR = ROOT / "models"
REPORTS_DIR = ROOT / "reports"
VISUALS_DIR = ROOT / "visuals"
for d in (DATA_DIR, MODELS_DIR, REPORTS_DIR, VISUALS_DIR):
    d.mkdir(parents=True, exist_ok=True)

APPLIANCE_COLS = ["Fan", "Refrigerator", "AirConditioner", "Television", "Monitor"]
WATTAGE = {"Fan": 75, "Refrigerator": 150, "AirConditioner": 1500, "Television": 100, "Monitor": 30}


def log(step, msg):
    print(f"[{step}] {msg}")


# ---------------------------------------------------------------------------
# Step 1: Weather climatology
# ---------------------------------------------------------------------------
def build_weather_climatology(weather_csv: Path) -> pd.DataFrame:
    lines = weather_csv.read_text().splitlines(keepends=True)
    hourly_header_idx = next(i for i, l in enumerate(lines) if l.startswith("time,temperature_2m ("))
    daily_header_idx = next(i for i, l in enumerate(lines) if l.startswith("time,temperature_2m_max"))

    hourly_block = "".join(lines[hourly_header_idx:daily_header_idx - 1])
    hourly_df = pd.read_csv(io.StringIO(hourly_block))
    daily_df = pd.read_csv(io.StringIO("".join(lines[daily_header_idx:])))

    hourly_df.columns = [c.split(" (")[0] for c in hourly_df.columns]
    daily_df.columns = [c.split(" (")[0] for c in daily_df.columns]
    hourly_df["time"] = pd.to_datetime(hourly_df["time"])
    daily_df["time"] = pd.to_datetime(daily_df["time"])
    hourly_df["Month"] = hourly_df["time"].dt.month
    daily_df["Month"] = daily_df["time"].dt.month

    monthly_humidity_precip = hourly_df.groupby("Month").agg(
        Avg_Humidity=("relative_humidity_2m", "mean"),
        Avg_Apparent_Temp=("apparent_temperature", "mean"),
        Total_Precipitation=("precipitation", "sum"),
    ).reset_index()

    monthly_temp = daily_df.groupby("Month").agg(
        Avg_Temp_Max=("temperature_2m_max", "mean"),
        Avg_Temp_Min=("temperature_2m_min", "mean"),
        Avg_Temp_Mean=("temperature_2m_mean", "mean"),
    ).reset_index()

    climatology = monthly_temp.merge(monthly_humidity_precip, on="Month", how="outer").sort_values("Month").round(2)
    climatology.to_csv(DATA_DIR / "monthly_climatology.csv", index=False)
    log("1/8 Weather", f"Built {len(climatology)}-month climatology -> data/monthly_climatology.csv")
    return climatology


# ---------------------------------------------------------------------------
# Step 2: Merge
# ---------------------------------------------------------------------------
def merge_datasets(bill_df: pd.DataFrame, climatology_df: pd.DataFrame) -> pd.DataFrame:
    merged = bill_df.merge(climatology_df, on="Month", how="left")
    assert len(merged) == len(bill_df), "Merge changed row count - check join key"
    assert merged.isnull().sum().sum() == 0, "Merge introduced nulls"
    merged.to_csv(DATA_DIR / "merged_dataset.csv", index=False)
    log("2/8 Merge", f"Merged -> shape {merged.shape} -> data/merged_dataset.csv")
    return merged


# ---------------------------------------------------------------------------
# Step 3: Cleaning
# ---------------------------------------------------------------------------
def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    log_dict = {}
    n_dupes = int(df.duplicated().sum())
    df = df.drop_duplicates()
    log_dict["duplicate_rows_dropped"] = n_dupes

    const_cols = [c for c in df.columns if df[c].nunique() == 1]
    log_dict["constant_columns_dropped"] = const_cols
    df = df.drop(columns=const_cols)

    numeric_cols = [c for c in ["Fan", "Refrigerator", "AirConditioner", "Television", "Monitor",
                                 "MonthlyHours", "TariffRate", "ElectricityBill"] if c in df.columns]
    outlier_summary = {}
    for col in numeric_cols:
        Q1, Q3 = df[col].quantile(0.25), df[col].quantile(0.75)
        IQR = Q3 - Q1
        lower, upper = Q1 - 1.5 * IQR, Q3 + 1.5 * IQR
        n_out = int(((df[col] < lower) | (df[col] > upper)).sum())
        outlier_summary[col] = {"lower": round(lower, 2), "upper": round(upper, 2), "n_outliers": n_out}
    log_dict["iqr_outliers"] = outlier_summary

    with open(REPORTS_DIR / "data_cleaning_log.json", "w") as f:
        json.dump(log_dict, f, indent=2)

    df.to_csv(DATA_DIR / "cleaned_dataset.csv", index=False)
    log("3/8 Clean", f"Dupes dropped={n_dupes}, constant cols dropped={const_cols} -> shape {df.shape}")
    return df


# ---------------------------------------------------------------------------
# Step 4: EDA
# ---------------------------------------------------------------------------
def run_eda(df: pd.DataFrame) -> dict:
    numeric_features = APPLIANCE_COLS + ["Avg_Temp_Max", "Avg_Temp_Min", "Avg_Temp_Mean",
                                          "Avg_Humidity", "Avg_Apparent_Temp", "Total_Precipitation"]
    corr = df[numeric_features + ["MonthlyHours"]].corr()["MonthlyHours"].drop("MonthlyHours")
    corr = corr.sort_values(key=abs, ascending=False)
    corr.to_csv(REPORTS_DIR / "correlation_with_target.csv")

    bill_by_city = df.groupby("City")["ElectricityBill"].mean().sort_values(ascending=False)
    hours_by_month = df.groupby("Month")["MonthlyHours"].mean().sort_index()

    insights = {
        "strongest_correlate_with_consumption": {"feature": corr.index[0], "correlation": round(float(corr.iloc[0]), 3)},
        "highest_avg_bill_city": bill_by_city.idxmax(),
        "lowest_avg_bill_city": bill_by_city.idxmin(),
        "peak_consumption_month": int(hours_by_month.idxmax()),
        "lowest_consumption_month": int(hours_by_month.idxmin()),
    }
    with open(REPORTS_DIR / "eda_business_insights.json", "w") as f:
        json.dump(insights, f, indent=2)

    log("4/8 EDA", f"Top correlate={insights['strongest_correlate_with_consumption']} -> reports/eda_business_insights.json")
    return insights


# ---------------------------------------------------------------------------
# Step 5: Feature engineering
# ---------------------------------------------------------------------------
def engineer_features(df: pd.DataFrame):
    df = df.copy()
    df["Total_Appliance_Hours"] = df[APPLIANCE_COLS].sum(axis=1)
    df["Estimated_Load_kWh"] = sum(df[c] * w for c, w in WATTAGE.items()) / 1000
    df["Month_sin"] = np.sin(2 * np.pi * df["Month"] / 12)
    df["Month_cos"] = np.cos(2 * np.pi * df["Month"] / 12)

    def to_season(m):
        if m in (12, 1, 2):
            return "Winter"
        elif m in (3, 4, 5, 6):
            return "Summer"
        elif m in (7, 8, 9):
            return "Monsoon"
        return "Post_Monsoon"

    df["Season"] = df["Month"].apply(to_season)

    encoders = {}
    for col in ["City", "Company", "Season"]:
        le = LabelEncoder()
        df[col + "_Encoded"] = le.fit_transform(df[col])
        encoders[col] = le
    with open(MODELS_DIR / "label_encoders.pkl", "wb") as f:
        pickle.dump(encoders, f)

    model_features = [
        "Fan", "Refrigerator", "AirConditioner", "Television", "Monitor",
        "Total_Appliance_Hours", "Estimated_Load_kWh",
        "Month_sin", "Month_cos",
        "City_Encoded", "Company_Encoded", "Season_Encoded",
    ]
    target = "MonthlyHours"

    meta = {
        "model_features": model_features,
        "target": target,
        "excluded_leakage_columns": ["TariffRate", "ElectricityBill"],
        "note": "TariffRate is kept for post-hoc Bill = predicted_MonthlyHours * TariffRate, not used as a model input.",
    }
    with open(REPORTS_DIR / "feature_list.json", "w") as f:
        json.dump(meta, f, indent=2)

    df.to_csv(DATA_DIR / "engineered_dataset.csv", index=False)
    log("5/8 Features", f"{len(model_features)} model features -> data/engineered_dataset.csv")
    return df, model_features, target


# ---------------------------------------------------------------------------
# Step 6: Split + scale
# ---------------------------------------------------------------------------
def split_and_scale(df: pd.DataFrame, features: list, target: str):
    X, y = df[features], df[target]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    scaler = StandardScaler()
    X_train_scaled = pd.DataFrame(scaler.fit_transform(X_train), columns=features, index=X_train.index)
    X_test_scaled = pd.DataFrame(scaler.transform(X_test), columns=features, index=X_test.index)

    with open(MODELS_DIR / "scaler.pkl", "wb") as f:
        pickle.dump(scaler, f)

    log("6/8 Split", f"Train={X_train.shape}, Test={X_test.shape}")
    return X_train_scaled, X_test_scaled, y_train, y_test


# ---------------------------------------------------------------------------
# Step 7: Train & compare models
# ---------------------------------------------------------------------------
def train_models(X_train, X_test, y_train, y_test):
    models = {
        "Linear Regression": LinearRegression(),
        "Ridge Regression": Ridge(alpha=1.0, random_state=42),
        "Decision Tree": DecisionTreeRegressor(max_depth=10, random_state=42),
        "Random Forest": RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42, n_jobs=-1),
        "Gradient Boosting": GradientBoostingRegressor(n_estimators=100, max_depth=3, random_state=42),
    }
    if HAS_XGB:
        models["XGBoost"] = XGBRegressor(n_estimators=100, max_depth=4, learning_rate=0.1, random_state=42, n_jobs=-1)

    svr_idx = X_train.sample(n=min(3000, len(X_train)), random_state=42).index
    X_train_svr, y_train_svr = X_train.loc[svr_idx], y_train.loc[svr_idx]
    models["SVR (3k subsample)"] = SVR(kernel="rbf", C=10, epsilon=1)

    results, trained = [], {}
    for name, model in models.items():
        t0 = time.time()
        if name.startswith("SVR"):
            model.fit(X_train_svr, y_train_svr)
            cv = cross_val_score(model, X_train_svr, y_train_svr, cv=3, scoring="r2", n_jobs=1)
        else:
            model.fit(X_train, y_train)
            cv = cross_val_score(model, X_train, y_train, cv=3, scoring="r2", n_jobs=1)
        preds = model.predict(X_test)
        mae = mean_absolute_error(y_test, preds)
        rmse = np.sqrt(mean_squared_error(y_test, preds))
        r2 = r2_score(y_test, preds)
        elapsed = time.time() - t0
        results.append({"Model": name, "MAE": round(mae, 3), "RMSE": round(rmse, 3),
                         "R2": round(r2, 4), "CV_R2_Mean": round(cv.mean(), 4),
                         "CV_R2_Std": round(cv.std(), 4), "Train_Time_Sec": round(elapsed, 2)})
        trained[name] = model
        log("7/8 Train", f"{name:20s} R2={r2:.4f}  CV_R2={cv.mean():.4f}±{cv.std():.4f}  ({elapsed:.1f}s)")

    results_df = pd.DataFrame(results).sort_values("R2", ascending=False)
    results_df.to_csv(REPORTS_DIR / "model_performance_comparison.csv", index=False)

    best_name = results_df.iloc[0]["Model"]
    best_model = trained[best_name]
    with open(MODELS_DIR / "best_model.pkl", "wb") as f:
        pickle.dump(best_model, f)

    with open(REPORTS_DIR / "feature_list.json") as f:
        meta = json.load(f)
    meta["best_model"] = best_name
    meta["best_model_metrics"] = results_df.iloc[0].to_dict()
    with open(MODELS_DIR / "model_meta.json", "w") as f:
        json.dump(meta, f, indent=2, default=str)

    log("7/8 Train", f"Best model: {best_name} (R2={results_df.iloc[0]['R2']}) -> models/best_model.pkl")
    return results_df, meta


# ---------------------------------------------------------------------------
# Step 8: Evaluation
# ---------------------------------------------------------------------------
def evaluate_model(model, X_test, y_test, features, meta, make_plots=True):
    preds = model.predict(X_test)
    residuals = y_test - preds
    importance_df = None

    if hasattr(model, "feature_importances_"):
        importance_df = pd.DataFrame({"Feature": features, "Importance": model.feature_importances_}) \
            .sort_values("Importance", ascending=False)
        importance_df.to_csv(REPORTS_DIR / "feature_importance.csv", index=False)
        log("8/8 Eval", f"Top feature: {importance_df.iloc[0]['Feature']} ({importance_df.iloc[0]['Importance']:.3f})")

    if not make_plots:
        log("8/8 Eval", "Skipping plots (--skip-plots)")
        return residuals

    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    fig, ax = plt.subplots(figsize=(7, 7))
    ax.scatter(y_test, preds, alpha=0.15, s=10, color="#2563eb")
    lims = [min(y_test.min(), preds.min()), max(y_test.max(), preds.max())]
    ax.plot(lims, lims, color="red", linestyle="--", label="Perfect prediction")
    ax.set_xlabel("Actual MonthlyHours"); ax.set_ylabel("Predicted MonthlyHours")
    ax.set_title(f"Actual vs Predicted ({meta['best_model']}, R\u00b2={meta['best_model_metrics']['R2']})")
    ax.legend(); plt.tight_layout()
    plt.savefig(VISUALS_DIR / "actual_vs_predicted.png", dpi=120); plt.close()

    fig, ax = plt.subplots(figsize=(8, 5))
    ax.scatter(preds, residuals, alpha=0.15, s=10, color="#16a34a")
    ax.axhline(0, color="red", linestyle="--")
    ax.set_xlabel("Predicted MonthlyHours"); ax.set_ylabel("Residual"); ax.set_title("Residual Plot")
    plt.tight_layout(); plt.savefig(VISUALS_DIR / "residual_plot.png", dpi=120); plt.close()

    if importance_df is not None:
        fig, ax = plt.subplots(figsize=(8, 6))
        ax.barh(importance_df["Feature"][::-1], importance_df["Importance"][::-1], color="#ea580c")
        ax.set_xlabel("Importance"); ax.set_title(f"Feature Importance - {meta['best_model']}")
        plt.tight_layout(); plt.savefig(VISUALS_DIR / "feature_importance.png", dpi=120); plt.close()

    log("8/8 Eval", f"Residual mean={residuals.mean():.3f}, std={residuals.std():.3f} -> visuals/*.png")
    return residuals


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def run_pipeline(bill_csv: Path, weather_csv: Path, skip_plots: bool = False):
    t_start = time.time()
    print("=" * 70)
    print("SPARK PIPELINE - Smart Power Analytics & Recommendation")
    print("=" * 70)

    bill_df = pd.read_csv(bill_csv)
    climatology = build_weather_climatology(weather_csv)
    merged = merge_datasets(bill_df, climatology)
    cleaned = clean_data(merged)
    run_eda(cleaned)
    engineered, features, target = engineer_features(cleaned)
    X_train, X_test, y_train, y_test = split_and_scale(engineered, features, target)
    results_df, meta = train_models(X_train, X_test, y_train, y_test)

    with open(MODELS_DIR / "best_model.pkl", "rb") as f:
        best_model = pickle.load(f)
    evaluate_model(best_model, X_test, y_test, features, meta, make_plots=not skip_plots)

    print("=" * 70)
    print(f"PIPELINE COMPLETE in {time.time() - t_start:.1f}s")
    print(f"Best model: {meta['best_model']}  |  R2={meta['best_model_metrics']['R2']}  |  MAE={meta['best_model_metrics']['MAE']}")
    print("=" * 70)
    return results_df, meta


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="SPARK end-to-end training pipeline")
    parser.add_argument("--bill-csv", type=Path, default=DATA_DIR / "electricity_bill_dataset.csv")
    parser.add_argument("--weather-csv", type=Path, default=DATA_DIR / "weather_raw.csv")
    parser.add_argument("--skip-plots", action="store_true", help="Skip matplotlib plot generation")
    args = parser.parse_args()

    run_pipeline(args.bill_csv, args.weather_csv, skip_plots=args.skip_plots)