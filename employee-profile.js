async function openEmployeeProfile(id) {
  selectedEmployeeId = id;

  const employees = await getAllRecords("employees");
  const employee = employees.find(e => e.id === id);

  if (!employee.equipment) employee.equipment = [];
  if (!employee.training) employee.training = [];
  if (!employee.activity) employee.activity = [];

  await updateRecord("employees", employee);

  document.getElementById("content").innerHTML = `
    <button onclick="loadEmployeesPage()">← Back to Employees</button>

    <section class="card">
      <h2>${employee.rank || ""} ${employee.firstName} ${employee.lastName}</h2>
      <p class="muted">Badge: ${employee.badge || "N/A"} | ${employee.assignment || "No assignment listed"}</p>

      <div class="profile-tabs">
        <button onclick="showEmployeeTab('overview')">Overview</button>
        <button onclick="showEmployeeTab('edit')">Edit Employee</button>
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

  if (tab === "edit") {
    loadEditEmployeeTab(employee);
  }

  if (tab === "timeline") {
    loadTimelineTab(employee);
  }

  if (tab === "notes") {
    loadAddNoteTab();
  }

  if (tab === "equipment") {
    loadEquipmentTab(employee);
  }

  if (tab === "training") {
    loadTrainingTab(employee);
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
