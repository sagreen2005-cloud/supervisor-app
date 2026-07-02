async function loadReportReviewsPage() {
  const employees = await getAllRecords("employees");

  document.getElementById("content").innerHTML = `
    <div class="page-header">
      <div>
        <h2>Report Reviews</h2>
        <p>Track report quality, corrections, coaching, and recurring issues.</p>
      </div>
    </div>

    <section class="card">
      <h3>Add Report Review</h3>

      <div class="form-grid">
        <input id="reviewCaseNumber" placeholder="Case Number" />

        <select id="reviewEmployeeId">
          <option value="">Select Employee</option>
          ${employees.map(employee => `
            <option value="${employee.id}">
              ${employee.rank || ""} ${employee.firstName} ${employee.lastName}
            </option>
          `).join("")}
        </select>

        <input id="reviewDate" type="date" />

        <select id="reviewType">
          <option value="DUI">DUI</option>
          <option value="Domestic Violence">Domestic Violence</option>
          <option value="Crash">Crash</option>
          <option value="Theft">Theft</option>
          <option value="Assault">Assault</option>
          <option value="Welfare Check">Welfare Check</option>
          <option value="Drug Case">Drug Case</option>
          <option value="Weapons Offense">Weapons Offense</option>
          <option value="Traffic">Traffic</option>
          <option value="Other">Other</option>
        </select>

        <select id="reviewRating">
          <option value="Excellent">Excellent</option>
          <option value="Acceptable">Acceptable</option>
          <option value="Needs Correction">Needs Correction</option>
        </select>

        <select id="reviewReturned">
          <option value="No">Returned for Correction? No</option>
          <option value="Yes">Returned for Correction? Yes</option>
        </select>
      </div>

      <h4>Issues / Coaching Topics</h4>

      <div class="checkbox-grid">
        <label><input type="checkbox" value="Grammar" class="reviewIssue"> Grammar</label>
        <label><input type="checkbox" value="Narrative" class="reviewIssue"> Narrative</label>
        <label><input type="checkbox" value="Probable Cause" class="reviewIssue"> Probable Cause</label>
        <label><input type="checkbox" value="Elements of Crime" class="reviewIssue"> Elements of Crime</label>
        <label><input type="checkbox" value="Evidence" class="reviewIssue"> Evidence</label>
        <label><input type="checkbox" value="Citations" class="reviewIssue"> Citations</label>
        <label><input type="checkbox" value="Formatting" class="reviewIssue"> Formatting</label>
        <label><input type="checkbox" value="Officer Safety" class="reviewIssue"> Officer Safety</label>
        <label><input type="checkbox" value="Follow-Up Needed" class="reviewIssue"> Follow-Up Needed</label>
        <label><input type="checkbox" value="Routing" class="reviewIssue"> Routing</label>
      </div>

      <textarea id="reviewNotes" placeholder="Coaching notes, corrections needed, positive feedback, or follow-up instructions..."></textarea>

      <button onclick="addReportReview()">Save Report Review</button>
    </section>

    <section class="card">
      <h3>Report Review History</h3>
      <input id="reviewSearchBox" placeholder="Search case number, employee, report type, issue, or notes..." />
      <div id="reportReviewList"></div>
    </section>
  `;

  document.getElementById("reviewDate").value = new Date().toISOString().slice(0, 10);
  document.getElementById("reviewSearchBox").addEventListener("input", renderReportReviews);

  await renderReportReviews();
}

async function addReportReview() {
  const employees = await getAllRecords("employees");
  const employeeId = Number(document.getElementById("reviewEmployeeId").value);
  const employee = employees.find(e => e.id === employeeId);

  if (!employee) {
    alert("Select an employee.");
    return;
  }

  const issues = Array.from(document.querySelectorAll(".reviewIssue:checked"))
    .map(item => item.value);

  const review = {
    caseNumber: document.getElementById("reviewCaseNumber").value.trim(),
    reportType: document.getElementById("reviewType").value,
    reviewDate: document.getElementById("reviewDate").value,
    rating: document.getElementById("reviewRating").value,
    returnedForCorrection: document.getElementById("reviewReturned").value,
    issues: issues,
    notes: document.getElementById("reviewNotes").value.trim(),
    createdAt: new Date().toISOString()
  };

  if (!review.caseNumber) {
    alert("Case number is required.");
    return;
  }

  if (!employee.reportReviews) employee.reportReviews = [];
  if (!employee.activity) employee.activity = [];

  employee.reportReviews.push(review);

  employee.activity.push({
    type: "Report Review",
    note: `${review.caseNumber} - ${review.rating}${issues.length ? " | Issues: " + issues.join(", ") : ""}`,
    date: new Date().toISOString()
  });

  employee.updatedAt = new Date().toISOString();

  await updateRecord("employees", employee);
  await loadReportReviewsPage();
}

async function renderReportReviews() {
  const employees = await getAllRecords("employees");
  const search = document.getElementById("reviewSearchBox")?.value.toLowerCase() || "";
  const list = document.getElementById("reportReviewList");

  let reviews = [];

  employees.forEach(employee => {
    const employeeReviews = employee.reportReviews || [];

    employeeReviews.forEach((review, index) => {
      reviews.push({
        ...review,
        index,
        employeeId: employee.id,
        employeeName: `${employee.rank || ""} ${employee.firstName || ""} ${employee.lastName || ""}`.trim()
      });
    });
  });

  reviews = reviews
    .filter(review => {
      const text = `
        ${review.caseNumber}
        ${review.employeeName}
        ${review.reportType}
        ${review.rating}
        ${review.returnedForCorrection}
        ${(review.issues || []).join(" ")}
        ${review.notes}
      `.toLowerCase();

      return text.includes(search);
    })
    .sort((a, b) => new Date(b.reviewDate || b.createdAt) - new Date(a.reviewDate || a.createdAt));

  if (reviews.length === 0) {
    list.innerHTML = `<p class="muted">No report reviews found.</p>`;
    return;
  }

  list.innerHTML = reviews.map(review => `
    <div class="review-card">
      <div class="employee-top">
        <div>
          <h3>${review.caseNumber} — ${review.reportType}</h3>
          <p class="muted">${review.employeeName} | ${review.reviewDate || "No date"}</p>
        </div>
        <button class="danger-btn" onclick="removeReportReview(${review.employeeId}, ${review.index})">Remove</button>
      </div>

      <div class="employee-details">
        <div><span>Rating</span>${review.rating || "N/A"}</div>
        <div><span>Returned</span>${review.returnedForCorrection || "N/A"}</div>
        <div><span>Issues</span>${(review.issues || []).length}</div>
      </div>

      ${(review.issues || []).length ? `<p class="employee-note"><strong>Issues:</strong> ${(review.issues || []).join(", ")}</p>` : ""}
      ${review.notes ? `<p class="employee-note">${review.notes}</p>` : ""}
    </div>
  `).join("");
}

async function removeReportReview(employeeId, reviewIndex) {
  if (!confirm("Remove this report review?")) return;

  const employees = await getAllRecords("employees");
  const employee = employees.find(e => e.id === employeeId);

  if (!employee || !employee.reportReviews) return;

  const removed = employee.reportReviews[reviewIndex];
  employee.reportReviews.splice(reviewIndex, 1);

  if (!employee.activity) employee.activity = [];

  employee.activity.push({
    type: "Report Review",
    note: `Report review removed: ${removed?.caseNumber || "Unknown case"}`,
    date: new Date().toISOString()
  });

  employee.updatedAt = new Date().toISOString();

  await updateRecord("employees", employee);
  await renderReportReviews();
}
