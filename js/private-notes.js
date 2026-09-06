import { createFileJson, getFileJson, getJson, postJson, putFileJson } from "./graph.js";
import { getRootFolder } from "./onedrive.js";

const DB_NAME = "akkordia-private-notes";
const DB_VERSION = 1;
const STORE = "workspaces";
const ROOT_FOLDER = "Akkordia";
const PRIVATE_FOLDER = "private";
const NOTES_FILE = "notes.json";
const SCHEMA_VERSION = 1;

export function getPrivateNotesAccountId(account) {
  return account?.homeAccountId || account?.localAccountId || account?.username || null;
}

export async function getPrivateNotesState(account, workspaceId) {
  const accountId = getPrivateNotesAccountId(account);
  if (!accountId || !workspaceId) return emptyState(accountId, workspaceId);
  return (await readRecord(accountId, workspaceId)) ?? emptyState(accountId, workspaceId);
}

export async function getPrivateNote(account, workspaceId, songId) {
  const state = await getPrivateNotesState(account, workspaceId);
  return {
    note: state.notes?.[songId] ?? null,
    conflict: state.conflicts?.[songId] ?? null,
    dirty: state.dirtySongIds?.includes(songId) ?? false
  };
}

export async function savePrivateNoteLocal(account, workspaceId, songId, text) {
  const accountId = getPrivateNotesAccountId(account);
  if (!accountId) throw new Error("Du må være logget inn for å bruke private notater.");
  if (!workspaceId || !songId) throw new Error("Privatnotatet mangler workspace eller sang-ID.");

  const state = (await readRecord(accountId, workspaceId)) ?? emptyState(accountId, workspaceId);
  const notes = structuredClone(state.notes ?? {});
  const conflicts = structuredClone(state.conflicts ?? {});
  const value = String(text ?? "");

  if (value.length) {
    notes[songId] = { text: value, updatedAt: new Date().toISOString() };
  } else {
    delete notes[songId];
  }

  // En eksplisitt ny redigering regnes som brukerens oppløsning av en gammel konflikt.
  delete conflicts[songId];

  const next = {
    ...state,
    notes,
    conflicts,
    dirtySongIds: unique([...(state.dirtySongIds ?? []), songId]),
    localUpdatedAt: new Date().toISOString()
  };
  await writeRecord(next);
  return next;
}

export async function syncPrivateNotes(account, workspace, attempt = 0) {
  const accountId = getPrivateNotesAccountId(account);
  if (!accountId || !workspace?.workspaceId) return null;
  if (!navigator.onLine) return getPrivateNotesState(account, workspace.workspaceId);

  const local = (await readRecord(accountId, workspace.workspaceId)) ?? emptyState(accountId, workspace.workspaceId);
  const remoteRef = await ensureRemoteNotesFile(workspace.workspaceId);
  const remoteDoc = normalizeDocument(await getFileJson(remoteRef.driveId, remoteRef.itemId), workspace.workspaceId);
  const remoteETag = remoteRef.eTag ?? null;

  const merged = mergeDocuments(local, remoteDoc);
  let finalETag = remoteETag;

  if (!sameNotes(merged.notes, remoteDoc.notes)) {
    try {
      const item = await putFileJson(
        remoteRef.driveId,
        remoteRef.itemId,
        documentFromNotes(workspace.workspaceId, merged.notes),
        remoteETag
      );
      finalETag = item.eTag ?? remoteETag;
    } catch (error) {
      if (attempt < 2 && /Graph svarte 409|Graph svarte 412/i.test(error.message)) {
        return syncPrivateNotes(account, workspace, attempt + 1);
      }
      throw error;
    }
  }

  const next = {
    ...local,
    notes: structuredClone(merged.notes),
    baseNotes: structuredClone(merged.notes),
    dirtySongIds: [],
    conflicts: merged.conflicts,
    remoteETag: finalETag,
    lastSyncedAt: new Date().toISOString()
  };
  await writeRecord(next);
  return next;
}

function mergeDocuments(localState, remoteDoc) {
  const localNotes = localState.notes ?? {};
  const baseNotes = localState.baseNotes ?? {};
  const remoteNotes = remoteDoc.notes ?? {};
  const dirty = new Set(localState.dirtySongIds ?? []);
  const conflicts = structuredClone(localState.conflicts ?? {});
  const notes = {};
  const ids = new Set([
    ...Object.keys(localNotes),
    ...Object.keys(baseNotes),
    ...Object.keys(remoteNotes),
    ...dirty
  ]);

  for (const songId of ids) {
    const local = localNotes[songId] ?? null;
    const base = baseNotes[songId] ?? null;
    const remote = remoteNotes[songId] ?? null;
    const localChanged = dirty.has(songId) || !sameValue(local, base);
    const remoteChanged = !sameValue(remote, base);
    let winner = local;

    if (localChanged && remoteChanged && !sameValue(local, remote)) {
      const result = chooseConflictWinner(local, remote);
      winner = result.winner;
      conflicts[songId] = {
        detectedAt: new Date().toISOString(),
        kept: cloneOrNull(result.winner),
        backup: cloneOrNull(result.loser),
        keptSource: result.winner === local ? "local" : "remote"
      };
    } else if (localChanged) {
      winner = local;
    } else if (remoteChanged) {
      winner = remote;
    } else {
      winner = local ?? remote;
    }

    if (winner) notes[songId] = structuredClone(winner);
  }

  return { notes, conflicts };
}

function chooseConflictWinner(local, remote) {
  if (!local) return { winner: remote, loser: local };
  if (!remote) return { winner: local, loser: remote };
  const localTime = Date.parse(local.updatedAt ?? "") || 0;
  const remoteTime = Date.parse(remote.updatedAt ?? "") || 0;
  return localTime >= remoteTime
    ? { winner: local, loser: remote }
    : { winner: remote, loser: local };
}

async function ensureRemoteNotesFile(workspaceId) {
  const root = await getRootFolder();
  const akkordia = await ensureChildFolder(root, ROOT_FOLDER);
  const privateFolder = await ensureChildFolder(akkordia, PRIVATE_FOLDER);
  const workspaceFolder = await ensureChildFolder(privateFolder, workspaceId);

  let file = await findChild(workspaceFolder, NOTES_FILE, "file");
  if (file) return file;

  try {
    const item = await createFileJson(
      workspaceFolder.driveId,
      workspaceFolder.itemId,
      NOTES_FILE,
      documentFromNotes(workspaceId, {})
    );
    return itemRef(item, workspaceFolder.driveId);
  } catch (error) {
    if (!/Graph svarte 409|Graph svarte 412/i.test(error.message)) throw error;
    file = await findChild(workspaceFolder, NOTES_FILE, "file");
    if (!file) throw error;
    return file;
  }
}

async function ensureChildFolder(parent, name) {
  let folder = await findChild(parent, name, "folder");
  if (folder) return folder;

  try {
    const item = await postJson(
      `/drives/${encodeURIComponent(parent.driveId)}/items/${encodeURIComponent(parent.itemId)}/children`,
      {
        name,
        folder: {},
        "@microsoft.graph.conflictBehavior": "fail"
      }
    );
    return itemRef(item, parent.driveId);
  } catch (error) {
    if (!/Graph svarte 409/i.test(error.message)) throw error;
    folder = await findChild(parent, name, "folder");
    if (!folder) throw error;
    return folder;
  }
}

async function findChild(parent, name, kind) {
  const data = await getJson(
    `/drives/${encodeURIComponent(parent.driveId)}/items/${encodeURIComponent(parent.itemId)}/children` +
    "?$select=id,name,folder,file,parentReference,eTag"
  );
  const item = (data.value ?? []).find(candidate =>
    candidate.name?.localeCompare(name, undefined, { sensitivity: "accent" }) === 0 && Boolean(candidate[kind])
  );
  return item ? itemRef(item, parent.driveId) : null;
}

function itemRef(item, fallbackDriveId) {
  return {
    driveId: item.parentReference?.driveId ?? fallbackDriveId,
    itemId: item.id,
    name: item.name,
    eTag: item.eTag ?? null,
    isFolder: Boolean(item.folder)
  };
}

function documentFromNotes(workspaceId, notes) {
  return {
    format: "akkordia-private-notes",
    schemaVersion: SCHEMA_VERSION,
    workspaceId,
    updatedAt: new Date().toISOString(),
    notes: structuredClone(notes)
  };
}

function normalizeDocument(value, workspaceId) {
  if (!value || value.format !== "akkordia-private-notes" || value.schemaVersion !== SCHEMA_VERSION) {
    throw new Error("notes.json har ukjent eller ugyldig format.");
  }
  if (value.workspaceId !== workspaceId) {
    throw new Error("notes.json tilhører et annet workspace.");
  }
  return {
    ...value,
    notes: value.notes && typeof value.notes === "object" && !Array.isArray(value.notes) ? value.notes : {}
  };
}

function emptyState(accountId, workspaceId) {
  return {
    key: `${accountId ?? "anonymous"}:${workspaceId ?? "none"}`,
    accountId,
    workspaceId,
    notes: {},
    baseNotes: {},
    dirtySongIds: [],
    conflicts: {},
    remoteETag: null,
    localUpdatedAt: null,
    lastSyncedAt: null
  };
}

function sameNotes(left, right) {
  return JSON.stringify(left ?? {}) === JSON.stringify(right ?? {});
}

function sameValue(left, right) {
  return JSON.stringify(left ?? null) === JSON.stringify(right ?? null);
}

function cloneOrNull(value) {
  return value ? structuredClone(value) : null;
}

function unique(values) {
  return [...new Set(values)];
}

async function readRecord(accountId, workspaceId) {
  const db = await openDb();
  return transactionRequest(db, "readonly", store => store.get(`${accountId}:${workspaceId}`));
}

async function writeRecord(record) {
  const db = await openDb();
  await transactionRequest(db, "readwrite", store => store.put(record));
}

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "key" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Kunne ikke åpne cache for private notater."));
  });
}

function transactionRequest(db, mode, action) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, mode);
    const store = transaction.objectStore(STORE);
    const request = action(store);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Cache for private notater feilet."));
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      db.close();
      reject(transaction.error ?? new Error("Cache for private notater feilet."));
    };
  });
}
