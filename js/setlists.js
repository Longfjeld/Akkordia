import { createFileJson, getFileJson, getJson, putFileJson } from "./graph.js";

const ACTIVE_PREFIX = "akkordia.activeSetlist.v1.";
const setlistStorage = new WeakMap();

export function getActiveSetlistId(workspaceId) {
  return localStorage.getItem(`${ACTIVE_PREFIX}${workspaceId}`);
}

export function setActiveSetlistId(workspaceId, setlistId) {
  const key = `${ACTIVE_PREFIX}${workspaceId}`;
  if (setlistId) localStorage.setItem(key, setlistId);
  else localStorage.removeItem(key);
}

export async function loadSetlists(workspace) {
  const folder = await getSetlistsFolder(workspace);
  const items = await getJson(
    `/drives/${encodeURIComponent(folder.driveId)}/items/${encodeURIComponent(folder.itemId)}/children` +
    "?$select=id,name,file,parentReference,remoteItem,eTag&$orderby=name"
  );

  const files = (items.value ?? []).filter(
    item => (item.file || item.remoteItem?.file) && item.name.toLowerCase().endsWith(".json")
  );

  const results = await Promise.allSettled(files.map(async file => {
    const ref = refFromItem(file, folder.driveId);
    const raw = await getFileJson(ref.driveId, ref.itemId);
    const setlist = normalizeSetlist(raw, file.name);
    setlistStorage.set(setlist, {
      driveId: ref.driveId,
      itemId: ref.itemId,
      eTag: file.remoteItem?.eTag ?? file.eTag ?? null,
      filename: file.name,
      folder
    });
    return setlist;
  }));

  const setlists = [];
  const errors = [];
  results.forEach((result, index) => {
    if (result.status === "fulfilled") setlists.push(result.value);
    else errors.push(`${files[index].name}: ${result.reason?.message ?? "ukjent feil"}`);
  });

  setlists.sort((a, b) => a.name.localeCompare(b.name, "nb", { sensitivity: "base" }));
  return { setlists, errors };
}

export async function saveSetlist(workspace, setlist, existingSetlist = null) {
  validateSetlist(setlist);
  const storage = setlistStorage.get(existingSetlist ?? setlist);

  if (storage?.itemId) {
    try {
      const item = await putFileJson(storage.driveId, storage.itemId, setlist, storage.eTag);
      setlistStorage.set(setlist, {
        ...storage,
        eTag: item.eTag ?? storage.eTag
      });
      return { created: false, item };
    } catch (error) {
      if (error.message.includes("412")) {
        throw new Error("Set-listen er endret av en annen bruker siden du åpnet den. Last inn set-listene på nytt før du prøver igjen.");
      }
      throw error;
    }
  }

  const folder = await getSetlistsFolder(workspace);
  const filename = `${setlist.id}.json`;
  const item = await createFileJson(folder.driveId, folder.itemId, filename, setlist);
  setlistStorage.set(setlist, {
    driveId: folder.driveId,
    itemId: item.id,
    eTag: item.eTag ?? null,
    filename,
    folder
  });
  return { created: true, item };
}

export function createSetlist() {
  return {
    schemaVersion: 2,
    id: crypto.randomUUID(),
    name: "Ny set-liste",
    items: []
  };
}

export function cloneSetlist(setlist) {
  return structuredClone(setlist);
}

export function validateSetlist(setlist, filename = "set-listfil") {
  if (!setlist || typeof setlist !== "object") throw new Error(`${filename} inneholder ikke et JSON-objekt.`);
  if (setlist.schemaVersion !== 2) throw new Error(`${filename}: schemaVersion ${setlist.schemaVersion ?? "mangler"} støttes ikke for lagring.`);
  if (typeof setlist.id !== "string" || !setlist.id.trim()) throw new Error(`${filename}: mangler gyldig id.`);
  if (typeof setlist.name !== "string" || !setlist.name.trim()) throw new Error(`${filename}: mangler navn.`);
  if (!Array.isArray(setlist.items)) throw new Error(`${filename}: mangler items-array.`);

  setlist.items.forEach((item, index) => {
    if (!item || typeof item !== "object") throw new Error(`${filename}: items[${index}] er ugyldig.`);
    if (item.type === "song") {
      if (typeof item.songId !== "string" || !item.songId.trim()) {
        throw new Error(`${filename}: items[${index}] mangler gyldig songId.`);
      }
      return;
    }
    if (item.type === "part") {
      if (typeof item.name !== "string" || !item.name.trim()) {
        throw new Error(`${filename}: items[${index}] mangler navn på del.`);
      }
      return;
    }
    throw new Error(`${filename}: items[${index}] har ukjent type.`);
  });
}

function normalizeSetlist(raw, filename) {
  if (!raw || typeof raw !== "object") throw new Error(`${filename} inneholder ikke et JSON-objekt.`);

  if (raw.schemaVersion === 1) {
    if (typeof raw.id !== "string" || !raw.id.trim()) throw new Error(`${filename}: mangler gyldig id.`);
    if (typeof raw.name !== "string" || !raw.name.trim()) throw new Error(`${filename}: mangler navn.`);
    if (!Array.isArray(raw.songs) || raw.songs.some(id => typeof id !== "string" || !id.trim())) {
      throw new Error(`${filename}: mangler gyldig songs-array.`);
    }
    return {
      schemaVersion: 2,
      id: raw.id,
      name: raw.name,
      items: raw.songs.map(songId => ({ type: "song", songId }))
    };
  }

  validateSetlist(raw, filename);
  return raw;
}

async function getSetlistsFolder(workspace) {
  const rootItems = await getJson(
    `/drives/${encodeURIComponent(workspace.driveId)}/items/${encodeURIComponent(workspace.itemId)}/children` +
    "?$select=id,name,folder,parentReference,remoteItem"
  );

  const item = (rootItems.value ?? []).find(
    entry => (entry.folder || entry.remoteItem?.folder) && entry.name.toLowerCase() === "setlists"
  );
  if (!item) throw new Error("setlists-mappen mangler i dette Akkordia-workspacet.");

  return refFromItem(item, workspace.driveId);
}

function refFromItem(item, fallbackDriveId) {
  if (item.remoteItem) {
    return {
      driveId: item.remoteItem.parentReference?.driveId ?? fallbackDriveId,
      itemId: item.remoteItem.id
    };
  }

  return {
    driveId: item.parentReference?.driveId ?? fallbackDriveId,
    itemId: item.id
  };
}
