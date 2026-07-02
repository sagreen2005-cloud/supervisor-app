const evaluationCategories = [
  "Uniform & Equipment",
  "Orientation Skill",
  "Field Performance",
  "Knowledge of Department Policy & Procedure",
  "Self-Initiated Field Activity",
  "Investigative Procedures",
  "Report Writing",
  "Attitude & Relationships",
  "Training",
  "Attendance"
];

async function loadEvaluationsPage() {
  const employees = await getAllRecords("employees");

  document.getElementById("content").innerHTML = `
    <div class="page-header">
      <div>
        <h2>Evaluations</h2>
        <p>Track evaluation due dates, status, scores, goals, and supporting justification.</p>
      </div>
    </div>

    <section class="card">
      <h3>Create Evaluation</h3>

      <div class="form-grid">
        <select id="evalEmployeeId">
          <option value="">Select Employee</option>
          ${employees.map(employee => `
            <option value="${employee.id}">
              ${employee.rank || ""} ${employee.firstName} ${employee.lastName}
            </option>
          `).join("")}
        </select>

        <select id="evalType">
          <option value="Semi-Annual">Semi-Annual</option>
          <option value="Annual">Annual</option>
          <option value="Transfer">Transfer</option>
          <option value="Special">Special</option>
          <option value="Probation">Probation</option>
        </select>

        <input id="evalPeriodStart" type="date" />
        <input id="evalPeriodEnd" type="date" />
        <input id="evalDueDate" type="date" />

        <select id="evalStatus">
          <option value="Not Started">Not Started</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      <textarea id="evalSupervisorGoals" placeholder="Supervisor goals..."></textarea>
      <textarea id="evalEmployeeGoals" placeholder="Employee goals..."></textarea>
      <textarea id="evalComments" placeholder="General evaluation comments..."></textarea>

      <button onclick="createEvaluation()">Create Evaluation</button>
    </section>

    <section class="card">
      <h3>Evaluation History</h3>
      <input id="evaluationSearchBox" placeholder="Search evaluations..." />
      <div id="evaluationList"></div>
    </section>
  `;

  document.getElementById("evaluationSearchBox").addEventListener("input", renderEvaluations);
  await renderEvaluations();
}

async function createEvaluation() {
  const employees = await getAllRecords("employees");
  const employeeId = Number(document.getElementById("evalEmployeeId").value);
  const employee = employees.find(e => e.id === employeeId);

  if (!employee) {
    alert("Select an employee.");
    return;
  }

  const evaluation = {
    id: crypto.randomUUID(),
    type: document.getElementById("evalType").value,
    periodStart: document.getElementById("evalPeriodStart").value,
    periodEnd: document.getElementById("evalPeriodEnd").value,
    dueDate: document.getElementById("evalDueDate").value,
    status: document.getElementById("evalStatus").value,
    supervisorGoals: document.getElementById("evalSupervisorGoals").value.trim(),
    employeeGoals: document.getElementById("evalEmployeeGoals").value.trim(),
    comments: document.getElementById("evalComments").value.trim(),
    scores: evaluationCategories.map(category => ({
      category,
      rating: "N.O.",
      justification: ""
    })),
    createdAt: new Date().toISOString()
  };

  if (!evaluation.dueDate) {
    alert("Due date is required.");
    return;
  }

  if (!employee.evaluations) employee.evaluations = [];
  if (!employee.activity) employee.activity = [];

  employee.evaluations.push(evaluation);

  employee.activity.push({
    type: "Evaluation",
    note: `${evaluation.type} evaluation created | Due: ${evaluation.dueDate}`,
    date: new Date().toISOString()
  });

  employee.updatedAt = new Date().toISOString();

  await updateRecord("employees", employee);
  await loadEvaluationsPage();
}

async function renderEvaluations() {
  const employees = await getAllRecords("employees");
  const search = document.getElementById("evaluationSearchBox")?.value.toLowerCase() || "";
  const list = document.getElementById("evaluationList");

  let evaluations = [];

  employees.forEach(employee => {
    (employee.evaluations || []).forEach((evaluation, index) => {
      evaluations.push({
        ...evaluation,
        employeeId: employee.id,
        index,
        employeeName: `${employee.rank || ""} ${employee.firstName || ""} ${employee.lastName || ""}`.trim()
      });
    });
  });

  evaluations = evaluations
    .filter(evaluation => {
      const text = `
        ${evaluation.employeeName}
        ${evaluation.type}
        ${evaluation.status}
        ${evaluation.dueDate}
        ${evaluation.supervisorGoals}
        ${evaluation.employeeGoals}
        ${evaluation.comments}
      `.toLowerCase();

      return text.includes(search);
    })
    .sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0));

  if (evaluations.length === 0) {
    list.innerHTML = `<p class="muted">No evaluations found.</p>`;
    return;
  }

  list.innerHTML = evaluations.map(evaluation => `
    <div class="evaluation-card">
      <div class="employee-top">
        <div>
          <h3>${evaluation.employeeName}</h3>
          <p class="muted">${evaluation.type} | Due: ${evaluation.dueDate || "N/A"} | ${evaluation.status}</p>
        </div>

        <div class="file-actions">
          <button onclick="openEvaluation(${evaluation.employeeId}, ${evaluation.index})">Open</button>
          <button class="danger-btn" onclick="removeEvaluation(${evaluation.employeeId}, ${evaluation.index})">Remove</button>
        </div>
      </div>

      <div class="employee-details">
        <div><span>Period Start</span>${evaluation.periodStart || "N/A"}</div>
        <div><span>Period End</span>${evaluation.periodEnd || "N/A"}</div>
        <div><span>Status</span>${evaluation.status || "N/A"}</div>
      </div>

      ${evaluation.supervisorGoals ? `<p class="employee-note"><strong>Supervisor Goals:</strong><br>${evaluation.supervisorGoals}</p>` : ""}
    </div>
  `).join("");
}

async function openEvaluation(employeeId, evaluationIndex) {
  const employees = await getAllRecords("employees");
  const employee = employees.find(e => e.id === employeeId);
  const evaluation = employee.evaluations[evaluationIndex];

  document.getElementById("content").innerHTML = `
    <button onclick="loadEvaluationsPage()">← Back to Evaluations</button>

    <section class="card">
      <h2>${employee.rank || ""} ${employee.firstName} ${employee.lastName}</h2>
      <p class="muted">${evaluation.type} Evaluation | Due: ${evaluation.dueDate || "N/A"}</p>

      <div class="form-grid">
        <select id="editEvalStatus">
          <option value="Not Started" ${evaluation.status === "Not Started" ? "selected" : ""}>Not Started</option>
          <option value="In Progress" ${evaluation.status === "In Progress" ? "selected" : ""}>In Progress</option>
          <option value="Completed" ${evaluation.status === "Completed" ? "selected" : ""}>Completed</option>
        </select>

        <input id="editEvalDueDate" type="date" value="${evaluation.dueDate || ""}" />
      </div>
    </section>

    <section class="card">
      <h3>Evaluation Scores</h3>

      ${evaluation.scores.map((score, index) => `
        <div class="evaluation-score-block">
          <h4>${score.category}</h4>

          <select id="scoreRating${index}">
            <option value="3" ${score.rating === "3" ? "selected" : ""}>3 - Exemplary</option>
            <option value="2" ${score.rating === "2" ? "selected" : ""}>2 - UPD Standard</option>
            <option value="1" ${score.rating === "1" ? "selected" : ""}>1 - Needs Improvement</option>
            <option value="N.O." ${score.rating === "N.O." ? "selected" : ""}>N.O. - Not Observed</option>
          </select>

          <textarea id="scoreJustification${index}" placeholder="Justification of score...">${score.justification || ""}</textarea>
        </div>
      `).join("")}

      <textarea id="editSupervisorGoals" placeholder="Supervisor goals...">${evaluation.supervisorGoals || ""}</textarea>
      <textarea id="editEmployeeGoals" placeholder="Employee goals...">${evaluation.employeeGoals || ""}</textarea>
      <textarea id="editEvalComments" placeholder="Comments...">${evaluation.comments || ""}</textarea>

      <button onclick="saveEvaluation(${employeeId}, ${evaluationIndex})">Save Evaluation</button>
    </section>
  `;
}

async function saveEvaluation(employeeId, evaluationIndex) {
  const employees = await getAllRecords("employees");
  const employee = employees.find(e => e.id === employeeId);
  const evaluation = employee.evaluations[evaluationIndex];

  evaluation.status = document.getElementById("editEvalStatus").value;
  evaluation.dueDate = document.getElementById("editEvalDueDate").value;
  evaluation.supervisorGoals = document.getElementById("editSupervisorGoals").value.trim();
  evaluation.employeeGoals = document.getElementById("editEmployeeGoals").value.trim();
  evaluation.comments = document.getElementById("editEvalComments").value.trim();

  evaluation.scores = evaluation.scores.map((score, index) => ({
    category: score.category,
    rating: document.getElementById(`scoreRating${index}`).value,
    justification: document.getElementById(`scoreJustification${index}`).value.trim()
  }));

  evaluation.updatedAt = new Date().toISOString();

  employee.updatedAt = new Date().toISOString();

  await updateRecord("employees", employee);
  await openEvaluation(employeeId, evaluationIndex);
}

async function removeEvaluation(employeeId, evaluationIndex) {
  if (!confirm("Remove this evaluation?")) return;

  const employees = await getAllRecords("employees");
  const employee = employees.find(e => e.id === employeeId);

  employee.evaluations.splice(evaluationIndex, 1);
  employee.updatedAt = new Date().toISOString();

  await updateRecord("employees", employee);
  await renderEvaluations();
}
