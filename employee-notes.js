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
      <div id="activityTimeline"></div>
    </section>
  `;

  loadEmployeeTimeline(employee);
}

function loadEmployeeTimeline(employee) {
  const timeline = document.getElementById("activityTimeline");
  const activity = employee.activity || [];

  if (activity.length === 0) {
    timeline.innerHTML = `<p class="muted">No timeline entries yet.</p>`;
    return;
  }

  timeline.innerHTML = activity
    .slice()
    .reverse()
    .map(item => `
      <div class="timeline-item">
        <strong>${item.type}</strong>
        <span>${new Date(item.date).toLocaleString()}</span>
        <p>${item.note}</p>
      </div>
    `)
    .join("");
}
