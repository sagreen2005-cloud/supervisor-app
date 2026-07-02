async function loadTasksPage() {
  const employees = await getAllRecords("employees");

  document.getElementById("content").innerHTML = `
    <div class="page-header">
      <div>
        <h2>Tasks & Follow-Ups</h2>
        <p>Track supervisor reminders, follow-ups, and employee-specific tasks.</p>
      </div>
    </div>

    <section class="card">
      <h3>Add Task / Follow-Up</h3>

      <div class="form-grid">
        <select id="taskEmployeeId">
          <option value="">General Task / No Employee</option>
          ${employees.map(employee => `
            <option value="${employee.id}">
              ${employee.rank || ""} ${employee.firstName} ${employee.lastName}
            </option>
          `).join("")}
        </select>

        <select id="taskPriority">
          <option value="Normal">Normal</option>
          <option value="High">High</option>
          <option value="Critical">Critical</option>
          <option value="Low">Low</option>
        </select>

        <select id="taskCategory">
          <option value="Follow-Up">Follow-Up</option>
          <option value="Report Review">Report Review</option>
          <option value="Performance">Performance</option>
          <option value="Equipment">Equipment</option>
          <option value="Training">Training</option>
          <option value="Schedule">Schedule</option>
          <option value="Evaluation">Evaluation</option>
          <option value="One-on-One">One-on-One</option>
          <option value="Other">Other</option>
        </select>

        <input id="taskDueDate" type="date" />
      </div>

      <input id="taskTitle" placeholder="Task title" />
      <textarea id="taskNotes" placeholder="Details, instructions, or follow-up notes..."></textarea>

      <button onclick="addTask()">Save Task</button>
    </section>

    <section class="card">
      <h3>Search Timelines / Notes / Tasks</h3>
      <input id="timelineSearchBox" placeholder="Search across employee timelines, performance, reports, training, equipment, schedule, and tasks..." />
      <div id="timelineSearchResults"></div>
    </section>

    <section class="card">
      <h3>Open Tasks</h3>
      <div id="taskList"></div>
    </section>
  `;

  document.getElementById("timelineSearchBox").addEventListener("input", renderTimelineSearch);
  await renderTasks();
}

async function addTask() {
  const employees = await getAllRecords("employees");
  const employeeIdValue = document.getElementById("taskEmployeeId").value;
  const employeeId = employeeIdValue ? Number(employeeIdValue) : null;

  const task = {
    id: crypto.randomUUID(),
    employeeId: employeeId,
    title: document.getElementById("taskTitle").value.trim(),
    category: document.getElementById("taskCategory").value,
    priority: document.getElementById("taskPriority").value,
    dueDate: document.getElementById("taskDueDate").value,
    notes: document.getElementById("taskNotes").value.trim(),
    completed: false,
    createdAt: new Date().toISOString(),
    completedAt: null
  };

  if (!task.title) {
    alert("Task title is required.");
    return;
  }

  const systemEmployee = employees[0];

  if (!systemEmployee) {
    alert("Add at least one employee first.");
    return;
  }

  if (!systemEmployee.tasks) systemEmployee.tasks = [];

  systemEmployee.tasks.push(task);
  systemEmployee.updatedAt = new Date().toISOString();

  if (employeeId) {
    const employee = employees.find(e => e.id === employeeId);

    if (employee) {
      if (!employee.activity) employee.activity = [];

      employee.activity.push({
        type: "Task",
        note: `${task.title}${task.dueDate ? " | Due: " + task.dueDate : ""}`,
        date: new Date().toISOString()
      });

      employee.updatedAt = new Date().toISOString();

      if (employee.id === systemEmployee.id) {
        await updateRecord("employees", systemEmployee);
      } else {
        await updateRecord("employees", employee);
        await updateRecord("employees", systemEmployee);
      }
    }
  } else {
    await updateRecord("employees", systemEmployee);
  }

  await loadTasksPage();
}

async function renderTasks() {
  const employees = await getAllRecords("employees");
  const list = document.getElementById("taskList");

  let tasks = [];

  employees.forEach(employee => {
    const employeeTasks = employee.tasks || [];

    employeeTasks.forEach((task, index) => {
      const linkedEmployee = employees.find(e => e.id === task.employeeId);

      tasks.push({
        ...task,
        storageEmployeeId: employee.id,
        index,
        employeeName: linkedEmployee
          ? `${linkedEmployee.rank || ""} ${linkedEmployee.firstName || ""} ${linkedEmployee.lastName || ""}`.trim()
          : "General Task"
      });
    });
  });

  tasks = tasks
    .filter(task => !task.completed)
    .sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });

  if (tasks.length === 0) {
    list.innerHTML = `<p class="muted">No open tasks.</p>`;
    return;
  }

  list.innerHTML = tasks.map(task => `
    <div class="task-card ${task.priority === "Critical" ? "critical-task" : ""} ${task.priority === "High" ? "high-task" : ""}">
      <div class="employee-top">
        <div>
          <h3>${task.title}</h3>
          <p class="muted">${task.employeeName} | ${task.category} | Due: ${task.dueDate || "No due date"}</p>
        </div>
        <button onclick="completeTask(${task.storageEmployeeId}, ${task.index})">Complete</button>
      </div>

      <div class="employee-details">
        <div><span>Priority</span>${task.priority || "Normal"}</div>
        <div><span>Category</span>${task.category || "N/A"}</div>
        <div><span>Created</span>${task.createdAt ? new Date(task.createdAt).toLocaleDateString() : "N/A"}</div>
      </div>

      ${task.notes ? `<p class="employee-note">${task.notes}</p>` : ""}
    </div>
  `).join("");
}

async function completeTask(storageEmployeeId, taskIndex) {
  if (!confirm("Mark this task complete?")) return;

  const employees = await getAllRecords("employees");
  const storageEmployee = employees.find(e => e.id === storageEmployeeId);

  if (!storageEmployee || !storageEmployee.tasks) return;

  const task = storageEmployee.tasks[taskIndex];

  task.completed = true;
  task.completedAt = new Date().toISOString();

  if (task.employeeId) {
    const linkedEmployee = employees.find(e => e.id === task.employeeId);

    if (linkedEmployee) {
      if (!linkedEmployee.activity) linkedEmployee.activity = [];

      linkedEmployee.activity.push({
        type: "Task Completed",
        note: `${task.title}${task.notes ? " | " + task.notes : ""}`,
        date: new Date().toISOString()
      });

      linkedEmployee.updatedAt = new Date().toISOString();

      if (linkedEmployee.id !== storageEmployee.id) {
        await updateRecord("employees", linkedEmployee);
      }
    }
  }

  storageEmployee.updatedAt = new Date().toISOString();

  await updateRecord("employees", storageEmployee);
  await loadTasksPage();
}

async function renderTimelineSearch() {
  const employees = await getAllRecords("employees");
  const search = document.getElementById("timelineSearchBox")?.value.toLowerCase() || "";
  const results = document.getElementById("timelineSearchResults");

  if (!search) {
    results.innerHTML = `<p class="muted">Enter a search term to search across timelines and records.</p>`;
    return;
  }

  let matches = [];

  employees.forEach(employee => {
    const employeeName = `${employee.rank || ""} ${employee.firstName || ""} ${employee.lastName || ""}`.trim();

    (employee.activity || []).forEach(item => {
      const text = `${employeeName} ${item.type} ${item.note} ${item.date}`.toLowerCase();
      if (text.includes(search)) {
        matches.push({
          employeeId: employee.id,
          employeeName,
          source: "Timeline",
          title: item.type,
          date: item.date,
          body: item.note
        });
      }
    });

    (employee.performance || []).forEach(item => {
      const text = `${employeeName} ${item.category} ${item.rating} ${item.type} ${item.notes}`.toLowerCase();
      if (text.includes(search)) {
        matches.push({
          employeeId: employee.id,
          employeeName,
          source: "Performance",
          title: `${item.category} | ${item.rating}`,
          date: item.date || item.createdAt,
          body: item.notes
        });
      }
    });

    (employee.reportReviews || []).forEach(item => {
      const text = `${employeeName} ${item.caseNumber} ${item.reportType} ${item.rating} ${(item.issues || []).join(" ")} ${item.notes}`.toLowerCase();
      if (text.includes(search)) {
        matches.push({
          employeeId: employee.id,
          employeeName,
          source: "Report Review",
          title: `${item.caseNumber} | ${item.reportType}`,
          date: item.reviewDate || item.createdAt,
          body: `${item.rating} | ${(item.issues || []).join(", ")} ${item.notes || ""}`
        });
      }
    });

    (employee.training || []).forEach(item => {
      const text = `${employeeName} ${item.name} ${item.provider} ${item.completedDate} ${item.expiresDate} ${item.notes}`.toLowerCase();
      if (text.includes(search)) {
        matches.push({
          employeeId: employee.id,
          employeeName,
          source: "Training",
          title: item.name,
          date: item.completedDate || item.createdAt,
          body: `${item.provider || ""} ${item.notes || ""}`
        });
      }
    });

    (employee.equipment || []).forEach(item => {
      const text = `${employeeName} ${item.name} ${item.serial} ${item.issuedDate} ${item.dueDate} ${item.notes}`.toLowerCase();
      if (text.includes(search)) {
        matches.push({
          employeeId: employee.id,
          employeeName,
          source: "Equipment",
          title: item.name,
          date: item.issuedDate || item.createdAt,
          body: `Serial: ${item.serial || "N/A"} ${item.notes || ""}`
        });
      }
    });

    (employee.schedule || []).forEach(item => {
      const text = `${employeeName} ${item.type} ${item.startDate} ${item.endDate} ${item.hours} ${item.notes}`.toLowerCase();
      if (text.includes(search)) {
        matches.push({
          employeeId: employee.id,
          employeeName,
          source: "Schedule",
          title: item.type,
          date: item.startDate || item.createdAt,
          body: `${item.startDate || ""} to ${item.endDate || ""} ${item.notes || ""}`
        });
      }
    });

    (employee.tasks || []).forEach(item => {
      const text = `${employeeName} ${item.title} ${item.category} ${item.priority} ${item.dueDate} ${item.notes}`.toLowerCase();
      if (text.includes(search)) {
        matches.push({
          employeeId: item.employeeId || employee.id,
          employeeName,
          source: "Task",
          title: item.title,
          date: item.dueDate || item.createdAt,
          body: `${item.priority || ""} ${item.category || ""} ${item.notes || ""}`
        });
      }
    });
  });

  matches = matches
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    .slice(0, 50);

  if (matches.length === 0) {
    results.innerHTML = `<p class="muted">No matches found.</p>`;
    return;
  }

  results.innerHTML = matches.map(match => `
    <div class="search-result-card" onclick="openEmployeeProfile(${match.employeeId})">
      <div class="employee-top">
        <div>
          <h3>${match.source}: ${match.title || "Result"}</h3>
          <p class="muted">${match.employeeName} | ${match.date ? new Date(match.date).toLocaleDateString() : "No date"}</p>
        </div>
      </div>
      <p class="employee-note">${match.body || ""}</p>
    </div>
  `).join("");
}
