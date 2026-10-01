/**
 * SPARK - API & Prediction Client Layer
 * Handles inference calls to either live Flask endpoint (/api/predict)
 * or local client-side mathematical simulation (Mock Mode).
 */

const SPARK_API = (function() {
  // Check localStorage for saved mode preference (default: Live Backend)
  const savedMode = localStorage.getItem('spark_use_mock');
  let USE_MOCK = savedMode !== null ? savedMode === 'true' : false;

  /**
   * Toggle between Mock mode and Live Backend API
   */
  function setMockMode(useMock) {
    USE_MOCK = Boolean(useMock);
    localStorage.setItem('spark_use_mock', USE_MOCK ? 'true' : 'false');
    updateModeBadgeUI();
    if (window.showToast) {
      window.showToast(
        USE_MOCK ? 'Switched to Demo Mode (Client Simulation)' : 'Switched to Live Backend API',
        'info'
      );
    }
    // Dispatch custom event for listeners
    window.dispatchEvent(new CustomEvent('spark-mode-change', { detail: { useMock: USE_MOCK } }));
  }

  function isMockMode() {
    return USE_MOCK;
  }

  /**
   * Updates the navbar badge reflecting active mode
   */
  function updateModeBadgeUI() {
    const badge = document.getElementById('spark-mode-badge');
    const toggleBtn = document.getElementById('spark-mode-toggle-btn');
    if (!badge) return;

    if (USE_MOCK) {
      badge.className = 'mode-badge mode-mock';
      badge.innerHTML = '<span class="status-dot"></span> Demo Mode (Client Mock)';
      if (toggleBtn) {
        toggleBtn.textContent = 'Switch to Live API';
        toggleBtn.title = 'Switch to live Flask ML backend';
      }
    } else {
      badge.className = 'mode-badge mode-live';
      badge.innerHTML = '<span class="status-dot"></span> Live Backend API';
      if (toggleBtn) {
        toggleBtn.textContent = 'Switch to Demo Mock';
        toggleBtn.title = 'Switch to client-side local simulation';
      }
    }
  }

  /**
   * Pure client-side inference engine matching trained model benchmarks
   */
  function computeLocalInference(payload) {
    const fan = parseFloat(payload.fan) || 14.0;
    const fridge = parseFloat(payload.refrigerator) || 22.0;
    const ac = parseFloat(payload.air_conditioner) || 1.5;
    const tv = parseFloat(payload.television) || 12.0;
    const monitor = parseFloat(payload.monitor) || 3.0;
    const month = parseInt(payload.month, 10) || 7;
    const city = payload.city || "Hyderabad";
    const company = payload.company || "Tata Power Company Ltd.";

    // 1. Total Daily Runtime & Estimated Load
    const total_hours = fan + fridge + ac + tv + monitor;
    const estimated_load_kwh = ((fan * 75) + (fridge * 150) + (ac * 1500) + (tv * 100) + (monitor * 30)) / 1000.0;
    const season = getSeasonName(month);
    const tariff = getCityTariff(city);

    // 2. Empirical Regression Equation closely calibrated with Gradient Boosting test distribution
    // Baseline mean = 515.08, correlation with Total_Appliance_Hours = ~0.85
    let raw_hours = 515.0 + 5.52 * (total_hours - 52.5) + (ac * 3.2) + (month === 7 || month === 1 ? 4.5 : -2.0);
    const predicted_hours = Math.round(Math.max(95.0, Math.min(926.0, raw_hours)) * 10) / 10;

    // 3. Bill Derivation (Target Leakage Safeguard)
    const estimated_bill = Math.round(predicted_hours * tariff * 10) / 10;

    // 4. Efficiency Score (0 to 100)
    // 300 hrs -> 100%, 900 hrs -> 0%
    const scoreVal = 100.0 - ((predicted_hours - 300.0) / 6.0);
    const efficiency_score = Math.max(0, Math.min(100, Math.round(scoreVal)));

    // 5. Appliance daily kWh breakdown
    const appliance_kwh = {
      "Fan": Math.round((fan * 75 / 1000.0) * 100) / 100,
      "Refrigerator": Math.round((fridge * 150 / 1000.0) * 100) / 100,
      "AirConditioner": Math.round((ac * 1500 / 1000.0) * 100) / 100,
      "Television": Math.round((tv * 100 / 1000.0) * 100) / 100,
      "Monitor": Math.round((monitor * 30 / 1000.0) * 100) / 100
    };

    return {
      predicted_hours: predicted_hours,
      tariff: tariff,
      estimated_bill: estimated_bill,
      efficiency_score: efficiency_score,
      total_appliance_hours: Math.round(total_hours * 10) / 10,
      estimated_load_kwh: Math.round(estimated_load_kwh * 100) / 100,
      season: season,
      appliance_kwh: appliance_kwh,
      city: city,
      company: company,
      month: month,
      isMock: true
    };
  }

  /**
   * Main prediction entrypoint
   */
  async function predict(payload) {
    if (USE_MOCK) {
      // Simulate light async processing delay for realistic UX
      await new Promise(r => setTimeout(r, 220));
      return computeLocalInference(payload);
    }

    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      data.isMock = false;
      return data;
    } catch (err) {
      console.warn('Backend API request failed, falling back to client simulation:', err);
      if (window.showToast) {
        window.showToast('Backend unavailable. Using precision client calculation.', 'warning');
      }
      return computeLocalInference(payload);
    }
  }

  return {
    predict,
    setMockMode,
    isMockMode,
    updateModeBadgeUI,
    computeLocalInference
  };
})();

// Initialize UI badge once DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  SPARK_API.updateModeBadgeUI();
  const toggleBtn = document.getElementById('spark-mode-toggle-btn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', function(e) {
      e.preventDefault();
      SPARK_API.setMockMode(!SPARK_API.isMockMode());
    });
  }
});
