let selectedEmployeeId = null;

async function loadEmployeesPage() {
  document.getElementById("content").innerHTML = `
    <div class="page-header">
      <div>
        <h2>Employees</h2>
        <p>Employee profiles, contact information, assignments, and supervisor documentation.</p>
      </div>
    </div>

    <section class="card">
      <h3>Add Employee</h3>

      <div class="form-grid">
        <input id="firstName" placeholder="First Name" />
        <input id="lastName" placeholder="Last Name" />
        <input id="badge" placeholder="Badge Number" />
        <input id="rank" placeholder="Rank" />
        <input id="phone" placeholder="Phone Number" />
        <input id="email" placeholder="Email" />
        <input id="assignment" placeholder="Assignment / Shift" />
        <input id="hireDate" type="date" />
      </div>

      <textarea id="employeeNotes" placeholder="General notes / quick reference information"></textarea>

      <button id="saveEmployeeBtn">Save Employee</button>
    </section>

    <section class="card">
      <h3>Employee Directory</h3>
      <input id="searchBox" placeholder="Search employees..." />
      <div id="employeeList"></div>
    </section>
  `;

  document.getElementById("saveEmployeeBtn").addEventListener("click", saveEmployee);
  document.getElementById("searchBox").addEventListener("input", loadEmployees);

  await loadEmployees();
}

async function saveEmployee() {
  const employee = {
    firstName: document.getElementById("firstName").value.trim(),
    lastName: document.getElementById("lastName").value.trim(),
    badge: document.getElementById("badge").value.trim(),
    rank: document.getElementById("rank").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    email: document.getElementById("email").value.trim(),
    assignment: document.getElementById("assignment").value.trim(),
    hireDate: document.getElementById("hireDate").value,
    notes: document.getElementById("employeeNotes").value.trim(),
    activity: [],
    createdAt: new Date().toISOString()
  };

  if (!employee.firstName || !employee.lastName) {
    alert("First and last name are required.");
    return;
  }

  await addRecord("employees", employee);
  await loadEmployeesPage();
}

async function loadEmployees() {
  const employees = await getAllRecords("employees");
  const search = document.getElementById("searchBox")?.value.toLowerCase() || "";
  const list = document.getElementById("employeeList");

  if (!list) return;

  list.innerHTML = "";

  const filtered = employees.filter(employee => {
    const text = `${employee.firstName} ${employee.lastName} ${employee.badge} ${employee.rank} ${employee.phone} ${employee.email} ${employee.assignment}`.toLowerCase();
    return text.includes(search);
  });

  if (filtered.length === 0) {
    list.innerHTML = `<p class="muted">No employees found.</p>`;
    return;
  }

  filtered.forEach(employee => {
    const div = document.createElement("div");
    div.className = "employee-card";
    div.onclick = () => openEmployeeProfile(employee.id);

    div.innerHTML = `
      <div class="employee-top">
        <div>
          <h3>${employee.rank || ""} ${employee.firstName} ${employee.lastName}</h3>
          <p class="muted">Badge: ${employee.badge || "N/A"} | Assignment: ${employee.assignment || "N/A"}</p>
        </div>
        <button class="danger-btn" onclick="event.stopPropagation(); removeEmployee(${employee.id})">Delete</button>
      </div>

      <div class="employee-details">
        <div><span>Phone</span>${employee.phone || "N/A"}</div>
        <div><span>Email</span>${employee.email || "N/A"}</div>
        <div><span>Hire Date</span>${employee.hireDate || "N/A"}</div>
      </div>
    `;

    list.appendChild(div);
  });
}

async function openEmployeeProfile(id) {
  selectedEmployeeId = id;

  const employees = await getAllRecords("employees");
  const employee = employees.find(e => e.id === id);

  document.getElementById("content").innerHTML = `
    <button onclick="loadEmployeesPage()">← Back to Employees</button>

    <section class="card">
      <h2>${employee.rank || ""} ${employee.firstName} ${employee.lastName}</h2>
      <p class="muted">Badge: ${employee.badge || "N/A"} | ${employee.assignment || "No assignment listed"}</p>

      <div class="profile-tabs">
        <button onclick="showEmployeeTab('overview')">Overview</button>
        <button onclick="showEmployeeTab('timeline')">Timeline</button>
        <button onclick="showEmployeeTab('notes')">Add Note</button>
        <button onclick="showEmployeeTab('equipment')">Equipment</button>
        <button onclick="showEmployeeTab('training')">Training</button>
        <button onclick="showEmployeeTab('schedule')">Schedule</button>
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

  if (tab === "overview") {
    container.innerHTML = `
      <section class="card">
        <h3>Overview</h3>

        <div class="employee-details">
          <div><span>Phone</span>${employee.phone || "N/A"}</div>
          <div><span>Email</span>${employee.email || "N/A"}</div>
          <div><span>Hire Date</span>${employee.hireDate || "N/A"}</div>
          <div><span>Assignment</span>${employee.assignment || "N/A"}</div>
        </div>

        <p class="employee-note">${employee.notes || "No general notes entered."}</p>
      </section>
    `;
  }

  if (tab === "timeline") {
    container.innerHTML = `
      <section class="card">
        <h3>Employee Timeline</h3>
        <div id="activityTimeline"></div>
      </section>
    `;

    loadEmployeeTimeline(employee);
  }

  if (tab === "notes") {
    container.innerHTML = `
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

  if (tab === "equipment") {
    container.innerHTML = `
      <section class="card">
        <h3>Equipment</h3>
        <p class="muted">Equipment tracking will be added next.</p>
      </section>
    `;
  }

  if (tab === "training") {
    container.innerHTML = `
      <section class="card">
        <h3>Training / Certifications</h3>
        <p class="muted">Training and certification tracking will be added later.</p>
      </section>
    `;
  }

  if (tab === "schedule") {
    container.innerHTML = `
      <section class="card">
        <h3>Schedule / Days Off</h3>
        <p class="muted">Schedule and days-off tracking will be added later.</p>
      </section>
    `;
  }
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

  await updateRecord("employees", employee);
  await openEmployeeProfile(employee.id);
  showEmployeeTab("timeline");
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

async function removeEmployee(id) {
  if (!confirm("Delete this employee? This cannot be undone.")) return;

  await deleteRecord("employees", id);
  await loadEmployees();
}
