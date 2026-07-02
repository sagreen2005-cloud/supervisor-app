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
      <div id="calendarGrid"></div>
    </section>

    <section class="card">
      <h3>Schedule List</h3>
      <div id="calendarList"></div>
    </section>
  `;

  document.getElementById("calendarMonth").addEventListener("change", renderCalendar);
  document.getElementById("calendarTypeFilter").addEventListener("change", renderCalendar);
  document.getElementById("calendarSearch").addEventListener("input", renderCalendar);

  await renderCalendar();
}

function getCurrentMonthValue() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}`;
}

async function renderCalendar() {
  const employees = await getAllRecords("employees");

  const monthValue = document.getElementById("calendarMonth").value || getCurrentMonthValue();
  const typeFilter = document.getElementById("calendarTypeFilter").value || "All";
  const search = (document.getElementById("calendarSearch").value || "").toLowerCase();

  const parts = monthValue.split("-");
  const year = Number(parts[0]);
  const month = Number(parts[1]);

  let entries = [];

  employees.forEach(employee => {
    const employeeName = `${employee.rank || ""} ${employee.firstName || ""} ${employee.lastName || ""}`.trim();

    (employee.schedule || []).forEach((item, index) => {
      if (!item.startDate) return;

      const startDate = item.startDate;
      const endDate = item.endDate || item.startDate;

      const matchesType = typeFilter === "All" || item.type === typeFilter;

      const searchableText = `
        ${employeeName}
        ${item.type || ""}
        ${item.notes || ""}
        ${item.startDate || ""}
        ${item.endDate || ""}
      `.toLowerCase();

      const matchesSearch = searchableText.includes(search);

      if (!matchesType || !matchesSearch) return;

      const dates = getDatesBetween(startDate, endDate);

      dates.forEach(dateString => {
        const dateParts = dateString.split("-");
        const entryYear = Number(dateParts[0]);
        const entryMonth = Number(dateParts[1]);

        if (entryYear === year && entryMonth === month) {
          entries.push({
            employeeId: employee.id,
            employeeName,
            type: item.type || "Other",
            date: dateString,
            startDate,
            endDate,
            hours: item.hours,
            notes: item.notes,
            index
          });
        }
      });
    });
  });

  renderCalendarGrid(year, month, entries);
  renderCalendarList(entries);
}

function getDatesBetween(startDate, endDate) {
  const dates = [];

  const startParts = startDate.split("-");
  const endParts = endDate.split("-");

  let current = new Date(Number(startParts[0]), Number(startParts[1]) - 1, Number(startParts[2]));
  const end = new Date(Number(endParts[0]), Number(endParts[1]) - 1, Number(endParts[2]));

  while (current <= end) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, "0");
    const d = String(current.getDate()).padStart(2, "0");

    dates.push(`${y}-${m}-${d}`);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

function renderCalendarGrid(year, month, entries) {
  const grid = document.getElementById("calendarGrid");

  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const daysInMonth = lastDay.getDate();
  const firstDayOfWeek = firstDay.getDay();

  let html = `
    <div class="calendar-grid">
      <div class="calendar-day-header">Sun</div>
      <div class="calendar-day-header">Mon</div>
      <div class="calendar-day-header">Tue</div>
      <div class="calendar-day-header">Wed</div>
      <div class="calendar-day-header">Thu</div>
      <div class="calendar-day-header">Fri</div>
      <div class="calendar-day-header">Sat</div>
  `;

  for (let i = 0; i < firstDayOfWeek; i++) {
    html += `<div class="calendar-day empty-day"></div>`;
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayString = String(day).padStart(2, "0");
    const monthString = String(month).padStart(2, "0");
    const dateString = `${year}-${monthString}-${dayString}`;

    const dayEntries = entries.filter(entry => entry.date === dateString);

    html += `
      <div class="calendar-day">
        <strong>${day}</strong>

        ${dayEntries.map(entry => `
          <div class="calendar-entry ${getCalendarTypeClass(entry.type)}" onclick="openEmployeeProfile(${entry.employeeId})">
            ${entry.employeeName} - ${entry.type}
          </div>
        `).join("")}
      </div>
    `;
  }

  html += `</div>`;

  grid.innerHTML = html;
}

function renderCalendarList(entries) {
  const list = document.getElementById("calendarList");

  const unique = [];

  entries.forEach(entry => {
    const key = `${entry.employeeId}-${entry.index}`;

    if (!unique.some(item => `${item.employeeId}-${item.index}` === key)) {
      unique.push(entry);
    }
  });

  if (unique.length === 0) {
    list.innerHTML = `<p class="muted">No schedule entries found for this month.</p>`;
    return;
  }

  list.innerHTML = unique
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .map(entry => `
      <div class="schedule-card clickable" onclick="openEmployeeProfile(${entry.employeeId})">
        <div class="employee-top">
          <div>
            <h3>${entry.employeeName}</h3>
            <p class="muted">${entry.type} | ${entry.startDate} to ${entry.endDate || entry.startDate}</p>
          </div>
        </div>

        <div class="employee-details">
          <div><span>Type</span>${entry.type}</div>
          <div><span>Hours</span>${entry.hours || "N/A"}</div>
          <div><span>Start</span>${entry.startDate}</div>
        </div>

        ${entry.notes ? `<p class="employee-note">${entry.notes}</p>` : ""}
      </div>
    `)
    .join("");
}

function getCalendarTypeClass(type) {
  if (type === "Vacation") return "calendar-vacation";
  if (type === "Sick Leave") return "calendar-sick";
  if (type === "Training") return "calendar-training";
  if (type === "Court") return "calendar-court";
  if (type === "Overtime") return "calendar-overtime";
  return "calendar-other";
}
