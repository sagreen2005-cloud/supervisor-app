async function loadDashboard() {
  const employees = await getAllRecords("employees");

  const todayString = new Date().toISOString().slice(0, 10);

  let workingToday = [];
  let vacationToday = [];
  let sickToday = [];
  let courtToday = [];
  let trainingToday = [];
  let openTasks = [];
  let trainingAlerts = [];
  let recentActivity = [];

  employees.forEach(employee => {
    const schedule = employee.schedule || [];
    const training = employee.training || [];
    const activity = employee.activity || [];
    const tasks = employee.tasks || [];

    let isUnavailable = false;

    schedule.forEach(item => {
      const start = item.startDate;
      const end = item.endDate || item.startDate;

      if (start && todayString >= start && todayString <= end) {
        if (item.type === "Vacation") {
          vacationToday.push(employee);
          isUnavailable = true;
        }

        if (item.type === "Sick Leave") {
          sickToday.push(employee);
          isUnavailable = true;
        }

        if (item.type === "Court") {
          courtToday.push(employee);
        }

        if (item.type === "Training") {
          trainingToday.push(employee);
          isUnavailable = true;
        }
      }
    });

    if (!isUnavailable) {
      workingToday.push(employee);
    }

    training.forEach(item => {
      if (!item.expiresDate) return;

      const today = new Date();
      const expires = new Date(item.expiresDate);
      const daysAway = Math.ceil((expires - today) / (1000 * 60 * 60 * 24));

      if (daysAway < 0) {
        trainingAlerts.push({
          employee,
          item,
          status: "Expired",
          daysAway
        });
      } else if (daysAway <= 30) {
        trainingAlerts.push({
          employee,
          item,
          status: "Due Soon",
          daysAway
        });
      }
    });

    activity.forEach(item => {
      recentActivity.push({
        employeeId: employee.id,
        employeeName: `${employee.firstName || ""} ${employee.lastName || ""}`.trim(),
        type: item.type,
        note: item.note,
        date: item.date
      });
    });

    tasks.forEach((task, index) => {
      if (!task.completed) {
        openTasks.push({
          ...task,
          storageEmployeeId: employee.id,
          index
        });
      }
    });
  });

  recentActivity = recentActivity
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 6);

  openTasks = openTasks
    .sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    })
    .slice(0, 6);

  document.getElementById("content").innerHTML = `
    <div class="page-header">
      <div>
        <h2>Smart Dashboard</h2>
        <p>Today’s staffing, alerts, tasks, and recent supervisor activity.</p>
      </div>
    </div>

    <section class="card">
      <h3>Quick Actions</h3>
      <div class="quick-actions">
        <button onclick="loadEmployeesPage()">+ Employee</button>
        <button onclick="loadQuickNote()">+ Quick Note</button>
        <button onclick="loadReportReviewsPage()">+ Report Review</button>
        <button onclick="loadQuickSchedule()">+ Schedule</button>
        <button onclick="loadQuickTraining()">+ Training</button>
      </div>
    </section>

    <div class="dashboard-grid">
      <div class="stat-card">
        <div class="number">${workingToday.length}</div>
        <div class="label">Working Today</div>
      </div>

      <div class="stat-card warning-card">
        <div class="number">${vacationToday.length}</div>
        <div class="label">Vacation Today</div>
      </div>

      <div class="stat-card danger-stat">
        <div class="number">${sickToday.length}</div>
        <div class="label">Sick Today</div>
      </div>

      <div class="stat-card">
        <div class="number">${courtToday.length}</div>
        <div class="label">Court Today</div>
      </div>

      <div class="stat-card">
        <div class="number">${trainingToday.length}</div>
        <div class="label">Training Today</div>
      </div>

      <div class="stat-card warning-card">
        <div class="number">${trainingAlerts.length}</div>
        <div class="label">Training Alerts</div>
      </div>

      <div class="stat-card">
        <div class="number">${openTasks.length}</div>
        <div class="label">Open Tasks</div>
      </div>
    </div>

    <section class="card">
      <h3>Working Today</h3>
      ${renderEmployeeMiniList(workingToday)}
    </section>

    <section class="card">
      <h3>Vacation / Sick / Court / Training</h3>
      <h4>Vacation</h4>
      ${renderEmployeeMiniList(vacationToday)}

      <h4>Sick Leave</h4>
      ${renderEmployeeMiniList(sickToday)}

      <h4>Court</h4>
      ${renderEmployeeMiniList(courtToday)}

      <h4>Training</h4>
      ${renderEmployeeMiniList(trainingToday)}
    </section>

    <section class="card">
      <h3>Needs Attention</h3>
      ${
        trainingAlerts.length === 0
          ? `<p class="muted">No training alerts.</p>`
          : trainingAlerts.map(alert => `
            <div class="alert-card ${alert.status === "Expired" ? "critical-task" : "high-task"}">
              <strong>${alert.employee.rank || ""} ${alert.employee.firstName} ${alert.employee.lastName}</strong>
              <p>${alert.item.name} — ${alert.status}${alert.daysAway >= 0 ? ` in ${alert.daysAway} days` : ""}</p>
            </div>
          `).join("")
      }
    </section>

    <section class="card">
      <h3>Open Tasks</h3>
      ${
        openTasks.length === 0
          ? `<p class="muted">No open tasks.</p>`
          : openTasks.map(task => `
            <div class="task-card">
              <strong>${task.title}</strong>
              <p class="muted">${task.category} | Due: ${task.dueDate || "No due date"}</p>
              ${task.notes ? `<p>${task.notes}</p>` : ""}
            </div>
          `).join("")
      }
    </section>

    <section class="card">
      <h3>Recent Activity</h3>
      ${
        recentActivity.length === 0
          ? `<p class="muted">No recent activity yet.</p>`
          : recentActivity.map(item => `
            <div class="timeline-item" onclick="openEmployeeProfile(${item.employeeId})">
              <strong>${item.employeeName} — ${item.type}</strong>
              <span>${item.date ? new Date(item.date).toLocaleString() : "No date"}</span>
              <p>${item.note || ""}</p>
            </div>
          `).join("")
      }
    </section>
  `;
}

function renderEmployeeMiniList(list) {
  if (!list || list.length === 0) {
    return `<p class="muted">None.</p>`;
  }

  return list.map(employee => `
    <div class="mini-employee" onclick="openEmployeeProfile(${employee.id})">
      ${employee.rank || ""} ${employee.firstName} ${employee.lastName}
      <span>${employee.assignment || ""}</span>
    </div>
  `).join("");
}
