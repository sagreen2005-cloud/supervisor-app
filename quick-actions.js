async function loadQuickNote() {
  const employees = await getAllRecords("employees");

  document.getElementById("content").innerHTML = `
    <div class="page-header">
      <div>
        <h2>Quick Note</h2>
        <p>Add a supervisor note without opening the employee profile first.</p>
      </div>
    </div>

    <section class="card">
      <div class="form-grid">
        <select id="quickNoteEmployeeId">
          <option value="">Select Employee</option>
          ${employees.map(employee => `
            <option value="${employee.id}">
              ${employee.rank || ""} ${employee.firstName} ${employee.lastName}
            </option>
          `).join("")}
        </select>

        <select id="quickNoteType">
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
      </div>

      <textarea id="quickNoteText" placeholder="Enter the supervisor note..."></textarea>

      <button onclick="saveQuickNote()">Save Quick Note</button>
    </section>
  `;
}

async function saveQuickNote() {
  const employeeId = Number(document.getElementById("quickNoteEmployeeId").value);
  const employees = await getAllRecords("employees");
  const employee = employees.find(e => e.id === employeeId);

  if (!employee) {
    alert("Select an employee.");
    return;
  }

  const note = document.getElementById("quickNoteText").value.trim();

  if (!note) {
    alert("Enter a note.");
    return;
  }

  if (!employee.activity) employee.activity = [];

  employee.activity.push({
    type: document.getElementById("quickNoteType").value,
    note: note,
    date: new Date().toISOString()
  });

  employee.updatedAt = new Date().toISOString();

  await updateRecord("employees", employee);
  await loadDashboard();
}

async function loadQuickSchedule() {
  const employees = await getAllRecords("employees");

  document.getElementById("content").innerHTML = `
    <div class="page-header">
      <div>
        <h2>Quick Schedule Entry</h2>
        <p>Add vacation, sick leave, court, training, overtime, or other schedule entries.</p>
      </div>
    </div>

    <section class="card">
      <div class="form-grid">
        <select id="quickScheduleEmployeeId">
          <option value="">Select Employee</option>
          ${employees.map(employee => `
            <option value="${employee.id}">
              ${employee.rank || ""} ${employee.firstName} ${employee.lastName}
            </option>
          `).join("")}
        </select>

        <select id="quickScheduleType">
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

        <input id="quickScheduleStart" type="date" />
        <input id="quickScheduleEnd" type="date" />
        <input id="quickScheduleHours" type="number" placeholder="Hours" />
      </div>

      <textarea id="quickScheduleNotes" placeholder="Notes, coverage, approval, court case number, etc."></textarea>

      <button onclick="saveQuickSchedule()">Save Schedule Entry</button>
    </section>
  `;
}

async function saveQuickSchedule() {
  const employeeId = Number(document.getElementById("quickScheduleEmployeeId").value);
  const employees = await getAllRecords("employees");
  const employee = employees.find(e => e.id === employeeId);

  if (!employee) {
    alert("Select an employee.");
    return;
  }

  const item = {
    type: document.getElementById("quickScheduleType").value,
    startDate: document.getElementById("quickScheduleStart").value,
    endDate: document.getElementById("quickScheduleEnd").value,
    hours: document.getElementById("quickScheduleHours").value,
    notes: document.getElementById("quickScheduleNotes").value.trim(),
    createdAt: new Date().toISOString()
  };

  if (!item.startDate) {
    alert("Start date is required.");
    return;
  }

  if (!employee.schedule) employee.schedule = [];
  if (!employee.activity) employee.activity = [];

  employee.schedule.push(item);

  employee.activity.push({
    type: "Schedule",
    note: `${item.type} added: ${item.startDate}${item.endDate ? " to " + item.endDate : ""}`,
    date: new Date().toISOString()
  });

  employee.updatedAt = new Date().toISOString();

  await updateRecord("employees", employee);
  await loadDashboard();
}

async function loadQuickTraining() {
  const employees = await getAllRecords("employees");

  document.getElementById("content").innerHTML = `
    <div class="page-header">
      <div>
        <h2>Quick Training Entry</h2>
        <p>Add training or certification records without opening the employee profile first.</p>
      </div>
    </div>

    <section class="card">
      <div class="form-grid">
        <select id="quickTrainingEmployeeId">
          <option value="">Select Employee</option>
          ${employees.map(employee => `
            <option value="${employee.id}">
              ${employee.rank || ""} ${employee.firstName} ${employee.lastName}
            </option>
          `).join("")}
        </select>

        <input id="quickTrainingName" placeholder="Training / Certification Name" />
        <input id="quickTrainingProvider" placeholder="Provider / Instructor" />
        <input id="quickTrainingCompleted" type="date" />
        <input id="quickTrainingExpires" type="date" />
      </div>

      <textarea id="quickTrainingNotes" placeholder="Training notes, certificate number, hours, qualification score, etc."></textarea>

      <button onclick="saveQuickTraining()">Save Training</button>
    </section>
  `;
}

async function saveQuickTraining() {
  const employeeId = Number(document.getElementById("quickTrainingEmployeeId").value);
  const employees = await getAllRecords("employees");
  const employee = employees.find(e => e.id === employeeId);

  if (!employee) {
    alert("Select an employee.");
    return;
  }

  const item = {
    name: document.getElementById("quickTrainingName").value.trim(),
    provider: document.getElementById("quickTrainingProvider").value.trim(),
    completedDate: document.getElementById("quickTrainingCompleted").value,
    expiresDate: document.getElementById("quickTrainingExpires").value,
    notes: document.getElementById("quickTrainingNotes").value.trim(),
    createdAt: new Date().toISOString()
  };

  if (!item.name) {
    alert("Training / certification name is required.");
    return;
  }

  if (!employee.training) employee.training = [];
  if (!employee.activity) employee.activity = [];

  employee.training.push(item);

  employee.activity.push({
    type: "Training",
    note: `Training added: ${item.name}${item.expiresDate ? " | Expires: " + item.expiresDate : ""}`,
    date: new Date().toISOString()
  });

  employee.updatedAt = new Date().toISOString();

  await updateRecord("employees", employee);
  await loadDashboard();
}
