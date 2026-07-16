const DEFAULT_DEPARTMENT_BRANDING = {
  profileName: "Primary Department Profile",
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
  accentLineColor: "#111827",
  documentFont: "Arial",
  headerLayout: "three-column",
  watermarkText: "",
  watermarkOpacity: 0.08,
  watermarkRotation: -28,
  showBadge: true,
  showWordmark: true,
  showLeadership: true,
  showPrecinct: true,
  showContactLine: true,
  showWatermark: false,
  useOnRollCall: true,
  useOnEmployeeExport: true,
  useInAppHeader: true,
  badgeImage: "",
  wordmarkImage: "",
  secondaryImage: "",
  designerPositions: {
    left: { x: 3, y: 18, width: 22 },
    center: { x: 26, y: 4, width: 48 },
    right: { x: 75, y: 18, width: 22 }
  }
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
          <h3>Document Designer</h3>
          <p class="muted">Create reusable department profiles and visually arrange the document header.</p>
        </div>
        <div class="quick-actions">
          <button type="button" onclick="previewDepartmentLetterhead()">Full Preview</button>
          <button type="button" onclick="saveDepartmentBrandingProfile()">Save Profile</button>
        </div>
      </div>

      <div class="form-grid">
        <select id="brandingProfileSelect" onchange="loadSelectedBrandingProfile()"></select>
        <input id="brandingProfileName" value="${escapeSettingsHtml(branding.profileName || "Primary Department Profile")}" placeholder="Profile name" />

        <select id="brandingHeaderLayout">
          <option value="three-column" ${branding.headerLayout === "three-column" ? "selected" : ""}>Three Column</option>
          <option value="centered" ${branding.headerLayout === "centered" ? "selected" : ""}>Centered</option>
          <option value="badge-left" ${branding.headerLayout === "badge-left" ? "selected" : ""}>Badge Left</option>
          <option value="custom" ${branding.headerLayout === "custom" ? "selected" : ""}>Custom Drag Layout</option>
        </select>

        <select id="brandingDocumentFont">
          ${["Arial", "Georgia", "Times New Roman", "Verdana"]
            .map(font => `<option value="${font}" ${branding.documentFont === font ? "selected" : ""}>${font}</option>`)
            .join("")}
        </select>
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

      <div class="form-grid">
        <label class="branding-color-field">
          <span>Accent line color</span>
          <input id="brandingAccentLineColor" type="color" value="${escapeSettingsHtml(branding.accentLineColor || "#111827")}" />
        </label>

        <input id="brandingWatermarkText" value="${escapeSettingsHtml(branding.watermarkText || "")}" placeholder="Watermark text, such as CONFIDENTIAL" />

        <label class="branding-range-field">
          <span>Watermark opacity</span>
          <input id="brandingWatermarkOpacity" type="range" min="0.03" max="0.25" step="0.01" value="${branding.watermarkOpacity ?? 0.08}" />
        </label>

        <label class="branding-range-field">
          <span>Watermark rotation</span>
          <input id="brandingWatermarkRotation" type="range" min="-60" max="0" step="1" value="${branding.watermarkRotation ?? -28}" />
        </label>
      </div>

      <div class="document-designer-shell">
        <div class="document-designer-toolbar">
          <strong>Live Header Designer</strong>
          <span class="muted">Drag the left, center, and right blocks. Resize with the width controls below.</span>
        </div>

        <div id="documentDesignerCanvas" class="document-designer-canvas">
          <div id="designerLeftBlock" class="designer-block designer-left" data-block="left">
            <strong>${escapeSettingsHtml(branding.leftName || "Left Name")}</strong>
            <span>${escapeSettingsHtml(branding.leftTitle || "Left Title")}</span>
          </div>

          <div id="designerCenterBlock" class="designer-block designer-center" data-block="center">
            <div class="designer-images">
              ${branding.badgeImage ? `<img src="${branding.badgeImage}" />` : ""}
              ${branding.wordmarkImage ? `<img src="${branding.wordmarkImage}" />` : ""}
            </div>
            <strong>${escapeSettingsHtml(branding.departmentName || "Department Name")}</strong>
            <span>${escapeSettingsHtml(branding.precinctName || branding.departmentSubtitle || "Precinct / Division")}</span>
          </div>

          <div id="designerRightBlock" class="designer-block designer-right" data-block="right">
            <strong>${escapeSettingsHtml(branding.rightName || "Right Name")}</strong>
            <span>${escapeSettingsHtml(branding.rightTitle || "Right Title")}</span>
          </div>
        </div>

        <div class="designer-width-grid">
          <label>Left width
            <input id="designerLeftWidth" type="range" min="12" max="35" value="${branding.designerPositions?.left?.width || 22}" />
          </label>
          <label>Center width
            <input id="designerCenterWidth" type="range" min="30" max="70" value="${branding.designerPositions?.center?.width || 48}" />
          </label>
          <label>Right width
            <input id="designerRightWidth" type="range" min="12" max="35" value="${branding.designerPositions?.right?.width || 22}" />
          </label>
        </div>
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
        ${renderBrandingCheckbox("brandingShowWatermark", "Show document watermark", branding.showWatermark)}
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
  loadBrandingProfileDropdown();
  initializeDocumentDesigner(branding);
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

  if (!Array.isArray(store.departmentBrandingProfiles)) {
    store.departmentBrandingProfiles = [];
  }

  const activeId = store.activeDepartmentBrandingProfileId;
  const existingIndex = store.departmentBrandingProfiles.findIndex(profile => profile.id === activeId);

  const profile = {
    ...branding,
    id: activeId || crypto.randomUUID(),
    updatedAt: new Date().toISOString()
  };

  if (existingIndex >= 0) {
    store.departmentBrandingProfiles[existingIndex] = profile;
  } else {
    store.departmentBrandingProfiles.push(profile);
  }

  store.activeDepartmentBrandingProfileId = profile.id;
  store.departmentBranding = profile;
  store.updatedAt = new Date().toISOString();

  await updateRecord("employees", store);
  applyDepartmentBrandingToApp(profile);

  alert("Department Identity saved.");
}

function collectDepartmentBrandingForm() {
  return {
    profileName: document.getElementById("brandingProfileName").value.trim() || "Department Profile",
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
    accentLineColor: document.getElementById("brandingAccentLineColor").value,
    documentFont: document.getElementById("brandingDocumentFont").value,
    headerLayout: document.getElementById("brandingHeaderLayout").value,
    watermarkText: document.getElementById("brandingWatermarkText").value.trim(),
    watermarkOpacity: Number(document.getElementById("brandingWatermarkOpacity").value),
    watermarkRotation: Number(document.getElementById("brandingWatermarkRotation").value),
    showBadge: document.getElementById("brandingShowBadge").checked,
    showWordmark: document.getElementById("brandingShowWordmark").checked,
    showLeadership: document.getElementById("brandingShowLeadership").checked,
    showPrecinct: document.getElementById("brandingShowPrecinct").checked,
    showContactLine: document.getElementById("brandingShowContactLine").checked,
    showWatermark: document.getElementById("brandingShowWatermark").checked,
    useOnRollCall: document.getElementById("brandingUseOnRollCall").checked,
    useOnEmployeeExport: document.getElementById("brandingUseOnEmployeeExport").checked,
    useInAppHeader: document.getElementById("brandingUseInAppHeader").checked,
    badgeImage: document.getElementById("brandingBadgeImageData").value,
    wordmarkImage: document.getElementById("brandingWordmarkImageData").value,
    secondaryImage: document.getElementById("brandingSecondaryImageData").value,
    designerPositions: getDesignerPositions()
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
  const profiles = Array.isArray(store.departmentBrandingProfiles)
    ? store.departmentBrandingProfiles
    : [];

  const activeId = store.activeDepartmentBrandingProfileId;
  const activeProfile = profiles.find(profile => profile.id === activeId);

  return {
    ...DEFAULT_DEPARTMENT_BRANDING,
    ...(activeProfile || store.departmentBranding || {})
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
  const accentColor = branding.accentLineColor || "#111827";
  const positions = branding.designerPositions || DEFAULT_DEPARTMENT_BRANDING.designerPositions;
  const font = branding.documentFont || "Arial";

  const leftContent = branding.showLeadership
    ? `<strong>${escapeSettingsHtml(branding.leftName || "")}</strong><span>${escapeSettingsHtml(branding.leftTitle || "")}</span>`
    : "";

  const rightContent = branding.showLeadership
    ? `<strong>${escapeSettingsHtml(branding.rightName || "")}</strong><span>${escapeSettingsHtml(branding.rightTitle || "")}</span>`
    : "";

  const centerContent = `
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
  `;

  let mainContent = "";

  if (branding.headerLayout === "custom") {
    mainContent = `
      <div class="department-letterhead-custom">
        <div class="department-letterhead-custom-block" style="left:${positions.left.x}%;top:${positions.left.y}%;width:${positions.left.width}%">${leftContent}</div>
        <div class="department-letterhead-custom-block center" style="left:${positions.center.x}%;top:${positions.center.y}%;width:${positions.center.width}%">${centerContent}</div>
        <div class="department-letterhead-custom-block right" style="left:${positions.right.x}%;top:${positions.right.y}%;width:${positions.right.width}%">${rightContent}</div>
      </div>
    `;
  } else if (branding.headerLayout === "centered") {
    mainContent = `
      <div class="department-letterhead-centered">
        ${centerContent}
        <div class="department-letterhead-leadership-line">
          <div>${leftContent}</div>
          <div>${rightContent}</div>
        </div>
      </div>
    `;
  } else if (branding.headerLayout === "badge-left") {
    mainContent = `
      <div class="department-letterhead-badge-left">
        <div>${branding.badgeImage ? `<img class="department-letterhead-badge" src="${branding.badgeImage}" />` : ""}</div>
        <div class="department-letterhead-center">${centerContent}</div>
        <div class="department-letterhead-side right">${rightContent}</div>
      </div>
    `;
  } else {
    mainContent = `
      <div class="department-letterhead-main">
        <div class="department-letterhead-side left">${leftContent}</div>
        <div class="department-letterhead-center">${centerContent}</div>
        <div class="department-letterhead-side right">${rightContent}</div>
      </div>
    `;
  }

  const contactParts = [
    branding.addressLine1,
    branding.addressLine2,
    branding.phone ? `Phone: ${branding.phone}` : "",
    branding.fax ? `Fax: ${branding.fax}` : "",
    branding.website
  ].filter(Boolean);

  return `
    <div class="department-document-shell" style="font-family:${escapeSettingsHtml(font)}, sans-serif">
      ${
        branding.showWatermark && branding.watermarkText
          ? `<div class="department-document-watermark" style="opacity:${Number(branding.watermarkOpacity || 0.08)};transform:translate(-50%,-50%) rotate(${Number(branding.watermarkRotation || -28)}deg)">${escapeSettingsHtml(branding.watermarkText)}</div>`
          : ""
      }

      <header class="department-letterhead" style="border-bottom-color:${escapeSettingsHtml(accentColor)}">
        ${mainContent}

        ${
          branding.showContactLine && contactParts.length
            ? `<div class="department-letterhead-contact">${contactParts.map(escapeSettingsHtml).join(" &nbsp; ◆ &nbsp; ")}</div>`
            : ""
        }

        ${documentTitle ? `<h1 class="department-document-title">${escapeSettingsHtml(documentTitle)}</h1>` : ""}
      </header>
    </div>
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


async function loadBrandingProfileDropdown() {
  const store = await getSettingsStore();

  if (!Array.isArray(store.departmentBrandingProfiles) || !store.departmentBrandingProfiles.length) {
    const initial = {
      ...DEFAULT_DEPARTMENT_BRANDING,
      ...(store.departmentBranding || {}),
      id: crypto.randomUUID(),
      profileName: store.departmentBranding?.profileName || "Primary Department Profile",
      updatedAt: new Date().toISOString()
    };

    store.departmentBrandingProfiles = [initial];
    store.activeDepartmentBrandingProfileId = initial.id;
    store.departmentBranding = initial;
    await updateRecord("employees", store);
  }

  const select = document.getElementById("brandingProfileSelect");
  if (!select) return;

  select.innerHTML = `
    ${store.departmentBrandingProfiles.map(profile => `
      <option value="${profile.id}" ${profile.id === store.activeDepartmentBrandingProfileId ? "selected" : ""}>
        ${escapeSettingsHtml(profile.profileName || "Department Profile")}
      </option>
    `).join("")}
    <option value="__new__">+ Create New Profile</option>
  `;
}

async function loadSelectedBrandingProfile() {
  const select = document.getElementById("brandingProfileSelect");
  if (!select) return;

  if (select.value === "__new__") {
    const store = await getSettingsStore();
    const profile = {
      ...DEFAULT_DEPARTMENT_BRANDING,
      id: crypto.randomUUID(),
      profileName: "New Department Profile",
      updatedAt: new Date().toISOString()
    };

    if (!Array.isArray(store.departmentBrandingProfiles)) {
      store.departmentBrandingProfiles = [];
    }

    store.departmentBrandingProfiles.push(profile);
    store.activeDepartmentBrandingProfileId = profile.id;
    store.departmentBranding = profile;

    await updateRecord("employees", store);
    loadSettingsPage();
    return;
  }

  const store = await getSettingsStore();
  const profile = (store.departmentBrandingProfiles || []).find(item => item.id === select.value);

  if (!profile) return;

  store.activeDepartmentBrandingProfileId = profile.id;
  store.departmentBranding = profile;
  await updateRecord("employees", store);

  loadSettingsPage();
}

async function saveDepartmentBrandingProfile() {
  await saveDepartmentBranding();
  await loadBrandingProfileDropdown();
}

function initializeDocumentDesigner(branding) {
  const positions = branding.designerPositions || DEFAULT_DEPARTMENT_BRANDING.designerPositions;

  ["left", "center", "right"].forEach(name => {
    const block = document.querySelector(`[data-block="${name}"]`);
    const position = positions[name] || DEFAULT_DEPARTMENT_BRANDING.designerPositions[name];

    if (!block) return;

    block.style.left = `${position.x}%`;
    block.style.top = `${position.y}%`;
    block.style.width = `${position.width}%`;

    makeDesignerBlockDraggable(block);
  });

  const widthMap = {
    designerLeftWidth: "left",
    designerCenterWidth: "center",
    designerRightWidth: "right"
  };

  Object.entries(widthMap).forEach(([inputId, name]) => {
    document.getElementById(inputId)?.addEventListener("input", event => {
      const block = document.querySelector(`[data-block="${name}"]`);
      if (block) block.style.width = `${event.target.value}%`;
    });
  });

  [
    "brandingDepartmentName",
    "brandingPrecinctName",
    "brandingDepartmentSubtitle",
    "brandingLeftName",
    "brandingLeftTitle",
    "brandingRightName",
    "brandingRightTitle"
  ].forEach(id => {
    document.getElementById(id)?.addEventListener("input", updateDesignerText);
  });
}

function updateDesignerText() {
  const left = document.getElementById("designerLeftBlock");
  const center = document.getElementById("designerCenterBlock");
  const right = document.getElementById("designerRightBlock");

  if (left) {
    left.innerHTML = `
      <strong>${escapeSettingsHtml(document.getElementById("brandingLeftName").value || "Left Name")}</strong>
      <span>${escapeSettingsHtml(document.getElementById("brandingLeftTitle").value || "Left Title")}</span>
    `;
  }

  if (center) {
    const badge = document.getElementById("brandingBadgeImageData")?.value || "";
    const wordmark = document.getElementById("brandingWordmarkImageData")?.value || "";

    center.innerHTML = `
      <div class="designer-images">
        ${badge ? `<img src="${badge}" />` : ""}
        ${wordmark ? `<img src="${wordmark}" />` : ""}
      </div>
      <strong>${escapeSettingsHtml(document.getElementById("brandingDepartmentName").value || "Department Name")}</strong>
      <span>${escapeSettingsHtml(
        document.getElementById("brandingPrecinctName").value ||
        document.getElementById("brandingDepartmentSubtitle").value ||
        "Precinct / Division"
      )}</span>
    `;
  }

  if (right) {
    right.innerHTML = `
      <strong>${escapeSettingsHtml(document.getElementById("brandingRightName").value || "Right Name")}</strong>
      <span>${escapeSettingsHtml(document.getElementById("brandingRightTitle").value || "Right Title")}</span>
    `;
  }
}

function makeDesignerBlockDraggable(block) {
  let dragging = false;
  let offsetX = 0;
  let offsetY = 0;

  block.addEventListener("pointerdown", event => {
    dragging = true;
    block.setPointerCapture(event.pointerId);

    const rect = block.getBoundingClientRect();
    offsetX = event.clientX - rect.left;
    offsetY = event.clientY - rect.top;
  });

  block.addEventListener("pointermove", event => {
    if (!dragging) return;

    const canvas = document.getElementById("documentDesignerCanvas");
    const rect = canvas.getBoundingClientRect();

    let x = ((event.clientX - rect.left - offsetX) / rect.width) * 100;
    let y = ((event.clientY - rect.top - offsetY) / rect.height) * 100;

    x = Math.max(0, Math.min(100 - (block.offsetWidth / rect.width) * 100, x));
    y = Math.max(0, Math.min(100 - (block.offsetHeight / rect.height) * 100, y));

    block.style.left = `${x}%`;
    block.style.top = `${y}%`;
  });

  block.addEventListener("pointerup", () => {
    dragging = false;
  });

  block.addEventListener("pointercancel", () => {
    dragging = false;
  });
}

function getDesignerPositions() {
  const canvas = document.getElementById("documentDesignerCanvas");
  if (!canvas) return DEFAULT_DEPARTMENT_BRANDING.designerPositions;

  const canvasRect = canvas.getBoundingClientRect();
  const result = {};

  ["left", "center", "right"].forEach(name => {
    const block = document.querySelector(`[data-block="${name}"]`);
    if (!block) return;

    const rect = block.getBoundingClientRect();

    result[name] = {
      x: Number((((rect.left - canvasRect.left) / canvasRect.width) * 100).toFixed(2)),
      y: Number((((rect.top - canvasRect.top) / canvasRect.height) * 100).toFixed(2)),
      width: Number(((rect.width / canvasRect.width) * 100).toFixed(2))
    };
  });

  return result;
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
    .department-document-shell {
      position: relative;
    }
    .department-document-watermark {
      position: fixed;
      left: 50%;
      top: 50%;
      z-index: 0;
      font-size: 72px;
      font-weight: 800;
      letter-spacing: 8px;
      color: #111827;
      white-space: nowrap;
      pointer-events: none;
    }
    .department-letterhead,
    .department-document-shell > *:not(.department-document-watermark) {
      position: relative;
      z-index: 1;
    }
    .department-letterhead-custom {
      position: relative;
      min-height: 145px;
    }
    .department-letterhead-custom-block {
      position: absolute;
      font-family: Georgia, serif;
      font-size: 12px;
    }
    .department-letterhead-custom-block strong,
    .department-letterhead-custom-block span {
      display: block;
    }
    .department-letterhead-custom-block.center {
      text-align: center;
    }
    .department-letterhead-custom-block.right {
      text-align: right;
    }
    .department-letterhead-centered {
      text-align: center;
    }
    .department-letterhead-leadership-line {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 8px;
      font-family: Georgia, serif;
      font-size: 12px;
      text-align: left;
    }
    .department-letterhead-leadership-line > div:last-child {
      text-align: right;
    }
    .department-letterhead-badge-left {
      display: grid;
      grid-template-columns: 100px 1fr 150px;
      align-items: center;
      gap: 14px;
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
