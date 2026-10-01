/**
 * SPARK - Dashboard Controller
 * Orchestrates KPI displays, efficiency gauge animation, Chart.js integrations,
 * rule-based energy recommendations, what-if simulator debounce, and PDF printing.
 */

document.addEventListener('DOMContentLoaded', function() {
  const dashboardContainer = document.getElementById('dashboard-content');
  if (!dashboardContainer) return;

  // Retrieve data from sessionStorage or supply fallback defaults
  let userInputs = null;
  let prediction = null;

  try {
    const rawInputs = sessionStorage.getItem('spark_user_inputs');
    const rawPred = sessionStorage.getItem('spark_prediction_result');
    if (rawInputs && rawPred) {
      userInputs = JSON.parse(rawInputs);
      prediction = JSON.parse(rawPred);
    }
  } catch (e) {
    console.warn('Session data read error:', e);
  }

  // Fallback if user lands directly on /dashboard
  if (!userInputs || !prediction) {
    userInputs = {
      fan: 14,
      refrigerator: 22,
      air_conditioner: 1.5,
      television: 12,
      monitor: 3,
      month: 7,
      city: 'Hyderabad',
      company: 'Tata Power Company Ltd.'
    };
    prediction = SPARK_API.computeLocalInference(userInputs);
  }

  // 1. Render Top KPI Summary Cards
  renderKpiCards(userInputs, prediction);

  // 2. Render Animated Radial Gauge
  renderEfficiencyGauge(prediction.efficiency_score);

  // 3. Render 4 Analytical Charts
  SPARK_CHARTS.renderApplianceShareChart('chart-appliance-share', prediction.appliance_kwh);
  SPARK_CHARTS.renderApplianceRuntimeChart('chart-appliance-runtime', userInputs);
  SPARK_CHARTS.renderBenchmarkChart('chart-benchmark', prediction.predicted_hours);
  SPARK_CHARTS.renderSeasonalProjectionChart('chart-seasonal-projection', prediction.predicted_hours);

  // 4. Render Actionable Recommendation Cards
  renderRecommendations(userInputs, prediction);

  // 5. Initialize What-If Simulator
  initWhatIfSimulator(userInputs, prediction);

  // 6. Print PDF Button
  const printBtn = document.getElementById('print-report-btn');
  if (printBtn) {
    printBtn.addEventListener('click', function() {
      window.print();
    });
  }

  // 7. Re-predict / Modify button
  const modifyBtn = document.getElementById('modify-inputs-btn');
  if (modifyBtn) {
    modifyBtn.addEventListener('click', function() {
      window.location.href = '/predict';
    });
  }
});

/**
 * Populates top KPI cards with animated numbers and context badges
 */
function renderKpiCards(inputs, pred) {
  // 1. Consumption
  const elHours = document.getElementById('kpi-predicted-hours');
  const elHoursDiff = document.getElementById('kpi-hours-diff');
  if (elHours) elHours.textContent = pred.predicted_hours.toFixed(1);
  if (elHoursDiff) {
    const avg = 515.1;
    const diffPct = Math.round(((pred.predicted_hours - avg) / avg) * 100);
    if (diffPct > 0) {
      elHoursDiff.innerHTML = `<span class="text-danger"><i class="fa-solid fa-arrow-trend-up"></i> +${diffPct}%</span> vs national avg (515 hrs)`;
    } else {
      elHoursDiff.innerHTML = `<span class="text-success"><i class="fa-solid fa-arrow-trend-down"></i> ${diffPct}%</span> vs national avg (515 hrs)`;
    }
  }

  // 2. Estimated Bill
  const elBill = document.getElementById('kpi-estimated-bill');
  const elBillFormula = document.getElementById('kpi-bill-formula');
  if (elBill) elBill.textContent = `₹${Math.round(pred.estimated_bill).toLocaleString('en-IN')}`;
  if (elBillFormula) {
    elBillFormula.textContent = `${pred.predicted_hours.toFixed(1)} units × ₹${pred.tariff.toFixed(1)}/kWh (${inputs.city || 'Municipal'})`;
  }

  // 3. Efficiency Score
  const elScore = document.getElementById('kpi-efficiency-score');
  const elGrade = document.getElementById('kpi-efficiency-grade');
  if (elScore) elScore.textContent = `${pred.efficiency_score}/100`;
  if (elGrade) {
    let grade = 'B';
    let colorClass = 'badge-primary';
    if (pred.efficiency_score >= 85) { grade = 'A+ (Excellent)'; colorClass = 'badge-success'; }
    else if (pred.efficiency_score >= 70) { grade = 'A (Good)'; colorClass = 'badge-success'; }
    else if (pred.efficiency_score >= 50) { grade = 'B (Moderate)'; colorClass = 'badge-warning'; }
    else if (pred.efficiency_score >= 35) { grade = 'C (High Usage)'; colorClass = 'badge-warning'; }
    else { grade = 'D (Critical Drain)'; colorClass = 'badge-danger'; }

    elGrade.textContent = grade;
    elGrade.className = `badge ${colorClass}`;
  }

  // 4. Daily Load & Runtime
  const elLoad = document.getElementById('kpi-daily-load');
  const elRuntime = document.getElementById('kpi-daily-runtime');
  if (elLoad) elLoad.textContent = `${pred.estimated_load_kwh.toFixed(2)} kWh`;
  if (elRuntime) elRuntime.textContent = `${pred.total_appliance_hours.toFixed(1)} hrs active across 5 appliances`;

  // Household meta summary chip
  const metaChip = document.getElementById('kpi-household-meta');
  if (metaChip) {
    metaChip.textContent = `${inputs.city || 'Hyderabad'} · ${pred.season || 'Monsoon'} · Tariff: ₹${pred.tariff}/kWh · ${inputs.company || ''}`;
  }
}

/**
 * Animated SVG circular gauge for efficiency score
 */
function renderEfficiencyGauge(score) {
  const circle = document.getElementById('efficiency-gauge-circle');
  const text = document.getElementById('efficiency-gauge-text');
  if (!circle || !text) return;

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  circle.style.strokeDasharray = `${circumference} ${circumference}`;

  // Calculate offset (100 is full, 0 is empty)
  const offset = circumference - (score / 100) * circumference;

  let strokeColor = '#3b82f6';
  if (score >= 75) strokeColor = '#10b981';
  else if (score >= 45) strokeColor = '#f59e0b';
  else strokeColor = '#f43f5e';

  circle.style.stroke = strokeColor;

  setTimeout(() => {
    circle.style.strokeDashoffset = offset;
    text.textContent = `${score}%`;
  }, 150);
}

/**
 * Render dynamic rule-based recommendations
 */
function renderRecommendations(inputs, pred) {
  const container = document.getElementById('recommendations-container');
  if (!container) return;

  const list = SPARK_RECOMMENDATIONS.generateRecommendations(inputs, pred);
  container.innerHTML = '';

  let totalMonthlyRupees = 0;
  let totalMonthlyKwh = 0;

  list.forEach(rec => {
    totalMonthlyRupees += rec.rupeeSaved;
    totalMonthlyKwh += rec.kwhSaved;

    const card = document.createElement('div');
    card.className = `rec-card rec-${rec.priority}`;
    card.innerHTML = `
      <div class="rec-icon-wrapper">
        <i class="fa-solid ${rec.icon}"></i>
      </div>
      <div class="rec-content">
        <div class="rec-header">
          <h4 class="rec-title">${rec.title}</h4>
          <span class="badge badge-${rec.priority}">${rec.category}</span>
        </div>
        <p class="rec-desc">${rec.description}</p>
        <div class="rec-action">
          <i class="fa-solid fa-arrow-right"></i> <strong>Recommended Action:</strong> ${rec.action}
        </div>
      </div>
      <div class="rec-savings">
        <div class="savings-amount">₹${rec.rupeeSaved.toLocaleString('en-IN')}</div>
        <div class="savings-label">est. savings / month</div>
        <div class="savings-kwh">~${rec.kwhSaved} kWh curtailed</div>
      </div>
    `;
    container.appendChild(card);
  });

  // Update total potential savings badge
  const totalRupeeEl = document.getElementById('total-potential-savings-rupees');
  const totalKwhEl = document.getElementById('total-potential-savings-kwh');
  if (totalRupeeEl) totalRupeeEl.textContent = `₹${totalMonthlyRupees.toLocaleString('en-IN')}/mo`;
  if (totalKwhEl) totalKwhEl.textContent = `${totalMonthlyKwh} kWh/mo`;
}

/**
 * Interactive What-If Simulator with debounced recalculation
 */
function initWhatIfSimulator(inputs, pred) {
  const acReductionSlider = document.getElementById('sim-ac-reduction');
  const fanReductionSlider = document.getElementById('sim-fan-reduction');
  const tvReductionSlider = document.getElementById('sim-tv-reduction');

  if (!acReductionSlider || !fanReductionSlider) return;

  let debounceTimer = null;

  function recalculateSimulation() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const acCut = parseFloat(acReductionSlider.value) || 0;
      const fanCut = parseFloat(fanReductionSlider.value) || 0;
      const tvCut = parseFloat(tvReductionSlider ? tvReductionSlider.value : 0) || 0;

      // Update slider label displays
      const acLabel = document.getElementById('sim-ac-val');
      const fanLabel = document.getElementById('sim-fan-val');
      const tvLabel = document.getElementById('sim-tv-val');
      if (acLabel) acLabel.textContent = `-${acCut}h`;
      if (fanLabel) fanLabel.textContent = `-${fanCut}h`;
      if (tvLabel) tvLabel.textContent = `-${tvCut}h`;

      // Energy curtailment:
      // AC: 1500W * acCut hrs * 30 days
      // Fan: 75W * fanCut hrs * 30 days
      // TV: 100W * tvCut hrs * 30 days
      const kwhCutMonthly = ((acCut * 1.5 * 30) + (fanCut * 0.075 * 30) + (tvCut * 0.1 * 30));
      const tariff = pred.tariff || 8.4;
      const rupeeSavedMonthly = Math.round(kwhCutMonthly * tariff);
      const rupeeSavedAnnual = Math.round(rupeeSavedMonthly * 12);

      const simNewHours = Math.max(95, Math.round((pred.predicted_hours - kwhCutMonthly) * 10) / 10);
      const simNewBill = Math.round(simNewHours * tariff);

      // Update UI elements
      const elSavedMo = document.getElementById('sim-savings-monthly');
      const elSavedYr = document.getElementById('sim-savings-annual');
      const elNewBill = document.getElementById('sim-new-bill');
      const elNewUnits = document.getElementById('sim-new-units');

      if (elSavedMo) elSavedMo.textContent = `₹${rupeeSavedMonthly.toLocaleString('en-IN')}`;
      if (elSavedYr) elSavedYr.textContent = `₹${rupeeSavedAnnual.toLocaleString('en-IN')}`;
      if (elNewBill) elNewBill.textContent = `₹${simNewBill.toLocaleString('en-IN')}/mo`;
      if (elNewUnits) elNewUnits.textContent = `${simNewHours} Units`;
    }, 300);
  }

  [acReductionSlider, fanReductionSlider, tvReductionSlider].forEach(slider => {
    if (slider) slider.addEventListener('input', recalculateSimulation);
  });

  // Run initial calculation
  recalculateSimulation();
}
