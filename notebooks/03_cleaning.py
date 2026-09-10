"""
Step 3: Data Cleaning
 - duplicate check
 - outlier detection (IQR method) on numeric columns
 - basic sanity checks (negative values, impossible hours)
"""
import pandas as pd
import json

df = pd.read_csv("../data/merged_dataset.csv")

log = {}

# --- Duplicates ---
n_dupes = df.duplicated().sum()
log["duplicate_rows"] = int(n_dupes)
df = df.drop_duplicates()
print(f"Duplicates found & dropped: {n_dupes}")

# --- Sanity checks: negative values in usage/hour columns ---
usage_cols = ["Fan", "Refrigerator", "AirConditioner", "Television", "Monitor", "MotorPump", "MonthlyHours"]
neg_counts = {c: int((df[c] < 0).sum()) for c in usage_cols}
log["negative_value_counts"] = neg_counts
print("Negative value counts:", neg_counts)

# NOTE: MonthlyHours is NOT wall-clock hours (which would cap at 744 for a 31-day
# month) - it's the SUM of running hours across all appliances (they run in
# parallel), so values above 744 are legitimate. Confirmed: ratio of
# MonthlyHours to sum-of-listed-appliance-hours ranges ~3.6x-16x per row,
# consistent with "total device-hours" including appliances not itemized.
# No rows dropped on this basis.

# MotorPump is constant (0) for every single row -> zero variance, no
# predictive signal. Drop it.
const_cols = [c for c in df.columns if df[c].nunique() == 1]
log["constant_columns_dropped"] = const_cols
print("Constant columns (dropped):", const_cols)
df = df.drop(columns=const_cols)

# --- IQR-based outlier detection (flag, don't drop yet) ---
# NOTE: Refrigerator and Monitor are low-cardinality/near-constant columns
# (Refrigerator mostly 17-23, Monitor mostly 1 with two other spikes at 7/12).
# IQR flags huge chunks of these as "outliers" purely because the IQR is
# narrow - this is a known IQR limitation on discrete/skewed distributions,
# not a real data quality problem. We report but do NOT remove based on IQR
# for these two columns.
numeric_cols = ["Fan", "Refrigerator", "AirConditioner", "Television", "Monitor",
                 "MonthlyHours", "TariffRate", "ElectricityBill"]

outlier_summary = {}
for col in numeric_cols:
    Q1, Q3 = df[col].quantile(0.25), df[col].quantile(0.75)
    IQR = Q3 - Q1
    lower, upper = Q1 - 1.5 * IQR, Q3 + 1.5 * IQR
    n_out = int(((df[col] < lower) | (df[col] > upper)).sum())
    outlier_summary[col] = {"lower_bound": round(lower, 2), "upper_bound": round(upper, 2), "n_outliers": n_out}

log["iqr_outliers"] = outlier_summary
print("\nIQR Outlier Summary:")
for col, stats in outlier_summary.items():
    print(f"  {col:20s} bounds=({stats['lower_bound']}, {stats['upper_bound']})  outliers={stats['n_outliers']}")

with open("../reports/data_cleaning_log.json", "w") as f:
    json.dump(log, f, indent=2)

df.to_csv("../data/cleaned_dataset.csv", index=False)
print(f"\nSaved -> data/cleaned_dataset.csv, shape: {df.shape}")
print("Saved -> reports/data_cleaning_log.json")