"""
Step 8: Evaluation of the best model (Gradient Boosting)
 - Actual vs Predicted scatter
 - Residual plot
 - Feature importance
"""
import pandas as pd
import numpy as np
import json
import pickle
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

X_train = pd.read_csv("../data/X_train_scaled.csv")
X_test = pd.read_csv("../data/X_test_scaled.csv")
y_test = pd.read_csv("../data/y_test.csv").squeeze()

with open("../models/best_model.pkl", "rb") as f:
    model = pickle.load(f)
with open("../models/model_meta.json") as f:
    meta = json.load(f)
FEATURES = meta["model_features"]

preds = model.predict(X_test)
residuals = y_test - preds

# --- 1. Actual vs Predicted ---
fig, ax = plt.subplots(figsize=(7, 7))
ax.scatter(y_test, preds, alpha=0.15, s=10, color="#2563eb")
lims = [min(y_test.min(), preds.min()), max(y_test.max(), preds.max())]
ax.plot(lims, lims, color="red", linestyle="--", label="Perfect prediction")
ax.set_xlabel("Actual MonthlyHours")
ax.set_ylabel("Predicted MonthlyHours")
ax.set_title(f"Actual vs Predicted (Gradient Boosting, R²={meta['best_model_metrics']['R2']})")
ax.legend()
plt.tight_layout()
plt.savefig("../visuals/actual_vs_predicted.png", dpi=120)
plt.close()

# --- 2. Residual plot ---
fig, ax = plt.subplots(figsize=(8, 5))
ax.scatter(preds, residuals, alpha=0.15, s=10, color="#16a34a")
ax.axhline(0, color="red", linestyle="--")
ax.set_xlabel("Predicted MonthlyHours")
ax.set_ylabel("Residual (Actual - Predicted)")
ax.set_title("Residual Plot")
plt.tight_layout()
plt.savefig("../visuals/residual_plot.png", dpi=120)
plt.close()

# --- 3. Residual distribution ---
fig, ax = plt.subplots(figsize=(8, 5))
ax.hist(residuals, bins=50, color="#7c3aed", alpha=0.8)
ax.axvline(0, color="red", linestyle="--")
ax.set_xlabel("Residual")
ax.set_title(f"Residual Distribution (mean={residuals.mean():.2f}, std={residuals.std():.2f})")
plt.tight_layout()
plt.savefig("../visuals/residual_distribution.png", dpi=120)
plt.close()

print(f"Residual mean: {residuals.mean():.3f}  (should be ~0, no systematic bias)")
print(f"Residual std:  {residuals.std():.3f}")

# --- 4. Feature importance (tree-based model has .feature_importances_) ---
if hasattr(model, "feature_importances_"):
    importance_df = pd.DataFrame({
        "Feature": FEATURES,
        "Importance": model.feature_importances_
    }).sort_values("Importance", ascending=False)

    print("\nFeature Importance:")
    print(importance_df.to_string(index=False))

    importance_df.to_csv("../reports/feature_importance.csv", index=False)

    fig, ax = plt.subplots(figsize=(8, 6))
    ax.barh(importance_df["Feature"][::-1], importance_df["Importance"][::-1], color="#ea580c")
    ax.set_xlabel("Importance")
    ax.set_title("Feature Importance - Gradient Boosting")
    plt.tight_layout()
    plt.savefig("../visuals/feature_importance.png", dpi=120)
    plt.close()

print("\nSaved -> visuals/actual_vs_predicted.png")
print("Saved -> visuals/residual_plot.png")
print("Saved -> visuals/residual_distribution.png")
print("Saved -> visuals/feature_importance.png")
print("Saved -> reports/feature_importance.csv")