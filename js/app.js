/**
 * WorkSight – Main Application Controller
 * Navigation, settings, demo loading, analysis orchestration.
 */

document.addEventListener("DOMContentLoaded", () => {

  // ═══════ NAVIGATION ═══════
  const navItems = document.querySelectorAll(".nav-item[data-panel]");
  const panels   = document.querySelectorAll(".panel");
  const pageTitle = document.getElementById("pageTitle");
  const pageDesc  = document.getElementById("pageDesc");

  const meta = {
    dashboard:     { title: "Dashboard",        desc: "Employee wellness overview & workforce health" },
    baseline:      { title: "Baseline DNA",     desc: "Recruitment silo — Psychological profiling & engagement scores" },
    digital:       { title: "Digital Exhaust",   desc: "Operational silo — Meeting density, login patterns & task velocity" },
    communication: { title: "Communication",     desc: "Communication silo — Message velocity, latency & network mapping" },
    results:       { title: "XAI Results",       desc: "Profile Drift Intelligence — Explainable AI insights & intervention" },
  };

  function switchPanel(name) {
    navItems.forEach(b => b.classList.toggle("active", b.dataset.panel === name));
    panels.forEach(p => p.classList.toggle("active", p.id === `panel-${name}`));
    const m = meta[name] || {};
    pageTitle.textContent = m.title || name;
    pageDesc.textContent  = m.desc  || "";
  }

  navItems.forEach(btn => btn.addEventListener("click", () => switchPanel(btn.dataset.panel)));

  // ═══════ SLIDER LIVE VALUES ═══════
  document.querySelectorAll(".slider").forEach(s => {
    s.addEventListener("input", () => {
      const valEl = document.getElementById(`val-${s.id}`);
      if (valEl) valEl.textContent = s.value;
    });
  });

  // ═══════ SETTINGS MODAL ═══════
  const modal       = document.getElementById("settingsModal");
  const settingsBtn = document.getElementById("settingsBtn");
  const modalClose  = document.getElementById("modalClose");
  const saveBtn     = document.getElementById("saveSettingsBtn");
  const apiInput    = document.getElementById("apiKeyInput");
  const modelSel    = document.getElementById("modelSelect");
  const apiDot      = document.getElementById("apiDot");
  const apiLabel    = document.getElementById("apiStatusLabel");

  // Load saved
  apiInput.value  = localStorage.getItem("worksight_api_key") || "";
  modelSel.value  = localStorage.getItem("worksight_model")   || "gemini-2.5-flash";
  refreshApiStatus();

  settingsBtn.addEventListener("click", () => modal.classList.add("open"));
  modalClose.addEventListener("click",  () => modal.classList.remove("open"));
  modal.addEventListener("click", e => { if (e.target === modal) modal.classList.remove("open"); });

  saveBtn.addEventListener("click", () => {
    localStorage.setItem("worksight_api_key", apiInput.value.trim());
    localStorage.setItem("worksight_model",   modelSel.value);
    modal.classList.remove("open");
    refreshApiStatus();
    showToast("Settings saved!", "success");
  });

  const clearHistoryBtn = document.getElementById("clearHistoryBtn");
  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener("click", () => {
      if (confirm("Are you sure you want to delete ALL saved analyses? This cannot be undone.")) {
        localStorage.removeItem("worksight_history");
        refreshRoster();
        showToast("History cleared", "info");
      }
    });
  }

  function refreshApiStatus() {
    const hasKey = !!(localStorage.getItem("worksight_api_key") || "").trim();
    apiDot.classList.toggle("connected", hasKey);
    apiLabel.textContent = hasKey ? "API Key Configured" : "API Key Not Set";
  }

  // ═══════ LOAD DEMO ═══════
  document.getElementById("loadDemoBtn").addEventListener("click", () => {
    loadSampleEmployee("alex");
    showToast('Demo loaded — "Alex Chen" data populated', "info");
  });

  // ═══════ V2: PRIVACY & SYNC ═══════
  const privacyToggle = document.getElementById("privacyToggle");
  if (privacyToggle) {
    privacyToggle.addEventListener("click", () => {
      privacyToggle.classList.toggle("active");
      refreshRoster();
      // If results are open, refresh them
      const resultsVisible = document.getElementById("resultsContent").style.display !== "none";
      if (resultsVisible) {
        // Find current record in history and re-render
        const history = JSON.parse(localStorage.getItem("worksight_history") || "[]");
        if (history.length > 0) {
          // Simplification: Re-render the first (latest) if we don't track active index
          renderResults(history[0].result, history[0].employee, history[0].id);
        }
      }
      showToast(privacyToggle.classList.contains("active") ? "Privacy Mode Enabled" : "Privacy Mode Disabled", "info");
    });
  }

  const syncDataBtn = document.getElementById("syncDataBtn");
  if (syncDataBtn) {
    syncDataBtn.addEventListener("click", () => {
      document.querySelectorAll(".slider").forEach(s => {
        const val = Math.floor(Math.random() * 10) + 1;
        s.value = val;
        const valEl = document.getElementById(`val-${s.id}`);
        if (valEl) valEl.textContent = val;
      });
      showToast("Data Synced from Passive Streams (Simulated)", "success");
    });
  }

  // ═══════ HISTORY & PERSISTENCE ═══════
  window.saveAnalysis = function(result, inputData) {
    const history = JSON.parse(localStorage.getItem("worksight_history") || "[]");
    const record = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      employee: inputData.baseline, // Corrected from inputData.employee
      inputData: inputData,
      result: result
    };
    // Keep only last 20 analyses
    history.unshift(record);
    localStorage.setItem("worksight_history", JSON.stringify(history.slice(0, 20)));
    refreshRoster();
    return record.id;
  };

  function refreshRoster() {
    const history = JSON.parse(localStorage.getItem("worksight_history") || "[]");
    renderRoster(history);
    updateDashboardSummary(history);
  }

  // Handle roster clicks
  document.getElementById("rosterList").addEventListener("click", e => {
    const item = e.target.closest(".roster-item");
    if (!item) return;
    
    const id = parseInt(item.dataset.id);
    const history = JSON.parse(localStorage.getItem("worksight_history") || "[]");
    const record = history.find(r => r.id === id);
    if (record) {
      renderResults(record.result, record.employee, record.id);
      switchPanel("results");
      showToast(`Viewing history for ${record.employee.name}`, "info");
    }
  });

  // ═══════ ANALYZE ═══════
  const analyzeBtn = document.getElementById("analyzeBtn");
  const loader     = document.getElementById("loadingOverlay");

  analyzeBtn.addEventListener("click", async () => {
    const apiKey = (localStorage.getItem("worksight_api_key") || "").trim();
    if (!apiKey) {
      modal.classList.add("open");
      showToast("Enter your Gemini API key first", "error");
      return;
    }

    if (!document.getElementById("employeeName").value.trim()) {
      switchPanel("baseline");
      showToast("Enter an employee name on the Baseline DNA panel", "error");
      return;
    }

    const model = localStorage.getItem("worksight_model") || "gemini-2.0-flash";
    const data  = collectEmployeeData();

    loader.classList.add("visible");
    analyzeBtn.disabled = true;

    try {
      const result = await analyzeProfileDrift(data, apiKey, model);
      const recordId = saveAnalysis(result, data);
      renderResults(result, data.baseline, recordId);
      switchPanel("results");
      showToast("Analysis complete — Burnout risk: " + (result.burnout_risk_score || "?") + "%", "success");
    } catch (err) {
      console.error("WorkSight error:", err);
      showToast("Error: " + err.message, "error");
    } finally {
      loader.classList.remove("visible");
      analyzeBtn.disabled = false;
    }
  });

  // ═══════ V2: ADDITIONAL RESULT CONTROLS ═══════
  const toggleTransparencyBtn = document.getElementById("toggleTransparencyBtn");
  if (toggleTransparencyBtn) {
    toggleTransparencyBtn.addEventListener("click", () => {
      const pre = document.getElementById("jsonOutput");
      pre.classList.toggle("visible");
      showToast(pre.classList.contains("visible") ? "Source Trace Active" : "Source Trace Hidden", "info");
    });
  }

  const logInterventionBtn = document.getElementById("logInterventionBtn");
  if (logInterventionBtn) {
    logInterventionBtn.addEventListener("click", () => {
      showToast("Intervention Recorded. Monitoring for ROI...", "success");
      logInterventionBtn.innerText = "✓ Action Logged";
      logInterventionBtn.disabled = true;
    });
  }

  // Init
  refreshRoster();

  // ═══════ COPY JSON ═══════
  const copyBtn = document.getElementById("copyJsonBtn");
  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      const text = document.getElementById("jsonOutput").textContent;
      navigator.clipboard.writeText(text).then(() => showToast("Copied to clipboard", "success"));
    });
  }

  // ═══════ TOAST ═══════
  window.showToast = function(msg, type = "info") {
    const t = document.createElement("div");
    t.className = `toast ${type}`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3400);
  };
});
