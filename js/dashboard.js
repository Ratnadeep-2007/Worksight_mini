/**
 * WorkSight – Dashboard Renderer
 * Renders XAI results: score ring, reasoning tags, drift summary, intervention.
 */

/**
 * Render the full analysis results to the XAI Results panel.
 */
/**
 * Render the full analysis results to the XAI Results panel.
 */
function renderResults(result, employeeData, recordId) {
  document.getElementById("resultsPlaceholder").style.display = "none";
  document.getElementById("resultsContent").style.display = "block"; // Changed from flex to block for standard layout

  const score = result.burnout_risk_score || 0;
  const riskLevel = (result.risk_level || "Unknown").toLowerCase();

  // ─── Score Ring ───
  updateRingGradient(riskLevel);
  const ring = document.getElementById("ringProgress");
  const C = 2 * Math.PI * 78; // r = 78
  ring.style.strokeDasharray = C;
  ring.style.strokeDashoffset = C;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      ring.style.strokeDashoffset = C - (C * score) / 100;
    });
  });

  animateCounter("scoreNumber", 0, score, 1200);

  const badge = document.getElementById("riskBadge");
  badge.textContent = result.risk_level || "Unknown";
  badge.className = "risk-pill " + riskLevel;

  // ─── Retention Deadline (New V2) ───
  const retentionVal = document.getElementById('retentionDeadline');
  const days = result.retention_prediction_days || 90;
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + days);
  retentionVal.innerText = deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  retentionVal.style.color = score > 70 ? 'var(--risk-critical)' : (score > 40 ? 'var(--risk-medium)' : 'var(--risk-low)');

  // ─── Profile Drift Summary ───
  document.getElementById("driftText").textContent =
    result.profile_drift_summary || "No drift summary available.";

  const driftBar = document.getElementById("driftBarFill");
  driftBar.style.width = "0%";
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      driftBar.style.width = Math.min(score, 100) + "%";
    });
  });

  // ─── Benchmarking (New V2) ───
  updateBenchmarking(score);

  // ─── XAI Reasoning Tags ───
  const tagsEl = document.getElementById("xaiTags");
  tagsEl.innerHTML = "";

  (result.xai_reasoning_tags || []).forEach((tag, i) => {
    const w = parseInt(tag.impact_weight) || 0;
    const card = document.createElement("div");
    card.className = "xai-tag";
    card.innerHTML = `
      <div class="xai-tag-top">
        <span class="xai-factor">${esc(tag.factor)}</span>
        <span class="xai-weight">${esc(tag.impact_weight)}</span>
      </div>
      <div class="xai-bar-track"><div class="xai-bar-fill" style="width:${w}%"></div></div>
      <div class="xai-explanation">${esc(tag.explanation)}</div>
    `;
    tagsEl.appendChild(card);
  });

  // ─── Playbook & Intervention (New V2) ───
  document.getElementById('playbookScript').innerText = result.manager_playbook_script || "Initiate a collaborative goal-setting session to clarify priorities.";
  document.getElementById("interventionText").textContent = result.intervention_tactic || "No intervention suggested.";

  // ─── Trendline (New V2) ───
  renderTrendline(recordId, employeeData.name);

  // ─── Formatted Output ───
  document.getElementById("jsonOutput").textContent = JSON.stringify(result, null, 2);
}

/**
 * Renders a mini sparkline based on historical scores for an employee
 */
function renderTrendline(recordId, employeeName) {
  const container = document.getElementById('trendSparkline');
  container.innerHTML = '';
  
  const history = JSON.parse(localStorage.getItem('worksight_history') || '[]');
  
  // Get history for THIS specific employee across all records
  const empHistory = history
    .filter(r => r.employee.name === employeeName)
    .sort((a,b) => a.timestamp - b.timestamp)
    .slice(-5); // Last 5 sessions

  empHistory.forEach(record => {
    const bar = document.createElement('div');
    bar.className = 'spark-bar';
    const s = record.result.burnout_risk_score;
    bar.style.height = Math.max(10, s) + '%';
    bar.title = `Score: ${s}% (${new Date(record.timestamp).toLocaleDateString()})`;
    container.appendChild(bar);
  });
}

/**
 * Calculates and displays team benchmarking
 */
function updateBenchmarking(currentScore) {
  const history = JSON.parse(localStorage.getItem('worksight_history') || '[]');
  if (history.length === 0) return;

  const scores = history.map(r => r.result.burnout_risk_score || 0);
  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const variance = currentScore - avg;

  document.getElementById('teamAvgVal').innerText = avg + '%';
  const varEl = document.getElementById('varianceVal');
  varEl.innerText = (variance >= 0 ? '+' : '') + variance + '%';
  varEl.style.color = variance > 15 ? 'var(--risk-critical)' : (variance < -15 ? 'var(--risk-low)' : 'var(--text-2)');
}

/**
 * Update the dashboard summary metrics (Total, At-Risk, etc.)
 */
function updateDashboardSummary(history) {
  const total = history.length;
  const atRiskCount = history.filter(r => {
    const rl = (r.result.risk_level || "").toLowerCase();
    return rl === "high" || rl === "critical";
  }).length;

  document.getElementById("stat-total").textContent = total;
  document.getElementById("stat-atrisk").textContent = atRiskCount;

  if (total > 0) {
    const latest = history[0].result;
    document.getElementById("stat-burnout").textContent = (latest.burnout_risk_score || 0) + "%";
    document.getElementById("stat-drift").textContent = latest.risk_level || "—";
  } else {
    document.getElementById("stat-burnout").textContent = "—";
    document.getElementById("stat-drift").textContent = "—";
  }
}

/**
 * Render the full history into the sidebar roster.
 */
function renderRoster(history) {
  const roster = document.getElementById("rosterList");
  const isPrivacyMode = document.getElementById('privacyToggle')?.classList.contains('active');

  if (history.length === 0) {
    roster.innerHTML = `
      <div class="roster-empty">
        <div class="empty-graphic">
          <svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="1.2" width="80" height="80" opacity="0.25">
            <circle cx="40" cy="28" r="12"/><path d="M20 68v-6a16 16 0 0 1 16-16h8a16 16 0 0 1 16 16v6"/>
          </svg>
        </div>
        <p>No employees analyzed yet.</p>
        <span class="empty-hint">Click <strong>"Load Demo"</strong> then <strong>"Analyze Drift"</strong> to begin.</span>
      </div>
    `;
    return;
  }

  roster.innerHTML = history.map(record => {
    const rawName = (record.employee && record.employee.name) ? record.employee.name : "Unknown";
    const initials = rawName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
    
    // Privacy Mode Anonymization
    const name = isPrivacyMode ? `EMP_${record.id.toString().slice(-4)}` : rawName;
    const role = isPrivacyMode ? "Confidential Role" : ((record.employee && record.employee.role) ? record.employee.role : "Role");
    const rl = (record.result.risk_level || "").toLowerCase();
    
    return `
      <div class="roster-item" data-id="${record.id}" title="Click to view analysis">
        <div class="roster-left">
          <div class="roster-avatar">${initials}</div>
          <div>
            <div class="roster-name">${esc(name)}</div>
            <div class="roster-role">${esc(role)}</div>
          </div>
        </div>
        <span class="risk-pill-sm ${rl}">${esc(record.result.risk_level || "—")}</span>
      </div>
    `;
  }).join("");
}

function updateRingGradient(riskLevel) {
  const gradEl = document.getElementById("ringGrad");
  if (!gradEl) return;
  const colors = {
    low:      ["#34d399", "#22d3ee"],
    medium:   ["#fbbf24", "#f97316"],
    high:     ["#f97316", "#ef4444"],
    critical: ["#ef4444", "#dc2626"],
  };
  const [c1, c2] = colors[riskLevel] || colors.high;
  gradEl.innerHTML = `<stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/>`;
}

function animateCounter(id, start, end, duration) {
  const el = document.getElementById(id);
  if (!el) return;
  const t0 = performance.now();
  function tick(now) {
    const p = Math.min((now - t0) / duration, 1);
    const eased = 1 - (1 - p) * (1 - p);
    el.textContent = Math.round(start + (end - start) * eased);
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}
