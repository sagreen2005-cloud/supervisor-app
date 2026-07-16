const DEFAULT_DEPARTMENT_BRANDING = {
  departmentName: "Unified Police Department",
  departmentSubtitle: "Greater Salt Lake",
  precinctName: "",
  leftName: "",
  leftTitle: "Chief of Police",
  rightName: "",
  rightTitle: "Precinct Chief",
  addressLine1: "",
  addressLine2: "",
  phone: "",
  fax: "",
  website: "",
  primaryTitleColor: "#0b1f66",
  showBadge: true,
  showWordmark: true,
  showLeadership: true,
  showPrecinct: true,
  showContactLine: true,
  useOnRollCall: true,
  useOnEmployeeExport: true,
  useInAppHeader: true,
  badgeImage: "",
  wordmarkImage: "",
  secondaryImage: ""
};

async function loadSettingsPage() {
  const branding = await getDepartmentBranding();

  document.getElementById("content").innerHTML = `
    <div class="page-header">
      <div>
        <h2>Settings</h2>
        <p>Department identity, document branding, backup, exports, and local database management.</p>
      </div>
    </div>

    <section class="card">
      <div class="branding-settings-header">
        <div>
          <h3>Department Identity</h3>
          <p class="muted">Controls the app header and all supported document exports.</p>
        </div>
        <button type="button" onclick="previewDepartmentLetterhead()">Preview Letterhead</button>
      </div>

      <div class="form-grid">
        <input id="brandingDepartmentName" value="${escapeSettingsHtml(branding.departmentName)}" placeholder="Department name" />
        <input id="brandingDepartmentSubtitle" value="${escapeSettingsHtml(branding.departmentSubtitle)}" placeholder="Department subtitle" />
        <input id="brandingPrecinctName" value="${escapeSettingsHtml(branding.precinctName)}" placeholder="Precinct / division name" />

        <input id="brandingLeftName" value="${escapeSettingsHtml(branding.leftName)}" placeholder="Left-side name" />
        <input id="brandingLeftTitle" value="${escapeSettingsHtml(branding.leftTitle)}" placeholder="Left-side title" />

        <input id="brandingRightName" value="${escapeSettingsHtml(branding.rightName)}" placeholder="Right-side name" />
        <input id="brandingRightTitle" value="${escapeSettingsHtml(branding.rightTitle)}" placeholder="Right-side title" />

        <input id="brandingAddressLine1" value="${escapeSettingsHtml(branding.addressLine1)}" placeholder="Address line 1" />
        <input id="brandingAddressLine2" value="${escapeSettingsHtml(branding.addressLine2)}" placeholder="City, State ZIP" />

        <input id="brandingPhone" value="${escapeSettingsHtml(branding.phone)}" placeholder="Phone" />
        <input id="brandingFax" value="${escapeSettingsHtml(branding.fax)}" placeholder="Fax" />
        <input id="brandingWebsite" value="${escapeSettingsHtml(branding.website)}" placeholder="Website" />

        <label class="branding-color-field">
          <span>Primary title color</span>
          <input id="brandingPrimaryTitleColor" type="color" value="${escapeSettingsHtml(branding.primaryTitleColor || "#0b1f66")}" />
        </label>
      </div>

      <div class="branding-image-grid">
        ${renderBrandingImageUploader("Badge / Seal", "brandingBadgeImage", branding.badgeImage)}
        ${renderBrandingImageUploader("Department Wordmark", "brandingWordmarkImage", branding.wordmarkImage)}
        ${renderBrandingImageUploader("Secondary Insignia", "brandingSecondaryImage", branding.secondaryImage)}
      </div>

      <div class="checkbox-grid">
        ${renderBrandingCheckbox("brandingShowBadge", "Show badge / seal", branding.showBadge)}
        ${renderBrandingCheckbox("brandingShowWordmark", "Show wordmark", branding.showWordmark)}
        ${renderBrandingCheckbox("brandingShowLeadership", "Show leadership names", branding.showLeadership)}
        ${renderBrandingCheckbox("brandingShowPrecinct", "Show precinct / division", branding.showPrecinct)}
        ${renderBrandingCheckbox("brandingShowContactLine", "Show address and contact line", branding.showContactLine)}
        ${renderBrandingCheckbox("brandingUseOnRollCall", "Use on Roll Call PDFs", branding.useOnRollCall)}
        ${renderBrandingCheckbox("brandingUseOnEmployeeExport", "Use on employee exports", branding.useOnEmployeeExport)}
        ${renderBrandingCheckbox("brandingUseInAppHeader", "Use branding in app header", branding.useInAppHeader)}
      </div>

      <div class="quick-actions">
        <button type="button" onclick="saveDepartmentBranding()">Save Department Identity</button>
        <button type="button" class="secondary-btn" onclick="resetDepartmentBranding()">Reset Fields</button>
      </div>
    </section>

    <section id="brandingPreviewCard" class="card" hidden>
      <div class="branding-settings-header">
        <h3>Letterhead Preview</h3>
        <button type="button" class="text-button" onclick="document.getElementById('brandingPreviewCard').hidden=true">Close</button>
      </div>
      <div id="brandingPreview"></div>
    </section>

    <section class="card">
      <h3>Export Full Backup</h3>
      <p class="muted">Downloads a full local backup containing employee records, Roll Calls, Smart Import rules, and Department Identity settings.</p>
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
      <p class="muted">Export one employee as a branded PDF summary or as a JSON file that can be imported later.</p>

      <select id="exportEmployeeSelect"></select>

      <div class="quick-actions">
        <button onclick="exportEmployeePDF()">Export Employee PDF</button>
        <button onclick="exportEmployeeJSON()">Export Employee JSON</button>
      </div>
    </section>

    <section class="card">
      <h3>Import Employee JSON</h3>
      <p class="muted">Bring back a former employee with their notes, files, training, schedule, evaluations, and history.</p>
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
  wireBrandingImageInputs();
}

function renderBrandingCheckbox(id, label, checked) {
  return `
    <label>
      <input id="${id}" type="checkbox" ${checked ? "checked" : ""} />
      ${escapeSettingsHtml(label)}
    </label>
  `;
}

function renderBrandingImageUploader(label, id, imageData) {
  return `
    <div class="branding-image-card">
      <strong>${escapeSettingsHtml(label)}</strong>
      <div class="branding-image-preview" id="${id}Preview">
        ${
          imageData
            ? `<img src="${imageData}" alt="${escapeSettingsHtml(label)}" />`
            : `<span class="muted">No image selected</span>`
        }
      </div>
      <input id="${id}" type="file" accept="image/png,image/jpeg,image/webp" />
      <button type="button" class="secondary-btn" onclick="clearBrandingImage('${id}')">Remove</button>
      <input id="${id}Data" type="hidden" value="${imageData ? escapeSettingsHtml(imageData) : ""}" />
    </div>
  `;
}

function wireBrandingImageInputs() {
  ["brandingBadgeImage", "brandingWordmarkImage", "brandingSecondaryImage"].forEach(id => {
    document.getElementById(id)?.addEventListener("change", event => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (file.size > 2_500_000) {
        alert("Use an image smaller than 2.5 MB.");
        event.target.value = "";
        return;
      }

      const reader = new FileReader();

      reader.onload = () => {
        document.getElementById(`${id}Data`).value = reader.result;
        document.getElementById(`${id}Preview`).innerHTML =
          `<img src="${reader.result}" alt="Branding image preview" />`;
      };

      reader.readAsDataURL(file);
    });
  });
}

function clearBrandingImage(id) {
  const fileInput = document.getElementById(id);
  const dataInput = document.getElementById(`${id}Data`);
  const preview = document.getElementById(`${id}Preview`);

  if (fileInput) fileInput.value = "";
  if (dataInput) dataInput.value = "";
  if (preview) preview.innerHTML = `<span class="muted">No image selected</span>`;
}

async function saveDepartmentBranding() {
  const branding = collectDepartmentBrandingForm();
  const store = await getSettingsStore();

  store.departmentBranding = branding;
  store.updatedAt = new Date().toISOString();

  await updateRecord("employees", store);
  applyDepartmentBrandingToApp(branding);

  alert("Department Identity saved.");
}

function collectDepartmentBrandingForm() {
  return {
    departmentName: document.getElementById("brandingDepartmentName").value.trim(),
    departmentSubtitle: document.getElementById("brandingDepartmentSubtitle").value.trim(),
    precinctName: document.getElementById("brandingPrecinctName").value.trim(),
    leftName: document.getElementById("brandingLeftName").value.trim(),
    leftTitle: document.getElementById("brandingLeftTitle").value.trim(),
    rightName: document.getElementById("brandingRightName").value.trim(),
    rightTitle: document.getElementById("brandingRightTitle").value.trim(),
    addressLine1: document.getElementById("brandingAddressLine1").value.trim(),
    addressLine2: document.getElementById("brandingAddressLine2").value.trim(),
    phone: document.getElementById("brandingPhone").value.trim(),
    fax: document.getElementById("brandingFax").value.trim(),
    website: document.getElementById("brandingWebsite").value.trim(),
    primaryTitleColor: document.getElementById("brandingPrimaryTitleColor").value,
    showBadge: document.getElementById("brandingShowBadge").checked,
    showWordmark: document.getElementById("brandingShowWordmark").checked,
    showLeadership: document.getElementById("brandingShowLeadership").checked,
    showPrecinct: document.getElementById("brandingShowPrecinct").checked,
    showContactLine: document.getElementById("brandingShowContactLine").checked,
    useOnRollCall: document.getElementById("brandingUseOnRollCall").checked,
    useOnEmployeeExport: document.getElementById("brandingUseOnEmployeeExport").checked,
    useInAppHeader: document.getElementById("brandingUseInAppHeader").checked,
    badgeImage: document.getElementById("brandingBadgeImageData").value,
    wordmarkImage: document.getElementById("brandingWordmarkImageData").value,
    secondaryImage: document.getElementById("brandingSecondaryImageData").value
  };
}

async function previewDepartmentLetterhead() {
  const branding = collectDepartmentBrandingForm();
  const card = document.getElementById("brandingPreviewCard");

  document.getElementById("brandingPreview").innerHTML =
    buildDepartmentLetterheadHtml(branding, { documentTitle: "Document Title Preview" });

  card.hidden = false;
  card.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function resetDepartmentBranding() {
  if (!confirm("Reset the Department Identity fields to defaults?")) return;

  const current = await getDepartmentBranding();
  const reset = {
    ...DEFAULT_DEPARTMENT_BRANDING,
    badgeImage: current.badgeImage || "",
    wordmarkImage: current.wordmarkImage || "",
    secondaryImage: current.secondaryImage || ""
  };

  const store = await getSettingsStore();
  store.departmentBranding = reset;
  store.updatedAt = new Date().toISOString();

  await updateRecord("employees", store);
  loadSettingsPage();
}

async function getDepartmentBranding() {
  const store = await getSettingsStore();
  return {
    ...DEFAULT_DEPARTMENT_BRANDING,
    ...(store.departmentBranding || {})
  };
}

async function getSettingsStore() {
  const employees = await getAllRecords("employees");
  const store = employees[0];

  if (!store) {
    throw new Error("Add at least one employee before using Department Identity settings.");
  }

  return store;
}

function buildDepartmentLetterheadHtml(branding, options = {}) {
  const documentTitle = options.documentTitle || "";
  const titleColor = branding.primaryTitleColor || "#0b1f66";

  const left = branding.showLeadership
    ? `
      <div class="department-letterhead-side left">
        <strong>${escapeSettingsHtml(branding.leftName || "")}</strong>
        <span>${escapeSettingsHtml(branding.leftTitle || "")}</span>
      </div>
    `
    : `<div></div>`;

  const right = branding.showLeadership
    ? `
      <div class="department-letterhead-side right">
        <strong>${escapeSettingsHtml(branding.rightName || "")}</strong>
        <span>${escapeSettingsHtml(branding.rightTitle || "")}</span>
      </div>
    `
    : `<div></div>`;

  const centerImages = `
    <div class="department-letterhead-images">
      ${
        branding.showBadge && branding.badgeImage
          ? `<img class="department-letterhead-badge" src="${branding.badgeImage}" alt="Department badge" />`
          : ""
      }
      ${
        branding.showWordmark && branding.wordmarkImage
          ? `<img class="department-letterhead-wordmark" src="${branding.wordmarkImage}" alt="Department wordmark" />`
          : ""
      }
      ${
        branding.secondaryImage
          ? `<img class="department-letterhead-secondary" src="${branding.secondaryImage}" alt="Secondary insignia" />`
          : ""
      }
    </div>
  `;

  const contactParts = [
    branding.precinctName,
    branding.addressLine1,
    branding.addressLine2,
    branding.phone ? `Phone: ${branding.phone}` : "",
    branding.fax ? `Fax: ${branding.fax}` : "",
    branding.website
  ].filter(Boolean);

  return `
    <header class="department-letterhead">
      <div class="department-letterhead-main">
        ${left}

        <div class="department-letterhead-center">
          ${centerImages}
          ${
            !branding.wordmarkImage
              ? `<div class="department-letterhead-department">${escapeSettingsHtml(branding.departmentName || "")}</div>`
              : ""
          }
          ${
            branding.departmentSubtitle
              ? `<div class="department-letterhead-subtitle">${escapeSettingsHtml(branding.departmentSubtitle)}</div>`
              : ""
          }
          ${
            branding.showPrecinct && branding.precinctName
              ? `<div class="department-letterhead-precinct" style="color:${escapeSettingsHtml(titleColor)}">${escapeSettingsHtml(branding.precinctName)}</div>`
              : ""
          }
        </div>

        ${right}
      </div>

      ${
        branding.showContactLine && contactParts.length
          ? `<div class="department-letterhead-contact">${contactParts.map(escapeSettingsHtml).join(" &nbsp; ◆ &nbsp; ")}</div>`
          : ""
      }

      ${documentTitle ? `<h1 class="department-document-title">${escapeSettingsHtml(documentTitle)}</h1>` : ""}
    </header>
  `;
}

async function applySavedDepartmentBranding() {
  try {
    const branding = await getDepartmentBranding();
    applyDepartmentBrandingToApp(branding);
  } catch (error) {
    console.warn("Department branding not applied:", error);
  }
}

function applyDepartmentBrandingToApp(branding) {
  const header = document.querySelector(".app-header");
  if (!header) return;

  const existing = document.getElementById("departmentAppBrand");
  if (existing) existing.remove();

  if (!branding.useInAppHeader) return;

  const brand = document.createElement("div");
  brand.id = "departmentAppBrand";
  brand.className = "department-app-brand";

  brand.innerHTML = `
    ${
      branding.showBadge && branding.badgeImage
        ? `<img src="${branding.badgeImage}" alt="Department badge" />`
        : ""
    }
    <div>
      <strong>${escapeSettingsHtml(branding.departmentName || "Supervisor Command Center")}</strong>
      <span>${escapeSettingsHtml(branding.precinctName || branding.departmentSubtitle || "")}</span>
    </div>
  `;

  header.insertBefore(brand, header.firstChild);
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
    employees
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
    employee
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

  const branding = await getDepartmentBranding();
  const html = buildEmployeePDFHtml(employee, branding);

  const printWindow = window.open("", "_blank");
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => printWindow.print(), 600);
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

function buildEmployeePDFHtml(employee, branding) {
  const activity = employee.activity || [];
  const performance = employee.performance || [];
  const reportReviews = employee.reportReviews || [];
  const training = employee.training || [];
  const schedule = employee.schedule || [];
  const evaluations = employee.evaluations || [];
  const files = getEmployeeFilesForPDF(employee);

  const letterhead = branding.useOnEmployeeExport
    ? buildDepartmentLetterheadHtml(branding, { documentTitle: "Employee Summary" })
    : `<h1>Employee Summary</h1>`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${escapeSettingsHtml(employee.firstName || "")} ${escapeSettingsHtml(employee.lastName || "")} Export</title>
      <style>
        ${getDepartmentDocumentCss()}

        body {
          font-family: Arial, sans-serif;
          color: #111827;
          margin: 26px 34px;
          line-height: 1.4;
        }

        h2 {
          border-bottom: 2px solid #111827;
          padding-bottom: 4px;
          margin-top: 28px;
        }

        h3 { margin-bottom: 4px; }
        .muted { color: #555; }
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
          break-inside: avoid;
        }
        .small {
          font-size: 12px;
          color: #555;
        }
        @media print {
          button { display: none; }
          body { margin: 0.35in; }
        }
      </style>
    </head>
    <body>
      <button onclick="window.print()">Print / Save as PDF</button>

      ${letterhead}

      <h1>${escapeSettingsHtml(employee.rank || "")} ${escapeSettingsHtml(employee.firstName || "")} ${escapeSettingsHtml(employee.lastName || "")}</h1>
      <p class="small">Exported: ${new Date().toLocaleString()}</p>

      <h2>Employee Information</h2>
      <div class="grid">
        <div class="box"><strong>Badge:</strong><br>${escapeSettingsHtml(employee.badge || "N/A")}</div>
        <div class="box"><strong>Assignment:</strong><br>${escapeSettingsHtml(employee.assignment || "N/A")}</div>
        <div class="box"><strong>Phone:</strong><br>${escapeSettingsHtml(employee.phone || "N/A")}</div>
        <div class="box"><strong>Email:</strong><br>${escapeSettingsHtml(employee.email || "N/A")}</div>
        <div class="box"><strong>Hire Date:</strong><br>${escapeSettingsHtml(employee.hireDate || "N/A")}</div>
      </div>

      <h2>General Notes</h2>
      <p>${escapeSettingsHtml(employee.notes || "No general notes entered.")}</p>

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
        body: `${item.startDate || ""} to ${item.endDate || item.startDate || ""}${item.startTime || item.endTime ? ` | ${item.startTime || ""}-${item.endTime || ""}` : ""} | Hours: ${item.hours || "N/A"}<br>${item.notes || ""}`
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
  if (!entries?.length) return `<p class="muted">No records.</p>`;

  return entries.map(item => `
    <div class="entry">
      <h3>${escapeSettingsHtml(item.title)}</h3>
      <div class="small">${item.date ? new Date(item.date).toLocaleString() : "No date"}</div>
      <p>${sanitizePdfBody(item.body || "")}</p>
    </div>
  `).join("");
}

function sanitizePdfBody(value) {
  return escapeSettingsHtml(value).replaceAll("&lt;br&gt;", "<br>");
}

function getDepartmentDocumentCss() {
  return `
    .department-letterhead {
      border-bottom: 1px solid #111;
      padding-bottom: 8px;
      margin-bottom: 18px;
    }
    .department-letterhead-main {
      display: grid;
      grid-template-columns: minmax(120px, 1fr) minmax(320px, 2.5fr) minmax(120px, 1fr);
      align-items: center;
      gap: 12px;
    }
    .department-letterhead-side {
      font-family: Georgia, serif;
      font-size: 12px;
      line-height: 1.25;
    }
    .department-letterhead-side strong,
    .department-letterhead-side span {
      display: block;
    }
    .department-letterhead-side.right { text-align: right; }
    .department-letterhead-center { text-align: center; }
    .department-letterhead-images {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 10px;
    }
    .department-letterhead-badge { max-height: 88px; max-width: 88px; }
    .department-letterhead-wordmark { max-height: 72px; max-width: 330px; }
    .department-letterhead-secondary { max-height: 70px; max-width: 100px; }
    .department-letterhead-department {
      font-size: 23px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .department-letterhead-subtitle {
      font-size: 11px;
      letter-spacing: 4px;
      text-transform: uppercase;
      margin-top: 3px;
    }
    .department-letterhead-precinct {
      font-family: Georgia, serif;
      font-size: 19px;
      font-weight: 700;
      margin-top: 8px;
    }
    .department-letterhead-contact {
      border-top: 1px solid #333;
      padding-top: 5px;
      margin-top: 8px;
      text-align: center;
      font-family: Georgia, serif;
      font-size: 9px;
    }
    .department-document-title {
      font-size: 22px;
      text-align: center;
      margin: 16px 0 0;
    }
  `;
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

function getEmployeeFilesForPDF() {
  return [];
}

function escapeSettingsHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
