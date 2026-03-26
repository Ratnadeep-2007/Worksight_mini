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
    interview:     { title: "AI Interviewer",   desc: "Behavioral assessment & psychological profiling" },
    workstream:    { title: "Workstream Chat",  desc: "Natural language task extraction & intelligence" },
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
      employee: inputData.employee, 
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

    const model = localStorage.getItem("worksight_model") || "gemini-2.5-flash";
    const data  = collectEmployeeData();

    loader.classList.add("visible");
    analyzeBtn.disabled = true;

    try {
      const result = await analyzeProfileDrift(data, apiKey, model);
      const recordId = saveAnalysis(result, data);
      renderResults(result, data.employee, recordId);
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

  // ═══════ ROLE & WORKSTREAM INIT ═══════
  WorkSightRoles.init();
  initWorkstreamChat();
  refreshWorkstreamHealth();

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

  // ═══════ WORKSTREAM CHAT ═══════
  function initWorkstreamChat() {
    const wsInput = document.getElementById("wsInput");
    const wsSendBtn = document.getElementById("wsSendBtn");
    const wsStatus = document.getElementById("wsStatus");

    if (!wsInput || !wsSendBtn) return;

    // Check API key to enable/disable
    function checkWsReady() {
      const hasKey = !!(localStorage.getItem("worksight_api_key") || "").trim();
      const hasRole = WorkSightRoles.isLoggedIn();
      wsInput.disabled = !(hasKey && hasRole);
      wsSendBtn.disabled = !(hasKey && hasRole);
      if (!hasKey) wsStatus.textContent = "Set API key in Settings to begin";
      else if (!hasRole) wsStatus.textContent = "Select a role to begin";
      else wsStatus.textContent = "Ready — type a work update or ask a question";

      // Update role badge in workstream
      const wsRoleBadge = document.getElementById("wsRoleBadge");
      if (wsRoleBadge && hasRole) {
        const user = WorkSightRoles.getUser();
        const cfg = WorkSightRoles.getRoleConfig(user.role);
        wsRoleBadge.textContent = `${cfg.icon} ${cfg.label}`;
      }
    }
    checkWsReady();
    // Re-check when settings change
    const observer = new MutationObserver(checkWsReady);
    observer.observe(document.getElementById("apiDot"), { attributes: true });

    // Load existing chat history into UI
    const chatHistory = WorkstreamEngine.getChatHistory();
    chatHistory.forEach(msg => {
      appendWsMessage(msg.role === "user" ? "user" : "bot", msg.text);
    });

    // Render existing intelligence
    renderIntelPanel();

    async function sendWsMessage() {
      const msg = wsInput.value.trim();
      if (!msg) return;

      const apiKey = (localStorage.getItem("worksight_api_key") || "").trim();
      const model = localStorage.getItem("worksight_model") || "gemini-2.5-flash";
      const user = WorkSightRoles.getUser();
      if (!user) return;

      // Role check for viewers
      const config = WorkSightRoles.getRoleConfig(user.role);
      if (!config.canSubmitUpdates && !msg.toLowerCase().match(/^(what|show|how|status|list|tell)/)) {
        appendWsMessage("bot", "🔒 As a Viewer, you can only ask questions. Try: \"What is the workstream status?\"");
        wsInput.value = "";
        return;
      }

      appendWsMessage("user", msg);
      wsInput.value = "";
      wsInput.disabled = true;
      wsSendBtn.disabled = true;
      wsStatus.textContent = "🧠 Analyzing your update...";

      // Show typing indicator
      const typingId = appendWsMessage("bot", '<span class="blinking-dot">●</span>  <span class="blinking-dot" style="animation-delay:0.2s">●</span>  <span class="blinking-dot" style="animation-delay:0.4s">●</span>', true);

      try {
        const { result, updatedData } = await WorkstreamEngine.processMessage(msg, user.name, apiKey, model);

        // Remove typing indicator and show response
        const typingEl = document.getElementById(typingId);
        if (typingEl) typingEl.remove();

        appendWsMessage("bot", result.response);

        // Show extraction summary
        if (result.summary) {
          appendWsMessage("bot", `<div style="font-size:0.78rem; color:var(--text-2); background:rgba(124,58,237,0.05); padding:0.5rem 0.8rem; border-radius:6px; border-left:3px solid var(--violet); margin-top:-0.4rem;">📊 ${result.summary}</div>`, true);
        }

        renderIntelPanel();
        refreshWorkstreamHealth();
        showToast("Workstream updated", "success");

      } catch (err) {
        const typingEl = document.getElementById(typingId);
        if (typingEl) typingEl.remove();
        appendWsMessage("bot", `⚠️ Error: ${err.message}. Check your API key in Settings.`);
        showToast("Workstream error: " + err.message, "error");
      }

      wsInput.disabled = false;
      wsSendBtn.disabled = false;
      wsStatus.textContent = "Ready — type a work update or ask a question";
      wsInput.focus();
    }

    wsSendBtn.addEventListener("click", sendWsMessage);
    wsInput.addEventListener("keydown", e => { if (e.key === "Enter") sendWsMessage(); });
  }

  function appendWsMessage(role, content, isHtml = false) {
    const chatBody = document.getElementById("wsChatHistory");
    if (!chatBody) return;

    const id = "ws-msg-" + Date.now();
    const wrapper = document.createElement("div");
    wrapper.id = id;
    wrapper.className = `chat-msg ${role}`;
    wrapper.style.cssText = "display:flex; gap:0.8rem; max-width:85%;";
    if (role === "user") wrapper.style.alignSelf = "flex-end";

    const avatarBg = role === "user" ? "rgba(124,58,237,0.1)" : "rgba(6,182,212,0.1)";
    const avatarColor = role === "user" ? "var(--violet)" : "var(--cyan)";
    const avatarBorder = role === "user" ? "rgba(124,58,237,0.3)" : "rgba(6,182,212,0.3)";
    const avatarText = role === "user" ? (WorkSightRoles.getUser()?.name?.charAt(0)?.toUpperCase() || "U") : "WS";
    const bubbleBg = role === "user" ? "rgba(124,58,237,0.05)" : "var(--surface-1)";
    const bubbleBorder = role === "user" ? "rgba(124,58,237,0.2)" : "var(--border)";
    const bubbleRadius = role === "user" ? "border-top-right-radius:4px" : "border-top-left-radius:4px";

    wrapper.innerHTML = `
      <div style="width:32px; height:32px; border-radius:50%; background:${avatarBg}; color:${avatarColor}; border:1px solid ${avatarBorder}; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:0.75rem; flex-shrink:0;">${avatarText}</div>
      <div style="background:${bubbleBg}; padding:0.8rem 1rem; border-radius:12px; ${bubbleRadius}; color:var(--text-1); font-size:0.9rem; line-height:1.5; border:1px solid ${bubbleBorder};">${isHtml ? content : escapeHtml(content)}</div>
    `;

    if (role === "user") wrapper.style.flexDirection = "row-reverse";
    chatBody.appendChild(wrapper);
    chatBody.scrollTop = chatBody.scrollHeight;
    return id;
  }

  function escapeHtml(text) {
    const d = document.createElement("div");
    d.textContent = text;
    return d.innerHTML;
  }

  // ═══════ INTELLIGENCE PANEL ═══════
  function renderIntelPanel() {
    const panel = document.getElementById("wsIntelPanel");
    if (!panel) return;

    const data = WorkstreamEngine.getData();
    if (data.tasks.length === 0 && data.blockers.length === 0 && data.commitments.length === 0) {
      panel.innerHTML = '<p class="card-hint">Tasks, blockers, and commitments extracted from your chat will appear here in real time.</p>';
      return;
    }

    let html = "";

    // Tasks
    if (data.tasks.length > 0) {
      html += '<div class="intel-section"><div class="intel-section-title">📋 Tasks (' + data.tasks.length + ')</div>';
      data.tasks.slice(0, 15).forEach(t => {
        html += `<div class="intel-card">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div class="intel-card-title">${escapeHtml(t.description)}</div>
            <span class="intel-status ${t.status}">${t.status}</span>
          </div>
          <div class="intel-card-meta">${t.id} · ${t.assignee}${t.dueDate ? ' · Due: ' + t.dueDate : ''}</div>
        </div>`;
      });
      html += '</div>';
    }

    // Blockers
    const activeBlockers = data.blockers.filter(b => b.isActive);
    if (activeBlockers.length > 0) {
      html += '<div class="intel-section"><div class="intel-section-title">🚫 Active Blockers (' + activeBlockers.length + ')</div>';
      activeBlockers.forEach(b => {
        html += `<div class="intel-card" style="border-color:rgba(248,113,113,0.3);">
          <div class="intel-card-title" style="color:#f87171;">${escapeHtml(b.description)}</div>
          <div class="intel-card-meta">Linked: ${escapeHtml(b.linkedTaskDesc)} · By: ${escapeHtml(b.reportedBy)}</div>
        </div>`;
      });
      html += '</div>';
    }

    // Commitments
    const pending = data.commitments.filter(c => !c.isFulfilled);
    if (pending.length > 0) {
      html += '<div class="intel-section"><div class="intel-section-title">🤝 Pending Commitments (' + pending.length + ')</div>';
      pending.forEach(c => {
        html += `<div class="intel-card" style="border-color:rgba(251,191,36,0.3);">
          <div class="intel-card-title">${escapeHtml(c.description)}</div>
          <div class="intel-card-meta">${c.assignee}${c.dueDate ? ' · Due: ' + c.dueDate : ''}</div>
        </div>`;
      });
      html += '</div>';
    }

    panel.innerHTML = html;
  }

  // ═══════ WORKSTREAM HEALTH DASHBOARD ═══════
  function refreshWorkstreamHealth() {
    const data = WorkstreamEngine.getData();
    const stats = WorkstreamEngine.computeStats(data);

    // Update stat numbers
    const el = (id) => document.getElementById(id);
    if (el("ws-total")) el("ws-total").textContent = stats.total;
    if (el("ws-done")) el("ws-done").textContent = stats.done;
    if (el("ws-progress")) el("ws-progress").textContent = stats.inProgress;
    if (el("ws-blocked")) el("ws-blocked").textContent = stats.blocked;

    // Health bar
    const healthScore = Math.max(0, Math.min(100, stats.healthScore));
    if (el("wsHealthFill")) el("wsHealthFill").style.width = healthScore + "%";
    if (el("wsHealthScore")) el("wsHealthScore").textContent = healthScore + "%";

    // Update workstream badge in sidebar
    const wsBadge = document.getElementById("wsBadge");
    if (wsBadge && stats.total > 0) {
      wsBadge.textContent = stats.total;
      wsBadge.style.display = "flex";
    }

    // Activity feed
    const feed = el("wsActivityFeed");
    if (feed && data.tasks.length > 0) {
      const recent = [...data.tasks].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 8);
      feed.innerHTML = recent.map(t => {
        const dotClass = t.status === "DONE" ? "done" : t.status === "BLOCKED" ? "blocked" : "created";
        return `<div class="ws-activity-item">
          <div class="ws-activity-dot ${dotClass}"></div>
          <span><strong>${t.status}</strong> — ${escapeHtml(t.description).substring(0, 50)}</span>
        </div>`;
      }).join("");
    }
  }
  window.refreshWorkstreamHealth = refreshWorkstreamHealth;

});
