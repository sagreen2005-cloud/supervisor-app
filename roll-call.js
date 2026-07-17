let currentRollCallId = null;
let rollCallSearchTimer = null;

const ROLL_CALL_TEMPLATES = {
  "Regular Shift": [
    "Staffing",
    "Officer Safety",
    "Administrative",
    "Training",
    "Community Information",
    "BOLO / Intelligence",
    "Reminders"
  ],
  "Holiday Shift": [
    "Holiday Staffing",
    "Traffic Expectations",
    "Special Events",
    "Officer Safety",
    "Patrol Assignments",
    "Community Events",
    "Administrative"
  ],
  "DUI Shift": [
    "Mission",
    "Assignments",
    "Hot Spots",
    "Recent DUI Intelligence",
    "Officer Safety",
    "Equipment Check",
    "Administrative",
    "Goals"
  ],
  "Major Incident Review": [
    "Incident Summary",
    "Timeline",
    "Resources Used",
    "What Went Well",
    "Needs Improvement",
    "Lessons Learned",
    "Training Opportunities",
    "Follow-up Items"
  ],
  "Weather Incident": [
    "Current Conditions",
    "Road Closures",
    "Traffic Hazards",
    "Power Outages",
    "Officer Safety",
    "Resource Deployment",
    "Special Assignments",
    "Community Messaging"
  ],
  "Special Event": [
    "Event Summary",
    "Staffing",
    "Traffic Plan",
    "Community Concerns",
    "Officer Safety",
    "Special Assignments",
    "Administrative"
  ],
  "Planned Operation": [
    "Mission",
    "Objectives",
    "Assignments",
    "Command Staff",
    "Communications",
    "Safety Plan",
    "Contingencies",
    "After Action"
  ],
  "Staff Meeting": [
    "Announcements",
    "Policy Updates",
    "Training",
    "Upcoming Events",
    "Open Discussion",
    "Action Items"
  ],
  "Training Day": [
    "Training Topic",
    "Objectives",
    "Materials",
    "Attendance",
    "Scenario Notes",
    "Follow-up"
  ],
  "Blank": []

};

const DEFAULT_SMART_IMPORT_RULES = [
  {
    id: "staffing",
    category: "Staffing",
    keywords: [
      "staffing",
      "short staffed",
      "vacation",
      "sick leave",
      "off duty",
      "coverage",
      "manpower",
      "overtime coverage"
    ]
  },
  {
    id: "officer-safety",
    category: "Officer Safety",
    keywords: [
      "officer safety",
      "road closure",
      "construction",
      "hazard",
      "threat",
      "ambush",
      "weapon",
      "unsafe",
      "expect delays"
    ]
  },
  {
    id: "administrative",
    category: "Administrative",
    keywords: [
      "time card",
      "timesheet",
      "pay period",
      "evaluation",
      "submit",
      "form",
      "deadline",
      "due by",
      "rfi",
      "geo",
      "watch command"
    ]
  },
  {
    id: "training",
    category: "Training",
    keywords: [
      "training",
      "class",
      "course",
      "certification",
      "academy",
      "applications close",
      "posting closes",
      "sro",
      "evergreen"
    ]
  },
  {
    id: "policy",
    category: "Policy Updates",
    keywords: [
      "policy",
      "procedure",
      "general order",
      "directive",
      "sop",
      "standard operating procedure"
    ]
  },
  {
    id: "dui",
    category: "DUI Shift",
    keywords: [
      "dui",
      "impaired driver",
      "blitz",
      "saturation",
      "sobriety",
      "alcohol enforcement",
      "drug recognition"
    ]
  },
  {
    id: "events",
    category: "Special Events",
    keywords: [
      "event",
      "parade",
      "festival",
      "concert",
      "pioneer day",
      "holiday",
      "community event"
    ]
  },
  {
    id: "bolo",
    category: "BOLO / Intelligence",
    keywords: [
      "bolo",
      "be on the lookout",
      "suspect",
      "vehicle description",
      "wanted",
      "intelligence",
      "attempt to locate"
    ]
  },
  {
    id: "community",
    category: "Community Information",
    keywords: [
      "community",
      "neighborhood",
      "school",
      "resident",
      "public",
      "outreach"
    ]
  },
  {
    id: "reminders",
    category: "Reminders",
    keywords: [
      "reminder",
      "remember",
      "don't forget",
      "follow up",
      "complete by",
      "due"
    ]
  }
];

async function loadRollCallPage() {
  currentRollCallId = null;

  document.getElementById("content").innerHTML = `
    <div class="page-header">
      <div>
        <h2>Roll Call</h2>
        <p>Create one complete briefing for each date or shift.</p>
      </div>

      <div class="roll-call-editor-actions">
        <button type="button" onclick="showSmartImportRules()">Import Rules</button>
        <button type="button" onclick="showCreateRollCallForm()">+ New Roll Call</button>
      </div>
    </div>

    <section id="createRollCallCard" class="card" hidden>
      <div class="roll-call-header-row">
        <div>
          <h3>Create Roll Call</h3>
          <p class="muted">Choose a date, shift, supervisor, and template.</p>
        </div>
        <button type="button" class="roll-call-icon-button" onclick="closeCreateRollCallForm()">×</button>
      </div>

      <div class="form-grid">
        <input id="newRollCallDate" type="date" />

        <select id="newRollCallShift">
          <option value="Graveyard">Graveyard</option>
          <option value="Day Shift">Day Shift</option>
          <option value="Swing Shift">Swing Shift</option>
          <option value="Special Assignment">Special Assignment</option>
          <option value="Other">Other</option>
        </select>

        <input id="newRollCallSupervisor" placeholder="Supervisor" />

        <select id="newRollCallTemplate">
          ${Object.keys(ROLL_CALL_TEMPLATES).map(name =>
            `<option value="${escapeRollCallHtml(name)}">${escapeRollCallHtml(name)}</option>`
          ).join("")}
        </select>

        <select id="newRollCallStatus">
          <option value="Draft">Draft</option>
          <option value="Final">Final</option>
        </select>
      </div>

      <div class="roll-call-form-actions">
        <button type="button" onclick="createRollCall()">Create Roll Call</button>
        <button type="button" class="secondary-btn" onclick="closeCreateRollCallForm()">Cancel</button>
      </div>
    </section>

    <section class="card">
      <div class="roll-call-header-row">
        <div>
          <h3>Roll Call Library</h3>
          <p class="muted">Search by date, shift, template, supervisor, section, title, or note.</p>
        </div>
      </div>

      <div class="form-grid">
        <input id="rollCallLibrarySearch" placeholder="Search roll calls..." />

        <select id="rollCallLibraryTemplate">
          <option value="All">All Templates</option>
          ${Object.keys(ROLL_CALL_TEMPLATES).map(name =>
            `<option value="${escapeRollCallHtml(name)}">${escapeRollCallHtml(name)}</option>`
          ).join("")}
        </select>

        <select id="rollCallLibraryStatus">
          <option value="All">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Final">Final</option>
        </select>
      </div>

      <div id="rollCallLibrary"></div>
    </section>

    <div id="smartImportRulesModal" class="roll-call-modal" onclick="closeSmartImportRules(event)">
      <div class="roll-call-modal-content" onclick="event.stopPropagation()">
        <div class="roll-call-header-row">
          <div>
            <h3>Smart Import Rules</h3>
            <p class="muted">Add words or phrases that should map to a Roll Call category.</p>
          </div>
          <button type="button" class="roll-call-icon-button" onclick="closeSmartImportRules()">×</button>
        </div>

        <div id="smartImportRulesList"></div>

        <div class="roll-call-form-actions">
          <button type="button" onclick="addSmartImportRule()">+ Add Rule</button>
          <button type="button" onclick="saveSmartImportRules()">Save Rules</button>
          <button type="button" class="secondary-btn" onclick="resetSmartImportRules()">Reset Defaults</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById("newRollCallDate").value = getRollCallLocalDate();

  document.getElementById("rollCallLibrarySearch").addEventListener("input", () => {
    clearTimeout(rollCallSearchTimer);
    rollCallSearchTimer = setTimeout(renderRollCallLibrary, 150);
  });

  document.getElementById("rollCallLibraryTemplate").addEventListener("change", renderRollCallLibrary);
  document.getElementById("rollCallLibraryStatus").addEventListener("change", renderRollCallLibrary);

  await renderRollCallLibrary();
}

function showCreateRollCallForm() {
  const card = document.getElementById("createRollCallCard");
  if (!card) return;

  document.getElementById("newRollCallDate").value = getRollCallLocalDate();
  document.getElementById("newRollCallShift").value = "Graveyard";
  document.getElementById("newRollCallTemplate").value = "Regular Shift";
  document.getElementById("newRollCallStatus").value = "Draft";

  card.hidden = false;
  card.scrollIntoView({ behavior: "smooth", block: "start" });
}

function closeCreateRollCallForm() {
  const card = document.getElementById("createRollCallCard");
  if (card) card.hidden = true;
}

async function createRollCall() {
  const date = document.getElementById("newRollCallDate").value;
  const shift = document.getElementById("newRollCallShift").value;
  const supervisor = document.getElementById("newRollCallSupervisor").value.trim();
  const template = document.getElementById("newRollCallTemplate").value;
  const status = document.getElementById("newRollCallStatus").value;

  if (!date) {
    alert("Select a date.");
    return;
  }

  if (!supervisor) {
    alert("Enter the supervisor.");
    return;
  }

  const store = await getRollCallStore();
  const duplicate = (store.rollCalls || []).find(item =>
    item.date === date && item.shift === shift
  );

  if (duplicate) {
    const openExisting = confirm(
      "A roll call already exists for this date and shift. Open it?"
    );

    if (openExisting) {
      await openRollCallEditor(duplicate.id);
    }

    return;
  }

  const now = new Date().toISOString();

  const rollCall = {
    id: crypto.randomUUID(),
    date,
    shift,
    supervisor,
    template,
    status,
    createdAt: now,
    updatedAt: now,
    sections: (ROLL_CALL_TEMPLATES[template] || []).map(name => ({
      id: crypto.randomUUID(),
      name,
      items: []
    }))
  };

  if (!store.rollCalls) store.rollCalls = [];
  store.rollCalls.push(rollCall);
  store.updatedAt = now;

  await updateRecord("employees", store);
  await openRollCallEditor(rollCall.id);
}

async function renderRollCallLibrary() {
  const library = document.getElementById("rollCallLibrary");
  if (!library) return;

  const store = await getRollCallStore();
  const search = document.getElementById("rollCallLibrarySearch")?.value.trim().toLowerCase() || "";
  const templateFilter = document.getElementById("rollCallLibraryTemplate")?.value || "All";
  const statusFilter = document.getElementById("rollCallLibraryStatus")?.value || "All";

  let rollCalls = (store.rollCalls || []).slice();

  rollCalls = rollCalls.filter(rollCall => {
    const text = [
      rollCall.date,
      rollCall.shift,
      rollCall.supervisor,
      rollCall.template,
      rollCall.status,
      ...(rollCall.sections || []).flatMap(section => [
        section.name,
        ...(section.items || []).flatMap(item => [
          item.title,
          item.note,
          item.priority
        ])
      ])
    ].join(" ").toLowerCase();

    const matchesSearch = text.includes(search);
    const matchesTemplate =
      templateFilter === "All" || rollCall.template === templateFilter;
    const matchesStatus =
      statusFilter === "All" || rollCall.status === statusFilter;

    return matchesSearch && matchesTemplate && matchesStatus;
  });

  rollCalls.sort((a, b) => {
    const dateCompare = String(b.date || "").localeCompare(String(a.date || ""));
    if (dateCompare !== 0) return dateCompare;
    return String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""));
  });

  if (!rollCalls.length) {
    library.innerHTML = `<p class="muted roll-call-empty">No roll calls found.</p>`;
    return;
  }

  library.innerHTML = `
    <div class="roll-call-library-grid">
      ${rollCalls.map(rollCall => {
        const topicCount = (rollCall.sections || [])
          .reduce((total, section) => total + (section.items || []).length, 0);

        return `
          <button type="button" class="roll-call-library-card" onclick="openRollCallEditor('${rollCall.id}')">
            <div class="roll-call-library-card-top">
              <span class="roll-call-status ${String(rollCall.status || "Draft").toLowerCase()}">
                ${escapeRollCallHtml(rollCall.status || "Draft")}
              </span>
              <span>${escapeRollCallHtml(rollCall.template || "Blank")}</span>
            </div>

            <h3>${escapeRollCallHtml(formatRollCallDisplayDate(rollCall.date))}</h3>
            <p>${escapeRollCallHtml(rollCall.shift || "Shift")}</p>
            <p class="muted">Supervisor: ${escapeRollCallHtml(rollCall.supervisor || "N/A")}</p>
            <p class="muted">${topicCount} topic${topicCount === 1 ? "" : "s"}</p>
          </button>
        `;
      }).join("")}
    </div>
  `;
}

async function openRollCallEditor(rollCallId) {
  const store = await getRollCallStore();
  const rollCall = (store.rollCalls || []).find(item => item.id === rollCallId);

  if (!rollCall) {
    alert("Roll call not found.");
    return;
  }

  currentRollCallId = rollCallId;

  document.getElementById("content").innerHTML = `
    <button type="button" onclick="loadRollCallPage()">← Back to Roll Call Library</button>

    <section class="card">
      <div class="roll-call-editor-heading">
        <div>
          <h2>${escapeRollCallHtml(formatRollCallDisplayDate(rollCall.date))}</h2>
          <p class="muted">
            ${escapeRollCallHtml(rollCall.shift || "Shift")}
            · ${escapeRollCallHtml(rollCall.template || "Blank")}
            · Supervisor: ${escapeRollCallHtml(rollCall.supervisor || "N/A")}
          </p>
        </div>

        <div class="roll-call-editor-actions">
          <button type="button" onclick="showSmartEmailImport()">Smart Email Import</button>
          <button type="button" onclick="showSmartImportRules()">Import Rules</button>
          <button type="button" onclick="downloadRollCallPdf('${rollCall.id}')">Download PDF</button>
          <button type="button" onclick="copyRollCallText('${rollCall.id}')">Copy Text</button>
          <button type="button" onclick="showCarryForwardDialog('${rollCall.id}')">Carry Forward</button>
          <button type="button" class="danger-btn" onclick="deleteRollCall('${rollCall.id}')">Delete</button>
        </div>
      </div>

      <div class="form-grid">
        <input id="editRollCallDate" type="date" value="${escapeRollCallHtml(rollCall.date || "")}" />

        <select id="editRollCallShift">
          ${["Graveyard", "Day Shift", "Swing Shift", "Special Assignment", "Other"]
            .map(value => `<option value="${value}" ${rollCall.shift === value ? "selected" : ""}>${value}</option>`)
            .join("")}
        </select>

        <input id="editRollCallSupervisor" value="${escapeRollCallHtml(rollCall.supervisor || "")}" />

        <select id="editRollCallStatus">
          <option value="Draft" ${rollCall.status === "Draft" ? "selected" : ""}>Draft</option>
          <option value="Final" ${rollCall.status === "Final" ? "selected" : ""}>Final</option>
        </select>
      </div>

      <button type="button" onclick="saveRollCallHeader()">Save Roll Call Details</button>
    </section>

    <section class="card">
      <div class="roll-call-header-row">
        <div>
          <h3>Briefing Sections</h3>
          <p class="muted">Add topics to the appropriate section.</p>
        </div>

        <button type="button" onclick="addRollCallSection()">+ Add Section</button>
      </div>

      <div id="rollCallSections">
        ${renderRollCallSections(rollCall)}
      </div>
    </section>

    <div id="rollCallModal" class="roll-call-modal" onclick="closeRollCallModal(event)">
      <div class="roll-call-modal-content" onclick="event.stopPropagation()">
        <div class="roll-call-header-row">
          <div>
            <h3 id="rollCallModalTitle">Add Topic</h3>
            <p id="rollCallModalSubtitle" class="muted"></p>
          </div>
          <button type="button" class="roll-call-icon-button" onclick="closeRollCallModal()">×</button>
        </div>

        <input id="rollCallModalSectionId" type="hidden" />
        <input id="rollCallModalItemId" type="hidden" />

        <div class="form-grid">
          <input id="rollCallItemTitle" placeholder="Topic title" />

          <select id="rollCallItemPriority">
            <option value="Normal">Normal</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>

          <label class="roll-call-checkbox">
            <input id="rollCallItemCarryForward" type="checkbox" />
            <span>Eligible to carry forward</span>
          </label>
        </div>

        <textarea id="rollCallItemNote" placeholder="Briefing note..."></textarea>

        <div class="roll-call-form-actions">
          <button type="button" onclick="saveRollCallTopic()">Save Topic</button>
          <button type="button" class="secondary-btn" onclick="closeRollCallModal()">Cancel</button>
        </div>
      </div>
    </div>

    <div id="smartEmailImportModal" class="roll-call-modal" onclick="closeSmartEmailImport(event)">
      <div class="roll-call-modal-content" onclick="event.stopPropagation()">
        <div class="roll-call-header-row">
          <div>
            <h3>Smart Email Import</h3>
            <p class="muted">Paste an email and review suggested Roll Call topics before adding them.</p>
          </div>
          <button type="button" class="roll-call-icon-button" onclick="closeSmartEmailImport()">×</button>
        </div>

        <div class="form-grid">
          <input id="smartEmailSource" placeholder="Source, such as Command Email or Training Unit" />
          <input id="smartEmailSourceDate" type="date" />
        </div>

        <textarea
          id="smartEmailText"
          class="smart-email-source"
          placeholder="Paste the full email text here..."
        ></textarea>

        <div class="roll-call-form-actions">
          <button type="button" onclick="analyzeSmartEmail()">Analyze Email</button>
          <button type="button" class="secondary-btn" onclick="closeSmartEmailImport()">Cancel</button>
        </div>

        <div id="smartEmailSuggestions"></div>
      </div>
    </div>

    <div id="smartImportRulesModal" class="roll-call-modal" onclick="closeSmartImportRules(event)">
      <div class="roll-call-modal-content" onclick="event.stopPropagation()">
        <div class="roll-call-header-row">
          <div>
            <h3>Smart Import Rules</h3>
            <p class="muted">Add words or phrases that should map to a Roll Call category.</p>
          </div>
          <button type="button" class="roll-call-icon-button" onclick="closeSmartImportRules()">×</button>
        </div>

        <div id="smartImportRulesList"></div>

        <div class="roll-call-form-actions">
          <button type="button" onclick="addSmartImportRule()">+ Add Rule</button>
          <button type="button" onclick="saveSmartImportRules()">Save Rules</button>
          <button type="button" class="secondary-btn" onclick="resetSmartImportRules()">Reset Defaults</button>
        </div>
      </div>
    </div>

    <div id="carryForwardModal" class="roll-call-modal" onclick="closeCarryForwardDialog(event)">
      <div class="roll-call-modal-content" onclick="event.stopPropagation()">
        <div class="roll-call-header-row">
          <div>
            <h3>Carry Forward</h3>
            <p class="muted">Create a new roll call and copy selected topics.</p>
          </div>
          <button type="button" class="roll-call-icon-button" onclick="closeCarryForwardDialog()">×</button>
        </div>

        <div class="form-grid">
          <input id="carryForwardDate" type="date" />
          <select id="carryForwardShift">
            <option value="Graveyard">Graveyard</option>
            <option value="Day Shift">Day Shift</option>
            <option value="Swing Shift">Swing Shift</option>
            <option value="Special Assignment">Special Assignment</option>
            <option value="Other">Other</option>
          </select>
          <input id="carryForwardSupervisor" placeholder="Supervisor" />
        </div>

        <div id="carryForwardItems"></div>

        <button type="button" onclick="createCarryForwardRollCall()">Create Roll Call</button>
      </div>
    </div>
  `;
}

function renderRollCallSections(rollCall) {
  if (!(rollCall.sections || []).length) {
    return `<p class="muted">No sections yet. Add a section to begin.</p>`;
  }

  return rollCall.sections.map(section => `
    <section class="roll-call-section-card">
      <div class="roll-call-section-heading">
        <div>
          <h3>${escapeRollCallHtml(section.name)}</h3>
          <p class="muted">${(section.items || []).length} topic${(section.items || []).length === 1 ? "" : "s"}</p>
        </div>

        <div class="roll-call-section-actions">
          <button type="button" onclick="openRollCallTopicModal('${section.id}')">+ Add Topic</button>
          <button type="button" class="danger-btn" onclick="removeRollCallSection('${section.id}')">Remove Section</button>
        </div>
      </div>

      <div class="roll-call-topic-list">
        ${
          !(section.items || []).length
            ? `<p class="muted">No topics in this section.</p>`
            : section.items.map(item => `
              <article class="roll-call-topic-card priority-${String(item.priority || "Normal").toLowerCase()}">
                <div class="roll-call-topic-heading">
                  <div>
                    <strong>${escapeRollCallHtml(item.title || "Untitled")}</strong>
                    <span>${escapeRollCallHtml(item.priority || "Normal")}</span>
                  </div>

                  <div class="roll-call-topic-actions">
                    <button type="button" onclick="openRollCallTopicModal('${section.id}', '${item.id}')">Edit</button>
                    <button type="button" class="danger-btn" onclick="removeRollCallTopic('${section.id}', '${item.id}')">Remove</button>
                  </div>
                </div>

                <p>${escapeRollCallHtml(item.note || "")}</p>

                <div class="roll-call-topic-meta">
                  ${
                    item.carryForward
                      ? `<small class="muted">Carry-forward eligible</small>`
                      : ""
                  }
                  ${
                    item.visibleUntil
                      ? `<small class="muted">Visible until: ${escapeRollCallHtml(item.visibleUntil)}</small>`
                      : ""
                  }
                  ${
                    item.source
                      ? `<small class="muted">Source: ${escapeRollCallHtml(item.source)}</small>`
                      : ""
                  }
                </div>
              </article>
            `).join("")
        }
      </div>
    </section>
  `).join("");
}

async function saveRollCallHeader() {
  const store = await getRollCallStore();
  const rollCall = findRollCall(store, currentRollCallId);
  if (!rollCall) return;

  rollCall.date = document.getElementById("editRollCallDate").value;
  rollCall.shift = document.getElementById("editRollCallShift").value;
  rollCall.supervisor = document.getElementById("editRollCallSupervisor").value.trim();
  rollCall.status = document.getElementById("editRollCallStatus").value;
  rollCall.updatedAt = new Date().toISOString();

  if (!rollCall.date || !rollCall.supervisor) {
    alert("Date and supervisor are required.");
    return;
  }

  await updateRecord("employees", store);
  await openRollCallEditor(rollCall.id);
}

async function addRollCallSection() {
  const name = prompt("Section name:");
  if (!name?.trim()) return;

  const store = await getRollCallStore();
  const rollCall = findRollCall(store, currentRollCallId);
  if (!rollCall) return;

  if (!rollCall.sections) rollCall.sections = [];

  rollCall.sections.push({
    id: crypto.randomUUID(),
    name: name.trim(),
    items: []
  });

  rollCall.updatedAt = new Date().toISOString();
  await updateRecord("employees", store);
  await openRollCallEditor(rollCall.id);
}

async function removeRollCallSection(sectionId) {
  if (!confirm("Remove this section and all topics inside it?")) return;

  const store = await getRollCallStore();
  const rollCall = findRollCall(store, currentRollCallId);
  if (!rollCall) return;

  rollCall.sections = (rollCall.sections || []).filter(section => section.id !== sectionId);
  rollCall.updatedAt = new Date().toISOString();

  await updateRecord("employees", store);
  await openRollCallEditor(rollCall.id);
}

async function openRollCallTopicModal(sectionId, itemId = "") {
  const store = await getRollCallStore();
  const rollCall = findRollCall(store, currentRollCallId);
  const section = (rollCall?.sections || []).find(item => item.id === sectionId);

  if (!section) return;

  const item = itemId
    ? (section.items || []).find(entry => entry.id === itemId)
    : null;

  document.getElementById("rollCallModalTitle").textContent =
    item ? "Edit Topic" : "Add Topic";

  document.getElementById("rollCallModalSubtitle").textContent = section.name;
  document.getElementById("rollCallModalSectionId").value = sectionId;
  document.getElementById("rollCallModalItemId").value = itemId;
  document.getElementById("rollCallItemTitle").value = item?.title || "";
  document.getElementById("rollCallItemPriority").value = item?.priority || "Normal";
  document.getElementById("rollCallItemCarryForward").checked = Boolean(item?.carryForward);
  document.getElementById("rollCallItemNote").value = item?.note || "";

  document.getElementById("rollCallModal").classList.add("open");
}

function closeRollCallModal(event) {
  if (event && event.target !== event.currentTarget) return;
  document.getElementById("rollCallModal")?.classList.remove("open");
}

async function saveRollCallTopic() {
  const sectionId = document.getElementById("rollCallModalSectionId").value;
  const itemId = document.getElementById("rollCallModalItemId").value;
  const title = document.getElementById("rollCallItemTitle").value.trim();
  const note = document.getElementById("rollCallItemNote").value.trim();

  if (!title || !note) {
    alert("Enter a title and note.");
    return;
  }

  const store = await getRollCallStore();
  const rollCall = findRollCall(store, currentRollCallId);
  const section = (rollCall?.sections || []).find(item => item.id === sectionId);

  if (!section) return;
  if (!section.items) section.items = [];

  const existingItem = itemId
    ? section.items.find(item => item.id === itemId)
    : null;

  const topic = {
    id: itemId || crypto.randomUUID(),
    title,
    note,
    priority: document.getElementById("rollCallItemPriority").value,
    carryForward: document.getElementById("rollCallItemCarryForward").checked,
    visibleUntil: existingItem?.visibleUntil || "",
    source: existingItem?.source || "",
    sourceDate: existingItem?.sourceDate || "",
    originalText: existingItem?.originalText || "",
    updatedAt: new Date().toISOString()
  };

  if (itemId) {
    const index = section.items.findIndex(item => item.id === itemId);
    if (index !== -1) section.items[index] = topic;
  } else {
    section.items.push(topic);
  }

  rollCall.updatedAt = new Date().toISOString();

  await updateRecord("employees", store);
  closeRollCallModal();
  await openRollCallEditor(rollCall.id);
}

async function removeRollCallTopic(sectionId, itemId) {
  if (!confirm("Remove this topic?")) return;

  const store = await getRollCallStore();
  const rollCall = findRollCall(store, currentRollCallId);
  const section = (rollCall?.sections || []).find(item => item.id === sectionId);

  if (!section) return;

  section.items = (section.items || []).filter(item => item.id !== itemId);
  rollCall.updatedAt = new Date().toISOString();

  await updateRecord("employees", store);
  await openRollCallEditor(rollCall.id);
}

async function deleteRollCall(rollCallId) {
  if (!confirm("Delete this entire roll call?")) return;

  const store = await getRollCallStore();
  store.rollCalls = (store.rollCalls || []).filter(item => item.id !== rollCallId);
  store.updatedAt = new Date().toISOString();

  await updateRecord("employees", store);
  await loadRollCallPage();
}

async function showCarryForwardDialog(rollCallId) {
  const store = await getRollCallStore();
  const rollCall = findRollCall(store, rollCallId);
  if (!rollCall) return;

  const eligible = [];

  (rollCall.sections || []).forEach(section => {
    (section.items || []).forEach(item => {
      if (
        item.carryForward &&
        (!item.visibleUntil || item.visibleUntil >= getRollCallLocalDate())
      ) {
        eligible.push({
          sectionId: section.id,
          sectionName: section.name,
          item
        });
      }
    });
  });

  document.getElementById("carryForwardDate").value = getTomorrowLocalDate();
  document.getElementById("carryForwardShift").value = rollCall.shift || "Graveyard";
  document.getElementById("carryForwardSupervisor").value = rollCall.supervisor || "";

  document.getElementById("carryForwardItems").innerHTML = eligible.length
    ? `
      <div class="carry-forward-list">
        ${eligible.map((entry, index) => `
          <label class="carry-forward-item">
            <input
              type="checkbox"
              class="carry-forward-checkbox"
              data-section-name="${escapeRollCallHtml(entry.sectionName)}"
              data-item-index="${index}"
              checked
            />
            <span>
              <strong>${escapeRollCallHtml(entry.item.title)}</strong>
              <small>${escapeRollCallHtml(entry.sectionName)}</small>
            </span>
          </label>
        `).join("")}
      </div>
    `
    : `<p class="muted">No topics are marked carry-forward eligible.</p>`;

  window.rollCallCarryForwardSource = {
    rollCallId,
    eligible
  };

  document.getElementById("carryForwardModal").classList.add("open");
}

function closeCarryForwardDialog(event) {
  if (event && event.target !== event.currentTarget) return;
  document.getElementById("carryForwardModal")?.classList.remove("open");
}

async function createCarryForwardRollCall() {
  const source = window.rollCallCarryForwardSource;
  if (!source) return;

  const date = document.getElementById("carryForwardDate").value;
  const shift = document.getElementById("carryForwardShift").value;
  const supervisor = document.getElementById("carryForwardSupervisor").value.trim();

  if (!date || !supervisor) {
    alert("Date and supervisor are required.");
    return;
  }

  const store = await getRollCallStore();
  const sourceRollCall = findRollCall(store, source.rollCallId);
  if (!sourceRollCall) return;

  const duplicate = (store.rollCalls || []).find(item =>
    item.date === date && item.shift === shift
  );

  if (duplicate) {
    alert("A roll call already exists for this date and shift.");
    return;
  }

  const selectedIndexes = [...document.querySelectorAll(".carry-forward-checkbox:checked")]
    .map(input => Number(input.dataset.itemIndex));

  const sections = (ROLL_CALL_TEMPLATES[sourceRollCall.template] || [])
    .map(name => ({
      id: crypto.randomUUID(),
      name,
      items: []
    }));

  selectedIndexes.forEach(index => {
    const entry = source.eligible[index];
    if (!entry) return;

    let section = sections.find(item => item.name === entry.sectionName);

    if (!section) {
      section = {
        id: crypto.randomUUID(),
        name: entry.sectionName,
        items: []
      };
      sections.push(section);
    }

    section.items.push({
      ...entry.item,
      id: crypto.randomUUID(),
      updatedAt: new Date().toISOString()
    });
  });

  const now = new Date().toISOString();

  const rollCall = {
    id: crypto.randomUUID(),
    date,
    shift,
    supervisor,
    template: sourceRollCall.template,
    status: "Draft",
    createdAt: now,
    updatedAt: now,
    sections
  };

  store.rollCalls.push(rollCall);
  store.updatedAt = now;

  await updateRecord("employees", store);
  closeCarryForwardDialog();
  await openRollCallEditor(rollCall.id);
}

async function copyRollCallText(rollCallId) {
  const store = await getRollCallStore();
  const rollCall = findRollCall(store, rollCallId);
  if (!rollCall) return;

  const text = buildRollCallPlainText(rollCall);

  try {
    await navigator.clipboard.writeText(text);
    alert("Roll call copied to the clipboard.");
  } catch (error) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
    alert("Roll call copied to the clipboard.");
  }
}

async function downloadRollCallPdf(rollCallId) {
  const store = await getRollCallStore();
  const rollCall = findRollCall(store, rollCallId);
  if (!rollCall) return;

  const html = buildRollCallPrintHtml(rollCall);
  const printWindow = window.open("", "_blank");

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
  }, 700);
}

function buildRollCallPrintHtml(rollCall) {
  const letterhead = `
    <header class="plain-roll-call-header">
      <h1>Supervisor Roll Call</h1>
      <p>Generated by Supervisor Command Center</p>
    </header>
  `;

  const sections = (rollCall.sections || [])
    .filter(section => (section.items || []).length)
    .map(section => `
      <section class="roll-call-print-section">
        <h2>${escapeRollCallHtml(section.name)}</h2>

        ${(section.items || []).map(item => `
          <article class="roll-call-print-topic">
            <h3>
              ${escapeRollCallHtml(item.title || "Untitled")}
              ${
                item.priority && item.priority !== "Normal"
                  ? `<span class="priority">[${escapeRollCallHtml(item.priority)}]</span>`
                  : ""
              }
            </h3>

            <p>${escapeRollCallHtml(item.note || "").replaceAll("\n", "<br>")}</p>

            ${
              item.source
                ? `<div class="source">Source: ${escapeRollCallHtml(item.source)}${item.sourceDate ? ` (${escapeRollCallHtml(item.sourceDate)})` : ""}</div>`
                : ""
            }
          </article>
        `).join("")}
      </section>
    `).join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Roll Call ${escapeRollCallHtml(rollCall.date || "")}</title>
      <style>
        @page {
          size: letter;
          margin: 0.4in;
        }

        body {
          font-family: Arial, Helvetica, sans-serif;
          color: #111827;
          line-height: 1.35;
          margin: 18px;
        }

        .print-button {
          margin-bottom: 14px;
          padding: 8px 12px;
        }

        .plain-roll-call-header {
          text-align: center;
          border-bottom: 2px solid #111827;
          padding-bottom: 10px;
          margin-bottom: 18px;
        }

        .plain-roll-call-header h1 { margin: 0; }
        .plain-roll-call-header p { margin: 4px 0 0; color: #64748b; font-size: 10px; }

        .roll-call-document-meta {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin: 12px 0 22px;
        }

        .roll-call-document-meta div {
          border: 1px solid #cbd5e1;
          border-radius: 5px;
          padding: 7px;
        }

        .roll-call-document-meta span {
          display: block;
          color: #64748b;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.6px;
        }

        .roll-call-document-meta strong {
          display: block;
          margin-top: 2px;
          font-size: 11px;
        }

        .roll-call-print-section {
          margin-top: 18px;
          break-inside: avoid-page;
        }

        .roll-call-print-section h2 {
          border-bottom: 2px solid #111827;
          padding-bottom: 4px;
          margin: 0 0 7px;
          font-size: 15px;
          text-transform: uppercase;
        }

        .roll-call-print-topic {
          padding: 7px 0 9px 15px;
          border-bottom: 1px solid #e5e7eb;
          break-inside: avoid;
        }

        .roll-call-print-topic h3 {
          margin: 0 0 4px;
          font-size: 12px;
        }

        .roll-call-print-topic p {
          margin: 0;
          font-size: 11px;
        }

        .priority {
          font-size: 9px;
          margin-left: 4px;
        }

        .source {
          margin-top: 5px;
          color: #64748b;
          font-size: 8px;
        }

        .roll-call-print-footer {
          margin-top: 22px;
          padding-top: 6px;
          border-top: 1px solid #9ca3af;
          color: #64748b;
          font-size: 8px;
          display: flex;
          justify-content: space-between;
        }

        @media print {
          .print-button { display: none; }
          body { margin: 0; }
        }
      </style>
    </head>
    <body>
      <button class="print-button" onclick="window.print()">Print / Save as PDF</button>

      ${letterhead}

      <div class="roll-call-document-meta">
        <div><span>Date</span><strong>${escapeRollCallHtml(formatRollCallDisplayDate(rollCall.date))}</strong></div>
        <div><span>Shift</span><strong>${escapeRollCallHtml(rollCall.shift || "N/A")}</strong></div>
        <div><span>Supervisor</span><strong>${escapeRollCallHtml(rollCall.supervisor || "N/A")}</strong></div>
        <div><span>Status</span><strong>${escapeRollCallHtml(rollCall.status || "Draft")}</strong></div>
      </div>

      ${sections || `<p>No Roll Call topics were entered.</p>`}

      <footer class="roll-call-print-footer">
        <span>Generated by Supervisor Command Center</span>
        <span>${new Date().toLocaleString()}</span>
      </footer>
    </body>
    </html>
  `;
}

function buildRollCallPlainText(rollCall) {
  const lines = [
    "UNIFIED POLICE DEPARTMENT",
    "SUPERVISOR ROLL CALL",
    "",
    `Date: ${formatRollCallDisplayDate(rollCall.date)}`,
    `Shift: ${rollCall.shift || "N/A"}`,
    `Supervisor: ${rollCall.supervisor || "N/A"}`,
    ""
  ];

  (rollCall.sections || []).forEach(section => {
    const items = section.items || [];
    if (!items.length) return;

    lines.push(section.name.toUpperCase());
    lines.push("");

    items.forEach(item => {
      lines.push(`- ${item.title}`);
      lines.push(`  ${item.note}`);

      if (item.source) {
        lines.push(
          `  Source: ${item.source}${item.sourceDate ? ` (${item.sourceDate})` : ""}`
        );
      }

      lines.push("");
    });
  });

  return lines.join("\n").trim();
}

function wrapPdfText(text, maxCharacters) {
  const words = String(text || "").replace(/\s+/g, " ").trim().split(" ");
  const lines = [];
  let current = "";

  words.forEach(word => {
    const proposed = current ? `${current} ${word}` : word;

    if (proposed.length > maxCharacters && current) {
      lines.push(current);
      current = word;
    } else {
      current = proposed;
    }
  });

  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

function escapePdfText(value) {
  return String(value || "")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function sanitizeRollCallFilename(value) {
  return String(value || "Shift")
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "");
}

async function getRollCallStore() {
  const employees = await getAllRecords("employees");
  const store = employees[0];

  if (!store) {
    throw new Error("Add at least one employee before using Roll Call.");
  }

  if (!store.rollCalls) store.rollCalls = [];
  return store;
}

function findRollCall(store, rollCallId) {
  return (store.rollCalls || []).find(item => item.id === rollCallId);
}

function getRollCallLocalDate() {
  const now = new Date();
  return formatRollCallInputDate(now);
}

function getTomorrowLocalDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return formatRollCallInputDate(tomorrow);
}

function formatRollCallInputDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatRollCallDisplayDate(value) {
  if (!value) return "No Date";

  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function escapeRollCallHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


async function showSmartEmailImport() {
  if (!currentRollCallId) {
    alert("Open a Roll Call before importing an email.");
    return;
  }

  const modal = document.getElementById("smartEmailImportModal");
  if (!modal) return;

  document.getElementById("smartEmailText").value = "";
  document.getElementById("smartEmailSource").value = "Command Email";
  document.getElementById("smartEmailSourceDate").value = getRollCallLocalDate();
  document.getElementById("smartEmailSuggestions").innerHTML = "";

  modal.classList.add("open");
}

function closeSmartEmailImport(event) {
  if (event && event.target !== event.currentTarget) return;
  document.getElementById("smartEmailImportModal")?.classList.remove("open");
}

async function showSmartImportRules() {
  const modal = document.getElementById("smartImportRulesModal");
  if (!modal) return;

  const rules = await getSmartImportRules();
  renderSmartImportRulesEditor(rules);
  modal.classList.add("open");
}

function closeSmartImportRules(event) {
  if (event && event.target !== event.currentTarget) return;
  document.getElementById("smartImportRulesModal")?.classList.remove("open");
}

async function getSmartImportRules() {
  const store = await getRollCallStore();

  if (!Array.isArray(store.smartImportRules) || !store.smartImportRules.length) {
    store.smartImportRules = JSON.parse(JSON.stringify(DEFAULT_SMART_IMPORT_RULES));
    store.updatedAt = new Date().toISOString();
    await updateRecord("employees", store);
  }

  return store.smartImportRules;
}

function renderSmartImportRulesEditor(rules) {
  const container = document.getElementById("smartImportRulesList");
  if (!container) return;

  container.innerHTML = `
    <div class="smart-rule-list">
      ${rules.map((rule, index) => `
        <div class="smart-rule-card" data-rule-index="${index}">
          <div class="form-grid">
            <input
              class="smart-rule-category"
              value="${escapeRollCallHtml(rule.category || "")}"
              placeholder="Category"
            />

            <input
              class="smart-rule-keywords"
              value="${escapeRollCallHtml((rule.keywords || []).join(", "))}"
              placeholder="Keywords or phrases separated by commas"
            />
          </div>

          <button type="button" class="danger-btn" onclick="removeSmartImportRule(${index})">
            Remove Rule
          </button>
        </div>
      `).join("")}
    </div>
  `;
}

function collectSmartImportRulesFromEditor() {
  return [...document.querySelectorAll(".smart-rule-card")]
    .map((card, index) => {
      const category =
        card.querySelector(".smart-rule-category")?.value.trim() || "";

      const keywords =
        (card.querySelector(".smart-rule-keywords")?.value || "")
          .split(",")
          .map(value => value.trim().toLowerCase())
          .filter(Boolean);

      return {
        id: `rule-${index}-${Date.now()}`,
        category,
        keywords
      };
    })
    .filter(rule => rule.category && rule.keywords.length);
}

function addSmartImportRule() {
  const rules = collectSmartImportRulesFromEditor();

  rules.push({
    id: `rule-${Date.now()}`,
    category: "Other",
    keywords: []
  });

  renderSmartImportRulesEditor(rules);
}

function removeSmartImportRule(index) {
  const rules = collectSmartImportRulesFromEditor();
  rules.splice(index, 1);
  renderSmartImportRulesEditor(rules);
}

async function saveSmartImportRules() {
  const rules = collectSmartImportRulesFromEditor();

  if (!rules.length) {
    alert("Add at least one category rule.");
    return;
  }

  const store = await getRollCallStore();
  store.smartImportRules = rules;
  store.updatedAt = new Date().toISOString();

  await updateRecord("employees", store);
  closeSmartImportRules();
  alert("Smart Import rules saved.");
}

function resetSmartImportRules() {
  if (!confirm("Reset Smart Import rules to the defaults?")) return;

  renderSmartImportRulesEditor(
    JSON.parse(JSON.stringify(DEFAULT_SMART_IMPORT_RULES))
  );
}

async function analyzeSmartEmail() {
  const sourceText =
    document.getElementById("smartEmailText")?.value.trim() || "";

  if (!sourceText) {
    alert("Paste an email first.");
    return;
  }

  const rules = await getSmartImportRules();
  const suggestions = buildSmartEmailSuggestions(sourceText, rules);

  window.smartEmailSuggestions = suggestions;
  renderSmartEmailSuggestions(suggestions);
}

function buildSmartEmailSuggestions(sourceText, rules) {
  const cleaned = String(sourceText || "")
    .replace(/\r/g, "")
    .replace(/\t/g, " ")
    .trim();

  const rawBlocks = cleaned
    .split(/\n\s*\n|(?<=\.)\s+(?=[A-Z])|(?<=\!)\s+(?=[A-Z])|(?<=\?)\s+(?=[A-Z])/)
    .flatMap(block => block.split(/\n(?=[•*-]\s)/))
    .map(block => block.replace(/^[•*-]\s*/, "").replace(/\s+/g, " ").trim())
    .filter(block => block.length >= 8);

  const blocks = [...new Set(rawBlocks)];
  const suggestions = [];

  blocks.forEach((block, index) => {
    const lower = block.toLowerCase();

    let bestRule = null;
    let bestScore = 0;

    rules.forEach(rule => {
      let score = 0;

      (rule.keywords || []).forEach(keyword => {
        const normalized = String(keyword || "").toLowerCase().trim();
        if (!normalized) return;

        if (lower.includes(normalized)) {
          score += normalized.includes(" ") ? 3 : 1;
        }
      });

      if (score > bestScore) {
        bestScore = score;
        bestRule = rule;
      }
    });

    const visibleUntil = extractSmartImportDate(block);
    const category = bestRule?.category || "Other";

    suggestions.push({
      id: `smart-${index}`,
      selected: true,
      category,
      title: createSmartImportTitle(block),
      note: simplifySmartImportText(block),
      priority: inferSmartImportPriority(block),
      carryForward: Boolean(
        visibleUntil ||
        /until|ongoing|through|closes|deadline|reminder|training|policy|follow up/i.test(block)
      ),
      visibleUntil,
      originalText: block
    });
  });

  return suggestions;
}

function renderSmartEmailSuggestions(suggestions) {
  const container = document.getElementById("smartEmailSuggestions");
  if (!container) return;

  if (!suggestions.length) {
    container.innerHTML =
      `<p class="muted">No usable Roll Call topics were found.</p>`;
    return;
  }

  container.innerHTML = `
    <div class="smart-suggestion-header">
      <h4>Suggested Roll Call Topics</h4>
      <p class="muted">Review every item before adding it.</p>
    </div>

    <div class="smart-suggestion-list">
      ${suggestions.map((item, index) => `
        <div class="smart-suggestion-card" data-suggestion-index="${index}">
          <label class="roll-call-checkbox">
            <input class="smart-suggestion-selected" type="checkbox" checked />
            <span>Include this topic</span>
          </label>

          <div class="form-grid">
            <select class="smart-suggestion-category">
              ${getSmartImportCategoryOptions(item.category)}
            </select>

            <input
              class="smart-suggestion-title"
              value="${escapeRollCallHtml(item.title)}"
              placeholder="Title"
            />

            <select class="smart-suggestion-priority">
              <option value="Normal" ${item.priority === "Normal" ? "selected" : ""}>Normal</option>
              <option value="High" ${item.priority === "High" ? "selected" : ""}>High</option>
              <option value="Critical" ${item.priority === "Critical" ? "selected" : ""}>Critical</option>
            </select>

            <input
              class="smart-suggestion-date"
              type="date"
              value="${escapeRollCallHtml(item.visibleUntil || "")}"
              title="Visible until"
            />

            <label class="roll-call-checkbox">
              <input
                class="smart-suggestion-carry"
                type="checkbox"
                ${item.carryForward ? "checked" : ""}
              />
              <span>Carry forward</span>
            </label>
          </div>

          <textarea class="smart-suggestion-note">${escapeRollCallHtml(item.note)}</textarea>

          <details class="smart-original-email">
            <summary>View original email text</summary>
            <p>${escapeRollCallHtml(item.originalText)}</p>
          </details>
        </div>
      `).join("")}
    </div>

    <div id="smartDuplicateWarnings"></div>

    <div class="roll-call-form-actions">
      <button type="button" onclick="checkSmartImportDuplicates()">Check Duplicates</button>
      <button type="button" onclick="addSmartSuggestionsToRollCall()">Add Selected to Roll Call</button>
    </div>
  `;
}

function getSmartImportCategoryOptions(selectedCategory) {
  const categories = [...new Set([
    ...Object.values(ROLL_CALL_TEMPLATES).flat(),
    ...DEFAULT_SMART_IMPORT_RULES.map(rule => rule.category),
    "Other"
  ])].sort();

  return categories.map(category => `
    <option
      value="${escapeRollCallHtml(category)}"
      ${category === selectedCategory ? "selected" : ""}
    >
      ${escapeRollCallHtml(category)}
    </option>
  `).join("");
}

async function checkSmartImportDuplicates() {
  const store = await getRollCallStore();
  const rollCall = findRollCall(store, currentRollCallId);

  if (!rollCall) return;

  const suggestions = collectSmartSuggestionsFromScreen();
  const warnings = [];

  suggestions.forEach((suggestion, suggestionIndex) => {
    (rollCall.sections || []).forEach(section => {
      (section.items || []).forEach(item => {
        const similarity = calculateSmartImportSimilarity(
          `${suggestion.title} ${suggestion.note}`,
          `${item.title} ${item.note}`
        );

        if (similarity >= 0.45) {
          warnings.push({
            suggestionIndex,
            suggestionTitle: suggestion.title,
            existingTitle: item.title,
            sectionName: section.name
          });
        }
      });
    });
  });

  const container = document.getElementById("smartDuplicateWarnings");
  if (!container) return;

  container.innerHTML = warnings.length
    ? `
      <div class="smart-duplicate-warning">
        <strong>Possible duplicates found:</strong>
        ${warnings.map(item => `
          <p>
            “${escapeRollCallHtml(item.suggestionTitle)}” may duplicate
            “${escapeRollCallHtml(item.existingTitle)}”
            in ${escapeRollCallHtml(item.sectionName)}.
          </p>
        `).join("")}
      </div>
    `
    : `<p class="muted">No likely duplicates found.</p>`;
}

function collectSmartSuggestionsFromScreen() {
  return [...document.querySelectorAll(".smart-suggestion-card")]
    .filter(card => card.querySelector(".smart-suggestion-selected")?.checked)
    .map((card, index) => {
      const original =
        window.smartEmailSuggestions?.[Number(card.dataset.suggestionIndex)] || {};

      return {
        index,
        category:
          card.querySelector(".smart-suggestion-category")?.value || "Other",
        title:
          card.querySelector(".smart-suggestion-title")?.value.trim() || "Untitled",
        note:
          card.querySelector(".smart-suggestion-note")?.value.trim() || "",
        priority:
          card.querySelector(".smart-suggestion-priority")?.value || "Normal",
        visibleUntil:
          card.querySelector(".smart-suggestion-date")?.value || "",
        carryForward:
          Boolean(card.querySelector(".smart-suggestion-carry")?.checked),
        originalText: original.originalText || ""
      };
    })
    .filter(item => item.title && item.note);
}

async function addSmartSuggestionsToRollCall() {
  if (!currentRollCallId) {
    alert("Open a Roll Call before importing an email.");
    return;
  }

  const selected = collectSmartSuggestionsFromScreen();

  if (!selected.length) {
    alert("Select at least one topic.");
    return;
  }

  const source =
    document.getElementById("smartEmailSource")?.value.trim() ||
    "Command Email";

  const sourceDate =
    document.getElementById("smartEmailSourceDate")?.value ||
    getRollCallLocalDate();

  const store = await getRollCallStore();
  const rollCall = findRollCall(store, currentRollCallId);

  if (!rollCall) {
    alert("Roll Call not found.");
    return;
  }

  selected.forEach(item => {
    let section = (rollCall.sections || [])
      .find(section => section.name === item.category);

    if (!section) {
      section = {
        id: crypto.randomUUID(),
        name: item.category,
        items: []
      };

      rollCall.sections.push(section);
    }

    section.items.push({
      id: crypto.randomUUID(),
      title: item.title,
      note: item.note,
      priority: item.priority,
      carryForward: item.carryForward,
      visibleUntil: item.visibleUntil,
      source,
      sourceDate,
      originalText: item.originalText,
      updatedAt: new Date().toISOString()
    });
  });

  rollCall.updatedAt = new Date().toISOString();

  await updateRecord("employees", store);
  closeSmartEmailImport();
  await openRollCallEditor(rollCall.id);
}

function createSmartImportTitle(text) {
  const cleaned = String(text || "").replace(/\s+/g, " ").trim();
  const firstSentence = cleaned.split(/[.!?]/)[0].trim();
  const words = firstSentence.split(" ").slice(0, 8).join(" ");

  if (!words) return "Imported Email Topic";
  return words.length > 60 ? `${words.slice(0, 57)}...` : words;
}

function simplifySmartImportText(text) {
  return String(text || "")
    .replace(/^(please|personnel are reminded to|all personnel should|supervisors should)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function inferSmartImportPriority(text) {
  const lower = String(text || "").toLowerCase();

  if (
    /critical|immediate|urgent|officer safety|must immediately|do not approach|armed/i.test(lower)
  ) {
    return "Critical";
  }

  if (
    /required|deadline|due|must|high priority|important|no later than/i.test(lower)
  ) {
    return "High";
  }

  return "Normal";
}

function extractSmartImportDate(text) {
  const value = String(text || "");

  const isoMatch = value.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  if (isoMatch) return isoMatch[0];

  const monthMap = {
    january: 1,
    february: 2,
    march: 3,
    april: 4,
    may: 5,
    june: 6,
    july: 7,
    august: 8,
    september: 9,
    october: 10,
    november: 11,
    december: 12
  };

  const wordMatch = value.match(
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:,\s*(20\d{2}))?/i
  );

  if (wordMatch) {
    const month = monthMap[wordMatch[1].toLowerCase()];
    const day = Number(wordMatch[2]);
    let year = wordMatch[3]
      ? Number(wordMatch[3])
      : new Date().getFullYear();

    const candidate = new Date(year, month - 1, day);

    if (!wordMatch[3] && candidate < new Date()) {
      year += 1;
    }

    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  const numericMatch = value.match(
    /\b(\d{1,2})\/(\d{1,2})(?:\/(20\d{2}|\d{2}))?\b/
  );

  if (numericMatch) {
    const month = Number(numericMatch[1]);
    const day = Number(numericMatch[2]);

    let year = numericMatch[3]
      ? Number(
          numericMatch[3].length === 2
            ? `20${numericMatch[3]}`
            : numericMatch[3]
        )
      : new Date().getFullYear();

    const candidate = new Date(year, month - 1, day);

    if (!numericMatch[3] && candidate < new Date()) {
      year += 1;
    }

    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  return "";
}

function calculateSmartImportSimilarity(first, second) {
  const tokenize = value =>
    new Set(
      String(value || "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter(word => word.length > 2)
    );

  const firstTokens = tokenize(first);
  const secondTokens = tokenize(second);

  if (!firstTokens.size || !secondTokens.size) return 0;

  let overlap = 0;

  firstTokens.forEach(token => {
    if (secondTokens.has(token)) overlap++;
  });

  return overlap / Math.min(firstTokens.size, secondTokens.size);
}
