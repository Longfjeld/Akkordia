import { getFileJson, getJson } from "./graph.js";

const VIEW_KEY = "akkordia.lyricsView.v1";
const VALID_VIEWS = new Set(["vocal", "harmony", "both"]);

export function getLyricsView() {
  const value = localStorage.getItem(VIEW_KEY);
  return VALID_VIEWS.has(value) ? value : "both";
}

export function setLyricsView(value) {
  if (!VALID_VIEWS.has(value)) return;
  localStorage.setItem(VIEW_KEY, value);
}

export async function loadSongs(workspace) {
  const rootItems = await getJson(
    `/drives/${encodeURIComponent(workspace.driveId)}/items/${encodeURIComponent(workspace.itemId)}/children` +
    "?$select=id,name,folder,parentReference"
  );

  const songsFolder = (rootItems.value ?? []).find(
    item => item.folder && item.name.toLowerCase() === "songs"
  );
  if (!songsFolder) throw new Error("songs-mappen mangler i workspacet.");

  const items = await getJson(
    `/drives/${encodeURIComponent(workspace.driveId)}/items/${encodeURIComponent(songsFolder.id)}/children` +
    "?$select=id,name,file,parentReference&$orderby=name"
  );

  const files = (items.value ?? []).filter(
    item => item.file && item.name.toLowerCase().endsWith(".json")
  );

  const results = await Promise.allSettled(files.map(async file => {
    const song = await getFileJson(workspace.driveId, file.id);
    validateSong(song, file.name);
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

export function validateSong(song, filename = "sangfil") {
  if (!song || typeof song !== "object") throw new Error(`${filename} inneholder ikke et JSON-objekt.`);
  if (song.schemaVersion !== 1) throw new Error(`schemaVersion ${song.schemaVersion ?? "mangler"} støttes ikke.`);
  if (typeof song.id !== "string" || !song.id) throw new Error("mangler gyldig id.");
  if (typeof song.title !== "string" || !song.title.trim()) throw new Error("mangler tittel.");
  if (!Array.isArray(song.chordSet)) throw new Error("mangler chordSet.");
  if (!Number.isFinite(song.transpose)) throw new Error("mangler gyldig transpose.");
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
        if (typeof chord.name !== "string" || !chord.name) throw new Error("akkord mangler navn.");
        if (!Number.isInteger(chord.pos) || chord.pos < 0) throw new Error("akkord har ugyldig pos.");
      }
    }
  }
}
