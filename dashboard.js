async function loadDashboard() {
  const employees = await getAllRecords("employees");
  const todayString = getLocalDateString(new Date());

  const workingToday = [];
  const openTasks = [];
  const recentActivity = [];

  employees.forEach(employee => {
    const schedule = employee.schedule || [];
    const activity = employee.activity || [];
    const tasks = employee.tasks || [];

    let unavailable = false;

    schedule.forEach(item => {
      const start = item.startDate;
      const end = item.endDate || item.startDate;

      if (start && todayString >= start && todayString <= end) {
        if (
          item.type === "Vacation" ||
          item.type === "Sick Leave" ||
          item.type === "Training"
        ) {
          unavailable = true;
        }
      }
    });

    if (!unavailable) workingToday.push(employee);

    tasks.forEach((task, taskIndex) => {
      if (!task.completed) {
        openTasks.push({
          ...task,
          employeeId: employee.id,
          employeeName: formatEmployeeName(employee),
          taskIndex
        });
      }
    });

    activity.forEach((item, activityIndex) => {
      recentActivity.push({
        ...item,
        employeeId: employee.id,
        employeeName: formatEmployeeName(employee),
        activityIndex
      });
    });
  });

  workingToday.sort(sortEmployees);
  employees.sort(sortEmployees);

  openTasks.sort((a, b) => {
    const aDate = a.dueDate || "9999-12-31";
    const bDate = b.dueDate || "9999-12-31";
    return aDate.localeCompare(bDate);
  });

  recentActivity.sort((a, b) => {
    return new Date(b.date || 0) - new Date(a.date || 0);
  });

  window.dashboardWorkingToday = workingToday;
  window.dashboardEmployees = employees;

  document.getElementById("content").innerHTML = `
    <div class="compact-dashboard-header">
      <div>
        <h2>Supervisor Dashboard</h2>
        <p>${new Date().toLocaleDateString()} | Daily crew overview</p>
      </div>

      <div class="quick-actions compact-actions">
        <button onclick="loadQuickNote()">+ Note</button>
        <button onclick="loadQuickSchedule()">+ Schedule</button>
        <button onclick="loadReportReviewsPage()">+ Report</button>
        <button onclick="loadTasksPage()">+ Task</button>
      </div>
    </div>

    <section class="dashboard-command-strip">
      <button class="dashboard-command-card working-card" onclick="showWorkingToday()">
        <span class="dashboard-command-icon">👮</span>
        <span class="dashboard-command-number">${workingToday.length}</span>
        <span class="dashboard-command-label">Working Today</span>
        <span class="dashboard-command-action">View today's crew</span>
      </button>

      <button class="dashboard-command-card" onclick="loadCalendarPage()">
        <span class="dashboard-command-icon">📅</span>
        <span class="dashboard-command-number">${employees.length}</span>
        <span class="dashboard-command-label">Crew Calendar</span>
        <span class="dashboard-command-action">Open calendar</span>
      </button>

      <button class="dashboard-command-card" onclick="loadTasksPage()">
        <span class="dashboard-command-icon">✅</span>
        <span class="dashboard-command-number">${openTasks.length}</span>
        <span class="dashboard-command-label">Open Tasks</span>
        <span class="dashboard-command-action">View all tasks</span>
      </button>
    </section>

    <section class="card dashboard-panel dashboard-crew-panel dashboard-employees-top">
      <div class="dashboard-panel-header">
        <div>
          <h3>My Employees</h3>
          <p>One-click access to employee profiles</p>
        </div>
        <button class="text-button" onclick="loadEmployeesPage()">View All</button>
      </div>

      <div class="dashboard-employee-grid">
        ${renderDashboardEmployees(employees)}
      </div>
    </section>

    <div class="dashboard-main-grid">
      <section class="card dashboard-panel">
        <div class="dashboard-panel-header">
          <div>
            <h3>Open Tasks</h3>
            <p>Current follow-ups and assignments</p>
          </div>
          <button class="text-button" onclick="loadTasksPage()">View All</button>
        </div>

        <div class="dashboard-list">
          ${renderDashboardTasks(openTasks.slice(0, 6))}
        </div>
      </section>

      <section class="card dashboard-panel">
        <div class="dashboard-panel-header">
          <div>
            <h3>Recent Activity</h3>
            <p>Click an entry to review or update it</p>
          </div>
        </div>

        <div class="dashboard-list">
          ${renderRecentActivity(recentActivity.slice(0, 8))}
        </div>
      </section>
    </div>

    <div id="dashboardModal" class="dashboard-modal" onclick="closeDashboardModal(event)">
      <div class="dashboard-modal-content" onclick="event.stopPropagation()">
        <div class="dashboard-modal-header">
          <div>
            <h3 id="dashboardModalTitle">Working Today</h3>
            <p id="dashboardModalSubtitle"></p>
          </div>
          <button class="modal-close-button" onclick="closeDashboardModal()">×</button>
        </div>
        <div id="dashboardModalBody"></div>
      </div>
    </div>
  `;
}

function renderDashboardTasks(tasks) {
  if (!tasks.length) {
    return `<p class="muted dashboard-empty">No open tasks.</p>`;
  }

  return tasks.map(task => `
    <button class="dashboard-list-item" onclick="openDashboardTask(${task.employeeId})">
      <span class="dashboard-list-icon">☐</span>
      <span class="dashboard-list-copy">
        <strong>${escapeDashboardHtml(task.title || "Untitled task")}</strong>
        <span>${escapeDashboardHtml(task.employeeName)} · ${escapeDashboardHtml(task.dueDate || "No due date")} · ${escapeDashboardHtml(task.priority || "Normal")}</span>
      </span>
      <span class="dashboard-chevron">›</span>
    </button>
  `).join("");
}

function renderRecentActivity(items) {
  if (!items.length) {
    return `<p class="muted dashboard-empty">No recent activity.</p>`;
  }

  return items.map(item => `
    <button class="dashboard-list-item" onclick="openDashboardActivity(${item.employeeId})">
      <span class="dashboard-list-icon">${getActivityIcon(item.type)}</span>
      <span class="dashboard-list-copy">
        <strong>${escapeDashboardHtml(item.employeeName)} — ${escapeDashboardHtml(item.type || "Activity")}</strong>
        <span>${escapeDashboardHtml(item.note || "Open employee profile to review details")}</span>
        <small>${formatDashboardDate(item.date)}</small>
      </span>
      <span class="dashboard-chevron">›</span>
    </button>
  `).join("");
}

function renderDashboardEmployees(employees) {
  if (!employees.length) {
    return `<p class="muted dashboard-empty">No employees have been added.</p>`;
  }

  return employees.map(employee => {
    const initials = `${employee.firstName?.[0] || ""}${employee.lastName?.[0] || ""}`.toUpperCase();
    return `
      <button class="dashboard-employee-button" onclick="openEmployeeProfile(${employee.id})">
        <span class="dashboard-avatar">${escapeDashboardHtml(initials || "—")}</span>
        <span class="dashboard-employee-copy">
          <strong>${escapeDashboardHtml(formatEmployeeName(employee))}</strong>
          <span>${escapeDashboardHtml(employee.assignment || employee.position || "Employee profile")}</span>
        </span>
      </button>
    `;
  }).join("");
}

function showWorkingToday() {
  const employees = window.dashboardWorkingToday || [];
  const modal = document.getElementById("dashboardModal");
  const body = document.getElementById("dashboardModalBody");
  const subtitle = document.getElementById("dashboardModalSubtitle");

  subtitle.textContent = `${employees.length} employee${employees.length === 1 ? "" : "s"} available today`;

  body.innerHTML = employees.length
    ? `<div class="working-today-list">
        ${employees.map(employee => `
          <button class="working-today-person" onclick="openEmployeeProfile(${employee.id})">
            <span class="working-status-dot"></span>
            <span>
              <strong>${escapeDashboardHtml(formatEmployeeName(employee))}</strong>
              <small>${escapeDashboardHtml(employee.assignment || employee.position || "Working today")}</small>
            </span>
            <span class="dashboard-chevron">›</span>
          </button>
        `).join("")}
      </div>`
    : `<p class="muted dashboard-empty">No employees are listed as working today.</p>`;

  modal.classList.add("open");
}

function closeDashboardModal(event) {
  if (event && event.target !== event.currentTarget) return;
  document.getElementById("dashboardModal")?.classList.remove("open");
}

function openDashboardTask(employeeId) {
  // Tasks remain editable in the Tasks page. This opens the full task list.
  // The employee ID is retained here for a future filtered-task view.
  window.dashboardSelectedEmployeeId = employeeId;
  loadTasksPage();
}

function openDashboardActivity(employeeId) {
  // Employee profiles contain the full activity history and editing controls.
  openEmployeeProfile(employeeId);
}

function formatEmployeeName(employee) {
  return `${employee.rank || ""} ${employee.firstName || ""} ${employee.lastName || ""}`
    .replace(/\s+/g, " ")
    .trim();
}

function sortEmployees(a, b) {
  const aName = `${a.lastName || ""} ${a.firstName || ""}`.toLowerCase();
  const bName = `${b.lastName || ""} ${b.firstName || ""}`.toLowerCase();
  return aName.localeCompare(bName);
}

function getLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDashboardDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return escapeDashboardHtml(value);
  return date.toLocaleDateString();
}

function getActivityIcon(type) {
  const value = String(type || "").toLowerCase();
  if (value.includes("commend")) return "⭐";
  if (value.includes("coach")) return "🗣️";
  if (value.includes("discipline")) return "⚠️";
  if (value.includes("training")) return "🎓";
  if (value.includes("report")) return "📄";
  return "📝";
}

function escapeDashboardHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
