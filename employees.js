function loadEmployeesPage() {
  document.getElementById("content").innerHTML = `
    <section class="card">
      <h2>Add Employee</h2>

      <input id="firstName" placeholder="First Name" />
      <input id="lastName" placeholder="Last Name" />
      <input id="badge" placeholder="Badge Number" />
      <input id="phone" placeholder="Phone Number" />
      <input id="email" placeholder="Email" />
      <input id="assignment" placeholder="Assignment / Shift" />

      <button id="saveEmployeeBtn">Save Employee</button>
    </section>

    <section class="card">
      <h2>Employees</h2>
      <input id="searchBox" placeholder="Search employees..." />
      <div id="employeeList"></div>
    </section>
  `;

  document
    .getElementById("saveEmployeeBtn")
    .addEventListener("click", saveEmployee);

  document
    .getElementById("searchBox")
    .addEventListener("input", loadEmployees);

  loadEmployees();
}

async function saveEmployee() {
  const employee = {
    firstName: document.getElementById("firstName").value.trim(),
    lastName: document.getElementById("lastName").value.trim(),
    badge: document.getElementById("badge").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    email: document.getElementById("email").value.trim(),
    assignment: document.getElementById("assignment").value.trim(),
    createdAt: new Date().toISOString()
  };

  if (!employee.firstName || !employee.lastName) {
    alert("First and last name are required.");
    return;
  }

  await addRecord("employees", employee);

  document.getElementById("firstName").value = "";
  document.getElementById("lastName").value = "";
  document.getElementById("badge").value = "";
  document.getElementById("phone").value = "";
  document.getElementById("email").value = "";
  document.getElementById("assignment").value = "";

  await loadEmployees();
}

async function loadEmployees() {
  const employees = await getAllRecords("employees");
  const search = document.getElementById("searchBox").value.toLowerCase();
  const list = document.getElementById("employeeList");

  list.innerHTML = "";

  employees
    .filter(employee => {
      const text = `${employee.firstName} ${employee.lastName} ${employee.badge} ${employee.phone} ${employee.email} ${employee.assignment}`.toLowerCase();
      return text.includes(search);
    })
    .forEach(employee => {
      const div = document.createElement("div");
      div.className = "employee";

      div.innerHTML = `
        <strong>${employee.firstName} ${employee.lastName}</strong><br>
        Badge: ${employee.badge || ""}<br>
        Phone: ${employee.phone || ""}<br>
        Email: ${employee.email || ""}<br>
        Assignment: ${employee.assignment || ""}
      `;

      list.appendChild(div);
    });
}
