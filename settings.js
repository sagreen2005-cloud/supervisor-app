function loadSettingsPage() {
  document.getElementById("content").innerHTML = `
    <div class="page-header">
      <div>
        <h2>Settings</h2>
        <p>Backup, restore, employee exports, and local database management.</p>
      </div>
    </div>

    <section class="card">
      <h3>Export Full Backup</h3>
      <p class="muted">Downloads a full local backup file containing all employee records and notes.</p>
      <button onclick="exportBackup()">Export Full Backup</button>
    </section>

    <section class="card">
      <h3>Import Full Backup</h3>
      <p class="muted">Restores records from a full backup file. This replaces current employee data.</p>
      <input id="backupFile" type="file" accept=".json" />
      <button onclick="importBackup()">Import Full Backup</button>
    </section>

    <section class="card">
      <h3>Employee Export / Transfer</h3>
      <p class="muted">Export one employee as a clean PDF summary or as a JSON file that can be imported later.</p>

      <select id="exportEmployeeSelect"></select>

      <div class="quick-actions">
        <button onclick="exportEmployeePDF()">Export Employee PDF</button>
        <button onclick="exportEmployeeJSON()">Export Employee JSON</button>
      </div>
    </section>

    <section class="card">
      <h3>Import Employee JSON</h3>
      <p class="muted">Use this to bring back a former employee with their notes, files, training, schedule, evaluations, and history.</p>
      <input id="employeeJsonFile" type="file" accept=".json" />
      <button onclick="importEmployeeJSON()">Import Employee JSON</button>
    </section>

    <section class="card danger-card">
      <h3>Clear Local Data</h3>
      <p class="muted">Deletes all locally saved employee data from this browser.</p>
      <button class="danger-btn" onclick="clearAllLocalData()">Clear All Local Data</button>
    </section>
  `;

  loadEmployeeExportDropdown();
}

async function loadEmployeeExportDropdown() {
  const employees = await getAllRecords("employees");
  const select = document.getElementById("exportEmployeeSelect");

  select.innerHTML = `
    <option value="">Select Employee</option>
    ${employees.map(employee => `
      <option value="${employee.id}">
        ${employee.rank || ""} ${employee.firstName || ""} ${employee.lastName || ""}
      </option>
    `).join("")}
  `;
}

async function exportBackup() {
  const employees = await getAllRecords("employees");

  const backup = {
    app: "Supervisor Command Center",
    version: 1,
    exportedAt: new Date().toISOString(),
    employees: employees
  };

  downloadJsonFile(backup, `supervisor-command-center-backup-${getTodayFileDate()}.json`);
}

async function importBackup() {
  const fileInput = document.getElementById("backupFile");
  const file = fileInput.files[0];

  if (!file) {
    alert("Select a backup file first.");
    return;
  }

  if (!confirm("Importing will replace current employee data in this browser. Continue?")) return;

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
  loadSettingsPage();
}

async function exportEmployeeJSON() {
  const employee = await getSelectedExportEmployee();

  if (!employee) return;

  const exportData = {
    app: "Supervisor Command Center",
    exportType: "Single Employee",
    exportedAt: new Date().toISOString(),
    employee: employee
  };

  const fileName = `${safeFileName(employee.lastName)}-${safeFileName(employee.firstName)}-employee-export-${getTodayFileDate()}.json`;

  downloadJsonFile(exportData, fileName);
}

async function importEmployeeJSON() {
  const fileInput = document.getElementById("employeeJsonFile");
  const file = fileInput.files[0];

  if (!file) {
    alert("Select an employee JSON file first.");
    return;
  }

  const text = await file.text();
  const data = JSON.parse(text);

  if (!data.employee) {
    alert("Invalid employee export file.");
    return;
  }

  const employee = data.employee;

  delete employee.id;

  employee.importedAt = new Date().toISOString();
  employee.updatedAt = new Date().toISOString();

  await addRecord("employees", employee);

  alert("Employee imported successfully.");
  loadSettingsPage();
}

async function exportEmployeePDF() {
  const employee = await getSelectedExportEmployee();

  if (!employee) return;

  const html = buildEmployeePDFHtml(employee);

  const printWindow = window.open("", "_blank");

  printWindow.document.write(html);
  printWindow.document.close();

  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
  }, 500);
}

async function getSelectedExportEmployee() {
  const id = Number(document.getElementById("exportEmployeeSelect").value);

  if (!id) {
    alert("Select an employee first.");
    return null;
  }

  const employees = await getAllRecords("employees");
  return employees.find(e => e.id === id);
}

function buildEmployeePDFHtml(employee) {
  const activity = employee.activity || [];
  const performance = employee.performance || [];
  const reportReviews = employee.reportReviews || [];
  const training = employee.training || [];
  const schedule = employee.schedule || [];
  const evaluations = employee.evaluations || [];
  const files = getEmployeeFilesForPDF(employee);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${employee.firstName || ""} ${employee.lastName || ""} Export</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          color: #111827;
          margin: 35px;
          line-height: 1.4;
        }

        h1 {
          margin-bottom: 0;
        }

        h2 {
          border-bottom: 2px solid #111827;
          padding-bottom: 4px;
          margin-top: 28px;
        }

        h3 {
          margin-bottom: 4px;
        }

        .muted {
          color: #555;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          margin-top: 12px;
        }

        .box {
          border: 1px solid #ccc;
          padding: 8px;
          border-radius: 6px;
        }

        .entry {
          border-bottom: 1px solid #ddd;
          padding: 8px 0;
        }

        .small {
          font-size: 12px;
          color: #555;
        }

        @media print {
          button {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <button onclick="window.print()">Print / Save as PDF</button>

      <h1>${employee.rank || ""} ${employee.firstName || ""} ${employee.lastName || ""}</h1>
      <p class="muted">Supervisor Command Center Employee Export</p>
      <p class="small">Exported: ${new Date().toLocaleString()}</p>

      <h2>Employee Information</h2>
      <div class="grid">
        <div class="box"><strong>Badge:</strong><br>${employee.badge || "N/A"}</div>
        <div class="box"><strong>Assignment:</strong><br>${employee.assignment || "N/A"}</div>
        <div class="box"><strong>Phone:</strong><br>${employee.phone || "N/A"}</div>
        <div class="box"><strong>Email:</strong><br>${employee.email || "N/A"}</div>
        <div class="box"><strong>Hire Date:</strong><br>${employee.hireDate || "N/A"}</div>
      </div>

      <h2>General Notes</h2>
      <p>${employee.notes || "No general notes entered."}</p>

      <h2>Performance Entries</h2>
      ${renderPdfEntries(performance.map(item => ({
        title: `${item.category || "Performance"} — ${item.rating || ""}`,
        date: item.date || item.createdAt,
        body: `${item.type || ""}: ${item.notes || ""}`
      })))}

      <h2>Report Reviews</h2>
      ${renderPdfEntries(reportReviews.map(item => ({
        title: `${item.caseNumber || "Case"} — ${item.reportType || ""}`,
        date: item.reviewDate || item.createdAt,
        body: `Rating: ${item.rating || "N/A"} | Returned: ${item.returnedForCorrection || "N/A"}<br>Issues: ${(item.issues || []).join(", ") || "None"}<br>${item.notes || ""}`
      })))}

      <h2>Training / Certifications</h2>
      ${renderPdfEntries(training.map(item => ({
        title: item.name || "Training",
        date: item.completedDate || item.createdAt,
        body: `Provider: ${item.provider || "N/A"} | Expires: ${item.expiresDate || "N/A"}<br>${item.notes || ""}`
      })))}

      <h2>Schedule / Days Off</h2>
      ${renderPdfEntries(schedule.map(item => ({
        title: item.type || "Schedule Entry",
        date: item.startDate || item.createdAt,
        body: `${item.startDate || ""} to ${item.endDate || item.startDate || ""} | Hours: ${item.hours || "N/A"}<br>${item.notes || ""}`
      })))}

      <h2>Evaluations</h2>
      ${renderPdfEntries(evaluations.map(item => ({
        title: `${item.type || "Evaluation"} — ${item.status || ""}`,
        date: item.dueDate || item.createdAt,
        body: `Period: ${item.periodStart || "N/A"} to ${item.periodEnd || "N/A"}<br>Supervisor Goals: ${item.supervisorGoals || "N/A"}<br>Employee Goals: ${item.employeeGoals || "N/A"}<br>Comments: ${item.comments || "N/A"}`
      })))}

      <h2>Files</h2>
      ${renderPdfEntries(files.map(item => ({
        title: `${item.title || "File"} — ${item.category || ""}`,
        date: item.createdAt,
        body: `File Name: ${item.fileName || "N/A"}<br>Notes: ${item.notes || "N/A"}`
      })))}

      <h2>Timeline</h2>
      ${renderPdfEntries(activity
        .slice()
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map(item => ({
          title: item.type || "Activity",
          date: item.date,
          body: item.note || ""
        })))}
    </body>
    </html>
  `;
}

function renderPdfEntries(entries) {
  if (!entries || entries.length === 0) {
    return `<p class="muted">No records.</p>`;
  }

  return entries.map(item => `
    <div class="entry">
      <h3>${item.title}</h3>
      <div class="small">${item.date ? new Date(item.date).toLocaleString() : "No date"}</div>
      <p>${item.body || ""}</p>
    </div>
  `).join("");
}

async function clearAllLocalData() {
  if (!confirm("This will delete all employee data stored in this browser. Continue?")) return;
  if (!confirm("Final warning. This cannot be undone unless you have a backup.")) return;

  await clearStore("employees");

  alert("All local employee data has been cleared.");
  loadSettingsPage();
}

function downloadJsonFile(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

function getTodayFileDate() {
  return new Date().toISOString().slice(0, 10);
}

function safeFileName(value) {
  return (value || "employee")
    .toString()
    .replace(/[^a-z0-9]/gi, "-")
    .toLowerCase();
}

function getEmployeeFilesForPDF(employee) {
  return [];

  /*
    This PDF export lists file metadata only.
    The actual stored file data remains inside the local browser database.
  */
}
