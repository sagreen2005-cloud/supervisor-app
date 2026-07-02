function loadTrainingTab(employee) {
  if (!employee.training) employee.training = [];

  document.getElementById("employeeTabContent").innerHTML = `
    <section class="card">
      <h3>Add Training / Certification</h3>

      <div class="form-grid">
        <input id="trainingName" placeholder="Training / Certification Name" />
        <input id="trainingProvider" placeholder="Provider / Instructor" />
        <input id="trainingCompleted" type="date" />
        <input id="trainingExpires" type="date" />
      </div>

      <textarea id="trainingNotes" placeholder="Training notes, certificate number, hours, qualification score, etc."></textarea>

      <button onclick="addTrainingItem()">Add Training</button>
    </section>

    <section class="card">
      <h3>Training / Certifications</h3>
      <div id="trainingList"></div>
    </section>
  `;

  renderTrainingList(employee.training);
}

function renderTrainingList(training) {
  const list = document.getElementById("trainingList");

  if (!training || training.length === 0) {
    list.innerHTML = `<p class="muted">No training or certifications added yet.</p>`;
    return;
  }

  list.innerHTML = training
    .map((item, index) => {
      const expired = item.expiresDate && new Date(item.expiresDate) < new Date();

      return `
        <div class="training-card ${expired ? "expired-card" : ""}">
          <div class="employee-top">
            <div>
              <h3>${item.name || "Unnamed Training"}</h3>
              <p class="muted">Provider: ${item.provider || "N/A"}</p>
            </div>
            <button class="danger-btn" onclick="removeTrainingItem(${index})">Remove</button>
          </div>

          <div class="employee-details">
            <div><span>Completed</span>${item.completedDate || "N/A"}</div>
            <div><span>Expires</span>${item.expiresDate || "N/A"}</div>
            <div><span>Status</span>${expired ? "Expired" : "Current / No Expiration"}</div>
          </div>

          ${item.notes ? `<p class="employee-note">${item.notes}</p>` : ""}
        </div>
      `;
    })
    .join("");
}

async function addTrainingItem() {
  const employees = await getAllRecords("employees");
  const employee = employees.find(e => e.id === selectedEmployeeId);

  if (!employee.training) employee.training = [];
  if (!employee.activity) employee.activity = [];

  const item = {
    name: document.getElementById("trainingName").value.trim(),
    provider: document.getElementById("trainingProvider").value.trim(),
    completedDate: document.getElementById("trainingCompleted").value,
    expiresDate: document.getElementById("trainingExpires").value,
    notes: document.getElementById("trainingNotes").value.trim(),
    createdAt: new Date().toISOString()
  };

  if (!item.name) {
    alert("Training / certification name is required.");
    return;
  }

  employee.training.push(item);

  employee.activity.push({
    type: "Training",
    note: `Training added: ${item.name}${item.expiresDate ? " | Expires: " + item.expiresDate : ""}`,
    date: new Date().toISOString()
  });

  employee.updatedAt = new Date().toISOString();

  await updateRecord("employees", employee);
  await showEmployeeTab("training");
}

async function removeTrainingItem(index) {
  if (!confirm("Remove this training / certification?")) return;

  const employees = await getAllRecords("employees");
  const employee = employees.find(e => e.id === selectedEmployeeId);

  if (!employee.training) employee.training = [];
  if (!employee.activity) employee.activity = [];

  const removed = employee.training[index];

  employee.training.splice(index, 1);

  employee.activity.push({
    type: "Training",
    note: `Training removed: ${removed?.name || "Unknown training"}`,
    date: new Date().toISOString()
  });

  employee.updatedAt = new Date().toISOString();

  await updateRecord("employees", employee);
  await showEmployeeTab("training");
}
