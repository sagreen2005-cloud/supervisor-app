function showPage(page) {
  switch (page) {
    case "dashboard":
      loadDashboard();
      break;

    case "dailyLog":
      loadDailyLogPage();
      break;

    case "employees":
      loadEmployeesPage();
      break;

    case "tasks":
      loadTasksPage();
      break;

    case "reportReviews":
      loadReportReviewsPage();
      break;

    case "performance":
      loadPerformancePage();
      break;

    case "settings":
      loadSettingsPage();
      break;

    default:
      document.getElementById("content").innerHTML = `
        <section class="card">
          <h2>Coming Soon</h2>
          <p class="muted">This section will be built later.</p>
        </section>
      `;
  }
}
