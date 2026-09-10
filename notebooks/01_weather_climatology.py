"""
Step 1: Build a Month-level (1-12) weather climatology table.

The Open-Meteo file contains ONE location (central India proxy) with:
  - an hourly block (temp, humidity, apparent temp, precipitation, rain, snowfall)
  - a daily block (temp max/min/mean)

Since the bill dataset only has a Month number (no year, no city-level geo),
we aggregate weather to a single "typical Month" climatology and treat it as
a national seasonal signal, not a per-city one. This is a deliberate,
documented simplification (see docs/Dataset_Documentation.md notes).
"""
import pandas as pd

RAW_PATH = "../data/weather_raw.csv"

# --- Read the two blocks separately ---
# Row 0: header (lat, long, elevation, ...)
# Row 1: values
# Row 2: blank
# Row 3: hourly header -> hourly data until the daily header appears
# Then: daily header -> daily data

import io

with open(RAW_PATH) as f:
    lines = f.readlines()

hourly_header_idx = next(i for i, l in enumerate(lines) if l.startswith("time,temperature_2m ("))
daily_header_idx = next(i for i, l in enumerate(lines) if l.startswith("time,temperature_2m_max"))

# Hourly block: header line + data rows up to (but excluding) the blank line before the daily header
hourly_block = "".join(lines[hourly_header_idx:daily_header_idx - 1])
hourly_df = pd.read_csv(io.StringIO(hourly_block))

daily_df = pd.read_csv(RAW_PATH, skiprows=daily_header_idx)

# --- Clean column names ---
hourly_df.columns = [c.split(" (")[0] for c in hourly_df.columns]
daily_df.columns = [c.split(" (")[0] for c in daily_df.columns]

hourly_df["time"] = pd.to_datetime(hourly_df["time"])
daily_df["time"] = pd.to_datetime(daily_df["time"])

hourly_df["Month"] = hourly_df["time"].dt.month
daily_df["Month"] = daily_df["time"].dt.month

print("Hourly rows:", len(hourly_df), "| Daily rows:", len(daily_df))
print("Hourly date range:", hourly_df["time"].min(), "->", hourly_df["time"].max())
print("Daily date range:", daily_df["time"].min(), "->", daily_df["time"].max())

# --- Monthly climatology from hourly humidity/precip (not in daily block) ---
monthly_humidity_precip = hourly_df.groupby("Month").agg(
    Avg_Humidity=("relative_humidity_2m", "mean"),
    Avg_Apparent_Temp=("apparent_temperature", "mean"),
    Total_Precipitation=("precipitation", "sum"),
).reset_index()

# --- Monthly climatology from daily temp block (more reliable min/max/mean) ---
monthly_temp = daily_df.groupby("Month").agg(
    Avg_Temp_Max=("temperature_2m_max", "mean"),
    Avg_Temp_Min=("temperature_2m_min", "mean"),
    Avg_Temp_Mean=("temperature_2m_mean", "mean"),
).reset_index()

monthly_climatology = monthly_temp.merge(monthly_humidity_precip, on="Month", how="outer").sort_values("Month")
monthly_climatology = monthly_climatology.round(2)

print("\nMonthly Climatology Table:")
print(monthly_climatology.to_string(index=False))

monthly_climatology.to_csv("../data/monthly_climatology.csv", index=False)
print("\nSaved -> data/monthly_climatology.csv")