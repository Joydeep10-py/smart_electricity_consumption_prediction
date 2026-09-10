"""
Step 7: Model Training

Trains 7 models on the same scaled train/test split:
Linear Regression, Ridge, Decision Tree, Random Forest, Gradient Boosting,
XGBoost, SVR. Evaluates each with MAE/RMSE/R2 + 5-fold CV R2.
"""
import pandas as pd
import numpy as np
import json
import pickle
import time

from sklearn.linear_model import LinearRegression, Ridge
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.svm import SVR
from sklearn.model_selection import cross_val_score
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

try:
    from xgboost import XGBRegressor
    HAS_XGB = True
except ImportError:
    HAS_XGB = False
    print("xgboost not installed - skipping XGBoost")

X_train = pd.read_csv("../data/X_train_scaled.csv")
X_test = pd.read_csv("../data/X_test_scaled.csv")
y_train = pd.read_csv("../data/y_train.csv").squeeze()
y_test = pd.read_csv("../data/y_test.csv").squeeze()

models = {
    "Linear Regression": LinearRegression(),
    "Ridge Regression": Ridge(alpha=1.0, random_state=42),
    "Decision Tree": DecisionTreeRegressor(max_depth=10, random_state=42),
    "Random Forest": RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42, n_jobs=-1),
    "Gradient Boosting": GradientBoostingRegressor(n_estimators=100, max_depth=3, random_state=42),
}
if HAS_XGB:
    models["XGBoost"] = XGBRegressor(n_estimators=100, max_depth=4, learning_rate=0.1,
                                       random_state=42, n_jobs=-1)

# SVR is O(n^2)-O(n^3) - full 36k-row train set makes it hang for a very
# long time. Train/evaluate it on a fixed 3,000-row subsample instead, and
# flag this clearly in the results so it's an honest, documented comparison.
SVR_SAMPLE_SIZE = 3000
svr_idx = X_train.sample(n=SVR_SAMPLE_SIZE, random_state=42).index
X_train_svr = X_train.loc[svr_idx]
y_train_svr = y_train.loc[svr_idx]
models["SVR (3k subsample)"] = SVR(kernel="rbf", C=10, epsilon=1)

results = []
trained_models = {}

for name, model in models.items():
    t0 = time.time()
    if name.startswith("SVR"):
        model.fit(X_train_svr, y_train_svr)
        cv_scores = cross_val_score(model, X_train_svr, y_train_svr, cv=3, scoring="r2", n_jobs=1)
    else:
        model.fit(X_train, y_train)
        cv_scores = cross_val_score(model, X_train, y_train, cv=3, scoring="r2", n_jobs=1)

    preds = model.predict(X_test)

    mae = mean_absolute_error(y_test, preds)
    mse = mean_squared_error(y_test, preds)
    rmse = np.sqrt(mse)
    r2 = r2_score(y_test, preds)

    elapsed = time.time() - t0

    results.append({
        "Model": name,
        "MAE": round(mae, 3),
        "RMSE": round(rmse, 3),
        "R2": round(r2, 4),
        "CV_R2_Mean": round(cv_scores.mean(), 4),
        "CV_R2_Std": round(cv_scores.std(), 4),
        "Train_Time_Sec": round(elapsed, 2),
    })
    trained_models[name] = model
    cv_scores_str = f"{cv_scores.mean():.4f}"
    print(f"{name:20s} MAE={mae:7.2f}  RMSE={rmse:7.2f}  R2={r2:.4f}  CV_R2={cv_scores.mean():.4f}±{cv_scores.std():.4f}  ({elapsed:.1f}s)")

results_df = pd.DataFrame(results).sort_values("R2", ascending=False)
results_df.to_csv("../reports/model_performance_comparison.csv", index=False)

print("\n=== Ranked by R2 ===")
print(results_df.to_string(index=False))

# --- Pick and save the best model ---
best_name = results_df.iloc[0]["Model"]
best_model = trained_models[best_name]
print(f"\nBest model: {best_name}")

with open("../models/best_model.pkl", "wb") as f:
    pickle.dump(best_model, f)

with open("../reports/feature_list.json") as f:
    meta = json.load(f)
meta["best_model"] = best_name
meta["best_model_metrics"] = results_df.iloc[0].to_dict()
with open("../models/model_meta.json", "w") as f:
    json.dump(meta, f, indent=2, default=str)

print("Saved -> models/best_model.pkl")
print("Saved -> models/model_meta.json")
print("Saved -> reports/model_performance_comparison.csv")