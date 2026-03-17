(function () {
  const modal = document.getElementById("registerModal");
  const form = document.getElementById("registerForm");
  const toast = document.getElementById("registerToast");
  const heroButton = document.querySelector(".hero-btn");
  const plusButton = document.querySelector("[data-open-register]");
  const closeButtons = modal.querySelectorAll("[data-close-modal]");

  function openModal() {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    const firstInput = form.querySelector("input, select, textarea");
    if (firstInput) {
      firstInput.focus();
    }
  }

  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
  }

  function showToast() {
    toast.classList.add("is-visible");
    window.setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 2200);
  }

  heroButton.addEventListener("click", openModal);
  if (plusButton) {
    plusButton.addEventListener("click", openModal);
  }

  closeButtons.forEach(function (btn) {
    btn.addEventListener("click", closeModal);
  });

  modal.addEventListener("click", function (event) {
    if (event.target === modal) {
      closeModal();
    }
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const existing = JSON.parse(localStorage.getItem("crm_records") || "[]");
      existing.unshift(
        Object.assign(
          {
            id: "rec_" + Date.now(),
            createdAt: new Date().toISOString()
          },
          data
        )
      );
      localStorage.setItem("crm_records", JSON.stringify(existing));
    } catch (error) {
      console.error("Register save failed", error);
    }

    form.reset();
    closeModal();
    showToast();
    renderRecordsTable();
    renderIncidentLists();
    renderCriminalGrid(criminalSearch ? criminalSearch.value : "");
  });

  // Drawer + views
  const drawer = document.getElementById("drawer");
  const menuBtn = document.getElementById("menuBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const drawerItems = Array.from(document.querySelectorAll(".drawer-item[data-view-target]"));
  const views = Array.from(document.querySelectorAll(".view[data-view]"));
  const openViewLinks = Array.from(document.querySelectorAll("[data-open-view]"));
  const recordsTableBody = document.getElementById("recordsTableBody");
  const totalRecordsStat = document.getElementById("totalRecordsStat");
  const overviewIncidentList = document.getElementById("overviewIncidentList");
  const reportsIncidentList = document.getElementById("reportsIncidentList");
  const criminalSearch = document.getElementById("criminalSearch");
  const criminalGrid = document.getElementById("criminalGrid");
  const registerNewSubjectBtn = document.getElementById("registerNewSubjectBtn");

  function openDrawer() {
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
  }

  function closeDrawer() {
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
  }

  function setActiveView(viewKey) {
    views.forEach(function (v) {
      v.classList.toggle("is-active", v.getAttribute("data-view") === viewKey);
    });
    drawerItems.forEach(function (btn) {
      btn.classList.toggle("is-active", btn.getAttribute("data-view-target") === viewKey);
    });
    if (viewKey === "criminal") {
      renderCriminalGrid(criminalSearch ? criminalSearch.value : "");
    }
  }

  function formatIncidentType(value) {
    if (value === "robbery") return "Dhac";
    if (value === "violence") return "Rabshado";
    if (value === "traffic") return "Shil";
    if (value === "other") return "Mid kale";
    return value || "—";
  }

  function formatTime(iso) {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch (_) {
      return "—";
    }
  }

  function getRecords() {
    try {
      const arr = JSON.parse(localStorage.getItem("crm_records") || "[]");
      return Array.isArray(arr) ? arr : [];
    } catch (_) {
      return [];
    }
  }

  function renderRecordsTable() {
    const records = getRecords();
    if (totalRecordsStat) {
      totalRecordsStat.textContent = records.length.toLocaleString();
    }

    if (!recordsTableBody) return;

    if (records.length === 0) {
      recordsTableBody.innerHTML =
        '<tr><td colspan="4" class="muted">Weli ma jiro diiwaan cusub. Riix “Diiwaan Cusub”.</td></tr>';
      return;
    }

    recordsTableBody.innerHTML = records
      .slice(0, 25)
      .map(function (r) {
        const safeName = (r.fullName || "—").toString().replaceAll("<", "&lt;").replaceAll(">", "&gt;");
        const safeLoc = (r.location || "—").toString().replaceAll("<", "&lt;").replaceAll(">", "&gt;");
        const type = formatIncidentType(r.incidentType);
        const time = formatTime(r.createdAt);
        return (
          "<tr>" +
          "<td>" + safeName + "</td>" +
          "<td>" + type + "</td>" +
          "<td>" + safeLoc + "</td>" +
          "<td>" + time + "</td>" +
          "</tr>"
        );
      })
      .join("");
  }

  function formatAlias(fullName) {
    if (!fullName) return "UNKNOWN";
    const parts = fullName.trim().split(/\s+/);
    return parts.slice(0, 2).join(" ").toUpperCase();
  }

  function formatStatus(type) {
    const norm = (type || "").toLowerCase();
    if (norm === "robbery" || norm === "violence") {
      return { label: "High", modifier: "high" };
    }
    if (norm === "traffic") {
      return { label: "Low", modifier: "low" };
    }
    return { label: "Medium", modifier: "medium" };
  }

  function renderCriminalGrid(filter) {
    const records = getRecords();
    const query = (filter || "").toString().trim().toLowerCase();

    const visible = query
      ? records.filter(function (r) {
          const name = (r.fullName || "").toString().toLowerCase();
          const loc = (r.location || "").toString().toLowerCase();
          const type = (r.incidentType || "").toString().toLowerCase();
          const details = (r.details || "").toString().toLowerCase();
          return (
            name.includes(query) ||
            loc.includes(query) ||
            type.includes(query) ||
            details.includes(query)
          );
        })
      : records;

    if (!criminalGrid) return;

    if (visible.length === 0) {
      criminalGrid.innerHTML =
        '<div class="muted">Weli ma jiro diiwaan cusub. Riix “Diiwaan Cusub”.</div>';
      return;
    }

    criminalGrid.innerHTML = visible
      .slice(0, 20)
      .map(function (r) {
        const safeName = (r.fullName || "Diiwaan aan magac lahayn").toString().replaceAll("<", "&lt;").replaceAll(">", "&gt;");
        const safeLoc = (r.location || "Goob aan la cayimin").toString().replaceAll("<", "&lt;").replaceAll(">", "&gt;");
        const safeDetails = (r.details || "").toString().replaceAll("<", "&lt;").replaceAll(">", "&gt;");
        const alias = formatAlias(r.fullName);
        const status = formatStatus(r.incidentType);
        const type = formatIncidentType(r.incidentType);
        return (
          '<article class="criminal-card">' +
          '<div class="criminal-card-header">' +
          '<div class="criminal-status criminal-status--' + status.modifier + '">' + status.label + '</div>' +
          '</div>' +
          '<div class="criminal-card-body">' +
          '<div class="criminal-name">' + safeName + '</div>' +
          '<div class="criminal-alias">Alias: ' + alias + '</div>' +
          '<div class="criminal-row"><span>Type</span><strong>' + type + '</strong></div>' +
          '<div class="criminal-row"><span>Location</span><strong>' + safeLoc + '</strong></div>' +
          '<div class="criminal-details">' + safeDetails + '</div>' +
          '</div>' +
          '</article>'
        );
      })
      .join("");
  }

  function renderIncidentLists() {
    const records = getRecords();
    const latest = records.slice(0, 3);

    function makeCard(r) {
      const safeName = (r.fullName || "Diiwaan aan magac lahayn").toString().replaceAll("<", "&lt;").replaceAll(">", "&gt;");
      const safeLoc = (r.location || "Goob aan la cayimin").toString().replaceAll("<", "&lt;").replaceAll(">", "&gt;");
      return (
        '<article class="incident-card">' +
        '<div class="incident-main">' +
        '<div class="incident-title">' + safeName + "</div>" +
        '<div class="incident-location">' + safeLoc + "</div>" +
        "</div>" +
        '<div class="incident-meta">' + (formatTime(r.createdAt) || "") + "</div>" +
        "</article>"
      );
    }

    if (overviewIncidentList) {
      if (latest.length === 0) {
        overviewIncidentList.innerHTML = '<div class="muted">Dhacdooyinka aad diiwaangeliso ayaa halkan ka soo muuqan doona.</div>';
      } else {
        overviewIncidentList.innerHTML = latest.map(makeCard).join("");
      }
    }

    if (reportsIncidentList) {
      if (records.length === 0) {
        reportsIncidentList.innerHTML = '<div class="muted">Dhacdooyinka aad diiwaangeliso ayaa halkan ka soo muuqan doona.</div>';
      } else {
        reportsIncidentList.innerHTML = records.map(makeCard).join("");
      }
    }
  }

  // Initialize totals and table
  renderRecordsTable();
  renderIncidentLists();
  renderCriminalGrid();

  menuBtn.addEventListener("click", openDrawer);

  drawer.addEventListener("click", function (event) {
    if (event.target === drawer) closeDrawer();
  });

  drawerItems.forEach(function (btn) {
    btn.addEventListener("click", function () {
      setActiveView(btn.getAttribute("data-view-target"));
      closeDrawer();
    });
  });

  openViewLinks.forEach(function (btn) {
    btn.addEventListener("click", function () {
      setActiveView(btn.getAttribute("data-open-view"));
    });
  });

  if (criminalSearch) {
    criminalSearch.addEventListener("input", function () {
      renderCriminalGrid(this.value);
    });
  }

  if (registerNewSubjectBtn) {
    registerNewSubjectBtn.addEventListener("click", openModal);
  }

  logoutBtn.addEventListener("click", function () {
    try {
      localStorage.removeItem("crm_records");
    } catch (_) {}
    closeDrawer();
    setActiveView("overview");
    showToast();
    renderRecordsTable();
    renderIncidentLists();
    renderCriminalGrid(criminalSearch ? criminalSearch.value : "");
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeModal();
      closeDrawer();
    }
  });
})();

