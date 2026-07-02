async function loadDashboard() {
  const employees = await getAllRecords("employees");

  let totalNotes = 0;
  let totalEquipment = 0;
  let totalTraining = 0;
  let totalSchedule = 0;
  let expiredTraining = 0;
  let trainingExpiringSoon = 0;
  let recentActivity = [];

  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);

  employees.forEach(employee => {
    const activity = employee.activity || [];
    const equipment = employee.equipment || [];
    const training = employee.training || [];
    const schedule = employee.schedule || [];

    totalNotes += activity.length;
    totalEquipment += equipment.length;
    totalTraining += training.length;
    totalSchedule += schedule.length;

    activity.forEach(item => {
      recentActivity.push({
        employeeId: employee.id,
        employeeName: `${employee.firstName || ""} ${employee.lastName || ""}`.trim(),
        type: item.type,
        note: item.note,
        date: item.date
      });
    });

    training.forEach(item => {
      if (!item.expiresDate) return;

      const expires = new Date(item.expiresDate);

      if (expires < today) {
        expiredTraining++;
      } else if (expires <= thirtyDaysFromNow) {
        trainingExpiringSoon++;
      }
    });
  });

  recentActivity = recentActivity
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 8);

  document.getElementById("content").innerHTML = `
    <div class="page-header">
      <div>
        <h2>Dashboard</h2>
        <p>Supervisor overview, quick actions, upcoming concerns, and recent employee activity.</p>
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
        <div class="number">${employees.length}</div>
        <div class="label">Employees</div>
      </div>

      <div class="stat-card">
        <div class="number">${totalNotes}</div>
        <div class="label">Timeline Notes</div>
      </div>

      <div class="stat-card">
        <div class="number">${totalEquipment}</div>
        <div class="label">Equipment Items</div>
      </div>

      <div class="stat-card">
        <div class="number">${totalTraining}</div>
        <div class="label">Training Records</div>
      </div>

      <div class="stat-card">
        <div class="number">${totalSchedule}</div>
        <div class="label">Schedule Entries</div>
      </div>

      <div class="stat-card warning-card">
        <div class="number">${trainingExpiringSoon}</div>
        <div class="label">Training Expiring Soon</div>
      </div>

      <div class="stat-card danger-stat">
        <div class="number">${expiredTraining}</div>
        <div class="label">Expired Training</div>
      </div>
    </div>

    <section class="card">
      <h3>Recent Activity</h3>
      <div id="recentActivityList">
        ${
          recentActivity.length === 0
            ? `<p class="muted">No recent activity yet.</p>`
            : recentActivity.map(item => `
              <div class="timeline-item" onclick="openEmployeeProfile(${item.employeeId})">
                <strong>${item.employeeName || "Unknown Employee"} — ${item.type || "Activity"}</strong>
                <span>${item.date ? new Date(item.date).toLocaleString() : "No date"}</span>
                <p>${item.note || ""}</p>
              </div>
            `).join("")
        }
      </div>
    </section>
  `;
}
