function loadDashboard() {
  document.getElementById("content").innerHTML = `
    <h2>Dashboard</h2>
    <p style="color:#9ca3af;">Supervisor quick reference and personnel management system.</p>

    <div class="dashboard-grid">
      <div class="stat-card">
        <div class="number">--</div>
        <div class="label">Employees</div>
      </div>

      <div class="stat-card">
        <div class="number">--</div>
        <div class="label">Reviews Due</div>
      </div>

      <div class="stat-card">
        <div class="number">--</div>
        <div class="label">Equipment Checks</div>
      </div>

      <div class="stat-card">
        <div class="number">--</div>
        <div class="label">Open Follow-Ups</div>
      </div>
    </div>

    <div class="card">
      <h3>Priority Items</h3>
      <p style="color:#9ca3af;">This area will later show upcoming reviews, expiring certifications, days off, and employee follow-ups.</p>
    </div>
  `;
}
