document.addEventListener("DOMContentLoaded", async () => {
  await openDatabase();

  await applySavedAppAppearance();

  showPage("dashboard");
});
