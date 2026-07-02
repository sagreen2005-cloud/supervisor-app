function loadEquipmentTab(employee) {
  if (!employee.equipment) employee.equipment = [];

  document.getElementById("employeeTabContent").innerHTML = `
    <section class="card">
      <h3>Add Equipment</h3>

      <div class="form-grid">
        <input id="equipmentName" placeholder="Equipment Item / Type" />
        <input id="equipmentSerial" placeholder="Serial Number" />
        <input id="equipmentIssued" type="date" />
        <input id="equipmentDue" type="date" />
      </div>

      <textarea id="equipmentNotes" placeholder="Condition, inspection notes, assigned vehicle, replacement details, etc."></textarea>

      <button onclick="addEquipmentItem()">Add Equipment</button>
    </section>

    <section class="card">
      <h3>Issued Equipment</h3>
      <div id="equipmentList"></div>
    </section>
  `;

  renderEquipmentList(employee.equipment);
}

function renderEquipmentList(equipment) {
  const list = document.getElementById("equipmentList");

  if (!equipment || equipment.length === 0) {
    list.innerHTML = `<p class="muted">No equipment added yet.</p>`;
    return;
  }

  list.innerHTML = equipment
    .map((item, index) => `
      <div class="equipment-card">
        <div class="employee-top">
          <div>
            <h3>${item.name || "Unnamed Equipment"}</h3>
            <p class="muted">Serial: ${item.serial || "N/A"}</p>
          </div>
          <button class="danger-btn" onclick="removeEquipmentItem(${index})">Remove</button>
        </div>

        <div class="employee-details">
          <div><span>Issued</span>${item.issuedDate || "N/A"}</div>
          <div><span>Inspection / Due</span>${item.dueDate || "N/A"}</div>
          <div><span>Added</span>${item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "N/A"}</div>
        </div>

        ${item.notes ? `<p class="employee-note">${item.notes}</p>` : ""}
      </div>
    `)
    .join("");
}

async function addEquipmentItem() {
  const employees = await getAllRecords("employees");
  const employee = employees.find(e => e.id === selectedEmployeeId);

  if (!employee.equipment) employee.equipment = [];
  if (!employee.activity) employee.activity = [];

  const item = {
    name: document.getElementById("equipmentName").value.trim(),
    serial: document.getElementById("equipmentSerial").value.trim(),
    issuedDate: document.getElementById("equipmentIssued").value,
    dueDate: document.getElementById("equipmentDue").value,
    notes: document.getElementById("equipmentNotes").value.trim(),
    createdAt: new Date().toISOString()
  };

  if (!item.name) {
    alert("Equipment item/type is required.");
    return;
  }

  employee.equipment.push(item);

  employee.activity.push({
    type: "Equipment",
    note: `Equipment added: ${item.name}${item.serial ? " | Serial: " + item.serial : ""}`,
    date: new Date().toISOString()
  });

  employee.updatedAt = new Date().toISOString();

  await updateRecord("employees", employee);
  await showEmployeeTab("equipment");
}

async function removeEquipmentItem(index) {
  if (!confirm("Remove this equipment item?")) return;

  const employees = await getAllRecords("employees");
  const employee = employees.find(e => e.id === selectedEmployeeId);

  if (!employee.equipment) employee.equipment = [];
  if (!employee.activity) employee.activity = [];

  const removed = employee.equipment[index];

  employee.equipment.splice(index, 1);

  employee.activity.push({
    type: "Equipment",
    note: `Equipment removed: ${removed?.name || "Unknown item"}`,
    date: new Date().toISOString()
  });

  employee.updatedAt = new Date().toISOString();

  await updateRecord("employees", employee);
  await showEmployeeTab("equipment");
}
