/**
 * SPARK - Data & Knowledge Base
 * Centralized dataset constants, city tariffs, distribution companies,
 * climatology benchmarks, model performance metrics, and feature importances.
 */

const SPARK_DATA = {
  // 16 Indian Cities with reference tariff rates (₹/kWh) and dataset averages
  cities: [
    { name: "Ahmedabad", tariff: 7.9, avgBill: 4045.5, avgHours: 512.1, state: "Gujarat" },
    { name: "Chennai", tariff: 8.8, avgBill: 4545.8, avgHours: 516.6, state: "Tamil Nadu" },
    { name: "Dahej", tariff: 7.6, avgBill: 3880.2, avgHours: 510.6, state: "Gujarat" },
    { name: "Faridabad", tariff: 8.1, avgBill: 4166.2, avgHours: 514.3, state: "Haryana" },
    { name: "Gurgaon", tariff: 8.3, avgBill: 4300.2, avgHours: 518.1, state: "Haryana" },
    { name: "Hyderabad", tariff: 8.4, avgBill: 4304.7, avgHours: 512.5, state: "Telangana" },
    { name: "Kolkata", tariff: 8.7, avgBill: 4505.4, avgHours: 517.9, state: "West Bengal" },
    { name: "Mumbai", tariff: 9.2, avgBill: 4770.5, avgHours: 518.5, state: "Maharashtra" },
    { name: "Nagpur", tariff: 8.9, avgBill: 4613.5, avgHours: 518.4, state: "Maharashtra" },
    { name: "Navi Mumbai", tariff: 9.3, avgBill: 4782.8, avgHours: 514.3, state: "Maharashtra" },
    { name: "New Delhi", tariff: 8.5, avgBill: 4382.5, avgHours: 515.6, state: "Delhi" },
    { name: "Noida", tariff: 8.2, avgBill: 4201.3, avgHours: 512.4, state: "Uttar Pradesh" },
    { name: "Pune", tariff: 9.1, avgBill: 4689.8, avgHours: 515.4, state: "Maharashtra" },
    { name: "Ratnagiri", tariff: 7.4, avgBill: 3807.4, avgHours: 514.5, state: "Maharashtra" },
    { name: "Shimla", tariff: 7.7, avgBill: 3964.1, avgHours: 514.8, state: "Himachal Pradesh" },
    { name: "Vadodara", tariff: 7.8, avgBill: 4022.4, avgHours: 515.7, state: "Gujarat" }
  ],

  // 32 Electricity Distribution Companies
  companies: [
    "Adani Power Ltd.",
    "Bonfiglioli Transmission Pvt. Ltd.",
    "CESC",
    "GE T&D India Limited",
    "Guj Ind Power",
    "Indowind Energy",
    "JSW Energy Ltd.",
    "Jaiprakash Power",
    "Jyoti Structure",
    "KEC International",
    "Kalpataru Power",
    "L&T Transmission & Distribution",
    "Maha Transco – Maharashtra State Electricity Transmission Co, Ltd.",
    "NHPC",
    "NLC India",
    "NTPC Pvt. Ltd.",
    "Neueon Towers / Sujana Towers Ltd.",
    "Optibelt Power Transmission India Private Limited",
    "Orient Green",
    "Power Grid Corp",
    "Ratnagiri Gas and Power Pvt. Ltd. (RGPPL)",
    "Reliance Energy",
    "Reliance Power",
    "Ringfeder Power Transmission India Pvt. Ltd.",
    "SJVN Ltd.",
    "Sterlite Power Transmission Ltd",
    "Sunil Hitech Eng",
    "Tata Power Company Ltd.",
    "Torrent Power Ltd.",
    "Toshiba Transmission & Distribution Systems (India) Pvt. Ltd.",
    "TransRail Lighting",
    "Unitech Power Transmission Ltd."
  ],

  // 12 Months with Name, Season, Dataset Average Hours and AC runtime
  months: [
    { num: 1, name: "January", season: "Winter", avgHours: 526.0, avgAC: 1.49 },
    { num: 2, name: "February", season: "Winter", avgHours: 468.9, avgAC: 1.51 },
    { num: 3, name: "March", season: "Summer", avgHours: 526.3, avgAC: 1.51 },
    { num: 4, name: "April", season: "Summer", avgHours: 508.8, avgAC: 1.49 },
    { num: 5, name: "May", season: "Summer", avgHours: 525.7, avgAC: 1.48 },
    { num: 6, name: "June", season: "Summer", avgHours: 504.6, avgAC: 1.50 },
    { num: 7, name: "July", season: "Monsoon", avgHours: 528.7, avgAC: 1.51 },
    { num: 8, name: "August", season: "Monsoon", avgHours: 525.8, avgAC: 1.51 },
    { num: 9, name: "September", season: "Monsoon", avgHours: 504.0, avgAC: 1.53 },
    { num: 10, name: "October", season: "Post-Monsoon", avgHours: 526.7, avgAC: 1.52 },
    { num: 11, name: "November", season: "Post-Monsoon", avgHours: 508.6, avgAC: 1.51 },
    { num: 12, name: "December", season: "Winter", avgHours: 528.3, avgAC: 1.50 }
  ],

  // Monthly Climatology Table (from Open-Meteo Historical API)
  climatology: [
    { month: 1, name: "January", maxTemp: 28.04, minTemp: 14.31, meanTemp: 20.45, humidity: 57.36, apparentTemp: 19.92, precip: 0.0 },
    { month: 2, name: "February", maxTemp: 29.79, minTemp: 16.62, meanTemp: 22.77, humidity: 41.27, apparentTemp: 21.13, precip: 0.1 },
    { month: 3, name: "March", maxTemp: 34.58, minTemp: 20.43, meanTemp: 27.15, humidity: 24.91, apparentTemp: 24.57, precip: 0.0 },
    { month: 4, name: "April", maxTemp: 37.38, minTemp: 23.84, meanTemp: 30.40, humidity: 27.19, apparentTemp: 28.69, precip: 2.1 },
    { month: 5, name: "May", maxTemp: 34.77, minTemp: 24.16, meanTemp: 28.78, humidity: 53.87, apparentTemp: 30.51, precip: 72.7 },
    { month: 6, name: "June", maxTemp: 32.51, minTemp: 24.13, meanTemp: 27.73, humidity: 64.58, apparentTemp: 29.59, precip: 123.9 },
    { month: 7, name: "July", maxTemp: 28.04, minTemp: 22.55, meanTemp: 24.79, humidity: 84.82, apparentTemp: 27.48, precip: 327.8 },
    { month: 8, name: "August", maxTemp: 28.42, minTemp: 22.35, meanTemp: 24.84, humidity: 85.18, apparentTemp: 28.32, precip: 202.0 },
    { month: 9, name: "September", maxTemp: 28.47, minTemp: 22.18, meanTemp: 24.66, humidity: 85.07, apparentTemp: 28.12, precip: 159.8 },
    { month: 10, name: "October", maxTemp: 28.65, minTemp: 20.46, meanTemp: 24.05, humidity: 73.39, apparentTemp: 26.03, precip: 62.1 },
    { month: 11, name: "November", maxTemp: 26.67, minTemp: 14.78, meanTemp: 20.15, humidity: 58.45, apparentTemp: 19.50, precip: 3.0 },
    { month: 12, name: "December", maxTemp: 24.83, minTemp: 12.54, meanTemp: 17.79, humidity: 53.62, apparentTemp: 15.78, precip: 0.0 }
  ],

  // Model Evaluation & Comparison Benchmarks (7 Algorithms)
  models: [
    { rank: 1, name: "Gradient Boosting", mae: 70.24, rmse: 81.02, r2: 0.5569, cvR2: "0.5684 ± 0.0029", trainTime: 8.61, isBest: true },
    { rank: 2, name: "XGBoost", mae: 70.25, rmse: 81.02, r2: 0.5569, cvR2: "0.5682 ± 0.0033", trainTime: 5.42, isBest: false },
    { rank: 3, name: "Random Forest", mae: 70.79, rmse: 82.03, r2: 0.5459, cvR2: "0.5564 ± 0.0024", trainTime: 2.11, isBest: false },
    { rank: 4, name: "Linear Regression", mae: 70.94, rmse: 82.31, r2: 0.5427, cvR2: "0.5561 ± 0.0032", trainTime: 0.06, isBest: false },
    { rank: 5, name: "Ridge Regression", mae: 70.94, rmse: 82.31, r2: 0.5427, cvR2: "0.5561 ± 0.0032", trainTime: 0.04, isBest: false },
    { rank: 6, name: "SVR (3k subsample)", mae: 72.30, rmse: 84.76, r2: 0.5151, cvR2: "0.5141 ± 0.0140", trainTime: 1.79, isBest: false },
    { rank: 7, name: "Decision Tree", mae: 72.90, rmse: 85.52, r2: 0.5064, cvR2: "0.4978 ± 0.0020", trainTime: 0.30, isBest: false }
  ],

  // Gradient Boosting Feature Importances
  featureImportance: [
    { feature: "Total_Appliance_Hours", importance: 0.8487, percent: "84.87%", description: "Sum of all active appliance operating hours" },
    { feature: "Estimated_Load_kWh", importance: 0.0967, percent: "9.67%", description: "Wattage-weighted daily load profile" },
    { feature: "Month_sin", importance: 0.0148, percent: "1.48%", description: "Cyclical month sine coordinate" },
    { feature: "Month_cos", importance: 0.0115, percent: "1.15%", description: "Cyclical month cosine coordinate" },
    { feature: "Refrigerator", importance: 0.0062, percent: "0.62%", description: "Daily refrigerator runtime hours" },
    { feature: "Television", importance: 0.0059, percent: "0.59%", description: "Daily television runtime hours" },
    { feature: "Monitor", importance: 0.0059, percent: "0.59%", description: "Daily computer monitor runtime hours" },
    { feature: "Season_Encoded", importance: 0.0057, percent: "0.57%", description: "Categorical season bucket (Winter/Summer/Monsoon/Post)" },
    { feature: "Fan", importance: 0.0032, percent: "0.32%", description: "Daily ceiling fan runtime hours" },
    { feature: "Company_Encoded", importance: 0.0007, percent: "0.07%", description: "Distribution utility index" },
    { feature: "AirConditioner", importance: 0.0005, percent: "0.05%", description: "Daily air conditioner runtime hours" },
    { feature: "City_Encoded", importance: 0.0002, percent: "0.02%", description: "Geographical municipal location" }
  ],

  // Correlations with MonthlyHours (Target)
  correlations: [
    { feature: "Television", corr: 0.430, category: "Appliance" },
    { feature: "Fan", corr: 0.426, category: "Appliance" },
    { feature: "Refrigerator", corr: 0.393, category: "Appliance" },
    { feature: "Monitor", corr: 0.324, category: "Appliance" },
    { feature: "AirConditioner", corr: 0.274, category: "Appliance" },
    { feature: "Total_Precipitation", corr: 0.033, category: "Weather" },
    { feature: "Avg_Humidity", corr: 0.031, category: "Weather" },
    { feature: "Avg_Temp_Max", corr: -0.013, category: "Weather" },
    { feature: "Avg_Apparent_Temp", corr: 0.010, category: "Weather" },
    { feature: "Avg_Temp_Min", corr: 0.009, category: "Weather" },
    { feature: "Avg_Temp_Mean", corr: -0.003, category: "Weather" }
  ],

  // Appliance Standard Wattages (Watts)
  applianceWattages: {
    Fan: 75,
    Refrigerator: 150,
    AirConditioner: 1500,
    Television: 100,
    Monitor: 30
  },

  // Dataset Statistics & Quartiles (45,345 records)
  datasetStats: {
    recordCount: 45345,
    cityCount: 16,
    companyCount: 32,
    appliances: {
      Fan: { mean: 13.99, min: 5, p25: 9, median: 14, p75: 19, max: 23 },
      Refrigerator: { mean: 21.71, min: 17, p25: 22, median: 22, p75: 23, max: 23 },
      AirConditioner: { mean: 1.50, min: 0, p25: 1, median: 2, p75: 2, max: 3 },
      Television: { mean: 12.50, min: 3, p25: 7, median: 13, p75: 17, max: 22 },
      Monitor: { mean: 2.87, min: 1, p25: 1, median: 1, p75: 1, max: 12 }
    },
    monthlyHours: { mean: 515.08, min: 95.0, p25: 429.0, median: 515.0, p75: 601.0, max: 926.0 },
    electricityBill: { mean: 4311.77, min: 807.5, p25: 3556.8, median: 4299.4, p75: 5038.8, max: 8286.3 },
    tariffRate: { mean: 8.37, min: 7.4, median: 8.4, max: 9.3 }
  }
};

/**
 * Utility function to obtain city tariff
 */
function getCityTariff(cityName) {
  const city = SPARK_DATA.cities.find(c => c.name.toLowerCase() === (cityName || "").toLowerCase());
  return city ? city.tariff : 8.4;
}

/**
 * Season classification from month number (1-12)
 */
function getSeasonName(monthNum) {
  const m = parseInt(monthNum, 10);
  if (m === 12 || m === 1 || m === 2) return "Winter";
  if (m >= 3 && m <= 6) return "Summer";
  if (m >= 7 && m <= 9) return "Monsoon";
  return "Post-Monsoon";
}
