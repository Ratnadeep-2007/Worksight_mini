/**
 * WorkSight – Role Management Module
 * Handles client-side role selection, persistence, and UI gating.
 */

const WorkSightRoles = (() => {
  const STORAGE_KEY = "worksight_user";

  const ROLE_CONFIG = {
    admin: {
      label: "Admin",
      icon: "👑",
      color: "#f59e0b",
      panels: ["dashboard", "interview", "baseline", "digital", "communication", "results", "workstream"],
      canSubmitUpdates: true,
      canCreateTasks: true,
      canViewAll: true
    },
    member: {
      label: "Member",
      icon: "👤",
      color: "#7c3aed",
      panels: ["dashboard", "interview", "baseline", "digital", "communication", "results", "workstream"],
      canSubmitUpdates: true,
      canCreateTasks: true,
      canViewAll: false
    },
    viewer: {
      label: "Viewer",
      icon: "👁️",
      color: "#06b6d4",
      panels: ["dashboard", "workstream", "results"],
      canSubmitUpdates: false,
      canCreateTasks: false,
      canViewAll: false
    }
  };

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch { return null; }
  }

  function setUser(user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }

  function getRole() {
    const user = getUser();
    return user ? user.role : null;
  }

  function getRoleConfig(role) {
    return ROLE_CONFIG[role] || ROLE_CONFIG.member;
  }

  function isLoggedIn() {
    return !!getUser();
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function applyRoleUI() {
    const user = getUser();
    if (!user) return;

    const config = getRoleConfig(user.role);

    // Update sidebar role badge
    const badge = document.getElementById("roleBadge");
    if (badge) {
      badge.textContent = `${config.icon} ${user.name || config.label}`;
      badge.style.color = config.color;
      badge.style.display = "block";
    }

    // Show/hide nav items based on role
    document.querySelectorAll(".nav-item[data-panel]").forEach(item => {
      const panel = item.dataset.panel;
      if (config.panels.includes(panel)) {
        item.style.display = "";
      } else {
        item.style.display = "none";
      }
    });
  }

  function showRoleModal() {
    const modal = document.getElementById("roleModal");
    if (modal) modal.classList.add("open");
  }

  function hideRoleModal() {
    const modal = document.getElementById("roleModal");
    if (modal) modal.classList.remove("open");
  }

  function init() {
    if (!isLoggedIn()) {
      showRoleModal();
    } else {
      applyRoleUI();
    }

    // Bind role selection buttons
    document.querySelectorAll("[data-role-select]").forEach(btn => {
      btn.addEventListener("click", () => {
        const role = btn.dataset.roleSelect;
        const nameInput = document.getElementById("roleNameInput");
        const name = nameInput ? nameInput.value.trim() : "";

        if (!name) {
          nameInput.classList.add("shake");
          setTimeout(() => nameInput.classList.remove("shake"), 500);
          return;
        }

        setUser({ name, role, createdAt: new Date().toISOString() });
        hideRoleModal();
        applyRoleUI();
        if (window.showToast) {
          window.showToast(`Welcome, ${name}! Role: ${getRoleConfig(role).label}`, "success");
        }
      });
    });

    // Bind logout
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        logout();
        showRoleModal();
        const badge = document.getElementById("roleBadge");
        if (badge) badge.style.display = "none";
      });
    }
  }

  return { init, getUser, getRole, getRoleConfig, isLoggedIn, applyRoleUI, ROLE_CONFIG };
})();
