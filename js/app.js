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

    const model = localStorage.getItem("worksight_model") || "gemini-2.5-flash";
    const data  = collectEmployeeData();

    loader.classList.add("visible");
    analyzeBtn.disabled = true;

    try {
      const result = await analyzeProfileDrift(data, apiKey, model);
      renderResults(result, data);
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
<<<<<<< HEAD

  // ═══════ TRANSCRIPT PARSING ═══════
  const parseBtn = document.getElementById("parseTranscriptBtn");
  if (localStorage.getItem("worksight_latest_transcript")) {
    parseBtn.style.display = "inline-flex";
  }

  parseBtn.addEventListener("click", async () => {
    const transcript = localStorage.getItem("worksight_latest_transcript");
    const apiKey = localStorage.getItem("worksight_api_key");
    if (!apiKey) {
      modal.classList.add("open");
      showToast("Enter your Gemini API key first", "error");
      return;
    }
    const model = localStorage.getItem("worksight_model") || "gemini-2.5-flash";
    
    loader.classList.add("visible");
    if (typeof _updateLoadingText === "function") {
      _updateLoadingText("Extracting metrics from interview via Gemini...");
    }
    try {
      const data = await parseTranscriptWithGemini(transcript, apiKey, model);
      Object.keys(data).forEach(id => {
         const el = document.getElementById(id);
         if (el && data[id] !== null && data[id] !== undefined) {
            el.value = data[id];
            if (el.classList.contains("slider")) {
               const valEl = document.getElementById(`val-${id}`);
               if (valEl) valEl.textContent = data[id];
            }
         }
      });
      showToast("Dashboard populated successfully!", "success");
      localStorage.removeItem("worksight_latest_transcript");
      parseBtn.style.display = "none";
    } catch (err) {
      showToast("Parsing failed: " + err.message, "error");
    } finally {
      loader.classList.remove("visible");
      if (typeof _updateLoadingText === "function") {
        _updateLoadingText("Analyzing Profile Drift via Gemini…");
      }
    }
  });

=======
>>>>>>> ac9261109212689b38ecc2c392ebee87b91d153d
});
