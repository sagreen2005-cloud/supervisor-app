function loadTimelineTab(employee) {
  document.getElementById("employeeTabContent").innerHTML = `
    <section class="card">
      <div class="timeline-header-row">
        <div>
          <h3>Employee Timeline</h3>
          <p class="muted">Add and review supervisory notes in one chronological history.</p>
        </div>
      </div>

      <div class="timeline-note-entry">
        <h4>Add Timeline Entry</h4>

        <div class="form-grid">
          <select id="activityType">
            <option value="Good Job">Good Job</option>
            <option value="Commendation">Commendation</option>
            <option value="Report Issue">Report Issue</option>
            <option value="Counseling">Counseling</option>
            <option value="Discipline">Discipline</option>
            <option value="Training">Training</option>
            <option value="Citizen Compliment">Citizen Compliment</option>
            <option value="Citizen Complaint">Citizen Complaint</option>
            <option value="General Note">General Note</option>
          </select>
        </div>

        <textarea
          id="activityNote"
          placeholder="Document the issue, observation, correction, or positive performance..."
        ></textarea>

        <button type="button" onclick="addEmployeeActivity()">Add Timeline Entry</button>
      </div>

      <div class="timeline-review-tools">
        <div class="form-grid">
          <input id="employeeTimelineSearch" placeholder="Search this employee's timeline..." />

          <select id="employeeTimelineFilter">
            <option value="All">All Types</option>
            <option value="Good Job">Good Job</option>
            <option value="Commendation">Commendation</option>
            <option value="Report Issue">Report Issue</option>
            <option value="Counseling">Counseling</option>
            <option value="Discipline">Discipline</option>
            <option value="Training">Training</option>
            <option value="Performance">Performance</option>
            <option value="Report Review">Report Review</option>
            <option value="Schedule">Schedule</option>
            <option value="Task">Task</option>
            <option value="File">File</option>
            <option value="Citizen Compliment">Citizen Compliment</option>
            <option value="Citizen Complaint">Citizen Complaint</option>
            <option value="General Note">General Note</option>
          </select>
        </div>
      </div>

      <div id="activityTimeline"></div>
    </section>
  `;

  document
    .getElementById("employeeTimelineSearch")
    .addEventListener("input", () => loadEmployeeTimeline(employee));

  document
    .getElementById("employeeTimelineFilter")
    .addEventListener("change", () => loadEmployeeTimeline(employee));

  loadEmployeeTimeline(employee);
}

async function addEmployeeActivity() {
  const typeElement = document.getElementById("activityType");
  const noteElement = document.getElementById("activityNote");

  if (!typeElement || !noteElement) return;

  const note = noteElement.value.trim();

  if (!note) {
    alert("Enter a note first.");
    return;
  }

  const employees = await getAllRecords("employees");
  const employee = employees.find(e => e.id === selectedEmployeeId);

  if (!employee) {
    alert("Employee record not found.");
    return;
  }

  const activity = {
    type: typeElement.value,
    note,
    date: new Date().toISOString()
  };

  if (!employee.activity) employee.activity = [];

  employee.activity.push(activity);
  employee.updatedAt = new Date().toISOString();

  await updateRecord("employees", employee);

  noteElement.value = "";

  if (typeof currentEmployeeProfile !== "undefined") {
    currentEmployeeProfile = employee;
  }

  loadTimelineTab(employee);
}

function loadEmployeeTimeline(employee) {
  const timeline = document.getElementById("activityTimeline");
  if (!timeline) return;

  const search =
    document.getElementById("employeeTimelineSearch")?.value.toLowerCase() || "";

  const filter =
    document.getElementById("employeeTimelineFilter")?.value || "All";

  let activity = employee.activity || [];

  activity = activity
    .filter(item => {
      const type = item.type || "";
      const note = item.note || "";
      const date = item.date || "";

      const matchesSearch =
        `${type} ${note} ${date}`.toLowerCase().includes(search);

      const matchesFilter =
        filter === "All" || type.includes(filter);

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  if (activity.length === 0) {
    timeline.innerHTML =
      `<p class="muted">No timeline entries found.</p>`;
    return;
  }

  timeline.innerHTML = activity
    .map(item => `
      <div class="timeline-item">
        <strong>${escapeTimelineHtml(item.type || "Activity")}</strong>
        <span>
          ${item.date
            ? new Date(item.date).toLocaleString()
            : "No date"}
        </span>
        <p>${escapeTimelineHtml(item.note || "")}</p>
      </div>
    `)
    .join("");
}

function escapeTimelineHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
