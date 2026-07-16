let currentEmployeeProfile = null;

async function openEmployeeProfile(id) {
  selectedEmployeeId = id;

  const employees = await getAllRecords("employees");
  const employee = employees.find(e => e.id === id);

  if (!employee) {
    alert("Employee record not found.");
    return;
  }

  currentEmployeeProfile = employee;

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
        <button onclick="showEmployeeTab('files')">Files</button>
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

  if (!employee || !container) return;
  currentEmployeeProfile = employee;

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

    <div class="dashboard-grid employee-360-grid">
      ${renderEmployee360Card(activity.length, "Timeline Notes", "openEmployee360Details('timeline')")}
      ${renderEmployee360Card(performance.length, "Performance Entries", "openEmployee360Details('performance')")}
      ${renderEmployee360Card(reportReviews.length, "Report Reviews", "openEmployee360Details('reports')")}
      ${renderEmployee360Card(excellentReports, "Excellent Reports", "openEmployee360Details('excellentReports')")}
      ${renderEmployee360Card(returnedReports, "Returned Reports", "openEmployee360Details('returnedReports')", "warning-card")}
      ${renderEmployee360Card(commendations, "Positive Notes", "openEmployee360Details('positiveNotes')")}
      ${renderEmployee360Card(equipment.length, "Equipment Items", "openEmployee360Details('equipment')")}
      ${renderEmployee360Card(training.length, "Training Records", "openEmployee360Details('training')")}
      ${renderEmployee360Card(trainingExpiringSoon, "Training Expiring Soon", "openEmployee360Details('expiringTraining')", "warning-card")}
      ${renderEmployee360Card(expiredTraining, "Expired Training", "openEmployee360Details('expiredTraining')", "danger-stat")}
      ${renderEmployee360Card(schedule.length, "Schedule Entries", "openEmployee360Details('schedule')")}
      ${renderEmployee360Card(needsImprovement, "Needs Improvement", "openEmployee360Details('needsImprovement')", "danger-stat")}
    </div>

    <section id="employee360DetailPanel" class="card employee-360-detail-panel" hidden>
      <div class="employee-360-detail-header">
        <div>
          <h3 id="employee360DetailTitle">Details</h3>
          <p id="employee360DetailSubtitle" class="muted"></p>
        </div>
        <button type="button" class="employee-360-close" onclick="closeEmployee360Details()">×</button>
      </div>
      <div id="employee360DetailBody"></div>
    </section>

    <section class="card">
      <h3>Recent Activity</h3>
      ${
        recentActivity.length === 0
          ? `<p class="muted">No recent activity yet.</p>`
          : recentActivity.map(item => `
            <button type="button" class="timeline-item employee-360-recent-item" onclick="showEmployeeTab('timeline')">
              <strong>${escapeEmployee360Html(item.type || "Activity")}</strong>
              <span>${item.date ? new Date(item.date).toLocaleString() : "No date"}</span>
              <p>${escapeEmployee360Html(item.note || "")}</p>
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



function renderEmployee360Card(number, label, action, extraClass = "") {
  return `
    <button
      type="button"
      class="stat-card employee-360-stat-link ${extraClass}"
      onclick="${action}"
      aria-label="Open ${escapeEmployee360Html(label)}"
    >
      <div class="number">${number}</div>
      <div class="label">${escapeEmployee360Html(label)}</div>
      <div class="employee-360-card-action">View details ›</div>
    </button>
  `;
}

function openEmployee360Details(category) {
  const employee = currentEmployeeProfile;
  const panel = document.getElementById("employee360DetailPanel");
  const title = document.getElementById("employee360DetailTitle");
  const subtitle = document.getElementById("employee360DetailSubtitle");
  const body = document.getElementById("employee360DetailBody");

  if (!employee || !panel || !title || !subtitle || !body) return;

  const activity = employee.activity || [];
  const performance = employee.performance || [];
  const reportReviews = employee.reportReviews || [];
  const training = employee.training || [];
  const equipment = employee.equipment || [];
  const schedule = employee.schedule || [];

  const today = startOfEmployee360Day(new Date());
  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  let records = [];
  let heading = "Details";
  let description = "";

  if (category === "timeline") {
    const sorted = activity
      .slice()
      .sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0));

    heading = "Timeline Notes";
    description = `${sorted.length} timeline entr${sorted.length === 1 ? "y" : "ies"}`;
    records = sorted.map(renderEmployee360ActivityItem);
  } else if (category === "equipment") {
    heading = "Equipment Items";
    description = `${equipment.length} equipment item${equipment.length === 1 ? "" : "s"}`;
    records = equipment.map(renderEmployee360EquipmentItem);
  } else if (category === "training") {
    heading = "Training Records";
    description = `${training.length} training record${training.length === 1 ? "" : "s"}`;
    records = training.map(renderEmployee360TrainingItem);
  } else if (category === "schedule") {
    const sorted = schedule
      .slice()
      .sort((a, b) => String(b.startDate || "").localeCompare(String(a.startDate || "")));

    heading = "Schedule Entries";
    description = `${sorted.length} schedule entr${sorted.length === 1 ? "y" : "ies"}`;
    records = sorted.map(renderEmployee360ScheduleItem);
  } else if (category === "performance") {
    heading = "Performance Entries";
    description = `${performance.length} total performance record${performance.length === 1 ? "" : "s"}`;
    records = performance.map(renderEmployee360PerformanceItem);
  } else if (category === "needsImprovement") {
    const filtered = performance.filter(item => item.rating === "1 - Needs Improvement");
    heading = "Needs Improvement";
    description = `${filtered.length} matching performance entr${filtered.length === 1 ? "y" : "ies"}`;
    records = filtered.map(renderEmployee360PerformanceItem);
  } else if (category === "reports") {
    heading = "Report Reviews";
    description = `${reportReviews.length} total report review${reportReviews.length === 1 ? "" : "s"}`;
    records = reportReviews.map(renderEmployee360ReportItem);
  } else if (category === "excellentReports") {
    const filtered = reportReviews.filter(item => item.rating === "Excellent");
    heading = "Excellent Reports";
    description = `${filtered.length} report${filtered.length === 1 ? "" : "s"} rated excellent`;
    records = filtered.map(renderEmployee360ReportItem);
  } else if (category === "returnedReports") {
    const filtered = reportReviews.filter(item => item.returnedForCorrection === "Yes");
    heading = "Returned Reports";
    description = `${filtered.length} report${filtered.length === 1 ? "" : "s"} returned for correction`;
    records = filtered.map(renderEmployee360ReportItem);
  } else if (category === "positiveNotes") {
    const filtered = activity.filter(item => {
      const type = String(item.type || "").toLowerCase();
      return type.includes("commendation") ||
        type.includes("good job") ||
        type.includes("compliment");
    });
    heading = "Positive Notes";
    description = `${filtered.length} positive note${filtered.length === 1 ? "" : "s"}`;
    records = filtered.map(renderEmployee360ActivityItem);
  } else if (category === "expiringTraining") {
    const filtered = training.filter(item => {
      if (!item.expiresDate) return false;
      const date = parseEmployee360Date(item.expiresDate);
      return date >= today && date <= thirtyDaysFromNow;
    });
    heading = "Training Expiring Soon";
    description = `${filtered.length} record${filtered.length === 1 ? "" : "s"} expiring within 30 days`;
    records = filtered.map(renderEmployee360TrainingItem);
  } else if (category === "expiredTraining") {
    const filtered = training.filter(item => {
      if (!item.expiresDate) return false;
      return parseEmployee360Date(item.expiresDate) < today;
    });
    heading = "Expired Training";
    description = `${filtered.length} expired record${filtered.length === 1 ? "" : "s"}`;
    records = filtered.map(renderEmployee360TrainingItem);
  }

  title.textContent = heading;
  subtitle.textContent = description;
  const fullTabButton = getEmployee360FullTabButton(category);

  body.innerHTML = `
    ${fullTabButton}
    ${
      records.length
        ? `<div class="employee-360-detail-list">${records.join("")}</div>`
        : `<p class="muted">No matching records found.</p>`
    }
  `;

  panel.hidden = false;
  panel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function closeEmployee360Details() {
  const panel = document.getElementById("employee360DetailPanel");
  if (panel) panel.hidden = true;
}

function renderEmployee360PerformanceItem(item) {
  const date = item.date || item.createdAt || "";
  const heading = item.category || item.type || "Performance Entry";
  const rating = item.rating || "No rating";
  const note = item.note || item.notes || item.comments || item.description || "";

  return `
    <article class="employee-360-detail-item">
      <div class="employee-360-detail-item-header">
        <strong>${escapeEmployee360Html(heading)}</strong>
        <span>${escapeEmployee360Html(formatEmployee360Date(date))}</span>
      </div>
      <div class="employee-360-detail-meta">${escapeEmployee360Html(rating)}</div>
      ${note ? `<p>${escapeEmployee360Html(note)}</p>` : ""}
    </article>
  `;
}

function renderEmployee360ReportItem(item) {
  const caseNumber = item.caseNumber || item.reportNumber || item.case || "Report Review";
  const date = item.date || item.reviewDate || item.createdAt || "";
  const rating = item.rating || "No rating";
  const returned = item.returnedForCorrection === "Yes" ? "Returned for correction" : "Not returned";
  const note = item.notes || item.note || item.comments || item.feedback || "";

  return `
    <article class="employee-360-detail-item">
      <div class="employee-360-detail-item-header">
        <strong>${escapeEmployee360Html(caseNumber)}</strong>
        <span>${escapeEmployee360Html(formatEmployee360Date(date))}</span>
      </div>
      <div class="employee-360-detail-meta">
        ${escapeEmployee360Html(rating)} · ${escapeEmployee360Html(returned)}
      </div>
      ${note ? `<p>${escapeEmployee360Html(note)}</p>` : ""}
    </article>
  `;
}

function renderEmployee360ActivityItem(item) {
  const date = item.date || item.createdAt || "";
  const heading = item.type || "Activity";
  const note = item.note || item.notes || "";

  return `
    <article class="employee-360-detail-item">
      <div class="employee-360-detail-item-header">
        <strong>${escapeEmployee360Html(heading)}</strong>
        <span>${escapeEmployee360Html(formatEmployee360Date(date))}</span>
      </div>
      ${note ? `<p>${escapeEmployee360Html(note)}</p>` : ""}
    </article>
  `;
}

function renderEmployee360TrainingItem(item) {
  const heading = item.name || item.trainingName || item.course || item.type || "Training";
  const completed = item.completedDate || item.date || "Not listed";
  const expires = item.expiresDate || "No expiration";
  const note = item.notes || item.note || "";

  return `
    <article class="employee-360-detail-item">
      <div class="employee-360-detail-item-header">
        <strong>${escapeEmployee360Html(heading)}</strong>
        <span>Expires: ${escapeEmployee360Html(expires)}</span>
      </div>
      <div class="employee-360-detail-meta">Completed: ${escapeEmployee360Html(completed)}</div>
      ${note ? `<p>${escapeEmployee360Html(note)}</p>` : ""}
    </article>
  `;
}

function renderEmployee360EquipmentItem(item) {
  const heading =
    item.itemName ||
    item.name ||
    item.equipment ||
    item.type ||
    item.description ||
    "Equipment Item";

  const issued =
    item.issueDate ||
    item.issuedDate ||
    item.date ||
    item.createdAt ||
    "Not listed";

  const returned =
    item.returnDate ||
    item.returnedDate ||
    item.status ||
    "Not listed";

  const serial =
    item.serialNumber ||
    item.serial ||
    item.assetNumber ||
    item.assetTag ||
    "";

  const note = item.notes || item.note || item.comments || "";

  return `
    <article class="employee-360-detail-item">
      <div class="employee-360-detail-item-header">
        <strong>${escapeEmployee360Html(heading)}</strong>
        <span>${escapeEmployee360Html(formatEmployee360Date(issued))}</span>
      </div>
      <div class="employee-360-detail-meta">
        ${serial ? `Serial / Asset: ${escapeEmployee360Html(serial)} · ` : ""}
        Status / Return: ${escapeEmployee360Html(returned)}
      </div>
      ${note ? `<p>${escapeEmployee360Html(note)}</p>` : ""}
    </article>
  `;
}

function renderEmployee360ScheduleItem(item) {
  const heading = item.type || "Schedule Entry";
  const start = item.startDate || "Not listed";
  const end = item.endDate || start;
  const hours = item.hours || "N/A";
  const note = item.notes || item.note || "";

  return `
    <article class="employee-360-detail-item">
      <div class="employee-360-detail-item-header">
        <strong>${escapeEmployee360Html(heading)}</strong>
        <span>${escapeEmployee360Html(start)} to ${escapeEmployee360Html(end)}</span>
      </div>
      <div class="employee-360-detail-meta">Hours: ${escapeEmployee360Html(hours)}</div>
      ${note ? `<p>${escapeEmployee360Html(note)}</p>` : ""}
    </article>
  `;
}

function getEmployee360FullTabButton(category) {
  const tabMap = {
    timeline: ["timeline", "Open Full Timeline"],
    positiveNotes: ["timeline", "Open Full Timeline"],
    equipment: ["equipment", "Manage Equipment"],
    training: ["training", "Manage Training"],
    expiringTraining: ["training", "Manage Training"],
    expiredTraining: ["training", "Manage Training"],
    schedule: ["schedule", "Manage Schedule"]
  };

  const target = tabMap[category];
  if (!target) return "";

  return `
    <div class="employee-360-detail-actions">
      <button type="button" onclick="showEmployeeTab('${target[0]}')">${target[1]}</button>
    </div>
  `;
}

function parseEmployee360Date(value) {
  if (!value) return new Date(0);

  const parts = String(value).split("-");
  if (parts.length === 3) {
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }

  return new Date(value);
}

function startOfEmployee360Day(value) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatEmployee360Date(value) {
  if (!value) return "No date";

  const date = parseEmployee360Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString();
}

function escapeEmployee360Html(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
