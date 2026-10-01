/**
 * SPARK - Predict Page Interactive Controller
 * Two-way slider-input binding, soft bound validation, live instant preview,
 * presets application, and seamless navigation to analytics dashboard.
 */

document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('prediction-form');
  if (!form) return;

  const applianceKeys = ['fan', 'refrigerator', 'air_conditioner', 'television', 'monitor'];
  const monthSelect = document.getElementById('month-select');
  const citySelect = document.getElementById('city-select');
  const companySelect = document.getElementById('company-select');

  // Populate Cities and Companies dynamically from SPARK_DATA if dropdowns are empty
  if (citySelect && citySelect.options.length <= 1) {
    citySelect.innerHTML = '';
    SPARK_DATA.cities.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.name;
      opt.textContent = `${c.name} (${c.state}) — ₹${c.tariff}/kWh`;
      if (c.name === 'Hyderabad') opt.selected = true;
      citySelect.appendChild(opt);
    });
  }

  if (companySelect && companySelect.options.length <= 1) {
    companySelect.innerHTML = '';
    SPARK_DATA.companies.forEach(comp => {
      const opt = document.createElement('option');
      opt.value = comp;
      opt.textContent = comp;
      if (comp.includes('Tata Power')) opt.selected = true;
      companySelect.appendChild(opt);
    });
  }

  // Two-way synchronization for sliders and numeric inputs
  applianceKeys.forEach(key => {
    const slider = document.getElementById(`${key}-slider`);
    const numInput = document.getElementById(`${key}-input`);

    if (slider && numInput) {
      slider.addEventListener('input', function() {
        numInput.value = slider.value;
        updateLivePreview();
      });

      numInput.addEventListener('input', function() {
        let val = parseFloat(numInput.value);
        if (isNaN(val)) val = 0;
        if (val < 0) val = 0;
        if (val > 24) val = 24;
        slider.value = val;
        updateLivePreview();
      });
    }
  });

  if (monthSelect) {
    monthSelect.addEventListener('change', updateLivePreview);
  }
  if (citySelect) {
    citySelect.addEventListener('change', updateLivePreview);
  }

  // Presets handling
  const presets = {
    saver: { fan: 8, refrigerator: 18, air_conditioner: 0, television: 4, monitor: 1, month: 2 },
    average: { fan: 14, refrigerator: 22, air_conditioner: 2, television: 13, monitor: 1, month: 7 },
    heavy: { fan: 20, refrigerator: 23, air_conditioner: 3, television: 18, monitor: 8, month: 5 }
  };

  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const type = this.getAttribute('data-preset');
      const p = presets[type];
      if (!p) return;

      document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');

      applianceKeys.forEach(k => {
        const slider = document.getElementById(`${k}-slider`);
        const numInput = document.getElementById(`${k}-input`);
        if (slider && numInput && p[k] !== undefined) {
          slider.value = p[k];
          numInput.value = p[k];
        }
      });

      if (monthSelect && p.month) {
        monthSelect.value = p.month;
      }

      updateLivePreview();
      if (window.showToast) {
        window.showToast(`Applied ${this.textContent.trim()} preset.`, 'info');
      }
    });
  });

  // Reset defaults button
  const resetBtn = document.getElementById('reset-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', function(e) {
      e.preventDefault();
      const avg = presets.average;
      applianceKeys.forEach(k => {
        const s = document.getElementById(`${k}-slider`);
        const n = document.getElementById(`${k}-input`);
        if (s && n) {
          s.value = avg[k];
          n.value = avg[k];
        }
      });
      if (monthSelect) monthSelect.value = 7;
      if (citySelect) citySelect.value = 'Hyderabad';
      if (companySelect) companySelect.value = 'Tata Power Company Ltd.';
      document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
      updateLivePreview();
      if (window.showToast) window.showToast('Reset inputs to dataset medians.', 'info');
    });
  }

  // Restore previous inputs from sessionStorage if available
  const savedInputs = sessionStorage.getItem('spark_user_inputs');
  if (savedInputs) {
    try {
      const parsed = JSON.parse(savedInputs);
      applianceKeys.forEach(k => {
        if (parsed[k] !== undefined) {
          const s = document.getElementById(`${k}-slider`);
          const n = document.getElementById(`${k}-input`);
          if (s && n) {
            s.value = parsed[k];
            n.value = parsed[k];
          }
        }
      });
      if (parsed.month && monthSelect) monthSelect.value = parsed.month;
      if (parsed.city && citySelect) citySelect.value = parsed.city;
      if (parsed.company && companySelect) companySelect.value = parsed.company;
    } catch (e) {
      console.warn('Could not parse saved inputs', e);
    }
  }

  /**
   * Update live badges, dynamic calculations, and soft bound warnings
   */
  function updateLivePreview() {
    const fan = parseFloat(document.getElementById('fan-input')?.value) || 0;
    const fridge = parseFloat(document.getElementById('refrigerator-input')?.value) || 0;
    const ac = parseFloat(document.getElementById('air_conditioner-input')?.value) || 0;
    const tv = parseFloat(document.getElementById('television-input')?.value) || 0;
    const monitor = parseFloat(document.getElementById('monitor-input')?.value) || 0;
    const month = parseInt(monthSelect?.value, 10) || 7;
    const city = citySelect?.value || 'Hyderabad';

    const totalHours = fan + fridge + ac + tv + monitor;
    const estimatedLoad = ((fan * 75) + (fridge * 150) + (ac * 1500) + (tv * 100) + (monitor * 30)) / 1000.0;
    const season = getSeasonName(month);
    const tariff = getCityTariff(city);

    // Update Live Badges
    const badgeTotalHours = document.getElementById('preview-total-hours');
    if (badgeTotalHours) badgeTotalHours.textContent = `${totalHours.toFixed(1)} hrs/day`;

    const badgeDailyLoad = document.getElementById('preview-daily-load');
    if (badgeDailyLoad) badgeDailyLoad.textContent = `${estimatedLoad.toFixed(2)} kWh/day`;

    const badgeSeason = document.getElementById('preview-season-badge');
    if (badgeSeason) {
      badgeSeason.textContent = season;
      badgeSeason.className = `badge badge-${season.toLowerCase()}`;
    }

    const badgeTariff = document.getElementById('preview-tariff-chip');
    if (badgeTariff) badgeTariff.textContent = `₹${tariff.toFixed(1)} / Unit`;

    // Instant Quick Estimate in card
    const quickHours = Math.round(Math.max(95, Math.min(926, 515.0 + 5.5 * (totalHours - 52.5))));
    const quickBill = Math.round(quickHours * tariff);
    const quickHoursEl = document.getElementById('preview-quick-hours');
    const quickBillEl = document.getElementById('preview-quick-bill');
    if (quickHoursEl) quickHoursEl.textContent = `~${quickHours} Units`;
    if (quickBillEl) quickBillEl.textContent = `~₹${quickBill.toLocaleString('en-IN')}`;

    // Soft warnings for realistic usage
    const warningBox = document.getElementById('soft-warning-box');
    if (warningBox) {
      const warnings = [];
      if (totalHours > 70) {
        warnings.push('High cumulative hours: Multiple high-drain appliances appear to operate concurrently around the clock.');
      }
      if (ac > 12) {
        warnings.push('Extended AC runtime (> 12 hrs) will dramatically escalate monthly power bills.');
      }
      if (fridge < 12) {
        warnings.push('Refrigerators typically run between 18–24 hours/day to maintain safe food storage.');
      }

      if (warnings.length > 0) {
        warningBox.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> <div>${warnings.join('<br>')}</div>`;
        warningBox.style.display = 'flex';
      } else {
        warningBox.style.display = 'none';
      }
    }
  }

  // Handle Form Submission
  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    const submitBtn = document.getElementById('predict-submit-btn');
    const originalText = submitBtn ? submitBtn.innerHTML : 'Predict';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Running ML Inference...';
    }

    const payload = {
      fan: parseFloat(document.getElementById('fan-input')?.value) || 14,
      refrigerator: parseFloat(document.getElementById('refrigerator-input')?.value) || 22,
      air_conditioner: parseFloat(document.getElementById('air_conditioner-input')?.value) || 1.5,
      television: parseFloat(document.getElementById('television-input')?.value) || 12,
      monitor: parseFloat(document.getElementById('monitor-input')?.value) || 3,
      month: parseInt(monthSelect?.value, 10) || 7,
      city: citySelect?.value || 'Hyderabad',
      company: companySelect?.value || 'Tata Power Company Ltd.'
    };

    try {
      const result = await SPARK_API.predict(payload);

      // Save input and result to sessionStorage for Dashboard
      sessionStorage.setItem('spark_user_inputs', JSON.stringify(payload));
      sessionStorage.setItem('spark_prediction_result', JSON.stringify(result));

      // Navigate to Dashboard
      window.location.href = '/dashboard';
    } catch (err) {
      console.error('Prediction failed:', err);
      if (window.showToast) {
        window.showToast('Inference error: ' + err.message, 'error');
      }
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    }
  });

  // Initial preview sync on page load
  updateLivePreview();
});
