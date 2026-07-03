const BACKUP_PREFIX = "supervisor-command-center-backup-";
const MAX_BACKUPS = 25;

async function chooseBackupFolder() {
  if (!window.showDirectoryPicker) {
    alert("Your browser does not support folder selection. Use Microsoft Edge or Chrome. Backup will fall back to Downloads.");
    return;
  }

  try {
    const handle = await window.showDirectoryPicker({
      mode: "readwrite"
    });

    await saveSetting("backupFolderHandle", handle);

    alert("Backup folder saved. Use Backup Now to save a backup there.");
  } catch (error) {
    console.log("Backup folder selection cancelled or blocked.", error);
  }
}

async function backupNow() {
  const employees = await getAllRecords("employees");

  const backup = {
    app: "Supervisor Command Center",
    backupType: "Full Backup",
    version: 1,
    exportedAt: new Date().toISOString(),
    employees: employees
  };

  const fileName = `${BACKUP_PREFIX}${getBackupTimestamp()}.json`;

  const folderHandle = await getSetting("backupFolderHandle");

  if (folderHandle && window.showDirectoryPicker) {
    try {
      const permission = await verifyFolderPermission(folderHandle);

      if (permission) {
        await writeBackupToFolder(folderHandle, fileName, backup);
        await cleanOldBackups(folderHandle);
        alert(`Backup saved:\n${fileName}`);
        return;
      }
    } catch (error) {
      console.error(error);
      alert("Could not write to the saved folder. Choose the backup folder again.");
      return;
    }
  }

  downloadBackupFile(backup, fileName);
  alert("Backup downloaded to your browser Downloads folder.");
}

async function verifyFolderPermission(folderHandle) {
  const options = { mode: "readwrite" };

  if ((await folderHandle.queryPermission(options)) === "granted") {
    return true;
  }

  if ((await folderHandle.requestPermission(options)) === "granted") {
    return true;
  }

  return false;
}

async function writeBackupToFolder(folderHandle, fileName, backup) {
  const fileHandle = await folderHandle.getFileHandle(fileName, {
    create: true
  });

  const writable = await fileHandle.createWritable();

  await writable.write(JSON.stringify(backup, null, 2));
  await writable.close();
}

async function cleanOldBackups(folderHandle) {
  let backups = [];

  for await (const [name, handle] of folderHandle.entries()) {
    if (handle.kind === "file" && name.startsWith(BACKUP_PREFIX) && name.endsWith(".json")) {
      backups.push(name);
    }
  }

  backups.sort().reverse();

  const oldBackups = backups.slice(MAX_BACKUPS);

  for (const fileName of oldBackups) {
    await folderHandle.removeEntry(fileName);
  }
}

function downloadBackupFile(backup, fileName) {
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.click();

  URL.revokeObjectURL(url);
}

function getBackupTimestamp() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");
  const second = String(now.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day}_${hour}-${minute}-${second}`;
}
