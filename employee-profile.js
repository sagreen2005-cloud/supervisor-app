async function openEmployeeProfile(id) {
  selectedEmployeeId = id;

  const employees = await getAllRecords("employees");
  const employee = employees.find(item => item.id === id);

  if (!employee) {
    alert("Employee record could not be found.");
    await loadEmployeesPage();
    return;
  }

  const arrays = [
    "training",
    "schedule",
    "activity",
    "performance",
    "reportReviews",
    "evaluations",
    "files"
  ];

  let changed = false;
  arrays.forEach(key => {
    if (!Array.isArray(employee[key])) {
      employee[key] = [];
      changed = true;
    }
  });

  if (changed) {
    employee.updatedAt = new Date().toISOString();
    await updateRecord("employees", employee);
  }

  document.getElementById("content").innerHTML = `
    <div class="employee-360-back-row">
      <button class="secondary-btn" type="button" onclick="loadEmployeesPage()">← Back to Employees</button>
    </div>

    <section class="card employee-360-hero">
      <div class="employee-360-identity">
        <div class="employee-profile-avatar">${getEmployeeInitials(employee)}</div>

        <div class="employee-360-name-block">
          <span class="employee-360-eyebrow">Employee 360</span>
          <h2>${escapeEmployeeProfileHtml(employee.rank || "")} ${escapeEmployeeProfileHtml(employee.firstName || "")} ${escapeEmployeeProfileHtml(employee.lastName || "")}</h2>
          <p>
            Badge ${escapeEmployeeProfileHtml(employee.badge || "N/A")}
            <span aria-hidden="true">•</span>
            ${escapeEmployeeProfileHtml(employee.assignment || "No assignment listed")}
          </p>
        </div>
      </div>

      <div class="employee-360-quick-actions">
        <button type="button" onclick="showEmployeeTab('notes')">Add Timeline Entry</button>
        <button class="secondary-btn" type="button" onclick="showEmployeeTab('timeline')">Open Timeline</button>
        <button class="secondary-btn" type="button" onclick="showEmployeeTab('edit')">Edit Employee</button>
      </div>

      <div class="employee-360-contact-strip">
        ${renderEmployee360Fact("Phone", employee.phone || "N/A")}
        ${renderEmployee360Fact("Email", employee.email || "N/A")}
        ${renderEmployee360Fact("Hire Date", formatEmployeeProfileDate(employee.hireDate))}
        ${renderEmployee360Fact("Service", getEmployeeServiceLength(employee.hireDate))}
      </div>
    </section>

    <div class="employee-360-shell">
      <aside class="card employee-360-navigation">
        <div class="employee-360-navigation-heading">Employee Record</div>
        <button data-employee-tab="overview" onclick="showEmployeeTab('overview')">Overview</button>
        <button data-employee-tab="timeline" onclick="showEmployeeTab('timeline')">Supervisor Timeline</button>
        <button data-employee-tab="notes" onclick="showEmployeeTab('notes')">Add Note</button>
        <button data-employee-tab="training" onclick="showEmployeeTab('training')">Training</button>
        <button data-employee-tab="schedule" onclick="showEmployeeTab('schedule')">Schedule</button>
        <button data-employee-tab="files" onclick="showEmployeeTab('files')">Files</button>
        <button data-employee-tab="edit" onclick="showEmployeeTab('edit')">Edit Employee</button>
      </aside>

      <main id="employeeTabContent" class="employee-360-content"></main>
    </div>
  `;

  await showEmployeeTab("timeline");
}

async function showEmployeeTab(tab) {
  const employees = await getAllRecords("employees");
  const employee = employees.find(item => item.id === selectedEmployeeId);

  if (!employee) return;

  document.querySelectorAll("[data-employee-tab]").forEach(button => {
    button.classList.toggle("active", button.dataset.employeeTab === tab);
  });

  const content = document.getElementById("employeeTabContent");
  if (!content) return;

  try {
    if (tab === "overview") {
      loadEmployee360(employee);
      return;
    }

    if (tab === "timeline") {
      if (typeof loadTimelineTab !== "function") {
        throw new Error("Timeline functions are not loaded. Confirm employee-notes.js is included after employee-profile.js.");
      }
      loadTimelineTab(employee);
      return;
    }

    if (tab === "notes") {
      loadAddNoteTab();
      return;
    }

    if (tab === "training") {
      loadTrainingTab(employee);
      return;
    }

    if (tab === "schedule") {
      loadScheduleTab(employee);
      return;
    }

    if (tab === "files") {
      loadEmployeeFilesTab(employee);
      return;
    }

    if (tab === "edit") {
      loadEditEmployeeTab(employee);
      return;
    }

    loadEmployee360(employee);
  } catch (error) {
    console.error("Employee 360 tab error:", error);
    content.innerHTML = `
      <section class="card">
        <h3>Unable to Load This Section</h3>
        <p class="muted">${escapeEmployeeProfileHtml(error.message || "An unexpected error occurred.")}</p>
      </section>
    `;
  }
}

function loadEmployee360(employee) {
  const entries = typeof buildEmployeeTimelineEntries === "function"
    ? buildEmployeeTimelineEntries(employee)
    : (employee.activity || []);

  const performance = employee.performance || [];
  const reports = employee.reportReviews || [];
  const evaluations = employee.evaluations || [];
  const training = employee.training || [];
  const files = employee.files || [];
  const schedule = employee.schedule || [];

  const positive = entries.filter(item => item.category === "positive").length;
  const coaching = entries.filter(item => item.category === "coaching").length;
  const pendingEvaluations = evaluations.filter(item => !/completed/i.test(item.status || "")).length;
  const expiringTraining = countEmployeeTrainingDue(training, 45);

  const recent = entries.slice(0, 6);

  document.getElementById("employeeTabContent").innerHTML = `
    <section class="employee-360-kpi-grid">
      ${renderEmployee360Kpi("Timeline", entries.length, "timeline")}
      ${renderEmployee360Kpi("Positive", positive, "timeline", "positive")}
      ${renderEmployee360Kpi("Coaching", coaching, "timeline", coaching ? "warning" : "")}
      ${renderEmployee360Kpi("Performance", performance.length, "timeline")}
      ${renderEmployee360Kpi("Report Reviews", reports.length, "timeline")}
      ${renderEmployee360Kpi("Evaluations Open", pendingEvaluations, "timeline", pendingEvaluations ? "warning" : "")}
      ${renderEmployee360Kpi("Training", training.length, "training")}
      ${renderEmployee360Kpi("Training Due", expiringTraining, "training", expiringTraining ? "warning" : "")}
      ${renderEmployee360Kpi("Files", files.length, "files")}
      ${renderEmployee360Kpi("Schedule", schedule.length, "schedule")}
    </section>

    <div class="employee-360-overview-grid">
      <section class="card">
        <div class="employee-360-section-header">
          <div>
            <h3>Supervisor Snapshot</h3>
            <p class="muted">Current indicators based on records already stored for this employee.</p>
          </div>
        </div>

        <div class="employee-360-snapshot-list">
          ${renderEmployeeSnapshotLine("Positive timeline entries", positive)}
          ${renderEmployeeSnapshotLine("Coaching or follow-up entries", coaching)}
          ${renderEmployeeSnapshotLine("Report reviews", reports.length)}
          ${renderEmployeeSnapshotLine("Open evaluations", pendingEvaluations)}
          ${renderEmployeeSnapshotLine("Training due within 45 days", expiringTraining)}
          ${renderEmployeeSnapshotLine("Files on record", files.length)}
        </div>
      </section>

      <section class="card">
        <div class="employee-360-section-header">
          <div>
            <h3>General Notes</h3>
            <p class="muted">Quick-reference employee information.</p>
          </div>
          <button class="secondary-btn" onclick="showEmployeeTab('edit')">Edit</button>
        </div>

        <div class="employee-note">${escapeEmployeeProfileHtml(employee.notes || "No general notes entered.")}</div>
      </section>
    </div>

    <section class="card">
      <div class="employee-360-section-header">
        <div>
          <h3>Recent Supervisor Timeline</h3>
          <p class="muted">The newest activity from notes, reports, evaluations, training, schedule, and files.</p>
        </div>
        <button class="secondary-btn" onclick="showEmployeeTab('timeline')">View Full Timeline</button>
      </div>

      <div class="employee-360-recent-list">
        ${
          recent.length
            ? recent.map(renderEmployee360RecentEntry).join("")
            : `<p class="muted">No timeline activity has been documented.</p>`
        }
      </div>
    </section>
  `;
}

function loadEditEmployeeTab(employee) {
  document.getElementById("employeeTabContent").innerHTML = `
    <section class="card">
      <div class="employee-360-section-header">
        <div>
          <h3>Edit Employee</h3>
          <p class="muted">Update the employee's core profile information.</p>
        </div>
      </div>

      <div class="form-grid labeled-form-grid">
        ${renderEmployeeEditField("First Name", "editFirstName", employee.firstName, true)}
        ${renderEmployeeEditField("Last Name", "editLastName", employee.lastName, true)}
        ${renderEmployeeEditField("Badge Number", "editBadge", employee.badge)}
        ${renderEmployeeEditField("Rank", "editRank", employee.rank)}
        ${renderEmployeeEditField("Phone Number", "editPhone", employee.phone, false, "tel")}
        ${renderEmployeeEditField("Email", "editEmail", employee.email, false, "email")}
        ${renderEmployeeEditField("Assignment / Shift", "editAssignment", employee.assignment)}
        ${renderEmployeeEditField("Hire Date", "editHireDate", employee.hireDate, false, "date")}
      </div>

      <label class="form-field form-field-full">
        <span>General Notes</span>
        <textarea id="editEmployeeNotes">${escapeEmployeeProfileHtml(employee.notes || "")}</textarea>
      </label>

      <div class="employee-360-form-actions">
        <button type="button" onclick="saveEmployeeProfile()">Save Changes</button>
        <button class="secondary-btn" type="button" onclick="showEmployeeTab('overview')">Cancel</button>
      </div>
    </section>
  `;
}

async function saveEmployeeProfile() {
  const employees = await getAllRecords("employees");
  const employee = employees.find(item => item.id === selectedEmployeeId);

  if (!employee) return;

  const firstName = document.getElementById("editFirstName").value.trim();
  const lastName = document.getElementById("editLastName").value.trim();

  if (!firstName || !lastName) {
    alert("First and last name are required.");
    return;
  }

  employee.firstName = firstName;
  employee.lastName = lastName;
  employee.badge = document.getElementById("editBadge").value.trim();
  employee.rank = document.getElementById("editRank").value.trim();
  employee.phone = document.getElementById("editPhone").value.trim();
  employee.email = document.getElementById("editEmail").value.trim();
  employee.assignment = document.getElementById("editAssignment").value.trim();
  employee.hireDate = document.getElementById("editHireDate").value;
  employee.notes = document.getElementById("editEmployeeNotes").value.trim();
  employee.updatedAt = new Date().toISOString();

  await updateRecord("employees", employee);
  await openEmployeeProfile(employee.id);
  await showEmployeeTab("overview");
}

function renderEmployeeEditField(label, id, value = "", required = false, type = "text") {
  return `
    <label class="form-field">
      <span>${escapeEmployeeProfileHtml(label)}${required ? ' <strong class="required-mark">*</strong>' : ""}</span>
      <input id="${id}" type="${type}" value="${escapeEmployeeProfileHtml(value || "")}" />
    </label>
  `;
}

function renderEmployee360Fact(label, value) {
  return `
    <div>
      <span>${escapeEmployeeProfileHtml(label)}</span>
      <strong>${escapeEmployeeProfileHtml(value)}</strong>
    </div>
  `;
}

function renderEmployee360Kpi(label, value, tab, state = "") {
  return `
    <button class="employee-360-kpi ${state}" type="button" onclick="showEmployeeTab('${tab}')">
      <strong>${Number(value) || 0}</strong>
      <span>${escapeEmployeeProfileHtml(label)}</span>
    </button>
  `;
}

function renderEmployeeSnapshotLine(label, value) {
  return `
    <div class="employee-360-snapshot-line">
      <span>${escapeEmployeeProfileHtml(label)}</span>
      <strong>${escapeEmployeeProfileHtml(String(value))}</strong>
    </div>
  `;
}

function renderEmployee360RecentEntry(item) {
  return `
    <button class="employee-360-recent-entry" type="button" onclick="showEmployeeTab('timeline')">
      <div>
        <strong>${escapeEmployeeProfileHtml(item.title || item.type || "Timeline Entry")}</strong>
        <span>${escapeEmployeeProfileHtml(item.type || item.source || "Employee record")}</span>
      </div>
      <time>${formatEmployeeProfileDateTime(item.date)}</time>
    </button>
  `;
}

function countEmployeeTrainingDue(training, withinDays) {
  const now = new Date();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + withinDays);

  return training.filter(item => {
    if (!item.expiresDate) return false;
    const date = new Date(`${item.expiresDate}T23:59:59`);
    return !Number.isNaN(date.getTime()) && date <= cutoff;
  }).length;
}

function getEmployeeInitials(employee) {
  const first = String(employee.firstName || "").trim().charAt(0);
  const last = String(employee.lastName || "").trim().charAt(0);
  return escapeEmployeeProfileHtml(`${first}${last}`.toUpperCase() || "E");
}

function getEmployeeServiceLength(hireDate) {
  if (!hireDate) return "N/A";

  const start = new Date(`${hireDate}T00:00:00`);
  if (Number.isNaN(start.getTime())) return "N/A";

  const now = new Date();
  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();

  if (now.getDate() < start.getDate()) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years < 0) return "N/A";
  if (years === 0) return `${Math.max(0, months)} month${months === 1 ? "" : "s"}`;
  return `${years} year${years === 1 ? "" : "s"}, ${Math.max(0, months)} month${months === 1 ? "" : "s"}`;
}

function formatEmployeeProfileDate(value) {
  if (!value) return "N/A";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? escapeEmployeeProfileHtml(value)
    : date.toLocaleDateString();
}

function formatEmployeeProfileDateTime(value) {
  if (!value) return "No date";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "No date" : date.toLocaleString();
}

function escapeEmployeeProfileHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
