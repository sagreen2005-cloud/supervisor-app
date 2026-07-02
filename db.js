let db;

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("SupervisorAppDB", 1);

    request.onupgradeneeded = function(event) {
      db = event.target.result;

      if (!db.objectStoreNames.contains("employees")) {
        db.createObjectStore("employees", {
          keyPath: "id",
          autoIncrement: true
        });
      }
    };

    request.onsuccess = function(event) {
      db = event.target.result;
      resolve(db);
    };

    request.onerror = function(event) {
      reject(event.target.error);
    };
  });
}

function addRecord(storeName, record) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.add(record);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getAllRecords(storeName) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
