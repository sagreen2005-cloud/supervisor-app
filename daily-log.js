async function loadDailyLogPage() {
  const employees = await getAllRecords("employees");

  document.getElementById("content").innerHTML = `
    <div class="page-header">
      <div>
        <h2>Daily Sergeant Log</h2>
        <p>Document roll call, shift priorities, staffing, follow-ups, and supervisor notes.</p>
      </div>
    </div>

    <section class="card">
      <h3>Create Shift Log</h3>

      <div class="form-grid">
        <input id="logDate" type="date" />

        <select id="logShift">
          <option value="Graveyard">Graveyard</option>
          <option value="Day Shift">Day Shift</option>
          <option value="Swing Shift">Swing Shift</option>
          <option value="Special Assignment">Special Assignment</option>
          <option value="Other">Other</option>
        </select>

        <input id="logSupervisor" placeholder="Supervisor" />
      </div>

      <textarea id="logRollCall" placeholder="Roll call notes, assignments, staffing, briefing items..."></textarea>
      <textarea id="logPriorities" placeholder="Supervisor priorities, BOLOs, directed patrol, problem areas..."></textarea>
      <textarea id="logSummary" placeholder="End-of-shift summary..."></textarea>

      <button onclick="saveDailyLog()">Save Shift Log</button>
    </section>

    <section class="card">
      <h3>Add Employee Note From Shift</h3>

      <div class="form-grid">
        <select id="logEmployeeId">
          <option value="">Select Employee</option>
          ${employees.map(employee => `
            <option value="${employee.id}">
              ${employee.rank || ""} ${employee.firstName} ${employee.lastName}
            </option>
          `).join("")}
        </select>

        <select id="logNoteType">
          <option value="Good Job">Good Job</option>
          <option value="Commendation">Commendation</option>
          <option value="Coaching">Coaching</option>
          <option value="Report Issue">Report Issue</option>
          <option value="Counseling">Counseling</option>
          <option value="Discipline">Discipline</option>
          <option value="Citizen Compliment">Citizen Compliment</option>
          <option value="Citizen Complaint">Citizen Complaint</option>
          <option value="General Note">General Note</option>
        </select>
      </div>

      <textarea id="logEmployeeNote" placeholder="Employee-specific note from this shift..."></textarea>

      <button onclick="saveShiftEmployeeNote()">Save Employee Note</button>
    </section>

    <section class="card">
      <h3>Daily Log History</h3>
      <input id="dailyLogSearch" placeholder="Search logs..." />
      <div id="dailyLogList"></div>
    </section>
  `;

  document.getElementById("logDate").value = new Date().toISOString().slice(0, 10);
  document.getElementById("dailyLogSearch").addEventListener("input", renderDailyLogs);

  await renderDailyLogs();
}

async function saveDailyLog() {
  const employees = await getAllRecords("employees");

  const log = {
    id: crypto.randomUUID(),
    date: document.getElementById("logDate").value,
    shift: document.getElementById("logShift").value,
    supervisor: document.getElementById("logSupervisor").value.trim(),
    rollCall: document.getElementById("logRollCall").value.trim(),
    priorities: document.getElementById("logPriorities").value.trim(),
    summary: document.getElementById("logSummary").value.trim(),
    createdAt: new Date().toISOString()
  };

  if (!log.date) {
    alert("Date is required.");
    return;
  }

  const systemEmployee = employees[0];

  if (!systemEmployee) {
    alert("Add at least one employee first.");
    return;
  }

  if (!systemEmployee.dailyLogs) systemEmployee.dailyLogs = [];

  systemEmployee.dailyLogs.push(log);
  systemEmployee.updatedAt = new Date().toISOString();

  await updateRecord("employees", systemEmployee);
  await loadDailyLogPage();
}

async function saveShiftEmployeeNote() {
  const employeeId = Number(document.getElementById("logEmployeeId").value);
  const employees = await getAllRecords("employees");
  const employee = employees.find(e => e.id === employeeId);

  if (!employee) {
    alert("Select an employee.");
    return;
  }

  const note = document.getElementById("logEmployeeNote").value.trim();

  if (!note) {
    alert("Enter an employee note.");
    return;
  }

  if (!employee.activity) employee.activity = [];

  const date = document.getElementById("logDate").value || new Date().toISOString().slice(0, 10);
  const type = document.getElementById("logNoteType").value;

  employee.activity.push({
    type: `Shift Log - ${type}`,
    note: note,
    date: new Date(date).toISOString()
  });

  employee.updatedAt = new Date().toISOString();

  await updateRecord("employees", employee);
  await loadDailyLogPage();
}

async function renderDailyLogs() {
  const employees = await getAllRecords("employees");
  const search = document.getElementById("dailyLogSearch")?.value.toLowerCase() || "";
  const list = document.getElementById("dailyLogList");

  let logs = [];

  employees.forEach(employee => {
    const employeeLogs = employee.dailyLogs || [];
    employeeLogs.forEach((log, index) => {
      logs.push({
        ...log,
        employeeId: employee.id,
        index
      });
    });
  });

  logs = logs
    .filter(log => {
      const text = `
        ${log.date}
        ${log.shift}
        ${log.supervisor}
        ${log.rollCall}
        ${log.priorities}
        ${log.summary}
      `.toLowerCase();

      return text.includes(search);
    })
    .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));

  if (logs.length === 0) {
    list.innerHTML = `<p class="muted">No daily logs found.</p>`;
    return;
  }

  list.innerHTML = logs.map(log => `
    <div class="daily-log-card">
      <div class="employee-top">
        <div>
          <h3>${log.date || "No Date"} — ${log.shift || "Shift Log"}</h3>
          <p class="muted">Supervisor: ${log.supervisor || "N/A"}</p>
        </div>
        <button class="danger-btn" onclick="removeDailyLog(${log.employeeId}, ${log.index})">Remove</button>
      </div>

      ${log.rollCall ? `<p class="employee-note"><strong>Roll Call:</strong><br>${log.rollCall}</p>` : ""}
      ${log.priorities ? `<p class="employee-note"><strong>Priorities:</strong><br>${log.priorities}</p>` : ""}
      ${log.summary ? `<p class="employee-note"><strong>Summary:</strong><br>${log.summary}</p>` : ""}
    </div>
  `).join("");
}

async function removeDailyLog(employeeId, logIndex) {
  if (!confirm("Remove this daily log?")) return;

  const employees = await getAllRecords("employees");
  const employee = employees.find(e => e.id === employeeId);

  if (!employee || !employee.dailyLogs) return;

  employee.dailyLogs.splice(logIndex, 1);
  employee.updatedAt = new Date().toISOString();

  await updateRecord("employees", employee);
  await renderDailyLogs();
}
