/* ═══════════════════════════════════════════════════════════════
   SPARK — Frontend Application Logic
   Handles API communication, form interaction, result rendering
   ═══════════════════════════════════════════════════════════════ */

const API_BASE = window.location.origin;

/* ── DOM References ───────────────────────────────────────── */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const statusDot  = $(".status-dot");
const statusText = $(".status-text");
const form       = $("#predictionForm");
const predictBtn = $("#predictBtn");
const btnText    = $(".btn-text");
const btnLoader  = $(".btn-loader");
const resultsEl  = $("#results");

/* ── State ────────────────────────────────────────────────── */
let metadata = null;

/* ── Initialization ───────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", async () => {
  initSliders();
  initNavScroll();
  await loadMetadata();
});

/* ── Slider Two-Way Binding ───────────────────────────────── */
function initSliders() {
  $$('input[type="range"]').forEach((slider) => {
    const output = $(`#output-${slider.name}`);
    if (!output) return;

    const update = () => {
      const val = slider.value;
      if (slider.name === "TariffRate") {
        output.textContent = `₹${parseFloat(val).toFixed(1)}`;
      } else {
        output.textContent = val;
      }
      // Update track fill via CSS custom property
      const pct = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
      slider.style.background = `linear-gradient(to right, rgba(0,212,255,0.5) 0%, rgba(123,97,255,0.5) ${pct}%, rgba(255,255,255,0.08) ${pct}%)`;
    };

    slider.addEventListener("input", update);
    update(); // initial paint
  });
}

/* ── Navbar active-section tracking ───────────────────────── */
function initNavScroll() {
  const links = $$(".nav-link");
  const sections = ["predict", "results", "model-info"];

  window.addEventListener("scroll", () => {
    const scrollY = window.scrollY + 100;
    let current = "";

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el && el.offsetTop <= scrollY) current = id;
    });

    links.forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href") === `#${current}`);
    });
  });
}

/* ── Load Metadata (cities, companies, model info) ────────── */
async function loadMetadata() {
  try {
    const res = await fetch(`${API_BASE}/api/metadata`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    metadata = await res.json();

    // Populate city dropdown
    const citySelect = $("#input-City");
    citySelect.innerHTML = metadata.cities
      .map((c) => `<option value="${c}">${c}</option>`)
      .join("");

    // Populate company dropdown
    const companySelect = $("#input-Company");
    companySelect.innerHTML = metadata.companies
      .map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`)
      .join("");

    // Render model comparison table
    renderModelTable(metadata.model_comparison);

    // Render feature importance
    renderFeatureImportance(metadata.feature_importance);

    // Status: connected
    statusDot.classList.add("connected");
    statusDot.classList.remove("error");
    statusText.textContent = "Model Ready";
  } catch (err) {
    console.error("Metadata load failed:", err);
    statusDot.classList.add("error");
    statusDot.classList.remove("connected");
    statusText.textContent = "Offline";
    showToast("⚠️ Cannot connect to SPARK backend. Is the server running?");
  }
}

/* ── Form Submission ──────────────────────────────────────── */
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!metadata) {
    showToast("Backend not connected. Please wait or refresh.");
    return;
  }

  // Build payload
  const payload = {
    Fan:            parseInt($("#input-Fan").value),
    Refrigerator:   parseInt($("#input-Refrigerator").value),
    AirConditioner: parseInt($("#input-AirConditioner").value),
    Television:     parseInt($("#input-Television").value),
    Monitor:        parseInt($("#input-Monitor").value),
    Month:          parseInt($("#input-Month").value),
    City:           $("#input-City").value,
    Company:        $("#input-Company").value,
    TariffRate:     parseFloat($("#input-TariffRate").value),
  };

  // UI: loading state
  predictBtn.disabled = true;
  btnText.hidden = true;
  btnLoader.hidden = false;

  try {
    const res = await fetch(`${API_BASE}/api/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }

    renderResults(data);
  } catch (err) {
    console.error("Prediction failed:", err);
    showToast(`Prediction failed: ${err.message}`);
  } finally {
    predictBtn.disabled = false;
    btnText.hidden = false;
    btnLoader.hidden = true;
  }
});

/* ── Render Prediction Results ────────────────────────────── */
function renderResults(data) {
  resultsEl.classList.remove("hidden");

  // Subtitle
  $("#resultSubtitle").textContent =
    `${data.input_summary.city} · ${monthName(data.input_summary.month)} · ${data.season}`;

  // KPIs with count-up animation
  animateValue($("#kpiConsumption"), data.predicted_monthly_hours, 0);
  animateValue($("#kpiBill"), data.predicted_monthly_bill, 2, "₹");

  // Efficiency ring
  const eff = data.efficiency_score;
  $("#kpiEfficiency").textContent = eff;
  const ring = $("#efficiencyRing");
  const circumference = 2 * Math.PI * 52; // r=52
  const offset = circumference * (1 - eff / 100);

  // We need to add an SVG gradient definition if not present
  ensureRingGradient();
  ring.style.stroke = `url(#ringGradient)`;
  // Trigger reflow then animate
  ring.style.strokeDashoffset = circumference;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      ring.style.strokeDashoffset = offset;
    });
  });

  // Season
  const seasonIcons = { Winter: "❄️", Summer: "☀️", Monsoon: "🌧️", Post_Monsoon: "🍂" };
  $("#seasonIcon").textContent = seasonIcons[data.season] || "🌤️";
  $("#kpiSeason").textContent = data.season.replace("_", " ");
  $("#kpiTariff").textContent = `₹${data.tariff_rate}/hr`;

  // Appliance breakdown
  renderBreakdown(data.appliance_breakdown);

  // Recommendations
  renderRecommendations(data.recommendations);

  // Scroll to results
  resultsEl.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ── Count-Up Animation ───────────────────────────────────── */
function animateValue(el, target, decimals = 0, prefix = "") {
  const duration = 800;
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const current = target * ease;
    el.textContent = prefix + current.toLocaleString("en-IN", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

/* ── Breakdown Bars ───────────────────────────────────────── */
function renderBreakdown(items) {
  const container = $("#breakdownBars");
  container.innerHTML = items
    .map(
      (item) => `
    <div class="breakdown-item">
      <span class="breakdown-name">${item.name}</span>
      <div class="breakdown-bar-track">
        <div class="breakdown-bar-fill" style="width: 0%" data-target="${item.percentage}"></div>
      </div>
      <span class="breakdown-pct">${item.percentage}%</span>
    </div>
  `
    )
    .join("");

  // Animate bars
  requestAnimationFrame(() => {
    container.querySelectorAll(".breakdown-bar-fill").forEach((bar) => {
      requestAnimationFrame(() => {
        bar.style.width = bar.dataset.target + "%";
      });
    });
  });
}

/* ── Recommendations ──────────────────────────────────────── */
function renderRecommendations(recs) {
  const container = $("#recsGrid");
  container.innerHTML = recs
    .map(
      (rec) => `
    <div class="rec-card">
      <div class="rec-header">
        <span class="rec-icon">${rec.icon}</span>
        <span class="rec-title">${rec.title}</span>
      </div>
      <p class="rec-detail">${rec.detail}</p>
      <span class="rec-saving">Potential saving: ${rec.potential_saving}</span>
    </div>
  `
    )
    .join("");
}

/* ── Model Comparison Table ───────────────────────────────── */
function renderModelTable(models) {
  const tbody = $("#modelTableBody");
  if (!models || !models.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">No data available</td></tr>`;
    return;
  }

  tbody.innerHTML = models
    .map((m) => {
      const isBest = m.Model === "Gradient Boosting";
      return `
      <tr class="${isBest ? "best-model" : ""}">
        <td>${m.Model}</td>
        <td>${Number(m.MAE).toFixed(2)}</td>
        <td>${Number(m.RMSE).toFixed(2)}</td>
        <td>${Number(m.R2).toFixed(4)}</td>
        <td>${Number(m.CV_R2_Mean).toFixed(4)} ± ${Number(m.CV_R2_Std).toFixed(4)}</td>
      </tr>
    `;
    })
    .join("");
}

/* ── Feature Importance Bars ──────────────────────────────── */
function renderFeatureImportance(features) {
  const container = $("#fiBars");
  if (!features || !features.length) {
    container.innerHTML = `<p style="color:var(--text-muted)">No data available</p>`;
    return;
  }

  const maxImp = Math.max(...features.map((f) => f.Importance));

  container.innerHTML = features
    .slice(0, 8) // top 8
    .map(
      (f) => `
    <div class="fi-item">
      <div>
        <div class="fi-item-name">${f.Feature}</div>
        <div class="fi-bar-track">
          <div class="fi-bar-fill" style="width: ${((f.Importance / maxImp) * 100).toFixed(1)}%"></div>
        </div>
      </div>
      <span class="fi-value">${(f.Importance * 100).toFixed(1)}%</span>
    </div>
  `
    )
    .join("");
}

/* ── SVG Gradient for Efficiency Ring ─────────────────────── */
function ensureRingGradient() {
  if (document.getElementById("ringGradient")) return;
  const svg = $(".efficiency-ring");
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  defs.innerHTML = `
    <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00d4ff" />
      <stop offset="100%" stop-color="#7b61ff" />
    </linearGradient>
  `;
  svg.insertBefore(defs, svg.firstChild);
}

/* ── Helpers ───────────────────────────────────────────────── */
function monthName(m) {
  return [
    "", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ][m] || "";
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function showToast(msg) {
  // Remove existing toasts
  document.querySelectorAll(".toast").forEach((t) => t.remove());

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = msg;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("toast-out");
    toast.addEventListener("animationend", () => toast.remove());
  }, 4000);
}
