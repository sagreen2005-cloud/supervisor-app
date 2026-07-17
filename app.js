document.addEventListener("DOMContentLoaded", async () => {
  if (hasAppPassword() && !isAppUnlocked()) {
    showAppLockScreen();
  }

  await openDatabase();
  await applySavedAppAppearance();
  showPage("dashboard");
  addHeaderLockButton();

  if (hasAppPassword() && !isAppUnlocked()) {
    showAppLockScreen();
  }
});
