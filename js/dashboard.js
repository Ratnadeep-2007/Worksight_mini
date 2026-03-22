/**
 * WorkSight – Dashboard Renderer
 * Renders XAI results: score ring, reasoning tags, drift summary, intervention.
 */

/**
 * Render the full analysis results to the XAI Results panel.
 */
function renderResults(result, employeeData) {
  document.getElementById("resultsPlaceholder").style.display = "none";
  document.getElementById("resultsContent").style.display = "flex";

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

  // ─── XAI Reasoning Tags ───
  const tagsEl = document.getElementById("xaiTags");
  tagsEl.innerHTML = "";

  (result.xai_reasoning_tags || []).forEach((tag, i) => {
    const w = parseInt(tag.impact_weight) || 0;
    const card = document.createElement("div");
    card.className = "xai-tag";
    card.style.animationDelay = `${i * 0.15}s`;
    card.innerHTML = `
      <div class="xai-tag-top">
        <span class="xai-factor">${esc(tag.factor)}</span>
        <span class="xai-weight">${esc(tag.impact_weight)}</span>
      </div>
      <div class="xai-bar-track"><div class="xai-bar-fill" style="width:0%"></div></div>
      <div class="xai-explanation">${esc(tag.explanation)}</div>
    `;
    tagsEl.appendChild(card);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        card.querySelector(".xai-bar-fill").style.width = w + "%";
      });
    });
  });

  // ─── Intervention ───
  document.getElementById("interventionText").textContent =
    result.intervention_tactic || "No intervention suggested.";

  // ─── Formatted Human Readable Output ───
  let readableText = `Analysis Report:\n`;
  readableText += `=================\n\n`;
  readableText += `Burnout Risk Score: ${score}%\n`;
  readableText += `Risk Level: ${badge.textContent}\n\n`;
  readableText += `Profile Drift Summary:\n${result.profile_drift_summary || "No summary available."}\n\n`;
  
  if (result.xai_reasoning_tags && result.xai_reasoning_tags.length > 0) {
    readableText += `Key Stressors:\n`;
    result.xai_reasoning_tags.forEach(tag => {
      readableText += `- ${tag.factor} (${tag.impact_weight}): ${tag.explanation}\n`;
    });
    readableText += `\n`;
  }
  
  readableText += `Recommended Intervention:\n${result.intervention_tactic || "No intervention suggested."}`;

  document.getElementById("jsonOutput").textContent = readableText;

  // ─── Dashboard stats ───
  updateDashboardStats(result, employeeData);
}

function updateDashboardStats(result, employeeData) {
  document.getElementById("stat-total").textContent = "1";
  document.getElementById("stat-burnout").textContent = (result.burnout_risk_score || 0) + "%";

  const rl = (result.risk_level || "").toLowerCase();
  document.getElementById("stat-atrisk").textContent = (rl === "high" || rl === "critical") ? "1" : "0";
  document.getElementById("stat-drift").textContent = result.risk_level || "—";

  // Roster
  const roster = document.getElementById("rosterList");
  const name = employeeData?.employee?.name || "Employee";
  const role = employeeData?.employee?.role || "Role";
  const initials = name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  roster.innerHTML = `
    <div class="roster-item">
      <div class="roster-left">
        <div class="roster-avatar">${initials}</div>
        <div>
          <div class="roster-name">${esc(name)}</div>
          <div class="roster-role">${esc(role)}</div>
        </div>
      </div>
      <span class="risk-pill-sm ${rl}">${esc(result.risk_level || "—")}</span>
    </div>
  `;
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
