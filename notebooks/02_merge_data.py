"""
Step 2: Merge the bill dataset with the Month-level weather climatology.

Join key: Month only (weather is a national seasonal proxy, not per-city).
"""
import pandas as pd

bill_df = pd.read_csv("../data/electricity_bill_dataset.csv")
climatology_df = pd.read_csv("../data/monthly_climatology.csv")

merged_df = bill_df.merge(climatology_df, on="Month", how="left")

print("Bill rows:", len(bill_df))
print("Merged rows:", len(merged_df))
print("Nulls introduced by merge:\n", merged_df.isnull().sum()[merged_df.isnull().sum() > 0])
print()
print(merged_df.head(3).T)

merged_df.to_csv("../data/merged_dataset.csv", index=False)
print("\nSaved -> data/merged_dataset.csv, shape:", merged_df.shape)