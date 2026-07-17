let employeeTimelineCategory = "all";
let employeeTimelineView = "timeline";

function loadAddNoteTab() {
  document.getElementById("employeeTabContent").innerHTML = `
    <section class="card">
      <h3>Add Supervisor Note</h3>
      <p class="muted">This note will appear in the employee's Supervisor Timeline.</p>

      <div class="form-grid">
        <select id="activityType">
          <option value="Good Job">Good Job</option>
          <option value="Commendation">Commendation</option>
          <option value="Supervisor Journal">Supervisor Journal</option>
          <option value="Coaching">Coaching</option>
          <option value="Report Issue">Report Issue</option>
          <option value="Counseling">Counseling</option>
          <option value="Discipline">Discipline</option>
          <option value="Training">Training</option>
          <option value="Equipment">Equipment</option>
          <option value="Citizen Compliment">Citizen Compliment</option>
          <option value="Citizen Complaint">Citizen Complaint</option>
          <option value="General Note">General Note</option>
        </select>

        <input id="activityTitle" placeholder="Title or short description" />
      </div>

      <textarea id="activityNote" placeholder="Document the issue, observation, correction, follow-up, or positive performance..."></textarea>

      <label class="timeline-private-option">
        <input id="activitySupervisorOnly" type="checkbox" />
        Supervisor-only journal entry
      </label>

      <button onclick="addEmployeeActivity()">Add Timeline Entry</button>
    </section>
  `;
}

async function addEmployeeActivity() {
  const employees = await getAllRecords("employees");
  const employee = employees.find(e => e.id === selectedEmployeeId);

  if (!employee) return;

  const type = document.getElementById("activityType").value;
  const title = document.getElementById("activityTitle").value.trim();
  const note = document.getElementById("activityNote").value.trim();
  const supervisorOnly = document.getElementById("activitySupervisorOnly").checked;

  if (!note) {
    alert("Enter a note first.");
    return;
  }

  const activity = {
    id: createTimelineId(),
    type: supervisorOnly ? "Supervisor Journal" : type,
    title: title || getDefaultTimelineTitle(type),
    note,
    visibility: supervisorOnly ? "supervisor" : "standard",
    source: "Supervisor Note",
    date: new Date().toISOString()
  };

  if (!employee.activity) employee.activity = [];

  employee.activity.push(activity);
  employee.updatedAt = new Date().toISOString();

  await updateRecord("employees", employee);
  await openEmployeeProfile(employee.id);
  showEmployeeTab("timeline");
}

function loadTimelineTab(employee) {
  employeeTimelineCategory = "all";
  employeeTimelineView = "timeline";

  const entries = buildEmployeeTimelineEntries(employee);
  const insights = getEmployeeTimelineInsights(entries, employee);

  document.getElementById("employeeTabContent").innerHTML = `
    <section class="employee-timeline-insights">
      ${renderTimelineInsightCard("Last Positive Note", insights.lastPositiveText, insights.lastPositiveDate)}
      ${renderTimelineInsightCard("Last Coaching", insights.lastCoachingText, insights.lastCoachingDate)}
      ${renderTimelineInsightCard("Report Reviews", String(insights.reportReviews), "All records")}
      ${renderTimelineInsightCard("Positive Entries", String(insights.positiveEntries), "All records")}
      ${renderTimelineInsightCard("Training Complete", String(insights.trainingCompleted), insights.trainingPending ? `${insights.trainingPending} pending` : "No pending items")}
      ${renderTimelineInsightCard("Evaluations", String(insights.evaluations), "All records")}
    </section>

    <div class="employee-timeline-layout">
      <section class="card employee-timeline-panel">
        <div class="employee-timeline-panel-header">
          <div>
            <h3>Supervisor Timeline</h3>
            <p class="muted">A combined history of supervisor notes and records already stored in Employee 360.</p>
          </div>

          <div class="employee-timeline-view-switch">
            <button id="employeeTimelineViewButton" class="active" onclick="setEmployeeTimelineView('timeline')">Timeline</button>
            <button id="employeeTimelineMonthButton" onclick="setEmployeeTimelineView('monthly')">Monthly</button>
          </div>
        </div>

        <div class="employee-timeline-toolbar">
          <div class="employee-timeline-search-row">
            <input id="employeeTimelineSearch" placeholder="Search notes, cases, training, or keywords..." oninput="renderEmployeeTimeline()" />
            <button class="secondary-btn" onclick="clearEmployeeTimelineFilters()">Clear</button>
            <button onclick="showEmployeeTab('notes')">+ Add Entry</button>
          </div>

          <div class="employee-timeline-filters">
            ${renderTimelineFilterButton("all", "All", true)}
            ${renderTimelineFilterButton("positive", "Positive")}
            ${renderTimelineFilterButton("report", "Reports")}
            ${renderTimelineFilterButton("training", "Training")}
            ${renderTimelineFilterButton("coaching", "Coaching")}
            ${renderTimelineFilterButton("evaluation", "Evaluations")}
            ${renderTimelineFilterButton("schedule", "Schedule")}
            ${renderTimelineFilterButton("file", "Files")}
            ${renderTimelineFilterButton("journal", "Supervisor Journal")}
          </div>
        </div>

        <div id="employeeTimelineResults"></div>
        <div id="employeeTimelineMonthly" hidden></div>
      </section>

      <aside class="card employee-timeline-sidebar">
        <section>
          <h3>90-Day Supervisor Summary</h3>
          <div class="employee-timeline-summary-box">${escapeTimelineHtml(buildEmployeeNinetyDaySummary(entries))}</div>
        </section>

        <section>
          <h3>Current Snapshot</h3>
          ${renderTimelineSnapshotRow("Positive entries", insights.positiveEntries)}
          ${renderTimelineSnapshotRow("Coaching entries", insights.coachingEntries)}
          ${renderTimelineSnapshotRow("Report corrections", insights.returnedReports)}
          ${renderTimelineSnapshotRow("Citizen complaints", insights.citizenComplaints)}
          ${renderTimelineSnapshotRow("Supervisor journal", insights.journalEntries)}
        </section>

        <section>
          <h3>Quick Add</h3>
          <button class="employee-timeline-quick-button" onclick="openTimelineQuickAdd('Good Job')">★ Positive performance</button>
          <button class="employee-timeline-quick-button" onclick="openTimelineQuickAdd('Coaching')">! Coaching note</button>
          <button class="employee-timeline-quick-button" onclick="openTimelineQuickAdd('Supervisor Journal', true)">J Supervisor journal</button>
        </section>
      </aside>
    </div>
  `;

  window.currentEmployeeTimelineEntries = entries;
  renderEmployeeTimeline();
  renderEmployeeTimelineMonthly(entries);
}

function buildEmployeeTimelineEntries(employee) {
  const entries = [];

  (employee.activity || []).forEach((item, index) => {
    entries.push(normalizeTimelineEntry({
      id: item.id || `activity-${index}`,
      type: item.type || "General Note",
      title: item.title || getDefaultTimelineTitle(item.type || "General Note"),
      note: item.note || "",
      date: item.date || item.createdAt,
      source: item.source || "Supervisor Note",
      visibility: item.visibility || ((item.type || "").toLowerCase().includes("supervisor journal") ? "supervisor" : "standard")
    }));
  });

  (employee.performance || []).forEach((item, index) => {
    entries.push(normalizeTimelineEntry({
      id: item.id || `performance-${index}`,
      type: "Performance",
      title: item.category || item.type || "Performance Entry",
      note: [item.rating, item.type, item.notes].filter(Boolean).join(" — "),
      date: item.date || item.createdAt || item.updatedAt,
      source: "Performance Entry"
    }));
  });

  (employee.reportReviews || []).forEach((item, index) => {
    const details = [];
    if (item.rating) details.push(`Rating: ${item.rating}`);
    if (item.returnedForCorrection) details.push(`Returned: ${item.returnedForCorrection}`);
    if (Array.isArray(item.issues) && item.issues.length) details.push(`Issues: ${item.issues.join(", ")}`);
    if (item.notes) details.push(item.notes);

    entries.push(normalizeTimelineEntry({
      id: item.id || `report-${index}`,
      type: "Report Review",
      title: item.caseNumber ? `Case ${item.caseNumber}` : (item.reportType || "Report Review"),
      note: details.join(" • "),
      date: item.reviewDate || item.date || item.createdAt || item.updatedAt,
      source: "Report Review"
    }));
  });

  (employee.training || []).forEach((item, index) => {
    const details = [];
    if (item.provider) details.push(`Provider: ${item.provider}`);
    if (item.expiresDate) details.push(`Expires: ${item.expiresDate}`);
    if (item.notes) details.push(item.notes);

    entries.push(normalizeTimelineEntry({
      id: item.id || `training-${index}`,
      type: "Training",
      title: item.name || item.title || "Training Record",
      note: details.join(" • "),
      date: item.completedDate || item.date || item.createdAt || item.updatedAt,
      source: "Training"
    }));
  });

  (employee.evaluations || []).forEach((item, index) => {
    const details = [];
    if (item.status) details.push(`Status: ${item.status}`);
    if (item.periodStart || item.periodEnd) details.push(`Period: ${item.periodStart || ""} to ${item.periodEnd || ""}`);
    if (item.comments) details.push(item.comments);

    entries.push(normalizeTimelineEntry({
      id: item.id || `evaluation-${index}`,
      type: "Evaluation",
      title: item.type || "Evaluation",
      note: details.join(" • "),
      date: item.completedDate || item.dueDate || item.date || item.createdAt || item.updatedAt,
      source: "Evaluation"
    }));
  });

  (employee.schedule || []).forEach((item, index) => {
    const range = [item.startDate, item.endDate && item.endDate !== item.startDate ? item.endDate : ""].filter(Boolean).join(" to ");
    const time = [item.startTime, item.endTime].filter(Boolean).join("–");
    const note = [range, time, item.hours ? `${item.hours} hours` : "", item.notes].filter(Boolean).join(" • ");

    entries.push(normalizeTimelineEntry({
      id: item.id || `schedule-${index}`,
      type: "Schedule",
      title: item.type || "Schedule Entry",
      note,
      date: item.startDate || item.date || item.createdAt || item.updatedAt,
      source: "Schedule"
    }));
  });

  const files = Array.isArray(employee.files) ? employee.files : [];
  files.forEach((item, index) => {
    entries.push(normalizeTimelineEntry({
      id: item.id || `file-${index}`,
      type: "File",
      title: item.title || item.fileName || "Employee File",
      note: [item.category, item.notes].filter(Boolean).join(" • "),
      date: item.date || item.createdAt || item.updatedAt,
      source: "Files"
    }));
  });

  return entries
    .filter(item => item.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function normalizeTimelineEntry(entry) {
  const typeText = String(entry.type || "General Note").toLowerCase();
  const noteText = `${entry.title || ""} ${entry.note || ""}`.toLowerCase();
  let category = "general";

  if (/good job|commendation|compliment|excellent|positive/.test(typeText + " " + noteText)) category = "positive";
  if (/report/.test(typeText)) category = "report";
  if (/training|certification/.test(typeText)) category = "training";
  if (/coaching|counsel|discipline|issue|needs improvement|complaint/.test(typeText + " " + noteText)) category = "coaching";
  if (/evaluation/.test(typeText)) category = "evaluation";
  if (/schedule|leave|pto|vacation|sick/.test(typeText)) category = "schedule";
  if (/file|document|attachment/.test(typeText)) category = "file";
  if (/supervisor journal/.test(typeText) || entry.visibility === "supervisor") category = "journal";

  return {
    ...entry,
    category,
    title: entry.title || entry.type || "Timeline Entry",
    note: entry.note || "",
    searchText: `${entry.type || ""} ${entry.title || ""} ${entry.note || ""} ${entry.source || ""}`.toLowerCase()
  };
}

function renderEmployeeTimeline() {
  const container = document.getElementById("employeeTimelineResults");
  if (!container) return;

  const search = document.getElementById("employeeTimelineSearch")?.value.toLowerCase().trim() || "";
  const entries = (window.currentEmployeeTimelineEntries || []).filter(item => {
    const categoryMatch = employeeTimelineCategory === "all" || item.category === employeeTimelineCategory;
    const searchMatch = !search || item.searchText.includes(search);
    return categoryMatch && searchMatch;
  });

  if (!entries.length) {
    container.innerHTML = `<div class="employee-timeline-empty">No timeline entries match the selected filters.</div>`;
    return;
  }

  const groups = groupTimelineEntriesByMonth(entries);
  container.innerHTML = Object.entries(groups).map(([month, monthEntries]) => `
    <section class="employee-timeline-month-group">
      <div class="employee-timeline-month-label"><span>${escapeTimelineHtml(month)}</span></div>
      ${monthEntries.map(renderEmployeeTimelineEvent).join("")}
    </section>
  `).join("");
}

function renderEmployeeTimelineEvent(item) {
  const date = new Date(item.date);
  const day = Number.isNaN(date.getTime()) ? "--" : String(date.getDate());
  const month = Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString(undefined, { month: "short" });
  const time = Number.isNaN(date.getTime()) ? "" : date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const icon = getTimelineCategoryIcon(item.category);

  return `
    <article class="employee-timeline-event type-${escapeTimelineHtml(item.category)}">
      <div class="employee-timeline-date"><strong>${day}</strong><span>${month}</span></div>
      <div class="employee-timeline-rail"><div class="employee-timeline-icon">${icon}</div></div>
      <div class="employee-timeline-event-card">
        <div class="employee-timeline-event-top">
          <div class="employee-timeline-type">${escapeTimelineHtml(item.type || "Activity")}</div>
          <div class="employee-timeline-time">${escapeTimelineHtml(time)}</div>
        </div>
        <h4>${escapeTimelineHtml(item.title || "Timeline Entry")}</h4>
        ${item.note ? `<p>${escapeTimelineHtml(item.note)}</p>` : ""}
        <div class="employee-timeline-event-footer">
          <span>${item.visibility === "supervisor" ? "Supervisor-only" : escapeTimelineHtml(item.source || "Employee record")}</span>
          <span>${formatTimelineDate(item.date)}</span>
        </div>
      </div>
    </article>
  `;
}

function renderEmployeeTimelineMonthly(entries) {
  const container = document.getElementById("employeeTimelineMonthly");
  if (!container) return;

  const monthMap = {};
  entries.forEach(item => {
    const date = new Date(item.date);
    if (Number.isNaN(date.getTime())) return;
    const key = date.toLocaleDateString(undefined, { year: "numeric", month: "long" });
    if (!monthMap[key]) monthMap[key] = { total: 0, positive: 0, coaching: 0, report: 0, training: 0, evaluation: 0, journal: 0 };
    monthMap[key].total++;
    if (monthMap[key][item.category] !== undefined) monthMap[key][item.category]++;
  });

  const months = Object.entries(monthMap);
  if (!months.length) {
    container.innerHTML = `<div class="employee-timeline-empty">No monthly history is available.</div>`;
    return;
  }

  container.innerHTML = months.map(([month, stats]) => `
    <section class="employee-timeline-month-summary">
      <h3>${escapeTimelineHtml(month)}</h3>
      <div class="employee-timeline-month-grid">
        ${renderMonthlyStat(stats.total, "Total events")}
        ${renderMonthlyStat(stats.positive, "Positive")}
        ${renderMonthlyStat(stats.coaching, "Coaching")}
        ${renderMonthlyStat(stats.report, "Reports")}
        ${renderMonthlyStat(stats.training, "Training")}
        ${renderMonthlyStat(stats.evaluation, "Evaluations")}
        ${renderMonthlyStat(stats.journal, "Journal")}
      </div>
    </section>
  `).join("");
}

function setEmployeeTimelineCategory(category, button) {
  employeeTimelineCategory = category;
  document.querySelectorAll(".employee-timeline-filter").forEach(item => item.classList.remove("active"));
  button?.classList.add("active");
  renderEmployeeTimeline();
}

function setEmployeeTimelineView(view) {
  employeeTimelineView = view;
  const timeline = document.getElementById("employeeTimelineResults");
  const monthly = document.getElementById("employeeTimelineMonthly");
  const timelineButton = document.getElementById("employeeTimelineViewButton");
  const monthlyButton = document.getElementById("employeeTimelineMonthButton");

  const isTimeline = view === "timeline";
  if (timeline) timeline.hidden = !isTimeline;
  if (monthly) monthly.hidden = isTimeline;
  timelineButton?.classList.toggle("active", isTimeline);
  monthlyButton?.classList.toggle("active", !isTimeline);
}

function clearEmployeeTimelineFilters() {
  const search = document.getElementById("employeeTimelineSearch");
  if (search) search.value = "";
  employeeTimelineCategory = "all";
  document.querySelectorAll(".employee-timeline-filter").forEach(button => {
    button.classList.toggle("active", button.dataset.category === "all");
  });
  renderEmployeeTimeline();
}

function openTimelineQuickAdd(type, supervisorOnly = false) {
  showEmployeeTab("notes").then(() => {
    const typeSelect = document.getElementById("activityType");
    const privateCheckbox = document.getElementById("activitySupervisorOnly");
    if (typeSelect) typeSelect.value = type;
    if (privateCheckbox) privateCheckbox.checked = supervisorOnly;
    document.getElementById("activityTitle")?.focus();
  });
}

function getEmployeeTimelineInsights(entries, employee) {
  const positive = entries.filter(item => item.category === "positive");
  const coaching = entries.filter(item => item.category === "coaching");
  const reports = employee.reportReviews || [];
  const training = employee.training || [];
  const evaluations = employee.evaluations || [];

  return {
    lastPositiveText: formatDaysSince(positive[0]?.date),
    lastPositiveDate: positive[0]?.date ? formatTimelineDate(positive[0].date) : "No positive entry",
    lastCoachingText: formatDaysSince(coaching[0]?.date),
    lastCoachingDate: coaching[0]?.date ? formatTimelineDate(coaching[0].date) : "No coaching entry",
    reportReviews: reports.length,
    positiveEntries: positive.length,
    coachingEntries: coaching.length,
    returnedReports: reports.filter(item => item.returnedForCorrection === "Yes").length,
    citizenComplaints: entries.filter(item => /citizen complaint/i.test(item.type || "")).length,
    journalEntries: entries.filter(item => item.category === "journal").length,
    trainingCompleted: training.filter(item => item.completedDate || !item.status || /complete/i.test(item.status)).length,
    trainingPending: training.filter(item => item.status && !/complete/i.test(item.status)).length,
    evaluations: evaluations.length
  };
}

function buildEmployeeNinetyDaySummary(entries) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  const recent = entries.filter(item => new Date(item.date) >= cutoff);
  const count = category => recent.filter(item => item.category === category).length;

  if (!recent.length) return "No timeline activity has been documented during the last 90 days.";

  const parts = [
    `${recent.length} timeline event${recent.length === 1 ? "" : "s"}`,
    `${count("positive")} positive`,
    `${count("coaching")} coaching or follow-up`,
    `${count("report")} report review${count("report") === 1 ? "" : "s"}`,
    `${count("training")} training record${count("training") === 1 ? "" : "s"}`
  ];

  return `During the last 90 days, this employee had ${parts.join(", ")}. Review the detailed entries before using this summary in an evaluation.`;
}

function groupTimelineEntriesByMonth(entries) {
  return entries.reduce((groups, item) => {
    const date = new Date(item.date);
    const key = Number.isNaN(date.getTime())
      ? "Undated"
      : date.toLocaleDateString(undefined, { year: "numeric", month: "long" });
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
    return groups;
  }, {});
}

function renderTimelineInsightCard(label, value, note) {
  return `
    <div class="employee-timeline-insight-card">
      <div class="employee-timeline-insight-label">${escapeTimelineHtml(label)}</div>
      <div class="employee-timeline-insight-value">${escapeTimelineHtml(value)}</div>
      <div class="employee-timeline-insight-note">${escapeTimelineHtml(note)}</div>
    </div>
  `;
}

function renderTimelineFilterButton(category, label, active = false) {
  return `<button class="employee-timeline-filter${active ? " active" : ""}" data-category="${category}" onclick="setEmployeeTimelineCategory('${category}', this)">${label}</button>`;
}

function renderTimelineSnapshotRow(label, value) {
  return `<div class="employee-timeline-snapshot-row"><span>${escapeTimelineHtml(label)}</span><strong>${escapeTimelineHtml(String(value))}</strong></div>`;
}

function renderMonthlyStat(value, label) {
  return `<div class="employee-timeline-month-stat"><strong>${value}</strong><span>${escapeTimelineHtml(label)}</span></div>`;
}

function getTimelineCategoryIcon(category) {
  return {
    positive: "★",
    report: "R",
    training: "T",
    coaching: "!",
    evaluation: "E",
    schedule: "S",
    file: "F",
    journal: "J",
    general: "•"
  }[category] || "•";
}

function getDefaultTimelineTitle(type) {
  const titles = {
    "Good Job": "Positive Performance",
    "Commendation": "Commendation",
    "Supervisor Journal": "Supervisor Observation",
    "Coaching": "Coaching Note",
    "Report Issue": "Report Follow-up",
    "Counseling": "Counseling Note",
    "Discipline": "Disciplinary Entry",
    "Training": "Training Note",
    "Equipment": "Equipment Note",
    "Citizen Compliment": "Citizen Compliment",
    "Citizen Complaint": "Citizen Complaint",
    "General Note": "Supervisor Note"
  };
  return titles[type] || type || "Supervisor Note";
}

function formatDaysSince(value) {
  if (!value) return "None";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  const days = Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
  if (days === 0) return "Today";
  if (days === 1) return "1 day";
  return `${days} days`;
}

function formatTimelineDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No date";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function createTimelineId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `timeline-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeTimelineHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
