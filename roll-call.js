let rollCallSearchTimer = null;
let rollCallEditingId = null;

async function loadDailyLogPage() {
  await loadRollCallPage();
}

async function loadRollCallPage() {
  document.getElementById("content").innerHTML = `
    <div class="page-header">
      <div>
        <h2>Roll Call</h2>
        <p>Create, organize, search, and reuse crew updates for the week or shift.</p>
      </div>

      <div class="quick-actions">
        <button type="button" onclick="showRollCallForm()">+ New Roll Call Item</button>
        <button type="button" onclick="copyActiveRollCall()">Copy Active Roll Call</button>
      </div>
    </div>

    <section id="rollCallFormCard" class="card" hidden>
      <div class="roll-call-form-header">
        <div>
          <h3 id="rollCallFormTitle">New Roll Call Item</h3>
          <p class="muted">Add an update from email, command staff, personal observation, or another source.</p>
        </div>
        <button type="button" class="roll-call-close" onclick="closeRollCallForm()">×</button>
      </div>

      <div class="form-grid">
        <input id="rollCallDate" type="date" />
        <input id="rollCallTitle" placeholder="Title / subject" />

        <select id="rollCallCategory">
          <option value="Staffing">Staffing</option>
          <option value="Officer Safety">Officer Safety</option>
          <option value="Training">Training</option>
          <option value="Policy">Policy</option>
          <option value="Administrative">Administrative</option>
          <option value="DUI Squad">DUI Squad</option>
          <option value="Events">Events</option>
          <option value="Equipment / Facilities">Equipment / Facilities</option>
          <option value="BOLO">BOLO</option>
          <option value="Community">Community</option>
          <option value="Reminder">Reminder</option>
          <option value="Other">Other</option>
        </select>

        <select id="rollCallPriority">
          <option value="Normal">Normal</option>
          <option value="High">High</option>
          <option value="Critical">Critical</option>
        </select>

        <select id="rollCallAppliesTo">
          <option value="All Crew">All Crew</option>
          <option value="Current Shift">Current Shift</option>
          <option value="Specific Employees">Specific Employees</option>
          <option value="Supervisors">Supervisors</option>
          <option value="Other">Other</option>
        </select>

        <input id="rollCallVisibleUntil" type="date" title="Visible until" />
        <input id="rollCallSource" placeholder="Source: email, command staff, observation..." />

        <label class="roll-call-checkbox">
          <input id="rollCallPinned" type="checkbox" />
          <span>Pin this item</span>
        </label>
      </div>

      <textarea
        id="rollCallMessage"
        placeholder="Crew update, issue seen, reminder, assignment, briefing information..."
      ></textarea>

      <div class="roll-call-form-actions">
        <button type="button" onclick="saveRollCallItem()">Save Roll Call Item</button>
        <button type="button" class="secondary-btn" onclick="closeRollCallForm()">Cancel</button>
      </div>
    </section>

    <section class="card">
      <div class="roll-call-filter-header">
        <div>
          <h3>Roll Call Board</h3>
          <p class="muted">Expired items remain searchable and are not deleted.</p>
        </div>
      </div>

      <div class="form-grid">
        <input id="rollCallSearch" placeholder="Search title, message, category, source, or date..." />

        <select id="rollCallCategoryFilter">
          <option value="All">All Categories</option>
          <option value="Staffing">Staffing</option>
          <option value="Officer Safety">Officer Safety</option>
          <option value="Training">Training</option>
          <option value="Policy">Policy</option>
          <option value="Administrative">Administrative</option>
          <option value="DUI Squad">DUI Squad</option>
          <option value="Events">Events</option>
          <option value="Equipment / Facilities">Equipment / Facilities</option>
          <option value="BOLO">BOLO</option>
          <option value="Community">Community</option>
          <option value="Reminder">Reminder</option>
          <option value="Other">Other</option>
        </select>

        <select id="rollCallStatusFilter">
          <option value="Active">Active</option>
          <option value="All">All Items</option>
          <option value="Expired">Expired</option>
          <option value="Pinned">Pinned</option>
        </select>

        <select id="rollCallPriorityFilter">
          <option value="All">All Priorities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Normal">Normal</option>
        </select>
      </div>

      <div id="rollCallList"></div>
    </section>
  `;

  document.getElementById("rollCallDate").value = getRollCallLocalDate();

  document.getElementById("rollCallSearch").addEventListener("input", () => {
    clearTimeout(rollCallSearchTimer);
    rollCallSearchTimer = setTimeout(renderRollCallItems, 150);
  });

  document.getElementById("rollCallCategoryFilter").addEventListener("change", renderRollCallItems);
  document.getElementById("rollCallStatusFilter").addEventListener("change", renderRollCallItems);
  document.getElementById("rollCallPriorityFilter").addEventListener("change", renderRollCallItems);

  await renderRollCallItems();
}

function showRollCallForm(itemId = null) {
  const form = document.getElementById("rollCallFormCard");
  if (!form) return;

  rollCallEditingId = itemId;
  clearRollCallForm();

  if (itemId) {
    loadRollCallItemIntoForm(itemId);
  } else {
    document.getElementById("rollCallFormTitle").textContent = "New Roll Call Item";
    document.getElementById("rollCallDate").value = getRollCallLocalDate();
  }

  form.hidden = false;
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function closeRollCallForm() {
  const form = document.getElementById("rollCallFormCard");
  if (form) form.hidden = true;
  rollCallEditingId = null;
}

function clearRollCallForm() {
  const ids = [
    "rollCallTitle",
    "rollCallVisibleUntil",
    "rollCallSource",
    "rollCallMessage"
  ];

  ids.forEach(id => {
    const element = document.getElementById(id);
    if (element) element.value = "";
  });

  if (document.getElementById("rollCallCategory")) {
    document.getElementById("rollCallCategory").value = "Staffing";
  }

  if (document.getElementById("rollCallPriority")) {
    document.getElementById("rollCallPriority").value = "Normal";
  }

  if (document.getElementById("rollCallAppliesTo")) {
    document.getElementById("rollCallAppliesTo").value = "All Crew";
  }

  if (document.getElementById("rollCallPinned")) {
    document.getElementById("rollCallPinned").checked = false;
  }
}

async function loadRollCallItemIntoForm(itemId) {
  const store = await getRollCallStore();
  const item = (store.rollCallItems || []).find(entry => entry.id === itemId);

  if (!item) {
    alert("Roll call item not found.");
    closeRollCallForm();
    return;
  }

  document.getElementById("rollCallFormTitle").textContent = "Edit Roll Call Item";
  document.getElementById("rollCallDate").value = item.date || getRollCallLocalDate();
  document.getElementById("rollCallTitle").value = item.title || "";
  document.getElementById("rollCallCategory").value = item.category || "Other";
  document.getElementById("rollCallPriority").value = item.priority || "Normal";
  document.getElementById("rollCallAppliesTo").value = item.appliesTo || "All Crew";
  document.getElementById("rollCallVisibleUntil").value = item.visibleUntil || "";
  document.getElementById("rollCallSource").value = item.source || "";
  document.getElementById("rollCallPinned").checked = Boolean(item.pinned);
  document.getElementById("rollCallMessage").value = item.message || "";
}

async function saveRollCallItem() {
  const title = document.getElementById("rollCallTitle").value.trim();
  const message = document.getElementById("rollCallMessage").value.trim();
  const date = document.getElementById("rollCallDate").value;

  if (!title) {
    alert("Enter a title.");
    return;
  }

  if (!message) {
    alert("Enter the roll call update.");
    return;
  }

  if (!date) {
    alert("Select a date.");
    return;
  }

  const store = await getRollCallStore();
  if (!store.rollCallItems) store.rollCallItems = [];

  const now = new Date().toISOString();

  const item = {
    id: rollCallEditingId || crypto.randomUUID(),
    date,
    title,
    category: document.getElementById("rollCallCategory").value,
    priority: document.getElementById("rollCallPriority").value,
    appliesTo: document.getElementById("rollCallAppliesTo").value,
    visibleUntil: document.getElementById("rollCallVisibleUntil").value,
    source: document.getElementById("rollCallSource").value.trim(),
    pinned: document.getElementById("rollCallPinned").checked,
    message,
    createdAt: now,
    updatedAt: now
  };

  if (rollCallEditingId) {
    const index = store.rollCallItems.findIndex(entry => entry.id === rollCallEditingId);

    if (index === -1) {
      alert("Roll call item not found.");
      return;
    }

    item.createdAt = store.rollCallItems[index].createdAt || now;
    store.rollCallItems[index] = item;
  } else {
    store.rollCallItems.push(item);
  }

  store.updatedAt = now;
  await updateRecord("employees", store);

  closeRollCallForm();
  await renderRollCallItems();
}

async function renderRollCallItems() {
  const list = document.getElementById("rollCallList");
  if (!list) return;

  const store = await getRollCallStore();
  const today = getRollCallLocalDate();

  const search =
    document.getElementById("rollCallSearch")?.value.trim().toLowerCase() || "";

  const categoryFilter =
    document.getElementById("rollCallCategoryFilter")?.value || "All";

  const statusFilter =
    document.getElementById("rollCallStatusFilter")?.value || "Active";

  const priorityFilter =
    document.getElementById("rollCallPriorityFilter")?.value || "All";

  let items = (store.rollCallItems || []).slice();

  items = items.filter(item => {
    const expired = isRollCallExpired(item, today);

    const searchableText = [
      item.date,
      item.title,
      item.category,
      item.priority,
      item.appliesTo,
      item.visibleUntil,
      item.source,
      item.message
    ].join(" ").toLowerCase();

    const matchesSearch = searchableText.includes(search);
    const matchesCategory = categoryFilter === "All" || item.category === categoryFilter;
    const matchesPriority = priorityFilter === "All" || item.priority === priorityFilter;

    let matchesStatus = true;

    if (statusFilter === "Active") matchesStatus = !expired;
    if (statusFilter === "Expired") matchesStatus = expired;
    if (statusFilter === "Pinned") matchesStatus = Boolean(item.pinned);

    return matchesSearch && matchesCategory && matchesPriority && matchesStatus;
  });

  items.sort((a, b) => {
    if (Boolean(a.pinned) !== Boolean(b.pinned)) {
      return a.pinned ? -1 : 1;
    }

    const priorityOrder = { Critical: 0, High: 1, Normal: 2 };
    const priorityDifference =
      (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3);

    if (priorityDifference !== 0) return priorityDifference;

    return String(b.date || b.createdAt || "")
      .localeCompare(String(a.date || a.createdAt || ""));
  });

  if (!items.length) {
    list.innerHTML = `<p class="muted roll-call-empty">No matching roll call items found.</p>`;
    return;
  }

  const pinnedItems = items.filter(item => item.pinned);
  const regularItems = items.filter(item => !item.pinned);

  list.innerHTML = `
    ${
      pinnedItems.length
        ? renderRollCallSection("Pinned Items", pinnedItems, today)
        : ""
    }

    ${
      regularItems.length
        ? renderRollCallSection(
            statusFilter === "Expired" ? "Expired Items" : "Roll Call Items",
            regularItems,
            today
          )
        : ""
    }
  `;
}

function renderRollCallSection(title, items, today) {
  return `
    <div class="roll-call-section">
      <h3>${escapeRollCallHtml(title)}</h3>
      <div class="roll-call-items">
        ${items.map(item => renderRollCallCard(item, today)).join("")}
      </div>
    </div>
  `;
}

function renderRollCallCard(item, today) {
  const expired = isRollCallExpired(item, today);

  return `
    <article class="roll-call-card ${item.pinned ? "roll-call-pinned" : ""} ${expired ? "roll-call-expired" : ""}">
      <div class="roll-call-card-header">
        <div>
          <div class="roll-call-badges">
            ${item.pinned ? `<span class="roll-call-badge pinned">Pinned</span>` : ""}
            <span class="roll-call-badge">${escapeRollCallHtml(item.category || "Other")}</span>
            <span class="roll-call-badge priority-${String(item.priority || "Normal").toLowerCase()}">
              ${escapeRollCallHtml(item.priority || "Normal")}
            </span>
            ${expired ? `<span class="roll-call-badge expired">Expired</span>` : ""}
          </div>

          <h3>${escapeRollCallHtml(item.title || "Untitled")}</h3>
          <p class="muted">
            ${escapeRollCallHtml(item.date || "No date")}
            · ${escapeRollCallHtml(item.appliesTo || "All Crew")}
            ${item.source ? ` · Source: ${escapeRollCallHtml(item.source)}` : ""}
          </p>
        </div>

        <div class="roll-call-card-actions">
          <button type="button" onclick="showRollCallForm('${item.id}')">Edit</button>
          <button type="button" class="danger-btn" onclick="removeRollCallItem('${item.id}')">Remove</button>
        </div>
      </div>

      <p class="roll-call-message">${escapeRollCallHtml(item.message || "")}</p>

      ${
        item.visibleUntil
          ? `<p class="muted roll-call-expiration">Visible until: ${escapeRollCallHtml(item.visibleUntil)}</p>`
          : ""
      }
    </article>
  `;
}

async function removeRollCallItem(itemId) {
  if (!confirm("Remove this roll call item?")) return;

  const store = await getRollCallStore();
  if (!store.rollCallItems) return;

  const index = store.rollCallItems.findIndex(item => item.id === itemId);
  if (index === -1) return;

  store.rollCallItems.splice(index, 1);
  store.updatedAt = new Date().toISOString();

  await updateRecord("employees", store);
  await renderRollCallItems();
}

async function copyActiveRollCall() {
  const store = await getRollCallStore();
  const today = getRollCallLocalDate();

  const items = (store.rollCallItems || [])
    .filter(item => !isRollCallExpired(item, today))
    .sort((a, b) => {
      if (Boolean(a.pinned) !== Boolean(b.pinned)) {
        return a.pinned ? -1 : 1;
      }

      const priorityOrder = { Critical: 0, High: 1, Normal: 2 };
      return (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3);
    });

  if (!items.length) {
    alert("There are no active roll call items to copy.");
    return;
  }

  const grouped = new Map();

  items.forEach(item => {
    const category = item.category || "Other";

    if (!grouped.has(category)) grouped.set(category, []);
    grouped.get(category).push(item);
  });

  const lines = [
    "ROLL CALL",
    formatRollCallHeadingDate(today),
    ""
  ];

  grouped.forEach((categoryItems, category) => {
    lines.push(category.toUpperCase());
    lines.push("");

    categoryItems.forEach(item => {
      lines.push(`• ${item.title}`);
      lines.push(`  ${item.message}`);

      if (item.visibleUntil) {
        lines.push(`  Visible until: ${item.visibleUntil}`);
      }

      lines.push("");
    });
  });

  const output = lines.join("\n").trim();

  try {
    await navigator.clipboard.writeText(output);
    alert("Active roll call copied to the clipboard.");
  } catch (error) {
    console.error("Clipboard copy failed:", error);
    showRollCallCopyFallback(output);
  }
}

function showRollCallCopyFallback(text) {
  const modal = document.createElement("div");
  modal.className = "roll-call-copy-modal";

  modal.innerHTML = `
    <div class="roll-call-copy-content">
      <h3>Copy Active Roll Call</h3>
      <textarea readonly>${escapeRollCallHtml(text)}</textarea>
      <button type="button" onclick="this.closest('.roll-call-copy-modal').remove()">Close</button>
    </div>
  `;

  document.body.appendChild(modal);
  modal.querySelector("textarea").select();
}

async function getRollCallStore() {
  const employees = await getAllRecords("employees");
  const store = employees[0];

  if (!store) {
    throw new Error("Add at least one employee before using Roll Call.");
  }

  if (!store.rollCallItems) store.rollCallItems = [];
  return store;
}

function isRollCallExpired(item, today = getRollCallLocalDate()) {
  return Boolean(item.visibleUntil && item.visibleUntil < today);
}

function getRollCallLocalDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatRollCallHeadingDate(value) {
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
