async function loadFilesPage() {
  const employees = await getAllRecords("employees");

  document.getElementById("content").innerHTML = `
    <div class="page-header">
      <div>
        <h2>Files</h2>
        <p>Store local files and attach them to employees for quick reference.</p>
      </div>
    </div>

    <section class="card">
      <h3>Add File</h3>

      <div class="form-grid">
        <select id="fileEmployeeId">
          <option value="">General File / No Employee</option>
          ${employees.map(employee => `
            <option value="${employee.id}">
              ${employee.rank || ""} ${employee.firstName} ${employee.lastName}
            </option>
          `).join("")}
        </select>

        <select id="fileCategory">
          <option value="Evaluation">Evaluation</option>
          <option value="Training Certificate">Training Certificate</option>
          <option value="Commendation">Commendation</option>
          <option value="Counseling">Counseling</option>
          <option value="Discipline">Discipline</option>
          <option value="Equipment">Equipment</option>
          <option value="Policy">Policy</option>
          <option value="Schedule">Schedule</option>
          <option value="Other">Other</option>
        </select>

        <input id="fileTitle" placeholder="File title" />
      </div>

      <input id="fileInput" type="file" />
      <textarea id="fileNotes" placeholder="Notes, description, date, or reason this file matters..."></textarea>

      <button onclick="saveFileRecord()">Save File</button>
    </section>

    <section class="card">
      <h3>File Search</h3>
      <input id="fileSearchBox" placeholder="Search by title, employee, category, file name, or notes..." />
      <div id="fileList"></div>
    </section>
  `;

  document.getElementById("fileSearchBox").addEventListener("input", renderFiles);
  await renderFiles();
}

async function saveFileRecord() {
  const employees = await getAllRecords("employees");
  const employeeIdValue = document.getElementById("fileEmployeeId").value;
  const employeeId = employeeIdValue ? Number(employeeIdValue) : null;
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];

  if (!file) {
    alert("Select a file first.");
    return;
  }

  const title = document.getElementById("fileTitle").value.trim();

  if (!title) {
    alert("File title is required.");
    return;
  }

  const fileData = await fileToBase64(file);

  const record = {
    id: crypto.randomUUID(),
    employeeId: employeeId,
    title: title,
    category: document.getElementById("fileCategory").value,
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    fileData: fileData,
    notes: document.getElementById("fileNotes").value.trim(),
    createdAt: new Date().toISOString()
  };

  const systemEmployee = employees[0];

  if (!systemEmployee) {
    alert("Add at least one employee first.");
    return;
  }

  if (!systemEmployee.files) systemEmployee.files = [];

  systemEmployee.files.push(record);
  systemEmployee.updatedAt = new Date().toISOString();

  if (employeeId) {
    const employee = employees.find(e => e.id === employeeId);

    if (employee) {
      if (!employee.activity) employee.activity = [];

      employee.activity.push({
        type: "File",
        note: `${record.category}: ${record.title} (${record.fileName})`,
        date: new Date().toISOString()
      });

      employee.updatedAt = new Date().toISOString();

      if (employee.id !== systemEmployee.id) {
        await updateRecord("employees", employee);
      }
    }
  }

  await updateRecord("employees", systemEmployee);
  await loadFilesPage();
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);

    reader.readAsDataURL(file);
  });
}

async function renderFiles() {
  const employees = await getAllRecords("employees");
  const search = document.getElementById("fileSearchBox")?.value.toLowerCase() || "";
  const list = document.getElementById("fileList");

  const files = getAllStoredFiles(employees)
    .filter(file => {
      const text = `
        ${file.title}
        ${file.category}
        ${file.fileName}
        ${file.employeeName}
        ${file.notes}
      `.toLowerCase();

      return text.includes(search);
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (files.length === 0) {
    list.innerHTML = `<p class="muted">No files found.</p>`;
    return;
  }

  list.innerHTML = files.map(file => renderFileCard(file)).join("");
}

function getAllStoredFiles(employees) {
  let files = [];

  employees.forEach(storageEmployee => {
    const employeeFiles = storageEmployee.files || [];

    employeeFiles.forEach((file, index) => {
      const linkedEmployee = employees.find(e => e.id === file.employeeId);

      files.push({
        ...file,
        storageEmployeeId: storageEmployee.id,
        index,
        employeeName: linkedEmployee
          ? `${linkedEmployee.rank || ""} ${linkedEmployee.firstName || ""} ${linkedEmployee.lastName || ""}`.trim()
          : "General File"
      });
    });
  });

  return files;
}

function renderFileCard(file) {
  return `
    <div class="file-card">
      <div class="employee-top">
        <div>
          <h3>${file.title}</h3>
          <p class="muted">${file.employeeName} | ${file.category} | ${file.fileName}</p>
        </div>

        <div class="file-actions">
          <button onclick="openStoredFile(${file.storageEmployeeId}, ${file.index})">Open</button>
          <button class="danger-btn" onclick="removeStoredFile(${file.storageEmployeeId}, ${file.index})">Remove</button>
        </div>
      </div>

      <div class="employee-details">
        <div><span>Type</span>${file.fileType || "Unknown"}</div>
        <div><span>Size</span>${formatFileSize(file.fileSize)}</div>
        <div><span>Added</span>${file.createdAt ? new Date(file.createdAt).toLocaleDateString() : "N/A"}</div>
      </div>

      ${file.notes ? `<p class="employee-note">${file.notes}</p>` : ""}
    </div>
  `;
}

async function loadEmployeeFilesTab(employee) {
  const employees = await getAllRecords("employees");
  const files = getAllStoredFiles(employees)
    .filter(file => file.employeeId === employee.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  document.getElementById("employeeTabContent").innerHTML = `
    <section class="card">
      <h3>Employee Files</h3>
      <p class="muted">Files attached to this employee.</p>
      ${
        files.length === 0
          ? `<p class="muted">No files attached to this employee.</p>`
          : files.map(file => renderFileCard(file)).join("")
      }
    </section>
  `;
}

async function openStoredFile(storageEmployeeId, fileIndex) {
  const employees = await getAllRecords("employees");
  const storageEmployee = employees.find(e => e.id === storageEmployeeId);

  if (!storageEmployee || !storageEmployee.files) return;

  const file = storageEmployee.files[fileIndex];

  const newWindow = window.open();
  newWindow.document.write(`
    <iframe src="${file.fileData}" style="width:100%; height:100vh; border:none;"></iframe>
  `);
}

async function removeStoredFile(storageEmployeeId, fileIndex) {
  if (!confirm("Remove this file?")) return;

  const employees = await getAllRecords("employees");
  const storageEmployee = employees.find(e => e.id === storageEmployeeId);

  if (!storageEmployee || !storageEmployee.files) return;

  storageEmployee.files.splice(fileIndex, 1);
  storageEmployee.updatedAt = new Date().toISOString();

  await updateRecord("employees", storageEmployee);

  if (selectedEmployeeId) {
    const employee = employees.find(e => e.id === selectedEmployeeId);

    if (employee && document.getElementById("employeeTabContent")) {
      await loadEmployeeFilesTab(employee);
      return;
    }
  }

  await renderFiles();
}

function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return "Unknown";

  if (bytes < 1024) return `${bytes} B`;

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
