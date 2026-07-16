document.addEventListener("DOMContentLoaded", async () => {
  await openDatabase();

  await applySavedDepartmentBranding();

  showPage("dashboard");
});
