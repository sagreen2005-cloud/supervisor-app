const SCC_SECURITY_KEY = "sccAppSecurity";
const SCC_UNLOCKED_KEY = "sccSessionUnlocked";

function getSecuritySettings() {
  try {
    return JSON.parse(localStorage.getItem(SCC_SECURITY_KEY) || "null");
  } catch {
    return null;
  }
}

function hasAppPassword() {
  const settings = getSecuritySettings();
  return Boolean(settings?.enabled && settings?.hash && settings?.salt);
}

function isAppUnlocked() {
  return !hasAppPassword() || sessionStorage.getItem(SCC_UNLOCKED_KEY) === "true";
}

function bytesToBase64(bytes) {
  let binary = "";
  bytes.forEach(byte => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function base64ToBytes(value) {
  const binary = atob(value);
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

async function deriveCredentialHash(credential, saltBytes) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(credential),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations: 210000,
      hash: "SHA-256"
    },
    keyMaterial,
    256
  );

  return bytesToBase64(new Uint8Array(bits));
}

function validateCredential(value) {
  const credential = String(value || "");
  const isSixDigitPin = /^\d{6}$/.test(credential);
  const isPassword = credential.length >= 6 && !/^\d+$/.test(credential);

  if (!isSixDigitPin && !isPassword) {
    return {
      valid: false,
      message: "Use exactly 6 numbers for a PIN, or a password with at least 6 characters that includes a letter or symbol."
    };
  }

  return { valid: true, type: isSixDigitPin ? "pin" : "password" };
}

async function saveAppCredential(credential) {
  const validation = validateCredential(credential);
  if (!validation.valid) throw new Error(validation.message);

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await deriveCredentialHash(credential, salt);

  localStorage.setItem(SCC_SECURITY_KEY, JSON.stringify({
    enabled: true,
    type: validation.type,
    salt: bytesToBase64(salt),
    hash,
    updatedAt: new Date().toISOString()
  }));

  sessionStorage.setItem(SCC_UNLOCKED_KEY, "true");
}

async function verifyAppCredential(credential) {
  const settings = getSecuritySettings();
  if (!settings?.enabled) return true;

  const attemptedHash = await deriveCredentialHash(
    String(credential || ""),
    base64ToBytes(settings.salt)
  );

  return attemptedHash === settings.hash;
}

function removeAppCredential() {
  localStorage.removeItem(SCC_SECURITY_KEY);
  sessionStorage.removeItem(SCC_UNLOCKED_KEY);
}

function lockApp() {
  if (!hasAppPassword()) return;
  sessionStorage.removeItem(SCC_UNLOCKED_KEY);
  showAppLockScreen();
}

function showAppLockScreen() {
  if (!hasAppPassword()) {
    revealAppShell();
    return;
  }

  document.body.classList.add("app-is-locked");
  document.getElementById("appLockOverlay")?.remove();

  const settings = getSecuritySettings();
  const overlay = document.createElement("div");
  overlay.id = "appLockOverlay";
  overlay.className = "app-lock-overlay";
  overlay.innerHTML = `
    <div class="app-lock-card">
      <div class="app-lock-emblem">SCC</div>
      <h1>Supervisor Command Center</h1>
      <p>Enter your ${settings?.type === "pin" ? "6-digit PIN" : "password"} to continue.</p>

      <form id="appUnlockForm" autocomplete="off">
        <label for="appUnlockCredential">${settings?.type === "pin" ? "PIN" : "Password"}</label>
        <div class="app-lock-input-row">
          <input
            id="appUnlockCredential"
            type="password"
            ${settings?.type === "pin" ? 'inputmode="numeric" maxlength="6" pattern="[0-9]*"' : ''}
            autocomplete="current-password"
            autofocus
          />
          <button type="button" class="app-password-toggle" onclick="toggleCredentialVisibility('appUnlockCredential', this)">Show</button>
        </div>
        <div id="appUnlockError" class="app-lock-error" role="alert"></div>
        <button type="submit" class="app-unlock-button">Unlock</button>
      </form>
      <div class="app-lock-note">Your records remain stored locally on this computer.</div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.getElementById("appUnlockForm")?.addEventListener("submit", handleUnlockSubmit);
  setTimeout(() => document.getElementById("appUnlockCredential")?.focus(), 0);
}

async function handleUnlockSubmit(event) {
  event.preventDefault();
  const input = document.getElementById("appUnlockCredential");
  const error = document.getElementById("appUnlockError");
  const button = event.currentTarget.querySelector("button[type='submit']");

  if (button) {
    button.disabled = true;
    button.textContent = "Checking…";
  }

  const valid = await verifyAppCredential(input?.value || "");

  if (valid) {
    sessionStorage.setItem(SCC_UNLOCKED_KEY, "true");
    document.getElementById("appLockOverlay")?.remove();
    document.body.classList.remove("app-is-locked");
    revealAppShell();
  } else {
    if (error) error.textContent = "Incorrect PIN or password.";
    if (input) {
      input.value = "";
      input.focus();
    }
  }

  if (button) {
    button.disabled = false;
    button.textContent = "Unlock";
  }
}

function revealAppShell() {
  document.body.classList.remove("app-is-locked");
  document.getElementById("appLockOverlay")?.remove();
  document.querySelector(".app-header")?.removeAttribute("aria-hidden");
  document.getElementById("container")?.removeAttribute("aria-hidden");
}

function toggleCredentialVisibility(inputId, button) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.type = input.type === "password" ? "text" : "password";
  if (button) button.textContent = input.type === "password" ? "Show" : "Hide";
}

function addHeaderLockButton() {
  if (!hasAppPassword()) return;
  const actions = document.querySelector(".header-actions");
  if (!actions || document.getElementById("manualAppLockButton")) return;

  const button = document.createElement("button");
  button.id = "manualAppLockButton";
  button.type = "button";
  button.textContent = "Lock App";
  button.onclick = lockApp;
  actions.prepend(button);
}

function renderSecuritySettingsSection() {
  const settings = getSecuritySettings();
  const enabled = hasAppPassword();
  const container = document.getElementById("securitySettingsMount");
  if (!container) return;

  container.innerHTML = `
    <section class="card">
      <div class="security-settings-heading">
        <div>
          <h3>App Lock</h3>
          <p class="muted">Require a 6-digit PIN or password whenever a new browser session opens the app.</p>
        </div>
        <span class="security-status ${enabled ? "enabled" : "disabled"}">${enabled ? "Enabled" : "Not Set"}</span>
      </div>

      ${enabled ? `
        <div class="security-current-state">
          <strong>Current lock:</strong> ${settings?.type === "pin" ? "6-digit PIN" : "Password"}
        </div>

        <div class="security-form-grid">
          <div>
            <label for="securityCurrentCredential">Current ${settings?.type === "pin" ? "PIN" : "password"}</label>
            <div class="app-lock-input-row">
              <input id="securityCurrentCredential" type="password" autocomplete="current-password" />
              <button type="button" class="secondary-btn app-password-toggle" onclick="toggleCredentialVisibility('securityCurrentCredential', this)">Show</button>
            </div>
          </div>
          <div>
            <label for="securityNewCredential">New PIN or password</label>
            <div class="app-lock-input-row">
              <input id="securityNewCredential" type="password" autocomplete="new-password" />
              <button type="button" class="secondary-btn app-password-toggle" onclick="toggleCredentialVisibility('securityNewCredential', this)">Show</button>
            </div>
          </div>
          <div>
            <label for="securityConfirmCredential">Confirm new PIN or password</label>
            <input id="securityConfirmCredential" type="password" autocomplete="new-password" />
          </div>
        </div>

        <p class="security-help">A PIN must be exactly 6 numbers. A password must be at least 6 characters and include a letter or symbol.</p>
        <div class="quick-actions">
          <button type="button" onclick="changeAppCredential()">Change App Lock</button>
          <button type="button" class="secondary-btn" onclick="lockApp()">Lock Now</button>
          <button type="button" class="danger-btn" onclick="disableAppCredential()">Remove App Lock</button>
        </div>
      ` : `
        <div class="security-form-grid">
          <div>
            <label for="securityNewCredential">Create PIN or password</label>
            <div class="app-lock-input-row">
              <input id="securityNewCredential" type="password" autocomplete="new-password" />
              <button type="button" class="secondary-btn app-password-toggle" onclick="toggleCredentialVisibility('securityNewCredential', this)">Show</button>
            </div>
          </div>
          <div>
            <label for="securityConfirmCredential">Confirm PIN or password</label>
            <input id="securityConfirmCredential" type="password" autocomplete="new-password" />
          </div>
        </div>

        <p class="security-help">Use exactly 6 numbers for a PIN, or use a password of at least 6 characters containing a letter or symbol.</p>
        <button type="button" onclick="enableAppCredential()">Enable App Lock</button>
      `}
    </section>
  `;
}

async function enableAppCredential() {
  const credential = document.getElementById("securityNewCredential")?.value || "";
  const confirmCredential = document.getElementById("securityConfirmCredential")?.value || "";

  if (credential !== confirmCredential) {
    alert("The PIN or passwords do not match.");
    return;
  }

  try {
    await saveAppCredential(credential);
    addHeaderLockButton();
    renderSecuritySettingsSection();
    alert("App lock enabled.");
  } catch (error) {
    alert(error.message);
  }
}

async function changeAppCredential() {
  const current = document.getElementById("securityCurrentCredential")?.value || "";
  const next = document.getElementById("securityNewCredential")?.value || "";
  const confirmNext = document.getElementById("securityConfirmCredential")?.value || "";

  if (!(await verifyAppCredential(current))) {
    alert("The current PIN or password is incorrect.");
    return;
  }

  if (next !== confirmNext) {
    alert("The new PIN or passwords do not match.");
    return;
  }

  try {
    await saveAppCredential(next);
    renderSecuritySettingsSection();
    alert("App lock changed.");
  } catch (error) {
    alert(error.message);
  }
}

async function disableAppCredential() {
  const current = document.getElementById("securityCurrentCredential")?.value || "";
  if (!(await verifyAppCredential(current))) {
    alert("Enter the current PIN or password before removing the app lock.");
    return;
  }

  if (!confirm("Remove the app lock from Supervisor Command Center?")) return;
  removeAppCredential();
  document.getElementById("manualAppLockButton")?.remove();
  renderSecuritySettingsSection();
  alert("App lock removed.");
}
