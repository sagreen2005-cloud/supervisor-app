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
    equipment: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
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

async function removeEmployee(id) {
  if (!confirm("Delete this employee? This cannot be undone.")) return;

  await deleteRecord("employees", id);
  await loadEmployees();
}
