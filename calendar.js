async function loadCalendarPage() {
  const employees = await getAllRecords("employees");

  const today = new Date();
  const currentMonth = today.toISOString().slice(0, 7);

  document.getElementById("content").innerHTML = `
    <div class="page-header">
      <div>
        <h2>Calendar</h2>
        <p>View PTO, sick leave, court, training, overtime, and other schedule entries.</p>
      </div>
    </div>

    <section class="card">
      <h3>Calendar Filter</h3>

      <div class="form-grid">
        <input id="calendarMonth" type="month" value="${currentMonth}" />

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

async function renderCalendar() {
  const employees = await getAllRecords("employees");
  const monthValue = document.getElementById("calendarMonth").value;
  const typeFilter = document.getElementById("calendarTypeFilter").value;
  const search = document.getElementById("calendarSearch").value.toLowerCase();

  const year = Number(monthValue.split("-")[0]);
  const month = Number(monthValue.split("-")[1]) - 1;

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  let entries = [];

  employees.forEach(employee => {
    const employeeName = `${employee.rank || ""} ${employee.firstName || ""} ${employee.lastName || ""}`.trim();

    (employee.schedule || []).forEach((item, index) => {
      const start = item.startDate;
      const end = item.endDate || item.startDate;

      if (!start) return;

      const text = `${employeeName} ${item.type} ${item.notes}`.toLowerCase();

      const matchesType = typeFilter === "All" || item.type === typeFilter;
      const matchesSearch = text.includes(search);

      if (!matchesType || !matchesSearch) return;

      const entryStart = new Date(start + "T00:00:00");
      const entryEnd = new Date(end + "T00:00:00");

      for (let d = new Date(entryStart); d <= entryEnd; d.setDate(d.getDate() + 1)) {
        if (d.getFullYear() === year && d.getMonth() === month) {
          entries.push({
            employeeId: employee.id,
            employeeName,
            type: item.type,
            date: d.toISOString().slice(0, 10),
            startDate: start,
            endDate: end,
            hours: item.hours,
            notes: item.notes,
            index
          });
        }
      }
    });
  });

  renderCalendarGrid(year, month, daysInMonth, entries);
  renderCalendarList(entries);
}

function renderCalendarGrid(year, month, daysInMonth, entries) {
  const grid = document.getElementById("calendarGrid");

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

  const firstDayOfWeek = new Date(year, month, 1).getDay();

  for (let i = 0; i < firstDayOfWeek; i++) {
    html += `<div class="calendar-day empty-day"></div>`;
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateString = new Date(year, month, day).toISOString().slice(0, 10);
    const dayEntries = entries.filter(e => e.date === dateString);

    html += `
      <div class="calendar-day">
        <strong>${day}</strong>
        ${
          dayEntries.map(entry => `
            <div class="calendar-entry ${getCalendarTypeClass(entry.type)}" onclick="openEmployeeProfile(${entry.employeeId})">
              ${entry.employeeName} - ${entry.type}
            </div>
          `).join("")
        }
      </div>
    `;
  }

  html += `</div>`;
  grid.innerHTML = html;
}

function renderCalendarList(entries) {
  const list = document.getElementById("calendarList");

  const uniqueEntries = [];

  entries.forEach(entry => {
    const key = `${entry.employeeId}-${entry.index}`;
    if (!uniqueEntries.some(e => `${e.employeeId}-${e.index}` === key)) {
      uniqueEntries.push(entry);
    }
  });

  if (uniqueEntries.length === 0) {
    list.innerHTML = `<p class="muted">No schedule entries found for this month.</p>`;
    return;
  }

  list.innerHTML = uniqueEntries
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
    .map(entry => `
      <div class="schedule-card" onclick="openEmployeeProfile(${entry.employeeId})">
        <div class="employee-top">
          <div>
            <h3>${entry.employeeName}</h3>
            <p class="muted">${entry.type} | ${entry.startDate} to ${entry.endDate || entry.startDate}</p>
          </div>
        </div>

        <div class="employee-details">
          <div><span>Type</span>${entry.type}</div>
          <div><span>Hours</span>${entry.hours || "N/A"}</div>
          <div><span>Date</span>${entry.startDate}</div>
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
