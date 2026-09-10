"""
Step 6: Train/Test Split & Scaling

- 80/20 split, random_state fixed for reproducibility
- StandardScaler fit ONLY on train, applied to both (no leakage)
- Scaling is needed for Linear/Ridge/SVR; tree models (RF/GB/XGBoost) don't
  need it but we apply the same scaled data everywhere for a fair,
  consistent comparison across all 7 models in Step 7
"""
import pandas as pd
import json
import pickle
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

df = pd.read_csv("../data/engineered_dataset.csv")

with open("../reports/feature_list.json") as f:
    meta = json.load(f)

FEATURES = meta["model_features"]
TARGET = meta["target"]

X = df[FEATURES]
y = df[TARGET]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

print(f"Train shape: {X_train.shape} | Test shape: {X_test.shape}")

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

X_train_scaled = pd.DataFrame(X_train_scaled, columns=FEATURES, index=X_train.index)
X_test_scaled = pd.DataFrame(X_test_scaled, columns=FEATURES, index=X_test.index)

# --- Save everything Step 7 needs ---
X_train_scaled.to_csv("../data/X_train_scaled.csv", index=False)
X_test_scaled.to_csv("../data/X_test_scaled.csv", index=False)
y_train.to_csv("../data/y_train.csv", index=False)
y_test.to_csv("../data/y_test.csv", index=False)

with open("../models/scaler.pkl", "wb") as f:
    pickle.dump(scaler, f)

print("\nSaved:")
print("  data/X_train_scaled.csv, data/X_test_scaled.csv")
print("  data/y_train.csv, data/y_test.csv")
print("  models/scaler.pkl")

print("\nTrain target stats:\n", y_train.describe().round(2))
print("\nTest target stats:\n", y_test.describe().round(2))