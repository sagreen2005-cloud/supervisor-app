let calendarEmployeesCache = [];
let calendarSearchTimer = null;
let calendarRenderToken = 0;

async function loadCalendarPage() {
  document.getElementById("content").innerHTML = `
    <div class="page-header">
      <div>
        <h2>Calendar</h2>
        <p>View vacation, sick leave, court, training, overtime, and other schedule entries.</p>
      </div>
    </div>

    <section class="card">
      <h3>Calendar Filter</h3>

      <div class="form-grid">
        <input id="calendarMonth" type="month" value="${getCurrentMonthValue()}" />

        <select id="calendarTypeFilter">
          <option value="All">All Types</option>
          <option value="Vacation">Vacation</option>
          <option value="Sick Leave">Sick Leave</option>
          <option value="Training">Training</option>
          <option value="Court">Court</option>
          <option value="Comp Time">Comp Time</option>
          <option value="Regular Day Off">Regular Day Off</option>
          <option value="Holiday">Holiday</option>
          <option value="Overtime">Overtime</option>
          <option value="Other">Other</option>
        </select>

        <input id="calendarSearch" placeholder="Search employee, type, or notes..." />
      </div>
    </section>

    <section class="card">
      <h3>Monthly Schedule</h3>
      <div id="calendarGrid">
        <p class="muted">Loading calendar...</p>
      </div>
    </section>

    <section class="card">
      <h3>Schedule List</h3>
      <div id="calendarList">
        <p class="muted">Loading schedule entries...</p>
      </div>
    </section>
  `;

  document.getElementById("calendarMonth").addEventListener("change", renderCalendar);
  document.getElementById("calendarTypeFilter").addEventListener("change", renderCalendar);

  document.getElementById("calendarSearch").addEventListener("input", () => {
    clearTimeout(calendarSearchTimer);
    calendarSearchTimer = setTimeout(renderCalendar, 175);
  });

  try {
    calendarEmployeesCache = await getAllRecords("employees");
    await renderCalendar();
  } catch (error) {
    console.error("Calendar load failed:", error);

    document.getElementById("calendarGrid").innerHTML =
      `<p class="muted">The calendar could not be loaded.</p>`;

    document.getElementById("calendarList").innerHTML =
      `<p class="muted">The schedule list could not be loaded.</p>`;
  }
}

function getCurrentMonthValue() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}`;
}

async function renderCalendar() {
  const renderToken = ++calendarRenderToken;

  const monthInput = document.getElementById("calendarMonth");
  const typeInput = document.getElementById("calendarTypeFilter");
  const searchInput = document.getElementById("calendarSearch");

  if (!monthInput || !typeInput || !searchInput) return;

  const monthValue = monthInput.value || getCurrentMonthValue();
  const typeFilter = typeInput.value || "All";
  const search = searchInput.value.trim().toLowerCase();

  const [yearText, monthText] = monthValue.split("-");
  const year = Number(yearText);
  const month = Number(monthText);

  if (!year || !month) return;

  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const monthEndDay = new Date(year, month, 0).getDate();
  const monthEnd = `${year}-${String(month).padStart(2, "0")}-${String(monthEndDay).padStart(2, "0")}`;

  const entries = [];
  const entriesByDate = new Map();
  const uniqueScheduleEntries = new Map();

  for (const employee of calendarEmployeesCache) {
    const employeeName = formatCalendarEmployeeName(employee);

    for (let index = 0; index < (employee.schedule || []).length; index++) {
      const item = employee.schedule[index];

      if (!item?.startDate) continue;

      const startDate = item.startDate;
      const endDate = item.endDate || item.startDate;

      if (endDate < monthStart || startDate > monthEnd) continue;
      if (typeFilter !== "All" && item.type !== typeFilter) continue;

      if (search) {
        const searchableText = [
          employeeName,
          item.type || "",
          item.notes || "",
          item.startDate || "",
          item.endDate || ""
        ].join(" ").toLowerCase();

        if (!searchableText.includes(search)) continue;
      }

      const visibleStart = startDate < monthStart ? monthStart : startDate;
      const visibleEnd = endDate > monthEnd ? monthEnd : endDate;

      const baseEntry = {
        employeeId: employee.id,
        employeeName,
        type: item.type || "Other",
        startDate,
        endDate,
        hours: item.hours,
        notes: item.notes,
        startTime: item.startTime || "",
        endTime: item.endTime || "",
        allDay: Boolean(item.allDay),
        index
      };

      uniqueScheduleEntries.set(`${employee.id}-${index}`, baseEntry);

      addCalendarRangeEntries(
        visibleStart,
        visibleEnd,
        baseEntry,
        entries,
        entriesByDate
      );
    }
  }

  if (renderToken !== calendarRenderToken) return;

  renderCalendarGrid(year, month, entriesByDate);
  renderCalendarList([...uniqueScheduleEntries.values()]);
}

function addCalendarRangeEntries(startDate, endDate, baseEntry, entries, entriesByDate) {
  const [startYear, startMonth, startDay] = startDate.split("-").map(Number);
  const [endYear, endMonth, endDay] = endDate.split("-").map(Number);

  const current = new Date(startYear, startMonth - 1, startDay);
  const end = new Date(endYear, endMonth - 1, endDay);

  while (current <= end) {
    const dateString = formatCalendarDate(current);

    const entry = {
      ...baseEntry,
      date: dateString
    };

    entries.push(entry);

    if (!entriesByDate.has(dateString)) {
      entriesByDate.set(dateString, []);
    }

    entriesByDate.get(dateString).push(entry);
    current.setDate(current.getDate() + 1);
  }
}

function formatCalendarDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatCalendarEmployeeName(employee) {
  return `${employee.rank || ""} ${employee.firstName || ""} ${employee.lastName || ""}`
    .replace(/\s+/g, " ")
    .trim();
}

function renderCalendarGrid(year, month, entriesByDate) {
  const grid = document.getElementById("calendarGrid");
  if (!grid) return;

  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const daysInMonth = lastDay.getDate();
  const firstDayOfWeek = firstDay.getDay();

  const html = [];

  html.push(`
    <div class="calendar-grid">
      <div class="calendar-day-header">Sun</div>
      <div class="calendar-day-header">Mon</div>
      <div class="calendar-day-header">Tue</div>
      <div class="calendar-day-header">Wed</div>
      <div class="calendar-day-header">Thu</div>
      <div class="calendar-day-header">Fri</div>
      <div class="calendar-day-header">Sat</div>
  `);

  for (let i = 0; i < firstDayOfWeek; i++) {
    html.push(`<div class="calendar-day empty-day"></div>`);
  }

  const monthString = String(month).padStart(2, "0");

  for (let day = 1; day <= daysInMonth; day++) {
    const dateString = `${year}-${monthString}-${String(day).padStart(2, "0")}`;
    const dayEntries = entriesByDate.get(dateString) || [];

    html.push(`
      <div class="calendar-day">
        <strong>${day}</strong>
        ${dayEntries.map(entry => `
          <button
            type="button"
            class="calendar-entry ${getCalendarTypeClass(entry.type)}"
            onclick="openEmployeeProfile(${entry.employeeId})"
            title="${escapeCalendarHtml(entry.employeeName)} — ${escapeCalendarHtml(entry.type)}"
          >
            ${escapeCalendarHtml(entry.employeeName)} - ${escapeCalendarHtml(entry.type)}
            ${formatCalendarEntryTime(entry) ? `<span class="calendar-entry-time">${escapeCalendarHtml(formatCalendarEntryTime(entry))}</span>` : ""}
          </button>
        `).join("")}
      </div>
    `);
  }

  html.push(`</div>`);
  grid.innerHTML = html.join("");
}

function renderCalendarList(entries) {
  const list = document.getElementById("calendarList");
  if (!list) return;

  if (!entries.length) {
    list.innerHTML = `<p class="muted">No schedule entries found for this month.</p>`;
    return;
  }

  entries.sort((a, b) => {
    const dateComparison = a.startDate.localeCompare(b.startDate);
    if (dateComparison !== 0) return dateComparison;
    return a.employeeName.localeCompare(b.employeeName);
  });

  list.innerHTML = entries.map(entry => `
    <div class="schedule-card clickable" onclick="openEmployeeProfile(${entry.employeeId})">
      <div class="employee-top">
        <div>
          <h3>${escapeCalendarHtml(entry.employeeName)}</h3>
          <p class="muted">
            ${escapeCalendarHtml(entry.type)} |
            ${escapeCalendarHtml(entry.startDate)} to
            ${escapeCalendarHtml(entry.endDate || entry.startDate)}
            ${formatCalendarEntryTime(entry) ? ` · ${escapeCalendarHtml(formatCalendarEntryTime(entry))}` : ""}
          </p>
        </div>
      </div>

      <div class="employee-details">
        <div><span>Type</span>${escapeCalendarHtml(entry.type)}</div>
        <div><span>Hours</span>${escapeCalendarHtml(entry.hours || "N/A")}</div>
        <div><span>Start</span>${escapeCalendarHtml(entry.startDate)}</div>
        <div><span>Time</span>${escapeCalendarHtml(formatCalendarEntryTime(entry) || "All Day")}</div>
      </div>

      ${entry.notes
        ? `<p class="employee-note">${escapeCalendarHtml(entry.notes)}</p>`
        : ""}
    </div>
  `).join("");
}

function getCalendarTypeClass(type) {
  if (type === "Vacation") return "calendar-vacation";
  if (type === "Sick Leave") return "calendar-sick";
  if (type === "Training") return "calendar-training";
  if (type === "Court") return "calendar-court";
  if (type === "Overtime") return "calendar-overtime";
  return "calendar-other";
}

function escapeCalendarHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function formatCalendarEntryTime(entry) {
  if (entry.allDay) return "All Day";

  const start = entry.startTime || "";
  const end = entry.endTime || "";

  if (!start && !end) return "";
  if (start && end) return `${start}-${end}`;
  return start || end;
}
