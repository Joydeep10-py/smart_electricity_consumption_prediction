"""
Step 4: Exploratory Data Analysis
Target for modeling: MonthlyHours (consumption). ElectricityBill and
TariffRate are EXCLUDED from correlation-with-target analysis on the
feature side since Bill = MonthlyHours * TariffRate (leakage, see Step 0
discussion) - we only look at Bill for business-insight commentary, not as
a model input.
"""
import pandas as pd
import json

df = pd.read_csv("../data/cleaned_dataset.csv")

numeric_features = ["Fan", "Refrigerator", "AirConditioner", "Television", "Monitor",
                     "Avg_Temp_Max", "Avg_Temp_Min", "Avg_Temp_Mean", "Avg_Humidity",
                     "Avg_Apparent_Temp", "Total_Precipitation"]

# --- Correlation with target ---
corr_with_target = df[numeric_features + ["MonthlyHours"]].corr()["MonthlyHours"].drop("MonthlyHours")
corr_with_target = corr_with_target.sort_values(key=abs, ascending=False)
print("Correlation with MonthlyHours (target):")
print(corr_with_target.round(3))

# --- Bill by City ---
bill_by_city = df.groupby("City")["ElectricityBill"].mean().sort_values(ascending=False)
print("\nAvg ElectricityBill by City (top 5):")
print(bill_by_city.head(5).round(1))
print("...bottom 5:")
print(bill_by_city.tail(5).round(1))

# --- Consumption by Month (seasonality check) ---
hours_by_month = df.groupby("Month")["MonthlyHours"].mean().sort_index()
print("\nAvg MonthlyHours by Month:")
print(hours_by_month.round(1))

# --- AC usage vs Month (does AC usage track summer?) ---
ac_by_month = df.groupby("Month")["AirConditioner"].mean().sort_index()
print("\nAvg AirConditioner hours by Month:")
print(ac_by_month.round(2))

# --- Business insights (auto-generated from the numbers above) ---
top_driver = corr_with_target.index[0]
insights = {
    "strongest_correlate_with_consumption": {
        "feature": top_driver,
        "correlation": round(float(corr_with_target.iloc[0]), 3)
    },
    "highest_avg_bill_city": bill_by_city.idxmax(),
    "lowest_avg_bill_city": bill_by_city.idxmin(),
    "peak_consumption_month": int(hours_by_month.idxmax()),
    "lowest_consumption_month": int(hours_by_month.idxmin()),
    "ac_usage_peak_month": int(ac_by_month.idxmax()),
}
print("\nAuto-generated insights:")
print(json.dumps(insights, indent=2))

with open("../reports/eda_business_insights.json", "w") as f:
    json.dump(insights, f, indent=2)

corr_with_target.to_csv("../reports/correlation_with_target.csv")
print("\nSaved -> reports/eda_business_insights.json")
print("Saved -> reports/correlation_with_target.csv")