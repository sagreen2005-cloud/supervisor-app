function loadScheduleTab(employee) {
  if (!employee.schedule) employee.schedule = [];

  document.getElementById("employeeTabContent").innerHTML = `
    <section class="card">
      <h3>Add Schedule / Day-Off Entry</h3>

      <div class="form-grid">
        <select id="scheduleType">
          <option value="Vacation">Vacation</option>
          <option value="Sick Leave">Sick Leave</option>
          <option value="Training">Training</option>
          <option value="Court">Court</option>
          <option value="Comp Time">Comp Time</option>
          <option value="Regular Day Off">Regular Day Off</option>
          <option value="Holiday">Holiday</option>
          <option value="Overtime">Overtime</option>
          <option value="Other">Other</option>
        </select>

        <input id="scheduleStart" type="date" />
        <input id="scheduleEnd" type="date" />
        <input id="scheduleHours" type="number" placeholder="Hours" />
      </div>

      <textarea id="scheduleNotes" placeholder="Notes, approval status, coverage, court case number, training location, etc."></textarea>

      <button onclick="addScheduleItem()">Add Schedule Entry</button>
    </section>

    <section class="card">
      <h3>Schedule / Days Off</h3>
      <div id="scheduleList"></div>
    </section>
  `;

  renderScheduleList(employee.schedule);
}

function renderScheduleList(schedule) {
  const list = document.getElementById("scheduleList");

  if (!schedule || schedule.length === 0) {
    list.innerHTML = `<p class="muted">No schedule entries added yet.</p>`;
    return;
  }

  list.innerHTML = schedule
    .slice()
    .reverse()
    .map((item, reversedIndex) => {
      const index = schedule.length - 1 - reversedIndex;

      return `
        <div class="schedule-card">
          <div class="employee-top">
            <div>
              <h3>${item.type || "Schedule Entry"}</h3>
              <p class="muted">${item.startDate || "N/A"} to ${item.endDate || item.startDate || "N/A"}</p>
            </div>
            <button class="danger-btn" onclick="removeScheduleItem(${index})">Remove</button>
          </div>

          <div class="employee-details">
            <div><span>Start</span>${item.startDate || "N/A"}</div>
            <div><span>End</span>${item.endDate || "N/A"}</div>
            <div><span>Hours</span>${item.hours || "N/A"}</div>
          </div>

          ${item.notes ? `<p class="employee-note">${item.notes}</p>` : ""}
        </div>
      `;
    })
    .join("");
}

async function addScheduleItem() {
  const employees = await getAllRecords("employees");
  const employee = employees.find(e => e.id === selectedEmployeeId);

  if (!employee.schedule) employee.schedule = [];
  if (!employee.activity) employee.activity = [];

  const item = {
    type: document.getElementById("scheduleType").value,
    startDate: document.getElementById("scheduleStart").value,
    endDate: document.getElementById("scheduleEnd").value,
    hours: document.getElementById("scheduleHours").value,
    notes: document.getElementById("scheduleNotes").value.trim(),
    createdAt: new Date().toISOString()
  };

  if (!item.startDate) {
    alert("Start date is required.");
    return;
  }

  employee.schedule.push(item);

  employee.activity.push({
    type: "Schedule",
    note: `${item.type} added: ${item.startDate}${item.endDate ? " to " + item.endDate : ""}`,
    date: new Date().toISOString()
  });

  employee.updatedAt = new Date().toISOString();

  await updateRecord("employees", employee);
  await showEmployeeTab("schedule");
}

async function removeScheduleItem(index) {
  if (!confirm("Remove this schedule entry?")) return;

  const employees = await getAllRecords("employees");
  const employee = employees.find(e => e.id === selectedEmployeeId);

  if (!employee.schedule) employee.schedule = [];
  if (!employee.activity) employee.activity = [];

  const removed = employee.schedule[index];

  employee.schedule.splice(index, 1);

  employee.activity.push({
    type: "Schedule",
    note: `Schedule entry removed: ${removed?.type || "Unknown entry"}`,
    date: new Date().toISOString()
  });

  employee.updatedAt = new Date().toISOString();

  await updateRecord("employees", employee);
  await showEmployeeTab("schedule");
}
