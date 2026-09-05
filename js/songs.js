import { createFileJson, getFileJson, getJson, putFileJson } from "./graph.js";

const VIEW_KEY = "akkordia.lyricsView.v1";
const VALID_VIEWS = new Set(["vocal", "harmony", "both"]);
const songStorage = new WeakMap();

export function getLyricsView() {
  const value = localStorage.getItem(VIEW_KEY);
  return VALID_VIEWS.has(value) ? value : "both";
}

export function setLyricsView(value) {
  if (!VALID_VIEWS.has(value)) return;
  localStorage.setItem(VIEW_KEY, value);
}

export async function loadSongs(workspace) {
  const songsFolder = await getSongsFolder(workspace);
  const items = await getJson(
    `/drives/${encodeURIComponent(songsFolder.driveId)}/items/${encodeURIComponent(songsFolder.itemId)}/children` +
    "?$select=id,name,file,parentReference,remoteItem,eTag&$orderby=name"
  );

  const files = (items.value ?? []).filter(
    item => item.file && item.name.toLowerCase().endsWith(".json")
  );

  const results = await Promise.allSettled(files.map(async file => {
    const ref = refFromItem(file, songsFolder.driveId);
    const song = await getFileJson(ref.driveId, ref.itemId);
    validateSong(song, file.name);
    songStorage.set(song, {
      driveId: ref.driveId,
      itemId: ref.itemId,
      eTag: file.remoteItem?.eTag ?? file.eTag ?? null,
      filename: file.name,
      songsFolder
    });
    return song;
  }));

  const songs = [];
  const errors = [];
  results.forEach((result, index) => {
    if (result.status === "fulfilled") songs.push(result.value);
    else errors.push(`${files[index].name}: ${result.reason?.message ?? "ukjent feil"}`);
  });

  songs.sort((a, b) => a.title.localeCompare(b.title, "nb", { sensitivity: "base" }));
  return { songs, errors };
}

export async function saveSong(workspace, song, existingSong = null) {
  validateSong(song);
  const storage = songStorage.get(existingSong ?? song);

  if (storage?.itemId) {
    try {
      const item = await putFileJson(storage.driveId, storage.itemId, song, storage.eTag);
      songStorage.set(song, {
        ...storage,
        eTag: item.eTag ?? storage.eTag
      });
      return { created: false, item };
    } catch (error) {
      if (error.message.includes("412")) {
        throw new Error("Sangen er endret av en annen bruker siden du åpnet den. Last inn sangbiblioteket på nytt før du prøver igjen.");
      }
      throw error;
    }
  }

  const songsFolder = await getSongsFolder(workspace);
  const filename = `${song.id}.json`;
  const item = await createFileJson(songsFolder.driveId, songsFolder.itemId, filename, song);
  songStorage.set(song, {
    driveId: songsFolder.driveId,
    itemId: item.id,
    eTag: item.eTag ?? null,
    filename,
    songsFolder
  });
  return { created: true, item };
}

export function createSong() {
  return {
    schemaVersion: 1,
    id: `song_${crypto.randomUUID()}`,
    title: "Ny sang",
    chordSet: [],
    transpose: 0,
    sections: [createSection()]
  };
}

export function createSection() {
  return {
    id: `section_${crypto.randomUUID()}`,
    type: "verse",
    label: "Vers 1",
    transpose: 0,
    lines: [createLine()]
  };
}

export function createLine() {
  return { vocal: "", harmony: "", chords: [] };
}

export function createChord() {
  return { id: `chord_${crypto.randomUUID()}`, name: "", pos: 0 };
}

export function validateSong(song, filename = "sangfil") {
  if (!song || typeof song !== "object") throw new Error(`${filename} inneholder ikke et JSON-objekt.`);
  if (song.schemaVersion !== 1) throw new Error(`schemaVersion ${song.schemaVersion ?? "mangler"} støttes ikke.`);
  if (typeof song.id !== "string" || !song.id) throw new Error("mangler gyldig id.");
  if (typeof song.title !== "string" || !song.title.trim()) throw new Error("mangler tittel.");
  if (!Array.isArray(song.chordSet)) throw new Error("mangler chordSet.");
  if (!Number.isFinite(song.transpose)) throw new Error("mangler gyldig transpose.");
  if (song.playback !== undefined) {
    if (!song.playback || typeof song.playback !== "object") throw new Error("playback er ugyldig.");
    if (!Number.isFinite(song.playback.bpm) || song.playback.bpm <= 0) throw new Error("playback.bpm er ugyldig.");
    if (!Number.isFinite(song.playback.beatsPerLine) || song.playback.beatsPerLine <= 0) throw new Error("playback.beatsPerLine er ugyldig.");
  }
  if (!Array.isArray(song.sections)) throw new Error("mangler sections.");

  for (const section of song.sections) {
    if (typeof section.id !== "string" || !section.id) throw new Error("seksjon mangler id.");
    if (typeof section.type !== "string" || !section.type) throw new Error("seksjon mangler type.");
    if (!Number.isFinite(section.transpose)) throw new Error("seksjon mangler gyldig transpose.");
    if (!Array.isArray(section.lines)) throw new Error("seksjon mangler lines.");

    for (const line of section.lines) {
      if (typeof line.vocal !== "string") throw new Error("sanglinje mangler vocal.");
      if (typeof line.harmony !== "string") throw new Error("sanglinje mangler harmony.");
      if (!Array.isArray(line.chords)) throw new Error("sanglinje mangler chords.");
      for (const chord of line.chords) {
        if (typeof chord.id !== "string" || !chord.id) throw new Error("akkord mangler id.");
        if (typeof chord.name !== "string" || !chord.name) throw new Error("akkord mangler navn.");
        if (!Number.isInteger(chord.pos) || chord.pos < 0) throw new Error("akkord har ugyldig pos.");
      }
    }
  }
}

async function getSongsFolder(workspace) {
  const rootItems = await getJson(
    `/drives/${encodeURIComponent(workspace.driveId)}/items/${encodeURIComponent(workspace.itemId)}/children` +
    "?$select=id,name,folder,parentReference,remoteItem"
  );

  const item = (rootItems.value ?? []).find(
    entry => (entry.folder || entry.remoteItem?.folder) && entry.name.toLowerCase() === "songs"
  );
  if (!item) throw new Error("songs-mappen mangler i workspacet.");

  return refFromItem(item, workspace.driveId);
}

function refFromItem(item, fallbackDriveId) {
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
