import { initializeAuth, getAccount, signIn, signOut } from "./auth.js";
import { getRootFolder, listFolders, validateWorkspace } from "./onedrive.js";
import { getActiveWorkspace, saveWorkspace, setActiveWorkspaceId } from "./workspaces.js";
import { createSong, getLyricsView, loadSongs, saveSong, setLyricsView } from "./songs.js";
import { cloneSong, renderSongEditor } from "./editor.js";
import { createSetlist, getActiveSetlistId, loadSetlists, saveSetlist, setActiveSetlistId } from "./setlists.js";
import { renderSetlistEditor } from "./setlist-editor.js";
import { createPlayer } from "./player.js";

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
  setlistsView: document.querySelector("#setlistsView"),
  setlistList: document.querySelector("#setlistList"),
  setlistListMessage: document.querySelector("#setlistListMessage"),
  setlistDetail: document.querySelector("#setlistDetail"),
  newSetlistButton: document.querySelector("#newSetlistButton"),
  refreshSetlistsButton: document.querySelector("#refreshSetlistsButton"),
  playView: document.querySelector("#playView"),
  playContent: document.querySelector("#playContent"),
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
let setlists = [];
let selectedSetlistId = null;
let editingSetlist = null;
let activeView = "songs";
let currentPlayer = null;

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
  ui.setlistsView.classList.toggle("hidden", !workspace || activeView !== "setlists");
  ui.playView.classList.toggle("hidden", !workspace || activeView !== "play");

  document.querySelectorAll("[data-view]").forEach(button => {
    button.classList.toggle("is-active", button.dataset.view === activeView);
  });

  if (workspace && activeView === "play") {
    showStatus(`Spill · ${workspace.name}`, false);
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

async function refreshSetlists() {
  const workspace = getActiveWorkspace();
  if (!workspace || !getAccount()) return;

  editingSetlist = null;
  setSetlistListMessage("Laster set-lister …");
  ui.setlistList.replaceChildren();
  ui.setlistDetail.replaceChildren();

  try {
    const result = await loadSetlists(workspace);
    setlists = result.setlists;
    const preferred = selectedSetlistId ?? getActiveSetlistId(workspace.workspaceId);
    selectedSetlistId = setlists.some(item => item.id === preferred) ? preferred : null;
    renderSetlistList();

    if (!setlists.length) setSetlistListMessage("Ingen set-lister er opprettet ennå.");
    else if (result.errors.length) {
      setSetlistListMessage(`${setlists.length} set-lister lastet. ${result.errors.length} fil(er) kunne ikke leses.`, true);
      console.warn("Set-listfiler som ikke kunne leses:", result.errors);
    } else {
      setSetlistListMessage(`${setlists.length} set-lister lastet.`);
    }

    if (selectedSetlistId) renderSetlist(setlists.find(item => item.id === selectedSetlistId));
    else renderSetlistPlaceholder();
  } catch (error) {
    setSetlistListMessage(error.message, true);
    renderSetlistPlaceholder();
  }
}

function renderSetlistList() {
  ui.setlistList.replaceChildren();
  for (const setlist of setlists) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "setlist-row";
    button.textContent = setlist.name;
    button.classList.toggle("is-selected", setlist.id === selectedSetlistId);
    button.addEventListener("click", () => {
      if (editingSetlist && !confirm("Avslutte redigering uten å lagre?")) return;
      editingSetlist = null;
      selectedSetlistId = setlist.id;
      const workspace = getActiveWorkspace();
      if (workspace) setActiveSetlistId(workspace.workspaceId, setlist.id);
      renderSetlistList();
      renderSetlist(setlist);
    });
    ui.setlistList.append(button);
  }
}

function renderSetlist(setlist) {
  editingSetlist = null;
  ui.setlistDetail.replaceChildren();
  const songById = new Map(songs.map(song => [song.id, song]));
  const songItems = setlist.items.filter(item => item.type === "song");

  const header = document.createElement("header");
  header.className = "setlist-header";
  const headingRow = document.createElement("div");
  headingRow.className = "song-heading-row";
  const title = document.createElement("h1");
  title.textContent = setlist.name;
  const actions = document.createElement("div");
  actions.className = "setlist-header-actions";
  const play = document.createElement("button");
  play.type = "button";
  play.className = "primary";
  play.textContent = "Spill";
  play.disabled = !songItems.some(item => songById.has(item.songId));
  play.addEventListener("click", () => startSetlistPlayer(setlist));
  const edit = document.createElement("button");
  edit.type = "button";
  edit.className = "secondary";
  edit.textContent = "Rediger";
  edit.addEventListener("click", () => beginEditSetlist(setlist));
  actions.append(play, edit);
  headingRow.append(title, actions);
  header.append(headingRow);

  const meta = document.createElement("p");
  meta.className = "muted song-meta";
  meta.textContent = `${songItems.length} ${songItems.length === 1 ? "sang" : "sanger"}`;
  header.append(meta);
  ui.setlistDetail.append(header);

  if (!setlist.items.length) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "Set-listen er tom. Velg Rediger for å legge til sanger eller deler.";
    ui.setlistDetail.append(empty);
    return;
  }

  const content = document.createElement("div");
  content.className = "setlist-read-sequence";
  let list = null;
  let numberWithinPart = 0;

  const ensureList = () => {
    if (list) return list;
    list = document.createElement("ol");
    list.className = "setlist-read-list";
    content.append(list);
    return list;
  };

  for (const item of setlist.items) {
    if (item.type === "part") {
      const heading = document.createElement("h2");
      heading.className = "setlist-part-heading";
      heading.textContent = item.name;
      content.append(heading);
      list = null;
      numberWithinPart = 0;
      continue;
    }

    numberWithinPart += 1;
    const song = songById.get(item.songId);
    const row = document.createElement("li");
    row.value = numberWithinPart;
    if (song) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "setlist-song-link";
      button.textContent = song.title;
      button.addEventListener("click", () => {
        activeView = "songs";
        selectedSongId = song.id;
        renderView();
        renderSongList();
        renderSong(song);
      });
      row.append(button);
    } else {
      row.className = "setlist-missing-song";
      row.textContent = `Mangler sang: ${item.songId}`;
    }
    ensureList().append(row);
  }

  ui.setlistDetail.append(content);
}
function beginEditSetlist(setlist) {
  editingSetlist = setlist;
  const draft = structuredClone(setlist);
  renderSetlistEditor(ui.setlistDetail, draft, songs, {
    onCancel: () => {
      editingSetlist = null;
      renderSetlist(setlist);
    },
    onSave: async value => saveSetlistDraft(value, setlist)
  });
}

function beginNewSetlist() {
  if (editingSetlist && !confirm("Avslutte redigering uten å lagre?")) return;
  const draft = createSetlist();
  editingSetlist = draft;
  selectedSetlistId = null;
  renderSetlistList();
  renderSetlistEditor(ui.setlistDetail, structuredClone(draft), songs, {
    onCancel: () => {
      editingSetlist = null;
      renderSetlistPlaceholder();
    },
    onSave: async value => saveSetlistDraft(value, null)
  });
}

async function saveSetlistDraft(draft, existingSetlist) {
  const workspace = getActiveWorkspace();
  if (!workspace) throw new Error("Ingen workspace er valgt.");

  await saveSetlist(workspace, draft, existingSetlist);

  if (existingSetlist) {
    const index = setlists.indexOf(existingSetlist);
    if (index >= 0) setlists[index] = draft;
  } else {
    setlists.push(draft);
  }

  setlists.sort((a, b) => a.name.localeCompare(b.name, "nb", { sensitivity: "base" }));
  selectedSetlistId = draft.id;
  setActiveSetlistId(workspace.workspaceId, draft.id);
  editingSetlist = null;
  renderSetlistList();
  renderSetlist(draft);
  setSetlistListMessage(`${setlists.length} set-lister lastet.`);
  showStatus(`Set-listen «${draft.name}» er lagret.`, false);
}

async function preparePlayView() {
  if (!getActiveWorkspace() || !getAccount() || currentPlayer) return;

  ui.playContent.innerHTML = '<div class="player-empty"><p>Laster set-lister …</p></div>';
  try {
    if (!setlists.length) {
      const result = await loadSetlists(getActiveWorkspace());
      setlists = result.setlists;
      const preferred = selectedSetlistId ?? getActiveSetlistId(getActiveWorkspace().workspaceId);
      selectedSetlistId = setlists.some(item => item.id === preferred) ? preferred : null;
    }
    renderPlayChooser();
  } catch (error) {
    ui.playContent.innerHTML = `<div class="player-empty"><h1>Spill</h1><p class="error">${escapeHtml(error.message)}</p></div>`;
  }
}

function renderPlayChooser() {
  currentPlayer?.destroy();
  currentPlayer = null;
  ui.playContent.replaceChildren();

  const chooser = document.createElement("section");
  chooser.className = "player-chooser";
  const title = document.createElement("h1");
  title.textContent = "Spill";
  const intro = document.createElement("p");
  intro.className = "muted";
  intro.textContent = "Velg set-list. Spill-modus holder skjermen aktiv der nettleseren tillater det.";
  chooser.append(title, intro);

  if (!setlists.length) {
    const empty = document.createElement("p");
    empty.textContent = "Ingen set-lister er tilgjengelige.";
    chooser.append(empty);
    ui.playContent.append(chooser);
    return;
  }

  const list = document.createElement("div");
  list.className = "player-setlist-list";
  for (const setlist of setlists) {
    const songCount = setlist.items.filter(item => item.type === "song" && songs.some(song => song.id === item.songId)).length;
    const row = document.createElement("button");
    row.type = "button";
    row.className = "player-setlist-row";
    row.disabled = songCount === 0;
    const name = document.createElement("strong");
    name.textContent = setlist.name;
    const meta = document.createElement("span");
    meta.className = "muted";
    meta.textContent = `${songCount} ${songCount === 1 ? "sang" : "sanger"}`;
    row.append(name, meta);
    row.addEventListener("click", () => startSetlistPlayer(setlist));
    list.append(row);
  }
  chooser.append(list);
  ui.playContent.append(chooser);
}

function startSetlistPlayer(setlist) {
  const playable = setlist.items.some(item => item.type === "song" && songs.some(song => song.id === item.songId));
  if (!playable) {
    showStatus("Set-listen inneholder ingen tilgjengelige sanger.", true);
    return;
  }

  currentPlayer?.destroy();
  selectedSetlistId = setlist.id;
  const workspace = getActiveWorkspace();
  if (workspace) setActiveSetlistId(workspace.workspaceId, setlist.id);
  activeView = "play";
  renderView();
  currentPlayer = createPlayer(ui.playContent, {
    setlist,
    songs,
    lyricsView: getLyricsView(),
    onExit: () => exitPlayer(setlist)
  });
}

function exitPlayer(setlist) {
  currentPlayer?.destroy();
  currentPlayer = null;
  activeView = "setlists";
  renderView();
  selectedSetlistId = setlist.id;
  renderSetlistList();
  renderSetlist(setlist);
}

function stopPlayer() {
  currentPlayer?.destroy();
  currentPlayer = null;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderSetlistPlaceholder() {
  ui.setlistDetail.innerHTML = '<div class="song-placeholder"><p>Velg en set-liste eller opprett en ny.</p></div>';
}

function renderSongPlaceholder() {
  ui.songDetail.innerHTML = '<div class="song-placeholder"><p>Velg en sang fra biblioteket eller opprett en ny.</p></div>';
}

ui.accountButton.addEventListener("click", async () => {
  try {
    if (getAccount() && (editingSong || editingSetlist) && !confirm("Avslutte redigering uten å lagre?")) return;
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
ui.newSetlistButton.addEventListener("click", beginNewSetlist);
ui.refreshSetlistsButton.addEventListener("click", async () => {
  if (editingSetlist && !confirm("Avslutte redigering uten å lagre?")) return;
  editingSetlist = null;
  await refreshSetlists();
});

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
    stopPlayer();
    selectedSongId = null;
    editingSong = null;
    selectedSetlistId = null;
    editingSetlist = null;
    setlists = [];
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

function setSetlistListMessage(message, isError = false) {
  ui.setlistListMessage.textContent = message;
  ui.setlistListMessage.classList.toggle("hidden", !message);
  ui.setlistListMessage.classList.toggle("error", isError);
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
  button.addEventListener("click", async () => {
    const nextView = button.dataset.view;
    if (nextView === activeView) return;
    if (editingSong && nextView !== "songs" && !confirm("Avslutte redigering uten å lagre?")) return;
    if (editingSetlist && nextView !== "setlists" && !confirm("Avslutte redigering uten å lagre?")) return;
    if (nextView !== "songs") editingSong = null;
    if (nextView !== "setlists") editingSetlist = null;
    if (activeView === "play" && nextView !== "play") stopPlayer();
    activeView = nextView;
    renderView();
    if (activeView === "setlists" && getActiveWorkspace() && getAccount()) await refreshSetlists();
    if (activeView === "play" && getActiveWorkspace() && getAccount()) await preparePlayView();
  });
});

window.addEventListener("beforeunload", event => {
  if (!editingSong && !editingSetlist) return;
  event.preventDefault();
  event.returnValue = "";
});

start();
