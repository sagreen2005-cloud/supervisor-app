async function openEmployeeProfile(id) {
  selectedEmployeeId = id;

  const employees = await getAllRecords("employees");
  const employee = employees.find(e => e.id === id);

  if (!employee) {
    alert("Employee record could not be found.");
    loadEmployeesPage();
    return;
  }

  if (!employee.equipment) employee.equipment = [];
  if (!employee.training) employee.training = [];
  if (!employee.schedule) employee.schedule = [];
  if (!employee.activity) employee.activity = [];
  if (!employee.performance) employee.performance = [];
  if (!employee.reportReviews) employee.reportReviews = [];
  if (!employee.evaluations) employee.evaluations = [];
  if (!employee.files) employee.files = [];

  await updateRecord("employees", employee);

  document.getElementById("content").innerHTML = `
    <button onclick="loadEmployeesPage()">← Back to Employees</button>

    <section class="card employee-profile-header">
      <div class="employee-profile-heading">
        <div class="employee-profile-avatar">${getEmployeeInitials(employee)}</div>
        <div>
          <h2>${escapeEmployeeProfileHtml(employee.rank || "")} ${escapeEmployeeProfileHtml(employee.firstName)} ${escapeEmployeeProfileHtml(employee.lastName)}</h2>
          <p class="muted">Badge: ${escapeEmployeeProfileHtml(employee.badge || "N/A")} | ${escapeEmployeeProfileHtml(employee.assignment || "No assignment listed")}</p>
        </div>
      </div>

      <div class="profile-tabs">
        <button data-employee-tab="overview" onclick="showEmployeeTab('overview')">360 Summary</button>
        <button data-employee-tab="timeline" onclick="showEmployeeTab('timeline')">Supervisor Timeline</button>
        <button data-employee-tab="edit" onclick="showEmployeeTab('edit')">Edit Employee</button>
        <button data-employee-tab="notes" onclick="showEmployeeTab('notes')">Add Note</button>
        <button data-employee-tab="equipment" onclick="showEmployeeTab('equipment')">Equipment</button>
        <button data-employee-tab="training" onclick="showEmployeeTab('training')">Training</button>
        <button data-employee-tab="schedule" onclick="showEmployeeTab('schedule')">Schedule</button>
        <button data-employee-tab="files" onclick="showEmployeeTab('files')">Files</button>
      </div>
    </section>

    <div id="employeeTabContent"></div>
  `;

  showEmployeeTab("overview");
}

async function showEmployeeTab(tab) {
  const employees = await getAllRecords("employees");
  const employee = employees.find(e => e.id === selectedEmployeeId);

  if (!employee) return;

  document.querySelectorAll("[data-employee-tab]").forEach(button => {
    button.classList.toggle("active", button.dataset.employeeTab === tab);
  });

  if (tab === "overview") loadEmployee360(employee);
  if (tab === "edit") loadEditEmployeeTab(employee);
  if (tab === "timeline") loadTimelineTab(employee);
  if (tab === "notes") loadAddNoteTab();
  if (tab === "equipment") loadEquipmentTab(employee);
  if (tab === "training") loadTrainingTab(employee);
  if (tab === "schedule") loadScheduleTab(employee);
  if (tab === "files") loadEmployeeFilesTab(employee);
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
  const evaluations = employee.evaluations || [];
  const combinedTimeline = typeof buildEmployeeTimelineEntries === "function"
    ? buildEmployeeTimelineEntries(employee)
    : activity;

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
  const commendations = combinedTimeline.filter(item => item.category === "positive").length;
  const coaching = combinedTimeline.filter(item => item.category === "coaching").length;

  const recentActivity = combinedTimeline
    .slice()
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    .slice(0, 5);

  document.getElementById("employeeTabContent").innerHTML = `
    <section class="card">
      <div class="employee-360-summary-header">
        <div>
          <h3>Employee 360 Summary</h3>
          <p class="muted">Current employee information and a preview of the supervisor timeline.</p>
        </div>
        <button type="button" onclick="showEmployeeTab('timeline')">View Full Timeline</button>
      </div>

      <div class="employee-details">
        <div><span>Phone</span>${escapeEmployeeProfileHtml(employee.phone || "N/A")}</div>
        <div><span>Email</span>${escapeEmployeeProfileHtml(employee.email || "N/A")}</div>
        <div><span>Hire Date</span>${escapeEmployeeProfileHtml(employee.hireDate || "N/A")}</div>
        <div><span>Assignment</span>${escapeEmployeeProfileHtml(employee.assignment || "N/A")}</div>
      </div>

      <p class="employee-note">${escapeEmployeeProfileHtml(employee.notes || "No general notes entered.")}</p>
    </section>

    <div class="dashboard-grid employee-360-stat-grid">
      <button class="stat-card employee-360-stat-link" onclick="showEmployeeTab('timeline')">
        <div class="number">${combinedTimeline.length}</div>
        <div class="label">Timeline Events</div>
      </button>

      <button class="stat-card employee-360-stat-link" onclick="showEmployeeTab('timeline')">
        <div class="number">${performance.length}</div>
        <div class="label">Performance Entries</div>
      </button>

      <button class="stat-card employee-360-stat-link" onclick="showEmployeeTab('timeline')">
        <div class="number">${reportReviews.length}</div>
        <div class="label">Report Reviews</div>
      </button>

      <button class="stat-card employee-360-stat-link" onclick="showEmployeeTab('timeline')">
        <div class="number">${commendations}</div>
        <div class="label">Positive Entries</div>
      </button>

      <button class="stat-card employee-360-stat-link warning-card" onclick="showEmployeeTab('timeline')">
        <div class="number">${coaching + returnedReports + needsImprovement}</div>
        <div class="label">Coaching / Follow-up</div>
      </button>

      <button class="stat-card employee-360-stat-link" onclick="showEmployeeTab('timeline')">
        <div class="number">${evaluations.length}</div>
        <div class="label">Evaluations</div>
      </button>

      <button class="stat-card employee-360-stat-link" onclick="showEmployeeTab('training')">
        <div class="number">${training.length}</div>
        <div class="label">Training Records</div>
      </button>

      <button class="stat-card employee-360-stat-link warning-card" onclick="showEmployeeTab('training')">
        <div class="number">${trainingExpiringSoon}</div>
        <div class="label">Training Expiring Soon</div>
      </button>

      <button class="stat-card employee-360-stat-link danger-stat" onclick="showEmployeeTab('training')">
        <div class="number">${expiredTraining}</div>
        <div class="label">Expired Training</div>
      </button>

      <button class="stat-card employee-360-stat-link" onclick="showEmployeeTab('schedule')">
        <div class="number">${schedule.length}</div>
        <div class="label">Schedule Entries</div>
      </button>

      <button class="stat-card employee-360-stat-link" onclick="showEmployeeTab('equipment')">
        <div class="number">${equipment.length}</div>
        <div class="label">Equipment Items</div>
      </button>

      <button class="stat-card employee-360-stat-link" onclick="showEmployeeTab('timeline')">
        <div class="number">${excellentReports}</div>
        <div class="label">Excellent Reports</div>
      </button>
    </div>

    <section class="card">
      <div class="employee-360-summary-header">
        <div>
          <h3>Recent Supervisor Timeline</h3>
          <p class="muted">Most recent activity from notes, performance, reports, training, evaluations, schedule, and files.</p>
        </div>
        <button class="secondary-btn" type="button" onclick="showEmployeeTab('timeline')">Open Timeline</button>
      </div>

      ${
        recentActivity.length === 0
          ? `<p class="muted">No timeline activity yet.</p>`
          : recentActivity.map(item => `
            <button class="employee-360-recent-item timeline-item" onclick="showEmployeeTab('timeline')">
              <strong>${escapeEmployeeProfileHtml(item.title || item.type || "Activity")}</strong>
              <span>${item.date ? new Date(item.date).toLocaleString() : "No date"}</span>
              <p>${escapeEmployeeProfileHtml(item.note || item.details || "")}</p>
            </button>
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
        <input id="editFirstName" placeholder="First Name" value="${escapeEmployeeProfileHtml(employee.firstName || "")}" />
        <input id="editLastName" placeholder="Last Name" value="${escapeEmployeeProfileHtml(employee.lastName || "")}" />
        <input id="editBadge" placeholder="Badge Number" value="${escapeEmployeeProfileHtml(employee.badge || "")}" />
        <input id="editRank" placeholder="Rank" value="${escapeEmployeeProfileHtml(employee.rank || "")}" />
        <input id="editPhone" placeholder="Phone Number" value="${escapeEmployeeProfileHtml(employee.phone || "")}" />
        <input id="editEmail" placeholder="Email" value="${escapeEmployeeProfileHtml(employee.email || "")}" />
        <input id="editAssignment" placeholder="Assignment / Shift" value="${escapeEmployeeProfileHtml(employee.assignment || "")}" />
        <input id="editHireDate" type="date" value="${escapeEmployeeProfileHtml(employee.hireDate || "")}" />
      </div>

      <textarea id="editEmployeeNotes" placeholder="General notes / quick reference information">${escapeEmployeeProfileHtml(employee.notes || "")}</textarea>

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

function getEmployeeInitials(employee) {
  const first = String(employee.firstName || "").trim().charAt(0);
  const last = String(employee.lastName || "").trim().charAt(0);
  return escapeEmployeeProfileHtml(`${first}${last}`.toUpperCase() || "--");
}

function escapeEmployeeProfileHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
