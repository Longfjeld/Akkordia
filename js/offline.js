const DB_NAME = "akkordia-offline";
const DB_VERSION = 1;
const STORE = "workspaces";

export async function getWorkspaceSnapshot(workspaceId) {
  const db = await openDb();
  return transactionRequest(db, "readonly", store => store.get(workspaceId));
}

export async function updateWorkspaceSnapshot(workspaceId, patch) {
  const current = await getWorkspaceSnapshot(workspaceId) ?? {
    workspaceId,
    songs: [],
    setlists: [],
    hasSongs: false,
    hasSetlists: false,
    updatedAt: null
  };

  const next = {
    ...current,
    ...structuredClone(patch),
    workspaceId,
    hasSongs: Object.hasOwn(patch, "songs") ? true : current.hasSongs,
    hasSetlists: Object.hasOwn(patch, "setlists") ? true : current.hasSetlists,
    updatedAt: new Date().toISOString()
  };

  const db = await openDb();
  await transactionRequest(db, "readwrite", store => store.put(next));
  return next;
}

export async function clearWorkspaceSnapshot(workspaceId) {
  const db = await openDb();
  await transactionRequest(db, "readwrite", store => store.delete(workspaceId));
}

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "workspaceId" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Kunne ikke åpne offline-cache."));
  });
}

function transactionRequest(db, mode, action) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, mode);
    const store = transaction.objectStore(STORE);
    const request = action(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Offline-cache feilet."));
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      db.close();
      reject(transaction.error ?? new Error("Offline-cache feilet."));
    };
  });
}
