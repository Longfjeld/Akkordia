import { getJson, getFileJson } from "./graph.js";

function refFromItem(item, fallbackDriveId = null) {
  if (item.remoteItem) {
    return {
      driveId: item.remoteItem.parentReference?.driveId,
      itemId: item.remoteItem.id,
      name: item.remoteItem.name ?? item.name,
      isFolder: Boolean(item.remoteItem.folder)
    };
  }

  return {
    driveId: item.parentReference?.driveId ?? fallbackDriveId,
    itemId: item.id,
    name: item.name,
    isFolder: Boolean(item.folder)
  };
}

export async function getRootFolder() {
  const drive = await getJson("/me/drive?$select=id,name,driveType");
  const root = await getJson("/me/drive/root?$select=id,name,parentReference");
  return {
    driveId: drive.id,
    itemId: root.id,
    name: "OneDrive",
    isFolder: true
  };
}

export async function listFolders(folderRef) {
  const data = await getJson(
    `/drives/${encodeURIComponent(folderRef.driveId)}/items/${encodeURIComponent(folderRef.itemId)}/children` +
    "?$select=id,name,folder,parentReference,remoteItem&$orderby=name"
  );

  return (data.value ?? [])
    .map(item => refFromItem(item, folderRef.driveId))
    .filter(item => item.isFolder && item.driveId && item.itemId);
}

export async function validateWorkspace(folderRef) {
  const data = await getJson(
    `/drives/${encodeURIComponent(folderRef.driveId)}/items/${encodeURIComponent(folderRef.itemId)}/children` +
    "?$select=id,name,folder,file,parentReference,remoteItem"
  );

  const items = data.value ?? [];
  const byName = new Map(items.map(item => [item.name.toLowerCase(), item]));
  const metadataItem = byName.get("akkordia.json");
  const songsItem = byName.get("songs");
  const setlistsItem = byName.get("setlists");

  if (!metadataItem?.file) throw new Error("akkordia.json mangler i denne mappen.");
  if (!songsItem?.folder) throw new Error("songs-mappen mangler i denne mappen.");
  if (!setlistsItem?.folder) throw new Error("setlists-mappen mangler i denne mappen.");

  const metadataRef = refFromItem(metadataItem, folderRef.driveId);
  const metadata = await getFileJson(metadataRef.driveId, metadataRef.itemId);

  if (metadata?.format !== "akkordia-workspace") {
    throw new Error("akkordia.json har ukjent format.");
  }
  if (metadata?.schemaVersion !== 1) {
    throw new Error(`Workspace schemaVersion ${metadata?.schemaVersion ?? "mangler"} støttes ikke.`);
  }
  if (!isUuid(metadata?.workspaceId)) {
    throw new Error("akkordia.json mangler gyldig workspaceId.");
  }
  if (typeof metadata?.name !== "string" || !metadata.name.trim()) {
    throw new Error("akkordia.json mangler workspace-navn.");
  }

  return {
    workspaceId: metadata.workspaceId,
    name: metadata.name.trim(),
    provider: "onedrive",
    driveId: folderRef.driveId,
    itemId: folderRef.itemId
  };
}

function isUuid(value) {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
