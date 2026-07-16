function loadScheduleTab(employee) {
  if (!employee.schedule) employee.schedule = [];

  document.getElementById("employeeTabContent").innerHTML = `
    <section class="card">
      <h3>Add Schedule / Day-Off Entry</h3>

      <div class="form-grid">
        <select id="scheduleType">
          <option value="Vacation">Vacation</option>
          <option value="Sick Leave">Sick Leave</option>
          <option value="Training">Training</option>
          <option value="Court">Court</option>
          <option value="Comp Time">Comp Time</option>
          <option value="Regular Day Off">Regular Day Off</option>
          <option value="Holiday">Holiday</option>
          <option value="Overtime">Overtime</option>
          <option value="Early Departure">Early Departure</option>
          <option value="Late Arrival">Late Arrival</option>
          <option value="Shift Adjustment">Shift Adjustment</option>
          <option value="Other">Other</option>
        </select>

        <input id="scheduleStart" type="date" />
        <input id="scheduleStartTime" inputmode="numeric" maxlength="4" placeholder="Start time (2000)" />

        <input id="scheduleEnd" type="date" />
        <input id="scheduleEndTime" inputmode="numeric" maxlength="4" placeholder="End time (0600 or 2400)" />

        <input id="scheduleHours" type="number" step="0.25" placeholder="Hours" />

        <label class="schedule-all-day-label">
          <input id="scheduleAllDay" type="checkbox" />
          <span>All-day entry</span>
        </label>
      </div>

      <div class="schedule-time-shortcuts">
        <span class="muted">Start:</span>
        ${["0000","0600","0800","1200","1400","1600","1800","2000","2200","2400"]
          .map(value => `<button type="button" onclick="setScheduleTime('scheduleStartTime','${value}')">${value}</button>`)
          .join("")}
      </div>

      <div class="schedule-time-shortcuts">
        <span class="muted">End:</span>
        ${["0000","0200","0400","0600","0800","1200","1600","1800","2000","2200","2400"]
          .map(value => `<button type="button" onclick="setScheduleTime('scheduleEndTime','${value}')">${value}</button>`)
          .join("")}
      </div>

      <textarea id="scheduleNotes" placeholder="Notes, approval status, coverage, court case number, training location, etc."></textarea>

      <button onclick="addScheduleItem()">Add Schedule Entry</button>
    </section>

    <section class="card">
      <h3>Schedule / Days Off</h3>
      <div id="scheduleList"></div>
    </section>
  `;

  document.getElementById("scheduleAllDay").addEventListener("change", toggleScheduleTimeInputs);
  document.getElementById("scheduleStartTime").addEventListener("blur", normalizeScheduleTimeField);
  document.getElementById("scheduleEndTime").addEventListener("blur", normalizeScheduleTimeField);

  renderScheduleList(employee.schedule);
}

function toggleScheduleTimeInputs() {
  const allDay = document.getElementById("scheduleAllDay")?.checked;
  const start = document.getElementById("scheduleStartTime");
  const end = document.getElementById("scheduleEndTime");

  if (!start || !end) return;

  start.disabled = allDay;
  end.disabled = allDay;

  if (allDay) {
    start.value = "";
    end.value = "";
  }
}

function setScheduleTime(fieldId, value) {
  const field = document.getElementById(fieldId);
  if (!field) return;

  field.value = value;
  field.dispatchEvent(new Event("change"));
}

function normalizeScheduleTimeField(event) {
  const field = event.target;
  const normalized = normalizeMilitaryTime(field.value);

  if (field.value.trim() && normalized === null) {
    alert("Enter military time between 0000 and 2400.");
    field.focus();
    return;
  }

  field.value = normalized || "";
}

function normalizeMilitaryTime(value) {
  const raw = String(value || "").replace(/[^0-9]/g, "");
  if (!raw) return "";

  if (raw === "24" || raw === "240" || raw === "2400") return "2400";

  const padded = raw.padStart(4, "0");
  if (padded.length !== 4) return null;

  const hour = Number(padded.slice(0, 2));
  const minute = Number(padded.slice(2, 4));

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return padded;
}

function renderScheduleList(schedule) {
  const list = document.getElementById("scheduleList");

  if (!schedule || schedule.length === 0) {
    list.innerHTML = `<p class="muted">No schedule entries added yet.</p>`;
    return;
  }

  list.innerHTML = schedule
    .slice()
    .reverse()
    .map((item, reversedIndex) => {
      const index = schedule.length - 1 - reversedIndex;
      const timeLabel = formatScheduleTimeRange(item);

      return `
        <div class="schedule-card">
          <div class="employee-top">
            <div>
              <h3>${escapeScheduleHtml(item.type || "Schedule Entry")}</h3>
              <p class="muted">
                ${escapeScheduleHtml(item.startDate || "N/A")} to
                ${escapeScheduleHtml(item.endDate || item.startDate || "N/A")}
                ${timeLabel ? ` · ${escapeScheduleHtml(timeLabel)}` : ""}
              </p>
            </div>
            <button class="danger-btn" onclick="removeScheduleItem(${index})">Remove</button>
          </div>

          <div class="employee-details">
            <div><span>Start</span>${escapeScheduleHtml(item.startDate || "N/A")}</div>
            <div><span>End</span>${escapeScheduleHtml(item.endDate || item.startDate || "N/A")}</div>
            <div><span>Time</span>${escapeScheduleHtml(timeLabel || "All Day")}</div>
            <div><span>Hours</span>${escapeScheduleHtml(item.hours || "N/A")}</div>
          </div>

          ${item.notes ? `<p class="employee-note">${escapeScheduleHtml(item.notes)}</p>` : ""}
        </div>
      `;
    })
    .join("");
}

async function addScheduleItem() {
  const employees = await getAllRecords("employees");
  const employee = employees.find(e => e.id === selectedEmployeeId);

  if (!employee) {
    alert("Employee record not found.");
    return;
  }

  if (!employee.schedule) employee.schedule = [];
  if (!employee.activity) employee.activity = [];

  const allDay = document.getElementById("scheduleAllDay").checked;
  const startTime = allDay
    ? ""
    : normalizeMilitaryTime(document.getElementById("scheduleStartTime").value);

  const endTime = allDay
    ? ""
    : normalizeMilitaryTime(document.getElementById("scheduleEndTime").value);

  if (!allDay && startTime === null) {
    alert("Enter a valid start time between 0000 and 2400.");
    return;
  }

  if (!allDay && endTime === null) {
    alert("Enter a valid end time between 0000 and 2400.");
    return;
  }

  const startDate = document.getElementById("scheduleStart").value;
  let endDate = document.getElementById("scheduleEnd").value || startDate;

  if (!startDate) {
    alert("Start date is required.");
    return;
  }

  if (!allDay && startTime && endTime && endDate === startDate) {
    const startMinutes = militaryTimeToMinutes(startTime);
    const endMinutes = militaryTimeToMinutes(endTime);

    if (endMinutes < startMinutes || endTime === "2400") {
      if (endTime !== "2400") {
        endDate = addDaysToScheduleDate(startDate, 1);
      }
    }
  }

  const item = {
    type: document.getElementById("scheduleType").value,
    startDate,
    endDate,
    startTime: startTime || "",
    endTime: endTime || "",
    allDay,
    hours: document.getElementById("scheduleHours").value,
    notes: document.getElementById("scheduleNotes").value.trim(),
    createdAt: new Date().toISOString()
  };

  employee.schedule.push(item);

  const timeLabel = formatScheduleTimeRange(item);

  employee.activity.push({
    type: "Schedule",
    note: `${item.type} added: ${item.startDate}${item.endDate ? " to " + item.endDate : ""}${timeLabel ? " " + timeLabel : ""}`,
    date: new Date().toISOString()
  });

  employee.updatedAt = new Date().toISOString();

  await updateRecord("employees", employee);
  await showEmployeeTab("schedule");
}

async function removeScheduleItem(index) {
  if (!confirm("Remove this schedule entry?")) return;

  const employees = await getAllRecords("employees");
  const employee = employees.find(e => e.id === selectedEmployeeId);

  if (!employee) return;

  if (!employee.schedule) employee.schedule = [];
  if (!employee.activity) employee.activity = [];

  const removed = employee.schedule[index];

  employee.schedule.splice(index, 1);

  employee.activity.push({
    type: "Schedule",
    note: `Schedule entry removed: ${removed?.type || "Unknown entry"}`,
    date: new Date().toISOString()
  });

  employee.updatedAt = new Date().toISOString();

  await updateRecord("employees", employee);
  await showEmployeeTab("schedule");
}

function formatScheduleTimeRange(item) {
  if (item.allDay) return "All Day";

  const start = item.startTime || "";
  const end = item.endTime || "";

  if (!start && !end) return "";
  if (start && end) return `${start}-${end}`;
  return start || end;
}

function militaryTimeToMinutes(value) {
  if (value === "2400") return 1440;
  const normalized = normalizeMilitaryTime(value);
  if (!normalized) return 0;

  return Number(normalized.slice(0, 2)) * 60 + Number(normalized.slice(2, 4));
}

function addDaysToScheduleDate(value, days) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function escapeScheduleHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
