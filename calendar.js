async function loadDashboard() {
  const employees = await getAllRecords("employees");
  const todayString = new Date().toISOString().slice(0, 10);

  let workingToday = [];
  let vacationToday = [];
  let sickToday = [];
  let courtToday = [];
  let trainingToday = [];
  let openTasks = [];
  let alerts = [];
  let recentActivity = [];

  employees.forEach(employee => {
    const schedule = employee.schedule || [];
    const training = employee.training || [];
    const activity = employee.activity || [];
    const tasks = employee.tasks || [];

    let unavailable = false;

    schedule.forEach(item => {
      const start = item.startDate;
      const end = item.endDate || item.startDate;

      if (start && todayString >= start && todayString <= end) {
        if (item.type === "Vacation") {
          vacationToday.push(employee);
          unavailable = true;
        }

        if (item.type === "Sick Leave") {
          sickToday.push(employee);
          unavailable = true;
        }

        if (item.type === "Court") courtToday.push(employee);

        if (item.type === "Training") {
          trainingToday.push(employee);
          unavailable = true;
        }
      }
    });

    if (!unavailable) workingToday.push(employee);

    training.forEach(item => {
      if (!item.expiresDate) return;

      const today = new Date();
      const expires = new Date(item.expiresDate);
      const daysAway = Math.ceil((expires - today) / (1000 * 60 * 60 * 24));

      if (daysAway < 0 || daysAway <= 30) {
        alerts.push({
          name: `${employee.rank || ""} ${employee.firstName} ${employee.lastName}`.trim(),
          text: `${item.name} ${daysAway < 0 ? "expired" : "expires in " + daysAway + " days"}`,
          critical: daysAway < 0
        });
      }
    });

    tasks.forEach(task => {
      if (!task.completed) {
        openTasks.push({
          title: task.title,
          dueDate: task.dueDate,
          priority: task.priority,
          category: task.category
        });
      }
    });

    activity.forEach(item => {
      recentActivity.push({
        employeeId: employee.id,
        name: `${employee.firstName || ""} ${employee.lastName || ""}`.trim(),
        type: item.type,
        note: item.note,
        date: item.date
      });
    });
  });

  openTasks = openTasks
    .sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    })
    .slice(0, 5);

  recentActivity = recentActivity
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  alerts = alerts.slice(0, 5);

  document.getElementById("content").innerHTML = `
    <div class="compact-dashboard-header">
      <div>
        <h2>Supervisor Dashboard</h2>
        <p>${new Date().toLocaleDateString()} | Roll-call overview</p>
      </div>

      <div class="quick-actions compact-actions">
        <button onclick="loadQuickNote()">+ Note</button>
        <button onclick="loadQuickSchedule()">+ Schedule</button>
        <button onclick="loadReportReviewsPage()">+ Report</button>
        <button onclick="loadTasksPage()">+ Task</button>
      </div>
    </div>

    <section class="staffing-strip">
      <div>
        <strong>${workingToday.length}</strong>
        <span>Working</span>
      </div>

      <div>
        <strong>${vacationToday.length}</strong>
        <span>Vacation</span>
      </div>

      <div>
        <strong>${sickToday.length}</strong>
        <span>Sick</span>
      </div>

      <div>
        <strong>${courtToday.length}</strong>
        <span>Court</span>
      </div>

      <div>
        <strong>${trainingToday.length}</strong>
        <span>Training</span>
      </div>

      <div>
        <strong>${alerts.length}</strong>
        <span>Alerts</span>
      </div>

      <div>
        <strong>${openTasks.length}</strong>
        <span>Tasks</span>
      </div>
    </section>

    <div class="dashboard-two-column">
      <section class="card compact-card">
        <h3>Out / Court / Training Today</h3>
        ${renderCompactGroup("Vacation", vacationToday)}
        ${renderCompactGroup("Sick", sickToday)}
        ${renderCompactGroup("Court", courtToday)}
        ${renderCompactGroup("Training", trainingToday)}
      </section>

      <section class="card compact-card">
        <h3>Needs Attention</h3>
        ${
          alerts.length === 0
            ? `<p class="muted">No alerts.</p>`
            : alerts.map(alert => `
              <div class="compact-alert ${alert.critical ? "critical-text" : ""}">
                <strong>${alert.name}</strong>
                <span>${alert.text}</span>
              </div>
            `).join("")
        }
      </section>

      <section class="card compact-card">
        <h3>Open Tasks</h3>
        ${
          openTasks.length === 0
            ? `<p class="muted">No open tasks.</p>`
            : openTasks.map(task => `
              <div class="compact-line">
                <strong>${task.title}</strong>
                <span>${task.dueDate || "No due date"} | ${task.priority || "Normal"}</span>
              </div>
            `).join("")
        }
      </section>

      <section class="card compact-card">
        <h3>Recent Activity</h3>
        ${
          recentActivity.length === 0
            ? `<p class="muted">No recent activity.</p>`
            : recentActivity.map(item => `
              <div class="compact-line clickable" onclick="openEmployeeProfile(${item.employeeId})">
                <strong>${item.name} — ${item.type}</strong>
                <span>${item.note || ""}</span>
              </div>
            `).join("")
        }
      </section>
    </div>
  `;
}

function renderCompactGroup(title, list) {
  if (!list || list.length === 0) {
    return `
      <div class="compact-group">
        <strong>${title}</strong>
        <span class="muted">None</span>
      </div>
    `;
  }

  return `
    <div class="compact-group">
      <strong>${title}</strong>
      <span>${list.map(e => `${e.rank || ""} ${e.firstName} ${e.lastName}`.trim()).join(", ")}</span>
    </div>
  `;
}
