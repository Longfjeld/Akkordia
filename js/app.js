import { initializeAuth, getAccount, signIn, signOut } from "./auth.js";
import { getRootFolder, listFolders, validateWorkspace } from "./onedrive.js";
import { getActiveWorkspace, saveWorkspace, setActiveWorkspaceId } from "./workspaces.js";
import { createSong, getLyricsView, loadSongs, saveSong, setLyricsView } from "./songs.js";
import { cloneSong, renderSongEditor } from "./editor.js";

const ui = {
  accountButton: document.querySelector("#accountButton"),
  workspaceButton: document.querySelector("#workspaceButton"),
  connectWorkspace: document.querySelector("#connectWorkspace"),
  workspaceStatus: document.querySelector("#workspaceStatus"),
  welcome: document.querySelector("#welcome"),
  songsView: document.querySelector("#songsView"),
  songList: document.querySelector("#songList"),
  songListMessage: document.querySelector("#songListMessage"),
  songDetail: document.querySelector("#songDetail"),
  lyricsView: document.querySelector("#lyricsView"),
  newSongButton: document.querySelector("#newSongButton"),
  folderDialog: document.querySelector("#folderDialog"),
  folderPath: document.querySelector("#folderPath"),
  folderList: document.querySelector("#folderList"),
  folderMessage: document.querySelector("#folderMessage"),
  folderUp: document.querySelector("#folderUp"),
  selectFolder: document.querySelector("#selectFolder")
};

let folderStack = [];
let songs = [];
let selectedSongId = null;
let editingSong = null;
let activeView = "songs";

async function start() {
  try {
    await initializeAuth();
    renderHeader();
    ui.lyricsView.value = getLyricsView();
    renderView();
    if (getAccount() && getActiveWorkspace()) await refreshSongs();
  } catch (error) {
    showStatus(`Autentisering kunne ikke initialiseres: ${error.message}`, true);
  }
}

function renderHeader() {
  const account = getAccount();
  const workspace = getActiveWorkspace();
  ui.accountButton.textContent = account?.name || account?.username || "Logg inn";
  ui.workspaceButton.textContent = workspace?.name ?? "Ingen band valgt";

  if (workspace) showStatus(`Aktivt band: ${workspace.name}`, false);
}

function renderView() {
  const workspace = getActiveWorkspace();
  ui.welcome.classList.toggle("hidden", Boolean(workspace));
  ui.songsView.classList.toggle("hidden", !workspace || activeView !== "songs");

  document.querySelectorAll("[data-view]").forEach(button => {
    button.classList.toggle("is-active", button.dataset.view === activeView);
  });

  if (workspace && activeView !== "songs") {
    showStatus(`${viewName(activeView)} kommer i en senere milepæl.`, false);
  } else if (workspace) {
    showStatus(`Aktivt band: ${workspace.name}`, false);
  }
}

async function refreshSongs() {
  const workspace = getActiveWorkspace();
  if (!workspace || !getAccount()) return;

  editingSong = null;
  setSongListMessage("Laster sanger …");
  ui.songList.replaceChildren();
  ui.songDetail.replaceChildren();

  try {
    const result = await loadSongs(workspace);
    songs = result.songs;
    renderSongList();

    if (!songs.length) setSongListMessage("Ingen gyldige sangfiler ble funnet.");
    else if (result.errors.length) {
      setSongListMessage(`${songs.length} sanger lastet. ${result.errors.length} fil(er) kunne ikke leses.`, true);
      console.warn("Sangfiler som ikke kunne leses:", result.errors);
    } else {
      setSongListMessage(`${songs.length} sanger lastet.`);
    }

    if (selectedSongId && songs.some(song => song.id === selectedSongId)) {
      renderSong(songs.find(song => song.id === selectedSongId));
    } else {
      renderSongPlaceholder();
    }
  } catch (error) {
    setSongListMessage(error.message, true);
  }
}

function renderSongList() {
  ui.songList.replaceChildren();
  for (const song of songs) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "song-row";
    button.textContent = song.title;
    button.classList.toggle("is-selected", song.id === selectedSongId);
    button.addEventListener("click", () => {
      if (editingSong && !confirm("Avslutte redigering uten å lagre?")) return;
      editingSong = null;
      selectedSongId = song.id;
      renderSongList();
      renderSong(song);
    });
    ui.songList.append(button);
  }
}

function renderSong(song) {
  editingSong = null;
  const view = getLyricsView();
  ui.songDetail.replaceChildren();

  const header = document.createElement("header");
  header.className = "song-header";
  const headingRow = document.createElement("div");
  headingRow.className = "song-heading-row";
  const title = document.createElement("h1");
  title.textContent = song.title;
  const edit = document.createElement("button");
  edit.type = "button";
  edit.className = "secondary";
  edit.textContent = "Rediger";
  edit.addEventListener("click", () => beginEdit(song));
  headingRow.append(title, edit);
  header.append(headingRow);

  if (song.chordSet.length) {
    const chordSet = document.createElement("p");
    chordSet.className = "chord-set muted";
    chordSet.textContent = `Akkordsett: ${song.chordSet.join(" · ")}`;
    header.append(chordSet);
  }

  const details = [];
  if (song.transpose) details.push(`Transpose: ${signed(song.transpose)}`);
  if (song.playback) details.push(`${song.playback.bpm} BPM · ${song.playback.beatsPerLine} beats/linje`);
  if (details.length) {
    const meta = document.createElement("p");
    meta.className = "muted song-meta";
    meta.textContent = details.join(" · ");
    header.append(meta);
  }
  ui.songDetail.append(header);

  for (const section of song.sections) {
    const block = document.createElement("section");
    block.className = `song-section section-${section.type}`;

    const heading = document.createElement("h2");
    heading.textContent = section.label || section.type;
    if (section.transpose) heading.textContent += ` (${signed(section.transpose)})`;
    block.append(heading);

    for (const line of section.lines) block.append(renderSongLine(line, view));
    ui.songDetail.append(block);
  }
}

function renderSongLine(line, view) {
  const row = document.createElement("div");
  row.className = "song-line";

  const chordLine = document.createElement("div");
  chordLine.className = "chord-line";
  chordLine.setAttribute("aria-label", line.chords.map(chord => chord.name).join(", "));
  for (const chord of line.chords) {
    const span = document.createElement("span");
    span.className = "chord";
    span.style.left = `${chord.pos}ch`;
    span.textContent = chord.name;
    chordLine.append(span);
  }
  row.append(chordLine);

  if (view !== "harmony") {
    const vocal = document.createElement("div");
    vocal.className = "lyric vocal";
    vocal.textContent = line.vocal || "\u00a0";
    row.append(vocal);
  }

  if (view !== "vocal") {
    const harmony = document.createElement("div");
    harmony.className = "lyric harmony";
    harmony.textContent = line.harmony || "\u00a0";
    row.append(harmony);
  }

  return row;
}

function beginEdit(song) {
  editingSong = song;
  const draft = cloneSong(song);
  renderSongEditor(ui.songDetail, draft, {
    onCancel: () => {
      editingSong = null;
      renderSong(song);
    },
    onSave: async value => saveDraft(value, song)
  });
}

function beginNewSong() {
  if (editingSong && !confirm("Avslutte redigering uten å lagre?")) return;
  const draft = createSong();
  editingSong = draft;
  selectedSongId = null;
  renderSongList();
  renderSongEditor(ui.songDetail, cloneSong(draft), {
    onCancel: () => {
      editingSong = null;
      renderSongPlaceholder();
    },
    onSave: async value => saveDraft(value, null)
  });
}

async function saveDraft(draft, existingSong) {
  const workspace = getActiveWorkspace();
  if (!workspace) throw new Error("Ingen workspace er valgt.");

  await saveSong(workspace, draft, existingSong);

  if (existingSong) {
    const index = songs.indexOf(existingSong);
    if (index >= 0) songs[index] = draft;
  } else {
    songs.push(draft);
  }

  songs.sort((a, b) => a.title.localeCompare(b.title, "nb", { sensitivity: "base" }));
  selectedSongId = draft.id;
  editingSong = null;
  renderSongList();
  renderSong(draft);
  setSongListMessage(`${songs.length} sanger lastet.`);
  showStatus(`Sangen «${draft.title}» er lagret.`, false);
}

function renderSongPlaceholder() {
  ui.songDetail.innerHTML = '<div class="song-placeholder"><p>Velg en sang fra biblioteket eller opprett en ny.</p></div>';
}

ui.accountButton.addEventListener("click", async () => {
  try {
    if (getAccount() && editingSong && !confirm("Avslutte redigering uten å lagre?")) return;
    if (getAccount()) await signOut();
    else await signIn();
  } catch (error) {
    showStatus(error.message, true);
  }
});

ui.connectWorkspace.addEventListener("click", async () => {
  try {
    if (!getAccount()) {
      await signIn();
      return;
    }
    await openFolderPicker();
  } catch (error) {
    showStatus(error.message, true);
  }
});

ui.newSongButton.addEventListener("click", beginNewSong);

ui.folderUp.addEventListener("click", async () => {
  if (folderStack.length <= 1) return;
  folderStack.pop();
  await renderFolder();
});

ui.selectFolder.addEventListener("click", async () => {
  const current = folderStack.at(-1);
  if (!current) return;

  setFolderMessage("Validerer Akkordia-workspace …");
  ui.selectFolder.disabled = true;

  try {
    const workspace = await validateWorkspace(current.ref);
    saveWorkspace(workspace);
    setActiveWorkspaceId(workspace.workspaceId);
    ui.folderDialog.close();
    selectedSongId = null;
    editingSong = null;
    renderHeader();
    renderView();
    await refreshSongs();
    showStatus(`Bandet «${workspace.name}» er koblet til og klart.`, false);
  } catch (error) {
    setFolderMessage(error.message, true);
  } finally {
    ui.selectFolder.disabled = false;
  }
});

ui.lyricsView.addEventListener("change", () => {
  setLyricsView(ui.lyricsView.value);
  const song = songs.find(item => item.id === selectedSongId);
  if (song && !editingSong) renderSong(song);
});

async function openFolderPicker() {
  const root = await getRootFolder();
  folderStack = [{ ref: root, label: "OneDrive" }];
  ui.folderDialog.showModal();
  await renderFolder();
}

async function renderFolder() {
  const current = folderStack.at(-1);
  ui.folderPath.textContent = folderStack.map(item => item.label).join(" / ");
  ui.folderUp.disabled = folderStack.length <= 1;
  ui.folderList.replaceChildren();
  setFolderMessage("Laster mapper …");

  try {
    const folders = await listFolders(current.ref);
    setFolderMessage("");

    if (!folders.length) {
      setFolderMessage("Denne mappen inneholder ingen undermapper.");
      return;
    }

    for (const folder of folders) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "folder-row";
      button.textContent = `📁 ${folder.name}`;
      button.addEventListener("click", async () => {
        folderStack.push({ ref: folder, label: folder.name });
        await renderFolder();
      });
      ui.folderList.append(button);
    }
  } catch (error) {
    setFolderMessage(error.message, true);
  }
}

function setFolderMessage(message, isError = false) {
  ui.folderMessage.textContent = message;
  ui.folderMessage.classList.toggle("hidden", !message);
  ui.folderMessage.classList.toggle("error", isError);
}

function setSongListMessage(message, isError = false) {
  ui.songListMessage.textContent = message;
  ui.songListMessage.classList.toggle("hidden", !message);
  ui.songListMessage.classList.toggle("error", isError);
}

function showStatus(message, isError) {
  ui.workspaceStatus.textContent = message;
  ui.workspaceStatus.classList.remove("hidden");
  ui.workspaceStatus.classList.toggle("error", Boolean(isError));
}

function viewName(view) {
  if (view === "setlists") return "Set-lister";
  if (view === "play") return "Spill";
  return "Sanger";
}

function signed(value) {
  return value > 0 ? `+${value}` : String(value);
}

document.querySelectorAll("[data-view]").forEach(button => {
  button.addEventListener("click", () => {
    if (editingSong && button.dataset.view !== "songs" && !confirm("Avslutte redigering uten å lagre?")) return;
    if (button.dataset.view !== "songs") editingSong = null;
    activeView = button.dataset.view;
    renderView();
  });
});

window.addEventListener("beforeunload", event => {
  if (!editingSong) return;
  event.preventDefault();
  event.returnValue = "";
});

start();
