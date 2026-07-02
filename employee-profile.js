async function openEmployeeProfile(id) {
  selectedEmployeeId = id;

  const employees = await getAllRecords("employees");
  const employee = employees.find(e => e.id === id);

  if (!employee.equipment) employee.equipment = [];
  if (!employee.training) employee.training = [];
  if (!employee.schedule) employee.schedule = [];
  if (!employee.activity) employee.activity = [];
  if (!employee.performance) employee.performance = [];
  if (!employee.reportReviews) employee.reportReviews = [];

  await updateRecord("employees", employee);

  document.getElementById("content").innerHTML = `
    <button onclick="loadEmployeesPage()">← Back to Employees</button>

    <section class="card">
      <h2>${employee.rank || ""} ${employee.firstName} ${employee.lastName}</h2>
      <p class="muted">Badge: ${employee.badge || "N/A"} | ${employee.assignment || "No assignment listed"}</p>

      <div class="profile-tabs">
        <button onclick="showEmployeeTab('overview')">360 Summary</button>
        <button onclick="showEmployeeTab('edit')">Edit Employee</button>
        <button onclick="showEmployeeTab('timeline')">Timeline</button>
        <button onclick="showEmployeeTab('notes')">Add Note</button>
        <button onclick="showEmployeeTab('equipment')">Equipment</button>
        <button onclick="showEmployeeTab('training')">Training</button>
        <button onclick="showEmployeeTab('schedule')">Schedule</button>
      </div>
    </section>

    <div id="employeeTabContent"></div>
  `;

  showEmployeeTab("overview");
}

async function showEmployeeTab(tab) {
  const employees = await getAllRecords("employees");
  const employee = employees.find(e => e.id === selectedEmployeeId);
  const container = document.getElementById("employeeTabContent");

  if (tab === "overview") {
    loadEmployee360(employee);
  }

  if (tab === "edit") loadEditEmployeeTab(employee);
  if (tab === "timeline") loadTimelineTab(employee);
  if (tab === "notes") loadAddNoteTab();
  if (tab === "equipment") loadEquipmentTab(employee);
  if (tab === "training") loadTrainingTab(employee);
  if (tab === "schedule") loadScheduleTab(employee);
}

function loadEmployee360(employee) {
  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);

  const activity = employee.activity || [];
  const equipment = employee.equipment || [];
  const training = employee.training || [];
  const schedule = employee.schedule || [];
  const performance = employee.performance || [];
  const reportReviews = employee.reportReviews || [];

  let expiredTraining = 0;
  let trainingExpiringSoon = 0;

  training.forEach(item => {
    if (!item.expiresDate) return;

    const expires = new Date(item.expiresDate);

    if (expires < today) {
      expiredTraining++;
    } else if (expires <= thirtyDaysFromNow) {
      trainingExpiringSoon++;
    }
  });

  const returnedReports = reportReviews.filter(r => r.returnedForCorrection === "Yes").length;
  const excellentReports = reportReviews.filter(r => r.rating === "Excellent").length;
  const needsImprovement = performance.filter(p => p.rating === "1 - Needs Improvement").length;
  const commendations = activity.filter(a =>
    (a.type || "").toLowerCase().includes("commendation") ||
    (a.type || "").toLowerCase().includes("good job") ||
    (a.type || "").toLowerCase().includes("compliment")
  ).length;

  const recentActivity = activity
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 6);

  document.getElementById("employeeTabContent").innerHTML = `
    <section class="card">
      <h3>Employee 360 Summary</h3>

      <div class="employee-details">
        <div><span>Phone</span>${employee.phone || "N/A"}</div>
        <div><span>Email</span>${employee.email || "N/A"}</div>
        <div><span>Hire Date</span>${employee.hireDate || "N/A"}</div>
        <div><span>Assignment</span>${employee.assignment || "N/A"}</div>
      </div>

      <p class="employee-note">${employee.notes || "No general notes entered."}</p>
    </section>

    <div class="dashboard-grid">
      <div class="stat-card">
        <div class="number">${activity.length}</div>
        <div class="label">Timeline Notes</div>
      </div>

      <div class="stat-card">
        <div class="number">${performance.length}</div>
        <div class="label">Performance Entries</div>
      </div>

      <div class="stat-card">
        <div class="number">${reportReviews.length}</div>
        <div class="label">Report Reviews</div>
      </div>

      <div class="stat-card">
        <div class="number">${excellentReports}</div>
        <div class="label">Excellent Reports</div>
      </div>

      <div class="stat-card warning-card">
        <div class="number">${returnedReports}</div>
        <div class="label">Returned Reports</div>
      </div>

      <div class="stat-card">
        <div class="number">${commendations}</div>
        <div class="label">Positive Notes</div>
      </div>

      <div class="stat-card">
        <div class="number">${equipment.length}</div>
        <div class="label">Equipment Items</div>
      </div>

      <div class="stat-card">
        <div class="number">${training.length}</div>
        <div class="label">Training Records</div>
      </div>

      <div class="stat-card warning-card">
        <div class="number">${trainingExpiringSoon}</div>
        <div class="label">Training Expiring Soon</div>
      </div>

      <div class="stat-card danger-stat">
        <div class="number">${expiredTraining}</div>
        <div class="label">Expired Training</div>
      </div>

      <div class="stat-card">
        <div class="number">${schedule.length}</div>
        <div class="label">Schedule Entries</div>
      </div>

      <div class="stat-card danger-stat">
        <div class="number">${needsImprovement}</div>
        <div class="label">Needs Improvement</div>
      </div>
    </div>

    <section class="card">
      <h3>Recent Activity</h3>
      ${
        recentActivity.length === 0
          ? `<p class="muted">No recent activity yet.</p>`
          : recentActivity.map(item => `
            <div class="timeline-item">
              <strong>${item.type || "Activity"}</strong>
              <span>${item.date ? new Date(item.date).toLocaleString() : "No date"}</span>
              <p>${item.note || ""}</p>
            </div>
          `).join("")
      }
    </section>
  `;
}

function loadEditEmployeeTab(employee) {
  document.getElementById("employeeTabContent").innerHTML = `
    <section class="card">
      <h3>Edit Employee</h3>

      <div class="form-grid">
        <input id="editFirstName" placeholder="First Name" value="${employee.firstName || ""}" />
        <input id="editLastName" placeholder="Last Name" value="${employee.lastName || ""}" />
        <input id="editBadge" placeholder="Badge Number" value="${employee.badge || ""}" />
        <input id="editRank" placeholder="Rank" value="${employee.rank || ""}" />
        <input id="editPhone" placeholder="Phone Number" value="${employee.phone || ""}" />
        <input id="editEmail" placeholder="Email" value="${employee.email || ""}" />
        <input id="editAssignment" placeholder="Assignment / Shift" value="${employee.assignment || ""}" />
        <input id="editHireDate" type="date" value="${employee.hireDate || ""}" />
      </div>

      <textarea id="editEmployeeNotes" placeholder="General notes / quick reference information">${employee.notes || ""}</textarea>

      <button onclick="saveEmployeeEdits()">Save Changes</button>
    </section>
  `;
}

async function saveEmployeeEdits() {
  const employees = await getAllRecords("employees");
  const employee = employees.find(e => e.id === selectedEmployeeId);

  employee.firstName = document.getElementById("editFirstName").value.trim();
  employee.lastName = document.getElementById("editLastName").value.trim();
  employee.badge = document.getElementById("editBadge").value.trim();
  employee.rank = document.getElementById("editRank").value.trim();
  employee.phone = document.getElementById("editPhone").value.trim();
  employee.email = document.getElementById("editEmail").value.trim();
  employee.assignment = document.getElementById("editAssignment").value.trim();
  employee.hireDate = document.getElementById("editHireDate").value;
  employee.notes = document.getElementById("editEmployeeNotes").value.trim();
  employee.updatedAt = new Date().toISOString();

  if (!employee.firstName || !employee.lastName) {
    alert("First and last name are required.");
    return;
  }

  await updateRecord("employees", employee);
  await openEmployeeProfile(employee.id);
}
