<div align="center">

# ⚡ SPARK
### Smart Power Analytics & Recommendation for Kilowatt Optimization

**A full-stack machine learning web application that predicts household electricity consumption, derives transparent utility bills, and delivers personalized kilowatt-saving recommendations.**

![Python](https://img.shields.io/badge/Python-3.13-3776AB?style=flat-square&logo=python&logoColor=white)
![Scikit--learn](https://img.shields.io/badge/Scikit--learn-1.8.0-F7931E?style=flat-square&logo=scikit-learn&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-Jinja2_Dashboard-black?style=flat-square&logo=flask)
![Chart.js](https://img.shields.io/badge/Chart.js-4.4-FF6384?style=flat-square&logo=chartdotjs&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)
![Status](https://img.shields.io/badge/Status-Live_on_Render-success?style=flat-square)

*Project Exhibition — I · DSN2098*

</div>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Problem Statement](#-problem-statement)
- [Features](#-features)
- [Live Demo & Pages](#-live-demo--pages)
- [System Architecture](#-system-architecture)
- [Process Flow](#-process-flow)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [Dataset](#-dataset)
- [Machine Learning Pipeline](#-machine-learning-pipeline)
- [Model Results](#-model-results)
- [Key Insights](#-key-insights)
- [Tech Stack](#️-tech-stack)
- [Applications](#-applications)
- [Future Improvements](#-future-improvements)
- [Team](#-team)
- [References](#-references)

---

## 🔎 Overview

**SPARK** predicts a household's **monthly electricity consumption** from its appliance usage patterns, then derives **estimated bills, energy efficiency scores, and personalized savings recommendations** from that prediction — built end-to-end from raw data to a deployed, production-ready web application.

> Consumption is *predicted*. Bill is *calculated*. That distinction is the backbone of this project's design — see [Key Insights](#-key-insights) for why it matters.

## 🎯 Problem Statement

Most households have no effective way to monitor or understand their electricity usage. Consumers can't easily identify which appliances drive their bill, forecast next month's cost, or spot inefficient usage patterns — leading to unnecessary energy waste, unpredictable bills, and missed opportunities for conservation.

## ✨ Features

| Feature | Description |
|---|---|
| 🔮 **Consumption Prediction** | Predicts monthly household electricity usage from appliance-level inputs using a trained ML regression model |
| 💰 **Smart Bill Estimation** | Converts predicted consumption into an estimated electricity bill using the household's actual tariff rate |
| 📊 **Interactive Analytics Dashboard** | 4 Chart.js visualizations: appliance energy shares, runtime comparison, national quartile benchmarks, and 12-month seasonal projections |
| 🧪 **What-If Energy Simulator** | Interactive "what-if" sliders to simulate how reducing appliance hours impacts monthly and annual bills |
| 🌱 **Personalized Recommendations** | Rule-based energy optimization advice with specific rupee savings estimates |
| 🌗 **Dark/Light Theme** | Full dark mode support with persistent theme preference |
| 📄 **PDF Report Export** | One-click downloadable household energy reports |
| 🔄 **Dual Execution Mode** | Live backend API or client-side fallback simulation with seamless switching |

## 🌐 Live Demo & Pages

The application consists of **6 interconnected pages**, each served via Flask + Jinja2:

| Route | Page | Description |
|---|---|---|
| `/` | **Home** | Hero landing page with animated counters, methodology cards, and pipeline overview |
| `/predict` | **Predictor** | Appliance hour sliders with live preview, presets (Saver / Average / Heavy), and ML inference |
| `/dashboard` | **Dashboard** | Full analytics with KPI cards, 4 charts, what-if simulator, and personalized recommendations |
| `/insights` | **EDA & Climatology** | Exploratory data analysis charts, city billing comparisons, and weather correlation findings |
| `/model` | **Model Benchmarks** | 7-algorithm comparison table, R²/MAE charts, feature importance, and residual diagnostics |
| `/about` | **Team & About** | Academic team roster, faculty supervision board, tech stack, and references |

## 🏗️ System Architecture

```mermaid
flowchart LR
    A[Raw Data<br/>Appliance Usage + Weather] --> B[Data Preprocessing<br/>Clean · Merge · Validate]
    B --> C[Feature Engineering<br/>Domain-informed features]
    C --> D[ML Model Training<br/>7 algorithms compared]
    D --> E[Prediction Engine<br/>Consumption → Bill → Efficiency Score]
    E --> F[Dashboard<br/>Flask + Jinja2 Web App]
```

| Stage | Description |
|---|---|
| **1. Data Preprocessing** | Cleans raw data, handles duplicates and constant columns, profiles outliers |
| **2. Feature Engineering** | Builds `Total_Appliance_Hours`, `Estimated_Load_kWh`, cyclical month encoding, seasonal buckets |
| **3. ML Model Training** | Trains and compares Linear Regression, Ridge, Decision Tree, Random Forest, Gradient Boosting, XGBoost, and SVR |
| **4. Prediction Engine** | Predicts monthly consumption, then computes monthly bill and efficiency score from it |
| **5. Web Dashboard** | Multi-page Jinja2 app with Chart.js visualizations, what-if simulator, and REST API |

## 🔄 Process Flow

```mermaid
sequenceDiagram
    participant U as Household Data
    participant P as Preprocessing
    participant F as Feature Engineering
    participant M as ML Model
    participant D as Dashboard

    U->>P: Appliance usage, City, Company, Tariff
    P->>F: Cleaned dataset
    F->>M: Engineered features
    M->>M: Predict Monthly Consumption
    M->>D: Consumption → Bill → Efficiency Score
    D-->>U: Insights & Recommendations
```

## 📁 Project Structure

```
SPARK_project/
├── data/                                # Training data (gitignored — not needed for deployment)
│
├── templates/                           # Jinja2 HTML templates
│   ├── base.html                        # Shared layout: navbar, footer, scripts
│   ├── index.html                       # Home / landing page
│   ├── predict.html                     # Appliance predictor form
│   ├── dashboard.html                   # Analytics dashboard + what-if simulator
│   ├── insights.html                    # EDA & climatology analysis
│   ├── model.html                       # ML benchmarks & evaluation
│   └── about.html                       # Team & academic context
│
├── static/
│   ├── css/
│   │   ├── style.css                    # Full design system (dark/light, glassmorphism)
│   │   └── print.css                    # Print-optimized styles for PDF export
│   ├── js/
│   │   ├── data.js                      # Centralized dataset constants & city tariffs
│   │   ├── api.js                       # API client (live backend + mock fallback)
│   │   ├── charts.js                    # Chart.js visualization library
│   │   ├── predict.js                   # Predict page controller (sliders, presets)
│   │   ├── dashboard.js                 # Dashboard page controller (KPIs, simulator)
│   │   ├── recommendations.js           # Dynamic recommendation engine
│   │   └── main.js                      # Theme toggle, toasts, mobile nav, counters
│   └── img/                             # Model evaluation plots (PNG)
│
├── notebooks/
│   ├── 01_weather_climatology.py
│   ├── 02_merge_data.py
│   ├── 03_cleaning.py
│   ├── 04_eda.py
│   ├── 05_feature_engineering.py
│   ├── 06_train_test_split.py
│   ├── 07_model_training.py
│   ├── 08_evaluation.py
│   └── pipelines.py                     # standalone script — runs all 8 steps end-to-end
│
├── models/
│   ├── best_model.pkl                   # trained Gradient Boosting regressor
│   ├── scaler.pkl                       # StandardScaler fit on training data
│   ├── label_encoders.pkl               # LabelEncoders for City / Company / Season
│   └── model_meta.json                  # feature list, target, best model + metrics
│
├── reports/
│   ├── data_cleaning_log.json
│   ├── eda_business_insights.json
│   ├── correlation_with_target.csv
│   ├── feature_list.json
│   ├── feature_importance.csv
│   └── model_performance_comparison.csv
│
├── docs/
│   └── Dataset_Documentation.md
│
├── app.py                               # Flask app (API + Jinja2 page routes)
├── requirements.txt                     # Pinned dependencies (scikit-learn==1.8.0)
├── Dockerfile                           # Docker container config (Python 3.13)
├── Procfile                             # Heroku / Render start command
├── render.yaml                          # Render.com blueprint
└── README.md
```

## 🚀 Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Run the full pipeline (preprocessing → training → evaluation)
python notebooks/pipelines.py

# 3. Launch the web application
python app.py
# → Open http://localhost:5000
```

### 🌐 Live Deployment
The app is fully containerized and configured for one-click deployment:
- **Docker:** `docker build -t spark . && docker run -p 5000:5000 spark`
- **Render.com:** Native deployment supported via the included `render.yaml` blueprint.
- **Heroku:** Supported via the included `Procfile`.

> **Note:** Model artifacts (`best_model.pkl`, `scaler.pkl`, `label_encoders.pkl`) are pinned to **scikit-learn 1.8.0** and **Python 3.13**. Mismatched versions will cause deserialization errors.

## 📊 Dataset

- **45,345 household records** across **16 Indian cities** and **32 electricity distribution companies**
- **12 raw features**: appliance usage hours (Fan, Refrigerator, Air Conditioner, Television, Monitor, Motor Pump), Month, City, Company, Monthly Hours, Tariff Rate, Electricity Bill
- **Supplementary weather data**: historical hourly + daily weather (temperature, humidity, precipitation) from the [Open-Meteo Historical Weather API](https://open-meteo.com/en/docs/historical-weather-api), aggregated into a Month-level national seasonal climatology

Full schema, data dictionary, and known limitations are documented in **[`docs/Dataset_Documentation.md`](docs/Dataset_Documentation.md)**.

## 🔬 Machine Learning Pipeline

1. **Weather Climatology** — aggregates hourly/daily weather into a 12-month seasonal reference table
2. **Merge** — joins weather climatology onto the bill dataset by `Month`
3. **Cleaning** — duplicate removal, constant-column detection, IQR outlier profiling
4. **EDA** — correlation analysis, seasonal trend checks, auto-generated business insights
5. **Feature Engineering** — `Total_Appliance_Hours`, `Estimated_Load_kWh` (wattage-weighted), cyclical `Month_sin`/`Month_cos`, `Season`, encoded categoricals
6. **Train/Test Split & Scaling** — 80/20 split, `StandardScaler` fit on train only
7. **Model Training** — 7 algorithms compared with 3-fold cross-validation
8. **Evaluation** — MAE, RMSE, R², residual analysis, feature importance

## 🏆 Model Results

**Target variable:** `MonthlyHours` (predicted consumption) — **not** `ElectricityBill` directly. See [Key Insights](#-key-insights) for why.

| Model | MAE | RMSE | R² | CV R² (mean ± std) |
|---|---:|---:|---:|---|
| **🥇 Gradient Boosting** | **70.24** | **81.02** | **0.5569** | 0.5684 ± 0.0029 |
| 🥈 XGBoost | 70.25 | 81.02 | 0.5569 | 0.5682 ± 0.0033 |
| 🥉 Random Forest | 70.79 | 82.03 | 0.5459 | 0.5564 ± 0.0024 |
| Linear Regression | 70.94 | 82.31 | 0.5427 | 0.5561 ± 0.0032 |
| Ridge Regression | 70.94 | 82.31 | 0.5427 | 0.5561 ± 0.0032 |
| SVR (3k subsample) | 72.30 | 84.76 | 0.5151 | 0.5141 ± 0.0140 |
| Decision Tree | 72.90 | 85.52 | 0.5064 | 0.4978 ± 0.0020 |

**Best model: Gradient Boosting Regressor** — chosen for the highest test R² and the tightest, most stable cross-validation spread.

<div align="center">
<img src="static/img/actual_vs_predicted.png" width="420"/> <img src="static/img/feature_importance.png" width="420"/>
</div>

## 💡 Key Insights

> **🚨 Leakage-aware target design.** `ElectricityBill = MonthlyHours × TariffRate` exactly, for every record in the dataset. Predicting `ElectricityBill` directly (using `MonthlyHours`/`TariffRate` as inputs) would produce a meaningless R² ≈ 1.0 — the model would just be learning multiplication. SPARK instead predicts **`MonthlyHours`** as the genuine ML problem, then computes the bill downstream: `predicted_bill = predicted_hours × tariff_rate`.

- **`Total_Appliance_Hours` is the dominant driver** of consumption — 84.9% feature importance in the final model, far ahead of any individual appliance.
- **Weather has ~zero effect on consumption in this dataset** (correlation < 0.04 for every weather variable). This was tested, not assumed — see the EDA report. Air Conditioner usage was found to be essentially flat across all 12 months, so no seasonal appliance behavior exists to correlate against.
- **No single appliance dominates individually** — Television, Fan, Refrigerator, Monitor, and Air Conditioner each correlate 0.27–0.43 with consumption; it's their *sum*, not any one of them, that matters most.
- **R² ≈ 0.56 is an honest ceiling**, not a shortfall — residuals are unbiased (mean ≈ 0.15) and symmetric, meaning remaining variance reflects real-world noise rather than a systematic model failure.
- **Input validation matters** — the model was trained on specific ranges (Fan: 5-23, Fridge: 17-23, AC: 0-3, TV: 3-22, Monitor: 1-12). Out-of-distribution inputs (e.g., all zeros) are rejected with a zero-prediction guard.

## 🛠️ Tech Stack

![Python](https://img.shields.io/badge/-Python_3.13-3776AB?style=flat-square&logo=python&logoColor=white)
![Pandas](https://img.shields.io/badge/-Pandas_3.0-150458?style=flat-square&logo=pandas&logoColor=white)
![NumPy](https://img.shields.io/badge/-NumPy_2.4-013243?style=flat-square&logo=numpy&logoColor=white)
![Scikit--learn](https://img.shields.io/badge/-Scikit--learn_1.8-F7931E?style=flat-square&logo=scikit-learn&logoColor=white)
![Flask](https://img.shields.io/badge/-Flask_3.x-black?style=flat-square&logo=flask&logoColor=white)
![Chart.js](https://img.shields.io/badge/-Chart.js_4.4-FF6384?style=flat-square&logo=chartdotjs&logoColor=white)
![Font Awesome](https://img.shields.io/badge/-Font_Awesome_6-528DD7?style=flat-square&logo=fontawesome&logoColor=white)
![Docker](https://img.shields.io/badge/-Docker-2496ED?style=flat-square&logo=docker&logoColor=white)
![Open--Meteo](https://img.shields.io/badge/-Open--Meteo%20API-0EA5E9?style=flat-square)

## 🌐 Applications

| Domain | Use Case |
|---|---|
| 🏠 **Residential Energy Management** | Optimize household electricity consumption and reduce costs |
| 🏢 **Utility & Power Companies** | Forecast electricity demand and analyze usage patterns at scale |
| 🌍 **Energy Awareness Platforms** | Promote responsible electricity usage through AI-driven insights |
| 🏙️ **Smart Cities** | Support sustainable, energy-efficient infrastructure planning |
| 🏡 **Smart Homes** | Intelligent monitoring of household energy consumption |

## 🔭 Future Improvements

- [ ] Fetch **per-city weather data** instead of a single national proxy, once city-level geolocation data is available
- [x] Build the **Flask dashboard** (`app.py`) for interactive predictions and recommendations
- [ ] Add **SHAP-based explainability** for per-prediction transparency
- [ ] Support **real smart-meter time-series data** for finer-grained, sub-monthly predictions
- [ ] **Hyperparameter tuning** (GridSearchCV / Optuna) on the tree-based models
- [x] Containerize with **Docker** for one-command deployment
- [x] Multi-page **Jinja2 frontend** with dark/light theme and Chart.js visualizations
- [x] **What-If Energy Simulator** for prospective savings analysis
- [x] Input validation with **dataset-range-constrained sliders** and zero-input guard

## 👥 Team

| Name | Roll No. |
|---|---|
| Suhani Boxi | 25BAI10011 |
| Joydeep Samanta | 25BAI11045 |
| Dhairya Garg | 25BAI10224 |
| Srishti Rai | 25BAI10554 |
| Ashmita Ganguly | 25BAI10010 |
| Ujjaval Gupta | 25BAI11102 |

**Project Supervisor:** Dr. Harshlata Vishwakarma
**Reviewer I:** Dr. Velmani Ramasamy · **Reviewer II:** Dr. Amrita Parashar

## 📚 References

**Government & Industry Sources**
- Ministry of Power · Bureau of Energy Efficiency (BEE) · Smart Meter National Programme (SMNP)

**Datasets & APIs**
- [Open-Meteo Historical Weather API](https://open-meteo.com/en/docs/historical-weather-api)
- [Indian Household Electricity Consumption Dataset (Kaggle)](https://www.kaggle.com/datasets/suraj520/indian-household-electricity-bill)

**Research**
- Household electricity consumption prediction using database combinations, ensemble and hybrid modeling techniques
- Residential electricity current and appliance dataset for AC-event detection from Indian dwellings
- Lockdown impacts on residential electricity demand in India
- Characterizing domestic electricity consumption in the Indian urban household sector
- Can non-intrusive load monitoring be used for identifying an appliance's anomalous behaviour?
- Electricity Bill Prediction Based on a Particle Swarm Optimized Multilayer Perceptron Model

---

<div align="center">

*Submitted for Project Exhibition — I · DSN2098*

**Made with ⚡ by Team SPARK**

</div>