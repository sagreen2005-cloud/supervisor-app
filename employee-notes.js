function loadAddNoteTab() {
  document.getElementById("employeeTabContent").innerHTML = `
    <section class="card">
      <h3>Add Supervisor Note</h3>

      <select id="activityType">
        <option value="Good Job">Good Job</option>
        <option value="Commendation">Commendation</option>
        <option value="Report Issue">Report Issue</option>
        <option value="Counseling">Counseling</option>
        <option value="Discipline">Discipline</option>
        <option value="Training">Training</option>
        <option value="Equipment">Equipment</option>
        <option value="Citizen Compliment">Citizen Compliment</option>
        <option value="Citizen Complaint">Citizen Complaint</option>
        <option value="General Note">General Note</option>
      </select>

      <textarea id="activityNote" placeholder="Document the issue, observation, correction, or positive performance..."></textarea>

      <button onclick="addEmployeeActivity()">Add Note</button>
    </section>
  `;
}

async function addEmployeeActivity() {
  const employees = await getAllRecords("employees");
  const employee = employees.find(e => e.id === selectedEmployeeId);

  const activity = {
    type: document.getElementById("activityType").value,
    note: document.getElementById("activityNote").value.trim(),
    date: new Date().toISOString()
  };

  if (!activity.note) {
    alert("Enter a note first.");
    return;
  }

  if (!employee.activity) employee.activity = [];

  employee.activity.push(activity);
  employee.updatedAt = new Date().toISOString();

  await updateRecord("employees", employee);
  await openEmployeeProfile(employee.id);
  showEmployeeTab("timeline");
}

function loadTimelineTab(employee) {
  document.getElementById("employeeTabContent").innerHTML = `
    <section class="card">
      <h3>Employee Timeline</h3>

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
          <option value="Equipment">Equipment</option>
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

      <div id="activityTimeline"></div>
    </section>
  `;

  document.getElementById("employeeTimelineSearch").addEventListener("input", () => loadEmployeeTimeline(employee));
  document.getElementById("employeeTimelineFilter").addEventListener("change", () => loadEmployeeTimeline(employee));

  loadEmployeeTimeline(employee);
}

function loadEmployeeTimeline(employee) {
  const timeline = document.getElementById("activityTimeline");
  const search = document.getElementById("employeeTimelineSearch")?.value.toLowerCase() || "";
  const filter = document.getElementById("employeeTimelineFilter")?.value || "All";

  let activity = employee.activity || [];

  activity = activity
    .filter(item => {
      const type = item.type || "";
      const note = item.note || "";
      const date = item.date || "";

      const matchesSearch = `${type} ${note} ${date}`.toLowerCase().includes(search);
      const matchesFilter = filter === "All" || type.includes(filter);

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (activity.length === 0) {
    timeline.innerHTML = `<p class="muted">No timeline entries found.</p>`;
    return;
  }

  timeline.innerHTML = activity
    .map(item => `
      <div class="timeline-item">
        <strong>${item.type || "Activity"}</strong>
        <span>${item.date ? new Date(item.date).toLocaleString() : "No date"}</span>
        <p>${item.note || ""}</p>
      </div>
    `)
    .join("");
}
