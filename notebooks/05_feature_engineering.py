"""
Step 5: Feature Engineering

Design notes (from EDA in Step 4):
 - Weather correlates ~0 with MonthlyHours -> we keep the columns but don't
   build extra weather-derived features; not worth the complexity.
 - Appliance hour columns (Fan/Refrigerator/AC/TV/Monitor) are the real
   signal (corr 0.27-0.43 each), fairly evenly spread -> no single dominant
   appliance, so we engineer a physically-informed *load* feature on top of
   raw hours, since raw hours undercount AC's actual electricity impact
   per hour vs. a fan or monitor.
 - We do NOT engineer any feature using MonthlyHours, TariffRate, or
   ElectricityBill as an input (that would leak the target / its formula).
"""
import pandas as pd
import numpy as np
import json
from sklearn.preprocessing import LabelEncoder
import pickle

df = pd.read_csv("../data/cleaned_dataset.csv")

# --- 1. Total raw appliance hours ---
appliance_cols = ["Fan", "Refrigerator", "AirConditioner", "Television", "Monitor"]
df["Total_Appliance_Hours"] = df[appliance_cols].sum(axis=1)

# --- 2. Physically-informed load index ---
# Typical household appliance wattages (India, approximate, documented assumption):
#   Fan ~75W, Refrigerator ~150W, AC ~1500W, TV ~100W, Monitor ~30W
WATTAGE = {"Fan": 75, "Refrigerator": 150, "AirConditioner": 1500, "Television": 100, "Monitor": 30}
df["Estimated_Load_kWh"] = sum(df[c] * w for c, w in WATTAGE.items()) / 1000

# --- 3. Cyclical month encoding (preserves Dec-Jan adjacency, unlike raw 1-12) ---
df["Month_sin"] = np.sin(2 * np.pi * df["Month"] / 12)
df["Month_cos"] = np.cos(2 * np.pi * df["Month"] / 12)

# --- 4. Season bucket (Indian climate: Winter/Summer/Monsoon/Post-monsoon) ---
def to_season(m):
    if m in (12, 1, 2):
        return "Winter"
    elif m in (3, 4, 5, 6):
        return "Summer"
    elif m in (7, 8, 9):
        return "Monsoon"
    else:
        return "Post_Monsoon"

df["Season"] = df["Month"].apply(to_season)

# --- 5. Categorical encoding ---
encoders = {}
for col in ["City", "Company", "Season"]:
    le = LabelEncoder()
    df[col + "_Encoded"] = le.fit_transform(df[col])
    encoders[col] = le
    print(f"{col}: {len(le.classes_)} categories -> encoded")

with open("../models/label_encoders.pkl", "wb") as f:
    pickle.dump(encoders, f)

print("\nEngineered columns added:")
print(["Total_Appliance_Hours", "Estimated_Load_kWh", "Month_sin", "Month_cos",
       "Season", "City_Encoded", "Company_Encoded", "Season_Encoded"])

# --- Correlation check for the new features ---
new_numeric = ["Total_Appliance_Hours", "Estimated_Load_kWh", "Month_sin", "Month_cos"]
corr_check = df[new_numeric + ["MonthlyHours"]].corr()["MonthlyHours"].drop("MonthlyHours")
print("\nCorrelation of new features with MonthlyHours:")
print(corr_check.round(3))

# --- Define the official feature list for modeling (Step 6/7) ---
# Explicitly EXCLUDED: TariffRate, ElectricityBill (leakage - Bill = MonthlyHours * TariffRate)
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
    "note": "TariffRate is kept in the dataset for post-hoc Bill = predicted_MonthlyHours * TariffRate, not used as a model input."
}
with open("../reports/feature_list.json", "w") as f:
    json.dump(meta, f, indent=2)

df.to_csv("../data/engineered_dataset.csv", index=False)
print(f"\nSaved -> data/engineered_dataset.csv, shape: {df.shape}")
print("Saved -> reports/feature_list.json")
print("Saved -> models/label_encoders.pkl")