const DEFAULT_APP_APPEARANCE = {
  appName: "Supervisor Command Center",
  departmentName: "Unified Police Department",
  appLogo: "",
  showLogo: true,
  theme: "midnight",
  accent: "blue",
  fontSize: "medium",
  density: "comfortable",
  cardStyle: "rounded",
  sidebarSize: "standard"
};

const APP_THEME_PRESETS = {
  midnight: { label: "Midnight Blue", description: "Current dark night-shift theme.", colors: { bgMain: "#0f172a", bgPanel: "#020617", bgCard: "#111827", bgCardLight: "#1f2937", bgInput: "#0b1220", textMain: "#f9fafb", textMuted: "#9ca3af", border: "#334155" } },
  police: { label: "Police Blue", description: "Dark blue panels with brighter blue surfaces.", colors: { bgMain: "#0b1f33", bgPanel: "#061321", bgCard: "#112a43", bgCardLight: "#173a5d", bgInput: "#0a1a2b", textMain: "#f4f9ff", textMuted: "#a9bfd2", border: "#315776" } },
  slate: { label: "Slate Gray", description: "Neutral gray-blue appearance.", colors: { bgMain: "#17202a", bgPanel: "#0e151d", bgCard: "#202b36", bgCardLight: "#2a3744", bgInput: "#141d26", textMain: "#f5f7fa", textMuted: "#aeb8c3", border: "#465564" } },
  carbon: { label: "Carbon Black", description: "Deep black CAD-style appearance.", colors: { bgMain: "#090b0f", bgPanel: "#030406", bgCard: "#111318", bgCardLight: "#1a1d23", bgInput: "#0b0d11", textMain: "#f7f7f8", textMuted: "#a5a7ad", border: "#343840" } },
  emerald: { label: "Emerald", description: "Dark green-gray panels.", colors: { bgMain: "#0d1f1a", bgPanel: "#06120f", bgCard: "#132b24", bgCardLight: "#1a3a31", bgInput: "#0a1915", textMain: "#f2fbf7", textMuted: "#a5c0b5", border: "#31594a" } },
  light: { label: "Light", description: "Bright daytime appearance.", colors: { bgMain: "#eef3f8", bgPanel: "#ffffff", bgCard: "#ffffff", bgCardLight: "#f5f8fb", bgInput: "#ffffff", textMain: "#17202a", textMuted: "#667482", border: "#cbd5df" } },
  highContrast: { label: "High Contrast", description: "Maximum contrast.", colors: { bgMain: "#000000", bgPanel: "#000000", bgCard: "#080808", bgCardLight: "#111111", bgInput: "#000000", textMain: "#ffffff", textMuted: "#e5e5e5", border: "#ffffff" } }
};

const APP_ACCENT_PRESETS = {
  blue: { label: "Blue", value: "#2563eb", hover: "#1d4ed8" },
  cyan: { label: "Cyan", value: "#0891b2", hover: "#0e7490" },
  green: { label: "Green", value: "#16885c", hover: "#116b49" },
  purple: { label: "Purple", value: "#7c3aed", hover: "#6d28d9" },
  orange: { label: "Orange", value: "#d97706", hover: "#b45309" },
  red: { label: "Red", value: "#dc2626", hover: "#b91c1c" },
  gold: { label: "Gold", value: "#b88900", hover: "#946f00" }
};

async function loadSettingsPage() {
  const appearance = await getAppAppearance();

  document.getElementById("content").innerHTML = `
    <div class="page-header">
      <div>
        <h2>Settings</h2>
        <p>App appearance, backup, exports, and local database management.</p>
      </div>
    </div>

    <section class="card appearance-settings-card">
      <div class="branding-settings-header"><div><h3>App Appearance</h3><p class="muted">Choose the theme, accent color, spacing, and application identity.</p></div></div>

      <div class="appearance-section"><h4>Theme</h4><div class="appearance-theme-grid">
        ${Object.entries(APP_THEME_PRESETS).map(([key, preset]) => `<label class="appearance-theme-option ${appearance.theme === key ? "selected" : ""}"><input type="radio" name="appearanceTheme" value="${key}" ${appearance.theme === key ? "checked" : ""}><span class="appearance-theme-preview theme-preview-${key}"><i></i><i></i><i></i></span><strong>${preset.label}</strong><small>${preset.description}</small></label>`).join("")}
      </div></div>

      <div class="appearance-section"><h4>Accent Color</h4><div class="appearance-accent-grid">
        ${Object.entries(APP_ACCENT_PRESETS).map(([key, preset]) => `<label class="appearance-accent-option ${appearance.accent === key ? "selected" : ""}"><input type="radio" name="appearanceAccent" value="${key}" ${appearance.accent === key ? "checked" : ""}><span style="background:${preset.value}"></span>${preset.label}</label>`).join("")}
      </div></div>

      <div class="appearance-control-grid">
        <label><span>Font Size</span><select id="appearanceFontSize"><option value="small" ${appearance.fontSize === "small" ? "selected" : ""}>Small</option><option value="medium" ${appearance.fontSize === "medium" ? "selected" : ""}>Medium</option><option value="large" ${appearance.fontSize === "large" ? "selected" : ""}>Large</option></select></label>
        <label><span>Screen Density</span><select id="appearanceDensity"><option value="comfortable" ${appearance.density === "comfortable" ? "selected" : ""}>Comfortable</option><option value="compact" ${appearance.density === "compact" ? "selected" : ""}>Compact</option><option value="dense" ${appearance.density === "dense" ? "selected" : ""}>Information Dense</option></select></label>
        <label><span>Card Style</span><select id="appearanceCardStyle"><option value="rounded" ${appearance.cardStyle === "rounded" ? "selected" : ""}>Rounded</option><option value="square" ${appearance.cardStyle === "square" ? "selected" : ""}>Square</option><option value="flat" ${appearance.cardStyle === "flat" ? "selected" : ""}>Flat</option></select></label>
        <label><span>Sidebar Size</span><select id="appearanceSidebarSize"><option value="standard" ${appearance.sidebarSize === "standard" ? "selected" : ""}>Standard</option><option value="compact" ${appearance.sidebarSize === "compact" ? "selected" : ""}>Compact</option></select></label>
      </div>

      <div class="appearance-section"><h4>Application Identity</h4><div class="form-grid"><input id="appearanceAppName" value="${escapeSettingsHtml(appearance.appName)}" placeholder="App name"><input id="appearanceDepartmentName" value="${escapeSettingsHtml(appearance.departmentName)}" placeholder="Department or division"></div>
      <div class="app-logo-settings"><div class="app-logo-preview" id="appLogoPreview">${appearance.appLogo ? `<img src="${appearance.appLogo}" alt="App logo preview">` : `<div class="app-logo-fallback">SCC</div>`}</div><div class="app-logo-controls"><strong>App Logo</strong><p class="muted">PNG, JPG, or WebP. Stored locally.</p><input id="appearanceAppLogo" type="file" accept="image/png,image/jpeg,image/webp"><input id="appearanceAppLogoData" type="hidden" value="${appearance.appLogo ? escapeSettingsHtml(appearance.appLogo) : ""}"><button type="button" class="secondary-btn" onclick="removeAppLogo()">Remove Logo</button></div></div>
      <div class="checkbox-grid"><label><input id="appearanceShowLogo" type="checkbox" ${appearance.showLogo ? "checked" : ""}> Show logo in application header</label></div></div>
      <div class="quick-actions"><button type="button" onclick="saveAppAppearance()">Save Appearance</button><button type="button" class="secondary-btn" onclick="previewAppAppearance()">Preview Changes</button><button type="button" class="secondary-btn" onclick="resetAppAppearance()">Reset Appearance</button></div>
    </section>

    <section class="card">
      <h3>Export Full Backup</h3>
      <p class="muted">Downloads a full local backup containing employee records, Roll Calls, Smart Import rules, and app settings.</p>
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
      <p class="muted">Bring back a former employee with their notes, files, training, schedule, evaluations, and history.</p>
      <input id="employeeJsonFile" type="file" accept=".json" />
      <button onclick="importEmployeeJSON()">Import Employee JSON</button>
    </section>

      <section class="card">
      <div id="securitySettingsMount"></div>
    </section>

    <section class="card danger-card">
      <h3>Clear Local Data</h3>

  loadEmployeeExportDropdown();
  wireAppLogoInput();
  wireAppearanceOptionCards();
  if (typeof renderSecuritySettingsSection === "function") renderSecuritySettingsSection();
}

function wireAppLogoInput() {
  document.getElementById("appearanceAppLogo")?.addEventListener("change", event => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2_500_000) {
      alert("Use an image smaller than 2.5 MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result || "");
      document.getElementById("appearanceAppLogoData").value = value;
      document.getElementById("appLogoPreview").innerHTML =
        `<img src="${value}" alt="App logo preview" />`;
    };
    reader.readAsDataURL(file);
  });
}

function removeAppLogo() {
  const input = document.getElementById("appearanceAppLogo");
  const data = document.getElementById("appearanceAppLogoData");
  const preview = document.getElementById("appLogoPreview");

  if (input) input.value = "";
  if (data) data.value = "";
  if (preview) preview.innerHTML = `<div class="app-logo-fallback">SCC</div>`;
}

async function saveAppAppearance() {
  const appearance = collectAppearanceFormValues();
  const store = await getSettingsStore();
  store.appAppearance = appearance;
  store.updatedAt = new Date().toISOString();
  await updateRecord("employees", store);
  applyAppAppearance(appearance);
  alert("App appearance saved.");
}

function collectAppearanceFormValues() {
  return {
    appName: document.getElementById("appearanceAppName")?.value.trim() || DEFAULT_APP_APPEARANCE.appName,
    departmentName: document.getElementById("appearanceDepartmentName")?.value.trim() || DEFAULT_APP_APPEARANCE.departmentName,
    appLogo: document.getElementById("appearanceAppLogoData")?.value || "",
    showLogo: document.getElementById("appearanceShowLogo")?.checked !== false,
    theme: document.querySelector('input[name="appearanceTheme"]:checked')?.value || DEFAULT_APP_APPEARANCE.theme,
    accent: document.querySelector('input[name="appearanceAccent"]:checked')?.value || DEFAULT_APP_APPEARANCE.accent,
    fontSize: document.getElementById("appearanceFontSize")?.value || DEFAULT_APP_APPEARANCE.fontSize,
    density: document.getElementById("appearanceDensity")?.value || DEFAULT_APP_APPEARANCE.density,
    cardStyle: document.getElementById("appearanceCardStyle")?.value || DEFAULT_APP_APPEARANCE.cardStyle,
    sidebarSize: document.getElementById("appearanceSidebarSize")?.value || DEFAULT_APP_APPEARANCE.sidebarSize,
    updatedAt: new Date().toISOString()
  };
}
function previewAppAppearance() { applyAppAppearance(collectAppearanceFormValues()); }
function wireAppearanceOptionCards() {
  document.querySelectorAll(".appearance-theme-option, .appearance-accent-option").forEach(option => option.addEventListener("click", () => {
    const selector = option.classList.contains("appearance-theme-option") ? ".appearance-theme-option" : ".appearance-accent-option";
    document.querySelectorAll(selector).forEach(item => item.classList.remove("selected"));
    option.classList.add("selected");
  }));
  document.querySelectorAll('input[name="appearanceTheme"], input[name="appearanceAccent"], #appearanceFontSize, #appearanceDensity, #appearanceCardStyle, #appearanceSidebarSize').forEach(control => control.addEventListener("change", previewAppAppearance));
}

async function resetAppAppearance() {
  if (!confirm("Reset the app appearance to defaults?")) return;

  const store = await getSettingsStore();
  store.appAppearance = { ...DEFAULT_APP_APPEARANCE };
  store.updatedAt = new Date().toISOString();
  await updateRecord("employees", store);

  applyAppAppearance(store.appAppearance);
  loadSettingsPage();
}

async function getAppAppearance() {
  const store = await getSettingsStore();
  const legacy = store.departmentBranding || {};

  return {
    ...DEFAULT_APP_APPEARANCE,
    ...(store.appAppearance || {}),
    ...(!store.appAppearance ? {
      departmentName: legacy.departmentName || DEFAULT_APP_APPEARANCE.departmentName,
      appLogo: legacy.badgeImage || legacy.wordmarkImage || "",
      showLogo: legacy.useInAppHeader !== false
    } : {})
  };
}

async function getSettingsStore() {
  const employees = await getAllRecords("employees");
  const store = employees[0];

  if (!store) {
    throw new Error("Add at least one employee before using settings.");
  }

  return store;
}

async function applySavedAppAppearance() {
  try {
    const appearance = await getAppAppearance();
    applyAppAppearance(appearance);
  } catch (error) {
    console.warn("App appearance not applied:", error);
  }
}

// Kept as an alias so existing startup code and older backups remain compatible.
async function applySavedDepartmentBranding() {
  return applySavedAppAppearance();
}

function applyAppAppearance(appearance = {}) {
  const resolved = { ...DEFAULT_APP_APPEARANCE, ...appearance };
  const theme = APP_THEME_PRESETS[resolved.theme] || APP_THEME_PRESETS.midnight;
  const accent = APP_ACCENT_PRESETS[resolved.accent] || APP_ACCENT_PRESETS.blue;
  const root = document.documentElement;
  root.style.setProperty("--bg-main", theme.colors.bgMain);
  root.style.setProperty("--bg-panel", theme.colors.bgPanel);
  root.style.setProperty("--bg-card", theme.colors.bgCard);
  root.style.setProperty("--bg-card-light", theme.colors.bgCardLight);
  root.style.setProperty("--bg-input", theme.colors.bgInput);
  root.style.setProperty("--text-main", theme.colors.textMain);
  root.style.setProperty("--text-muted", theme.colors.textMuted);
  root.style.setProperty("--border", theme.colors.border);
  root.style.setProperty("--accent", accent.value);
  root.style.setProperty("--accent-hover", accent.hover);
  document.body.dataset.theme = resolved.theme;
  document.body.dataset.fontSize = resolved.fontSize;
  document.body.dataset.density = resolved.density;
  document.body.dataset.cardStyle = resolved.cardStyle;
  document.body.dataset.sidebarSize = resolved.sidebarSize;
  const header = document.querySelector(".app-header");
  if (!header) return;
  document.getElementById("departmentAppBrand")?.remove();
  const title = header.querySelector("h1");
  const subtitle = header.querySelector("p");
  if (title) title.textContent = resolved.appName || DEFAULT_APP_APPEARANCE.appName;
  if (subtitle) subtitle.textContent = resolved.departmentName || "Local-only personnel, supervision, and shift management";
  if (!resolved.showLogo || !resolved.appLogo) return;
  const brand = document.createElement("div");
  brand.id = "departmentAppBrand";
  brand.className = "department-app-brand app-logo-only";
  brand.innerHTML = `<img src="${resolved.appLogo}" alt="App logo">`;
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

  const html = buildEmployeePDFHtml(employee);

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

function buildEmployeePDFHtml(employee) {
  const activity = employee.activity || [];
  const performance = employee.performance || [];
  const reportReviews = employee.reportReviews || [];
  const training = employee.training || [];
  const schedule = employee.schedule || [];
  const evaluations = employee.evaluations || [];
  const files = getEmployeeFilesForPDF(employee);

  const letterhead = `
    <header class="plain-document-header">
      <h1>Employee Summary</h1>
      <p>Generated by Supervisor Command Center</p>
    </header>
  `;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${escapeSettingsHtml(employee.firstName || "")} ${escapeSettingsHtml(employee.lastName || "")} Export</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          color: #111827;
          margin: 26px 34px;
          line-height: 1.4;
        }

        .plain-document-header {
          text-align: center;
          border-bottom: 2px solid #111827;
          padding-bottom: 12px;
          margin-bottom: 22px;
        }
        .plain-document-header h1 { margin: 0; }
        .plain-document-header p { margin: 5px 0 0; color: #555; font-size: 12px; }

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
