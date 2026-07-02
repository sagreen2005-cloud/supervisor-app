const performanceCategories = [
  "Uniform & Equipment",
  "Orientation Skill",
  "Field Performance",
  "Knowledge of Department Policy & Procedure",
  "Self-Initiated Field Activity",
  "Investigative Procedures",
  "Report Writing",
  "Attitude & Relationships",
  "Training",
  "Attendance"
];

async function loadPerformancePage() {
  const employees = await getAllRecords("employees");

  document.getElementById("content").innerHTML = `
    <div class="page-header">
      <div>
        <h2>Performance</h2>
        <p>Document performance observations using the same categories as the uniformed officer evaluation.</p>
      </div>
    </div>

    <section class="card">
      <h3>Add Performance Entry</h3>

      <div class="form-grid">
        <select id="performanceEmployeeId">
          <option value="">Select Employee</option>
          ${employees.map(employee => `
            <option value="${employee.id}">
              ${employee.rank || ""} ${employee.firstName} ${employee.lastName}
            </option>
          `).join("")}
        </select>

        <select id="performanceCategory">
          ${performanceCategories.map(category => `
            <option value="${category}">${category}</option>
          `).join("")}
        </select>

        <select id="performanceRating">
          <option value="3 - Exemplary">3 - Exemplary</option>
          <option value="2 - UPD Standard">2 - UPD Standard</option>
          <option value="1 - Needs Improvement">1 - Needs Improvement</option>
          <option value="N.O. - Not Observed">N.O. - Not Observed</option>
        </select>

        <select id="performanceType">
          <option value="Observation">Observation</option>
          <option value="Good Job">Good Job</option>
          <option value="Commendation">Commendation</option>
          <option value="Coaching">Coaching</option>
          <option value="Concern">Concern</option>
          <option value="Discipline">Discipline</option>
          <option value="Goal">Goal</option>
          <option value="One-on-One">One-on-One</option>
        </select>

        <input id="performanceDate" type="date" />
      </div>

      <textarea id="performanceNotes" placeholder="Document the specific behavior, facts, coaching, goal, or justification..."></textarea>

      <button onclick="addPerformanceEntry()">Save Performance Entry</button>
    </section>

    <section class="card">
      <h3>Performance History</h3>
      <input id="performanceSearchBox" placeholder="Search employee, category, rating, type, or notes..." />
      <div id="performanceList"></div>
    </section>
  `;

  document.getElementById("performanceDate").value = new Date().toISOString().slice(0, 10);
  document.getElementById("performanceSearchBox").addEventListener("input", renderPerformanceEntries);

  await renderPerformanceEntries();
}

async function addPerformanceEntry() {
  const employees = await getAllRecords("employees");
  const employeeId = Number(document.getElementById("performanceEmployeeId").value);
  const employee = employees.find(e => e.id === employeeId);

  if (!employee) {
    alert("Select an employee.");
    return;
  }

  const entry = {
    category: document.getElementById("performanceCategory").value,
    rating: document.getElementById("performanceRating").value,
    type: document.getElementById("performanceType").value,
    date: document.getElementById("performanceDate").value,
    notes: document.getElementById("performanceNotes").value.trim(),
    createdAt: new Date().toISOString()
  };

  if (!entry.notes) {
    alert("Enter performance notes.");
    return;
  }

  if (!employee.performance) employee.performance = [];
  if (!employee.activity) employee.activity = [];

  employee.performance.push(entry);

  employee.activity.push({
    type: "Performance",
    note: `${entry.category} | ${entry.rating} | ${entry.type}: ${entry.notes}`,
    date: new Date().toISOString()
  });

  employee.updatedAt = new Date().toISOString();

  await updateRecord("employees", employee);
  await loadPerformancePage();
}

async function renderPerformanceEntries() {
  const employees = await getAllRecords("employees");
  const search = document.getElementById("performanceSearchBox")?.value.toLowerCase() || "";
  const list = document.getElementById("performanceList");

  let entries = [];

  employees.forEach(employee => {
    const employeeEntries = employee.performance || [];

    employeeEntries.forEach((entry, index) => {
      entries.push({
        ...entry,
        index,
        employeeId: employee.id,
        employeeName: `${employee.rank || ""} ${employee.firstName || ""} ${employee.lastName || ""}`.trim()
      });
    });
  });

  entries = entries
    .filter(entry => {
      const text = `
        ${entry.employeeName}
        ${entry.category}
        ${entry.rating}
        ${entry.type}
        ${entry.notes}
      `.toLowerCase();

      return text.includes(search);
    })
    .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));

  if (entries.length === 0) {
    list.innerHTML = `<p class="muted">No performance entries found.</p>`;
    return;
  }

  list.innerHTML = entries.map(entry => `
    <div class="performance-card">
      <div class="employee-top">
        <div>
          <h3>${entry.employeeName}</h3>
          <p class="muted">${entry.category} | ${entry.date || "No date"}</p>
        </div>
        <button class="danger-btn" onclick="removePerformanceEntry(${entry.employeeId}, ${entry.index})">Remove</button>
      </div>

      <div class="employee-details">
        <div><span>Rating</span>${entry.rating || "N/A"}</div>
        <div><span>Type</span>${entry.type || "N/A"}</div>
        <div><span>Category</span>${entry.category || "N/A"}</div>
      </div>

      <p class="employee-note">${entry.notes || ""}</p>
    </div>
  `).join("");
}

async function removePerformanceEntry(employeeId, entryIndex) {
  if (!confirm("Remove this performance entry?")) return;

  const employees = await getAllRecords("employees");
  const employee = employees.find(e => e.id === employeeId);

  if (!employee || !employee.performance) return;

  const removed = employee.performance[entryIndex];

  employee.performance.splice(entryIndex, 1);

  if (!employee.activity) employee.activity = [];

  employee.activity.push({
    type: "Performance",
    note: `Performance entry removed: ${removed?.category || "Unknown category"}`,
    date: new Date().toISOString()
  });

  employee.updatedAt = new Date().toISOString();

  await updateRecord("employees", employee);
  await renderPerformanceEntries();
}
