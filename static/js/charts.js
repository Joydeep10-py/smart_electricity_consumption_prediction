/**
 * SPARK - Interactive Data Visualizations
 * Powered by Chart.js for responsive analytics across Dashboard, Insights, and Model Benchmarks.
 */

const SPARK_CHARTS = (function() {
  // Chart instances registry
  const instances = {};

  // Theme color palette
  function getThemeColors() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
      textColor: isDark ? '#94a3b8' : '#475569',
      gridColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
      primary: '#3b82f6',
      primaryLight: 'rgba(59, 130, 246, 0.25)',
      sparkGold: '#f59e0b',
      sparkGoldLight: 'rgba(245, 158, 11, 0.25)',
      emerald: '#10b981',
      emeraldLight: 'rgba(16, 185, 129, 0.25)',
      rose: '#f43f5e',
      roseLight: 'rgba(244, 63, 94, 0.25)',
      purple: '#8b5cf6',
      cyan: '#06b6d4',
      slate: '#64748b'
    };
  }

  function destroyChart(id) {
    if (instances[id]) {
      instances[id].destroy();
      delete instances[id];
    }
  }

  // --- DASHBOARD CHARTS ---

  /**
   * 1. Appliance Daily Energy Share (Doughnut Chart in kWh)
   */
  function renderApplianceShareChart(canvasId, applianceKwh) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const colors = getThemeColors();
    const labels = Object.keys(applianceKwh);
    const data = Object.values(applianceKwh);

    instances[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: [
            '#3b82f6', // Fan
            '#06b6d4', // Fridge
            '#f43f5e', // AC
            '#f59e0b', // TV
            '#8b5cf6'  // Monitor
          ],
          borderWidth: 2,
          borderColor: document.documentElement.getAttribute('data-theme') === 'dark' ? '#1e293b' : '#ffffff',
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: colors.textColor, font: { family: 'Inter', size: 12 } }
          },
          tooltip: {
            callbacks: {
              label: function(item) {
                const total = data.reduce((a, b) => a + b, 0);
                const val = item.raw;
                const pct = total > 0 ? Math.round((val / total) * 100) : 0;
                return ` ${item.label}: ${val.toFixed(2)} kWh/day (${pct}%)`;
              }
            }
          }
        },
        cutout: '68%'
      }
    });
  }

  /**
   * 2. Appliance Runtime Comparison: User vs Dataset Average (Horizontal Bar Chart)
   */
  function renderApplianceRuntimeChart(canvasId, userInputs) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const colors = getThemeColors();
    const labels = ['Fan', 'Refrigerator', 'Air Conditioner', 'Television', 'Monitor'];
    const userData = [
      parseFloat(userInputs.fan) || 0,
      parseFloat(userInputs.refrigerator) || 0,
      parseFloat(userInputs.air_conditioner) || 0,
      parseFloat(userInputs.television) || 0,
      parseFloat(userInputs.monitor) || 0
    ];
    const avgData = [14.0, 21.7, 1.5, 12.5, 2.9];

    instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Your Household (hrs/day)',
            data: userData,
            backgroundColor: '#3b82f6',
            borderRadius: 6
          },
          {
            label: 'National Dataset Average',
            data: avgData,
            backgroundColor: colors.slate,
            borderRadius: 6
          }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { color: colors.gridColor },
            ticks: { color: colors.textColor, font: { family: 'Inter' } },
            title: { display: true, text: 'Hours / Day', color: colors.textColor }
          },
          y: {
            grid: { display: false },
            ticks: { color: colors.textColor, font: { family: 'Inter', weight: '500' } }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: { color: colors.textColor, font: { family: 'Inter', size: 12 } }
          }
        }
      }
    });
  }

  /**
   * 3. Household vs Dataset Quartile Benchmark (Bar Chart)
   */
  function renderBenchmarkChart(canvasId, userMonthlyHours) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const colors = getThemeColors();
    const labels = ['25th %ile (Low)', 'Median (Average)', 'Your Prediction', '75th %ile (High)'];
    const data = [429.0, 515.0, userMonthlyHours, 601.0];
    const bgColors = [
      colors.emerald,
      colors.slate,
      '#3b82f6',
      colors.rose
    ];

    instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Monthly Consumption (Hours / Units)',
          data: data,
          backgroundColor: bgColors,
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            grid: { color: colors.gridColor },
            ticks: { color: colors.textColor, font: { family: 'Inter' } },
            title: { display: true, text: 'Monthly Consumption (kWh Units)', color: colors.textColor }
          },
          x: {
            grid: { display: false },
            ticks: { color: colors.textColor, font: { family: 'Inter', weight: '500' } }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (item) => ` ${item.raw.toFixed(1)} Units / Month`
            }
          }
        }
      }
    });
  }

  /**
   * 4. Seasonal & Monthly Baseline Projection (Line Chart)
   */
  function renderSeasonalProjectionChart(canvasId, baselineHours) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const colors = getThemeColors();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    // Factors relative to annual mean of 515
    const monthFactors = [1.021, 0.910, 1.022, 0.988, 1.021, 0.980, 1.026, 1.021, 0.978, 1.023, 0.987, 1.026];
    const projectedData = monthFactors.map(f => Math.round(baselineHours * f * 10) / 10);
    const nationalAverages = [526.0, 468.9, 526.3, 508.8, 525.7, 504.6, 528.7, 525.8, 504.0, 526.7, 508.6, 528.3];

    instances[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Your Projected Monthly Trend',
            data: projectedData,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            borderWidth: 3,
            fill: true,
            tension: 0.35,
            pointRadius: 4,
            pointBackgroundColor: '#3b82f6'
          },
          {
            label: 'National Baseline Average',
            data: nationalAverages,
            borderColor: colors.slate,
            borderWidth: 2,
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false,
            tension: 0.35
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            grid: { color: colors.gridColor },
            ticks: { color: colors.textColor, font: { family: 'Inter' } },
            title: { display: true, text: 'Monthly Consumption Units', color: colors.textColor }
          },
          x: {
            grid: { display: false },
            ticks: { color: colors.textColor, font: { family: 'Inter' } }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: { color: colors.textColor, font: { family: 'Inter', size: 12 } }
          }
        }
      }
    });
  }

  // --- INSIGHTS PAGE CHARTS ---

  /**
   * Average Electricity Bill by City across 16 Indian Cities
   */
  function renderCityBillChart(canvasId) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const colors = getThemeColors();
    const sorted = [...SPARK_DATA.cities].sort((a, b) => b.avgBill - a.avgBill);
    const labels = sorted.map(c => c.name);
    const bills = sorted.map(c => c.avgBill);

    // Color highest (Navi Mumbai) and lowest (Ratnagiri) specifically
    const barColors = sorted.map(c => {
      if (c.name === 'Navi Mumbai') return colors.rose;
      if (c.name === 'Ratnagiri') return colors.emerald;
      return '#3b82f6';
    });

    instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Average Monthly Bill (₹)',
          data: bills,
          backgroundColor: barColors,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            grid: { color: colors.gridColor },
            ticks: { color: colors.textColor },
            title: { display: true, text: 'Electricity Bill (₹)', color: colors.textColor }
          },
          x: {
            grid: { display: false },
            ticks: { color: colors.textColor, maxRotation: 45, minRotation: 45, font: { size: 11 } }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (item) => ` ₹${item.raw.toLocaleString('en-IN')}`
            }
          }
        }
      }
    });
  }

  /**
   * Monthly Consumption & AC Usage (Dual-axis Line Chart)
   */
  function renderMonthlySeasonalityChart(canvasId) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const colors = getThemeColors();
    const months = SPARK_DATA.months.map(m => m.name.substring(0, 3));
    const hours = SPARK_DATA.months.map(m => m.avgHours);
    const ac = SPARK_DATA.months.map(m => m.avgAC);

    instances[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Monthly Consumption (Units)',
            data: hours,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            yAxisID: 'y',
            tension: 0.3,
            fill: true,
            pointRadius: 4
          },
          {
            label: 'Air Conditioner Runtime (hrs/day)',
            data: ac,
            borderColor: '#f59e0b',
            borderDash: [4, 4],
            yAxisID: 'y1',
            tension: 0.3,
            pointRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            type: 'linear',
            position: 'left',
            grid: { color: colors.gridColor },
            ticks: { color: colors.textColor },
            title: { display: true, text: 'Monthly Hours (Units)', color: colors.textColor }
          },
          y1: {
            type: 'linear',
            position: 'right',
            grid: { display: false },
            min: 0,
            max: 3,
            ticks: { color: '#f59e0b' },
            title: { display: true, text: 'AC Daily Runtime (Hours)', color: '#f59e0b' }
          },
          x: {
            grid: { display: false },
            ticks: { color: colors.textColor }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: { color: colors.textColor }
          }
        }
      }
    });
  }

  /**
   * Feature Correlation with Monthly Hours (Target)
   */
  function renderCorrelationChart(canvasId) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const colors = getThemeColors();
    const corrs = [...SPARK_DATA.correlations].sort((a, b) => b.corr - a.corr);
    const labels = corrs.map(c => c.feature);
    const data = corrs.map(c => c.corr);
    const bgColors = corrs.map(c => c.category === 'Appliance' ? '#3b82f6' : colors.slate);

    instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Pearson Correlation with Monthly Consumption',
          data: data,
          backgroundColor: bgColors,
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { color: colors.gridColor },
            ticks: { color: colors.textColor },
            min: -0.1,
            max: 0.5,
            title: { display: true, text: 'Correlation Coefficient (r)', color: colors.textColor }
          },
          y: {
            grid: { display: false },
            ticks: { color: colors.textColor, font: { size: 12 } }
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }

  // --- MODEL PAGE CHARTS ---

  /**
   * ML Models R2 Comparison
   */
  function renderModelR2Chart(canvasId) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const colors = getThemeColors();
    const models = [...SPARK_DATA.models].sort((a, b) => b.r2 - a.r2);
    const labels = models.map(m => m.name);
    const r2Vals = models.map(m => m.r2);
    const bg = models.map(m => m.isBest ? '#10b981' : '#3b82f6');

    instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Test R² Score',
          data: r2Vals,
          backgroundColor: bg,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            min: 0.45,
            max: 0.60,
            grid: { color: colors.gridColor },
            ticks: { color: colors.textColor },
            title: { display: true, text: 'Coefficient of Determination (R²)', color: colors.textColor }
          },
          x: {
            grid: { display: false },
            ticks: { color: colors.textColor, maxRotation: 30, minRotation: 30 }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (item) => ` R² Score: ${item.raw.toFixed(4)}`
            }
          }
        }
      }
    });
  }

  /**
   * ML Models MAE Comparison
   */
  function renderModelMaeChart(canvasId) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const colors = getThemeColors();
    const models = [...SPARK_DATA.models].sort((a, b) => a.mae - b.mae);
    const labels = models.map(m => m.name);
    const maeVals = models.map(m => m.mae);
    const bg = models.map(m => m.isBest ? '#10b981' : '#f59e0b');

    instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Mean Absolute Error (Units)',
          data: maeVals,
          backgroundColor: bg,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            min: 65,
            max: 75,
            grid: { color: colors.gridColor },
            ticks: { color: colors.textColor },
            title: { display: true, text: 'MAE (Lower is Better)', color: colors.textColor }
          },
          x: {
            grid: { display: false },
            ticks: { color: colors.textColor, maxRotation: 30, minRotation: 30 }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (item) => ` MAE: ${item.raw.toFixed(2)} units`
            }
          }
        }
      }
    });
  }

  /**
   * Feature Importance Horizontal Bar Chart
   */
  function renderFeatureImportanceChart(canvasId) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const colors = getThemeColors();
    const feats = [...SPARK_DATA.featureImportance].reverse();
    const labels = feats.map(f => f.feature);
    const data = feats.map(f => f.importance);
    const bg = feats.map(f => f.importance > 0.5 ? '#10b981' : '#3b82f6');

    instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Relative Gini Importance',
          data: data,
          backgroundColor: bg,
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { color: colors.gridColor },
            ticks: { color: colors.textColor, callback: (v) => `${(v * 100).toFixed(0)}%` },
            title: { display: true, text: 'Importance Weight', color: colors.textColor }
          },
          y: {
            grid: { display: false },
            ticks: { color: colors.textColor, font: { size: 11 } }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (item) => ` Importance: ${(item.raw * 100).toFixed(2)}%`
            }
          }
        }
      }
    });
  }

  // Update theme when switched
  function refreshTheme() {
    Object.values(instances).forEach(chart => {
      const colors = getThemeColors();
      if (chart.options.scales) {
        if (chart.options.scales.x && chart.options.scales.x.ticks) chart.options.scales.x.ticks.color = colors.textColor;
        if (chart.options.scales.x && chart.options.scales.x.grid) chart.options.scales.x.grid.color = colors.gridColor;
        if (chart.options.scales.y && chart.options.scales.y.ticks) chart.options.scales.y.ticks.color = colors.textColor;
        if (chart.options.scales.y && chart.options.scales.y.grid) chart.options.scales.y.grid.color = colors.gridColor;
      }
      chart.update();
    });
  }

  return {
    renderApplianceShareChart,
    renderApplianceRuntimeChart,
    renderBenchmarkChart,
    renderSeasonalProjectionChart,
    renderCityBillChart,
    renderMonthlySeasonalityChart,
    renderCorrelationChart,
    renderModelR2Chart,
    renderModelMaeChart,
    renderFeatureImportanceChart,
    refreshTheme
  };
})();
