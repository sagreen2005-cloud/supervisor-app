function loadSettingsPage() {
  document.getElementById("content").innerHTML = `
    <div class="page-header">
      <div>
        <h2>Settings</h2>
        <p>Backup, restore, and local database management.</p>
      </div>
    </div>

    <section class="card">
      <h3>Export Backup</h3>
      <p class="muted">
        Downloads a local backup file containing your employee records and supervisor notes.
        Store this somewhere approved and secure.
      </p>
      <button onclick="exportBackup()">Export Backup</button>
    </section>

    <section class="card">
      <h3>Import Backup</h3>
      <p class="muted">
        Restores records from a backup file. This will replace the current employee data in this browser.
      </p>

      <input id="backupFile" type="file" accept=".json" />
      <button onclick="importBackup()">Import Backup</button>
    </section>

    <section class="card danger-card">
      <h3>Clear Local Data</h3>
      <p class="muted">
        Deletes all locally saved employee data from this browser. Use only for testing or starting over.
      </p>
      <button class="danger-btn" onclick="clearAllLocalData()">Clear All Local Data</button>
    </section>
  `;
}

async function exportBackup() {
  const employees = await getAllRecords("employees");

  const backup = {
    app: "Supervisor Management System",
    version: 1,
    exportedAt: new Date().toISOString(),
    employees: employees
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  const date = new Date().toISOString().slice(0, 10);

  link.href = url;
  link.download = `supervisor-app-backup-${date}.json`;
  link.click();

  URL.revokeObjectURL(url);
}

async function importBackup() {
  const fileInput = document.getElementById("backupFile");
  const file = fileInput.files[0];

  if (!file) {
    alert("Select a backup file first.");
    return;
  }

  if (!confirm("Importing will replace current employee data in this browser. Continue?")) {
    return;
  }

  const text = await file.text();
  const backup = JSON.parse(text);

  if (!backup.employees || !Array.isArray(backup.employees)) {
    alert("Invalid backup file.");
    return;
  }

  await clearStore("employees");

  for (const employee of backup.employees) {
    await addRecord("employees", employee);
  }

  alert("Backup imported successfully.");
  loadEmployeesPage();
}

async function clearAllLocalData() {
  if (!confirm("This will delete all employee data stored in this browser. Continue?")) {
    return;
  }

  if (!confirm("Final warning. This cannot be undone unless you have a backup.")) {
    return;
  }

  await clearStore("employees");

  alert("All local employee data has been cleared.");
  loadSettingsPage();
}
