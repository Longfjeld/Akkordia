import { initializeAuth, getAccount, signIn, signOut } from "./auth.js";
import { getRootFolder, listFolders, validateWorkspace } from "./onedrive.js";
import { getActiveWorkspace, saveWorkspace, setActiveWorkspaceId } from "./workspaces.js";
import { createSong, getLyricsView, loadSongs, saveSong, setLyricsView } from "./songs.js";
import { cloneSong, renderSongEditor } from "./editor.js";
import { createSetlist, getActiveSetlistId, loadSetlists, saveSetlist, setActiveSetlistId } from "./setlists.js";
import { renderSetlistEditor } from "./setlist-editor.js";
import { createPlayer } from "./player.js";
import { getWorkspaceSnapshot, updateWorkspaceSnapshot } from "./offline.js";
import { getPrivateNotesState, savePrivateNoteLocal, syncPrivateNotes } from "./private-notes.js";

const ui = {
  accountButton: document.querySelector("#accountButton"),
  connectionStatus: document.querySelector("#connectionStatus"),
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
let songsReadOnly = true;
let setlistsReadOnly = true;
let setlistsWorkspaceId = null;
let setlistsSyncedWorkspaceId = null;
let setlistsRefreshPromise = null;
let setlistsRefreshWorkspaceId = null;
let setlistsLastErrors = [];
let privateNotesState = null;
let privateNotesSyncTimer = null;

const PRIVATE_NOTES_LOCAL_SAVE_DELAY = 250;
const PRIVATE_NOTES_SYNC_DELAY = 5000;
const PRIVATE_NOTES_BLUR_SYNC_DELAY = 500;

async function start() {
  let authError = null;
  try {
    await initializeAuth();
  } catch (error) {
    authError = error;
  }

  renderHeader();
  renderConnectivity();
  ui.lyricsView.value = getLyricsView();
  renderView();
  await registerServiceWorker();

  const workspace = getActiveWorkspace();
  if (workspace) {
    await refreshSongs();
    await initializePrivateNotes(workspace);
    await primeSetlistsForOffline();
  }

  if (authError) {
    if (navigator.onLine) showStatus(`Autentisering kunne ikke initialiseres: ${authError.message}`, true);
    else showStatus("Offline · viser sist lagrede data dersom de finnes.", false);
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

  if (workspace && !navigator.onLine) {
    showStatus(`Offline · ${workspace.name} · fellesdata kun lesing`, false);
  } else if (workspace && activeView === "play") {
    showStatus(`Spill · ${workspace.name}`, false);
  } else if (workspace) {
    showStatus(`Aktivt band: ${workspace.name}`, false);
  }
}

function canWrite() {
  return navigator.onLine && Boolean(getAccount());
}

function canWriteSongs() {
  return canWrite() && !songsReadOnly;
}

function canWriteSetlists() {
  return canWrite() && !setlistsReadOnly;
}

function renderConnectivity() {
  const online = navigator.onLine;
  ui.connectionStatus.textContent = online ? "Online" : "Offline · fellesdata kun lesing";
  ui.connectionStatus.classList.toggle("is-offline", !online);
  ui.accountButton.disabled = !online;
  ui.connectWorkspace.disabled = !online;
  ui.newSongButton.disabled = !canWriteSongs();
  ui.newSetlistButton.disabled = !canWriteSetlists();

  if (!online) {
    showStatus("Offline · bruker sist lagrede fellesdata. Private notater kan fortsatt redigeres.", false);
  }
}

async function primeSetlistsForOffline() {
  const workspace = getActiveWorkspace();
  if (!workspace) return;

  await loadSetlistsFromCache(workspace);

  if (navigator.onLine && getAccount()) {
    void refreshSetlistsFromOneDrive(workspace).catch(error => {
      console.info("Kunne ikke forhåndslaste set-lister fra OneDrive:", error);
    });
  }
}

async function loadSetlistsFromCache(workspace) {
  const cached = await getWorkspaceSnapshot(workspace.workspaceId);
  if (!cached?.hasSetlists) return false;

  setlists = cached.setlists;
  setlistsWorkspaceId = workspace.workspaceId;
  setlistsReadOnly = setlistsSyncedWorkspaceId !== workspace.workspaceId;
  renderConnectivity();
  return true;
}

async function refreshSetlistsFromOneDrive(workspace, { force = false } = {}) {
  if (!workspace || !navigator.onLine || !getAccount()) return null;

  if (!force && setlistsSyncedWorkspaceId === workspace.workspaceId) {
    return { setlists, errors: setlistsLastErrors, changed: false, fromMemory: true };
  }

  if (!force && setlistsRefreshPromise && setlistsRefreshWorkspaceId === workspace.workspaceId) {
    return setlistsRefreshPromise;
  }

  const workspaceId = workspace.workspaceId;
  const request = (async () => {
    const result = await loadSetlists(workspace);
    const changed = setlistsWorkspaceId !== workspaceId || !sameSetlists(setlists, result.setlists);

    if (getActiveWorkspace()?.workspaceId !== workspaceId) {
      return { ...result, changed, fromMemory: false, ignored: true };
    }

    setlists = result.setlists;
    setlistsWorkspaceId = workspaceId;
    setlistsSyncedWorkspaceId = workspaceId;
    setlistsLastErrors = result.errors;
    setlistsReadOnly = false;
    await updateWorkspaceSnapshot(workspaceId, { setlists: result.setlists });
    renderConnectivity();

    return { ...result, changed, fromMemory: false };
  })();

  setlistsRefreshPromise = request;
  setlistsRefreshWorkspaceId = workspaceId;
  try {
    return await request;
  } finally {
    if (setlistsRefreshPromise === request) {
      setlistsRefreshPromise = null;
      setlistsRefreshWorkspaceId = null;
    }
  }
}

async function loadSetlistsForCurrentMode() {
  const workspace = getActiveWorkspace();
  if (!workspace) return;

  if (setlistsWorkspaceId === workspace.workspaceId && setlists.length) return;

  const hasCache = await loadSetlistsFromCache(workspace);
  if (hasCache) {
    if (navigator.onLine && getAccount()) {
      void refreshSetlistsFromOneDrive(workspace).catch(error => {
        console.warn("Bakgrunnsoppdatering av set-lister feilet:", error);
      });
    }
    return;
  }

  if (navigator.onLine && getAccount()) {
    await refreshSetlistsFromOneDrive(workspace);
    return;
  }

  throw new Error("Ingen offline-cache for set-lister er tilgjengelig.");
}

function sameSetlists(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register("./sw.js", { scope: "./" });
  } catch (error) {
    console.info("Service worker kunne ikke registreres:", error);
  }
}

async function refreshSongs() {
  const workspace = getActiveWorkspace();
  if (!workspace) return;

  editingSong = null;
  setSongListMessage(navigator.onLine ? "Laster sanger …" : "Laster offline-data …");
  ui.songList.replaceChildren();
  ui.songDetail.replaceChildren();

  try {
    let result;
    let source = "online";

    if (navigator.onLine && getAccount()) {
      try {
        result = await loadSongs(workspace);
        await updateWorkspaceSnapshot(workspace.workspaceId, { songs: result.songs });
      } catch (error) {
        const cached = await getWorkspaceSnapshot(workspace.workspaceId);
        if (!cached?.hasSongs) throw error;
        result = { songs: cached.songs, errors: [] };
        source = "cache";
        console.warn("Online lasting av sanger feilet. Bruker offline-cache:", error);
      }
    } else {
      const cached = await getWorkspaceSnapshot(workspace.workspaceId);
      if (!cached?.hasSongs) {
        throw new Error("Ingen offline-cache for sanger er tilgjengelig. Koble til nett og åpne bandet minst én gang.");
      }
      result = { songs: cached.songs, errors: [] };
      source = "cache";
    }

    songs = result.songs;
    songsReadOnly = source === "cache";
    renderConnectivity();
    renderSongList();

    if (!songs.length) setSongListMessage("Ingen gyldige sangfiler ble funnet.");
    else if (source === "cache") {
      setSongListMessage(`${songs.length} sanger lastet fra offline-cache · kun lesing.`);
    } else if (result.errors.length) {
      setSongListMessage(`${songs.length} sanger lastet. ${result.errors.length} fil(er) kunne ikke leses.`, true);
      console.warn("Sangfiler som ikke kunne leses:", result.errors);
    } else {
      setSongListMessage(`${songs.length} sanger lastet fra OneDrive.`);
    }

    if (selectedSongId && songs.some(song => song.id === selectedSongId)) {
      renderSong(songs.find(song => song.id === selectedSongId));
    } else {
      renderSongPlaceholder();
    }
  } catch (error) {
    songsReadOnly = true;
    renderConnectivity();
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
  edit.disabled = !canWriteSongs();
  if (!canWriteSongs()) edit.title = "Redigering krever en oppdatert online-versjon av sangbiblioteket.";
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
  appendPrivateNotePanel(ui.songDetail, song);

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
  if (!canWriteSongs()) {
    showStatus("Sangbiblioteket er i lesemodus. Koble til nett og oppdater data før redigering.", true);
    return;
  }
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
  if (!canWriteSongs()) {
    showStatus("Nye sanger krever en aktiv, oppdatert OneDrive-tilkobling.", true);
    return;
  }
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
  if (!canWriteSongs()) throw new Error("Sangen kan ikke lagres før biblioteket er oppdatert fra OneDrive.");
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
  await updateWorkspaceSnapshot(workspace.workspaceId, { songs });
  songsReadOnly = false;
  renderConnectivity();
  renderSongList();
  renderSong(draft);
  setSongListMessage(`${songs.length} sanger lastet.`);
  showStatus(`Sangen «${draft.title}» er lagret.`, false);
}

async function initializePrivateNotes(workspace) {
  const account = getAccount();
  if (!workspace || !account) {
    privateNotesState = null;
    return;
  }

  try {
    privateNotesState = await getPrivateNotesState(account, workspace.workspaceId);
    if (navigator.onLine) await syncPrivateNotesForWorkspace(workspace);
  } catch (error) {
    console.warn("Private notater kunne ikke initialiseres:", error);
  }
}

async function savePrivateNote(songId, text, { syncDelay = PRIVATE_NOTES_SYNC_DELAY } = {}) {
  const workspace = getActiveWorkspace();
  const account = getAccount();
  if (!workspace || !account) throw new Error("Du må være logget inn for å bruke private notater.");

  privateNotesState = await savePrivateNoteLocal(account, workspace.workspaceId, songId, text);
  updatePrivateNoteStatusIndicators();
  if (syncDelay !== null) schedulePrivateNotesSync(workspace, syncDelay);
  return privateNotesState;
}

function schedulePrivateNotesSync(workspace, delay = PRIVATE_NOTES_SYNC_DELAY) {
  clearTimeout(privateNotesSyncTimer);
  privateNotesSyncTimer = null;
  if (!navigator.onLine || !getAccount()) {
    updatePrivateNoteStatusIndicators();
    return;
  }
  privateNotesSyncTimer = setTimeout(() => {
    privateNotesSyncTimer = null;
    if (isPrivateNoteEditing()) {
      updatePrivateNoteStatusIndicators();
      return;
    }
    syncPrivateNotesForWorkspace(workspace).catch(error => {
      console.warn("Synkronisering av private notater feilet:", error);
    });
  }, delay);
}

function isPrivateNoteEditing() {
  return Boolean(document.activeElement?.closest?.(".private-note-card textarea, .player-private-note textarea"));
}

async function syncPrivateNotesForWorkspace(workspace) {
  const account = getAccount();
  if (!workspace || !account || !navigator.onLine) {
    updatePrivateNoteStatusIndicators();
    return;
  }

  clearTimeout(privateNotesSyncTimer);
  privateNotesSyncTimer = null;
  updatePrivateNoteStatusIndicators({ syncing: true });
  try {
    privateNotesState = await syncPrivateNotes(account, workspace);
    updatePrivateNoteStatusIndicators();
  } catch (error) {
    updatePrivateNoteStatusIndicators();
    console.warn("Private notater er lagret lokalt, men OneDrive-synk feilet:", error);
  }
}

function updatePrivateNoteStatusIndicators({ syncing = false } = {}) {
  document.querySelectorAll(".private-note-status[data-song-id]").forEach(status => {
    const songId = status.dataset.songId;
    const dirty = privateNotesState?.dirtySongIds?.includes(songId);

    if (syncing && dirty) {
      status.textContent = "Synkroniserer …";
      status.disabled = true;
      status.title = "";
      return;
    }

    if (dirty && navigator.onLine) {
      status.textContent = "Venter på synk";
      status.disabled = false;
      status.title = "Trykk for å synkronisere nå";
      return;
    }

    status.textContent = dirty
      ? "Lagret lokalt · venter på nett"
      : (privateNotesState?.lastSyncedAt ? "Synkronisert" : "Lagres privat");
    status.disabled = true;
    status.title = "";
  });
}

function appendPrivateNotePanel(container, song) {
  const account = getAccount();
  const panel = document.createElement("section");
  panel.className = "private-note-card";
  const heading = document.createElement("div");
  heading.className = "private-note-heading";
  const title = document.createElement("h2");
  title.textContent = "Privat notat";
  const status = document.createElement("button");
  status.type = "button";
  status.className = "private-note-status muted";
  status.dataset.songId = song.id;
  heading.append(title, status);
  panel.append(heading);

  if (!account) {
    const message = document.createElement("p");
    message.className = "muted";
    message.textContent = "Logg inn med Microsoft for å bruke private notater.";
    panel.append(message);
    container.append(panel);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.rows = 4;
  textarea.placeholder = "Dine private notater til denne sangen …";
  textarea.value = privateNotesState?.notes?.[song.id]?.text ?? "";
  let saveTimer = null;
  let pendingText = textarea.value;

  const setLocalStatus = text => {
    status.textContent = text;
  };

  const persist = async ({ syncDelay = PRIVATE_NOTES_SYNC_DELAY } = {}) => {
    clearTimeout(saveTimer);
    saveTimer = null;
    try {
      setLocalStatus("Lagrer lokalt …");
      await savePrivateNote(song.id, pendingText, { syncDelay });
      updatePrivateNoteStatusIndicators();
    } catch (error) {
      setLocalStatus("Kunne ikke lagre");
      console.error(error);
    }
  };

  textarea.addEventListener("input", () => {
    pendingText = textarea.value;
    setLocalStatus("Endret …");
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => persist(), PRIVATE_NOTES_LOCAL_SAVE_DELAY);
  });
  textarea.addEventListener("blur", async () => {
    if (saveTimer) await persist({ syncDelay: PRIVATE_NOTES_BLUR_SYNC_DELAY });
    else if (privateNotesState?.dirtySongIds?.includes(song.id)) schedulePrivateNotesSync(getActiveWorkspace(), PRIVATE_NOTES_BLUR_SYNC_DELAY);
  });
  status.addEventListener("click", async () => {
    if (status.disabled || !navigator.onLine) return;
    if (saveTimer) await persist({ syncDelay: null });
    await syncPrivateNotesForWorkspace(getActiveWorkspace());
  });
  panel.append(textarea);

  const conflict = privateNotesState?.conflicts?.[song.id];
  if (conflict?.backup?.text) {
    const details = document.createElement("details");
    details.className = "private-note-conflict";
    const summary = document.createElement("summary");
    summary.textContent = "Konfliktkopi bevart";
    const explanation = document.createElement("p");
    explanation.className = "muted";
    explanation.textContent = "Samme notat ble endret på en annen enhet. Den tapende teksten er bevart her.";
    const backup = document.createElement("pre");
    backup.textContent = conflict.backup.text;
    const restore = document.createElement("button");
    restore.type = "button";
    restore.className = "secondary small";
    restore.textContent = "Bruk konfliktkopien";
    restore.addEventListener("click", async () => {
      textarea.value = conflict.backup.text;
      pendingText = textarea.value;
      await persist();
      const current = songs.find(item => item.id === song.id);
      if (current) renderSong(current);
    });
    details.append(summary, explanation, backup, restore);
    panel.append(details);
  }

  container.append(panel);
  updatePrivateNoteStatusIndicators();
}

async function refreshSetlists({ force = false } = {}) {
  const workspace = getActiveWorkspace();
  if (!workspace) return;

  editingSetlist = null;

  try {
    const sameWorkspaceInMemory = setlistsWorkspaceId === workspace.workspaceId;
    let hasCachedData = sameWorkspaceInMemory && setlists.length > 0;

    if (!hasCachedData) {
      hasCachedData = await loadSetlistsFromCache(workspace);
    }

    if (hasCachedData) {
      renderCurrentSetlists();
      if (navigator.onLine && getAccount() && setlistsSyncedWorkspaceId !== workspace.workspaceId) {
        setSetlistListMessage(`${setlists.length} set-lister fra lokal cache · oppdaterer fra OneDrive …`);
      } else if (setlistsSyncedWorkspaceId === workspace.workspaceId) {
        setSetlistListMessage(`${setlists.length} set-lister klare · synkronisert med OneDrive.`);
      } else {
        setSetlistListMessage(`${setlists.length} set-lister lastet fra offline-cache · kun lesing.`);
      }
    } else {
      setSetlistListMessage(navigator.onLine ? "Laster set-lister fra OneDrive …" : "Laster offline-data …");
      ui.setlistList.replaceChildren();
      ui.setlistDetail.replaceChildren();
    }

    if (navigator.onLine && getAccount()) {
      const result = await refreshSetlistsFromOneDrive(workspace, { force });
      if (!result) return;

      if (result.ignored) return;
      if (!result.fromMemory) renderCurrentSetlists();
      else updateSelectedSetlistAfterRefresh();

      if (!setlists.length) setSetlistListMessage("Ingen set-lister er opprettet ennå.");
      else if (result.errors.length) {
        setSetlistListMessage(`${setlists.length} set-lister lastet. ${result.errors.length} fil(er) kunne ikke leses.`, true);
        console.warn("Set-listfiler som ikke kunne leses:", result.errors);
      } else if (result.fromMemory && !force) {
        setSetlistListMessage(`${setlists.length} set-lister klare · allerede synkronisert i denne økten.`);
      } else {
        setSetlistListMessage(`${setlists.length} set-lister oppdatert fra OneDrive.`);
      }
      return;
    }

    if (!hasCachedData) {
      throw new Error("Ingen offline-cache for set-lister er tilgjengelig. Koble til nett og åpne bandet minst én gang.");
    }
  } catch (error) {
    if (setlistsWorkspaceId === workspace.workspaceId && setlists.length) {
      setlistsReadOnly = true;
      renderConnectivity();
      renderCurrentSetlists();
      setSetlistListMessage(`${setlists.length} set-lister fra lokal cache · OneDrive kunne ikke oppdateres.`, true);
      console.warn("Online lasting av set-lister feilet. Beholder lokal cache:", error);
      return;
    }

    setlistsReadOnly = true;
    renderConnectivity();
    setSetlistListMessage(error.message, true);
    renderSetlistPlaceholder();
  }
}

function renderCurrentSetlists() {
  const workspace = getActiveWorkspace();
  if (!workspace) return;

  updateSelectedSetlistAfterRefresh();
  renderSetlistList();
  if (selectedSetlistId) renderSetlist(setlists.find(item => item.id === selectedSetlistId));
  else renderSetlistPlaceholder();
}

function updateSelectedSetlistAfterRefresh() {
  const workspace = getActiveWorkspace();
  if (!workspace) return;

  const preferred = selectedSetlistId ?? getActiveSetlistId(workspace.workspaceId);
  selectedSetlistId = setlists.some(item => item.id === preferred) ? preferred : null;
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
  edit.disabled = !canWriteSetlists();
  if (!canWriteSetlists()) edit.title = "Redigering krever en oppdatert online-versjon av set-listene.";
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
  if (!canWriteSetlists()) {
    showStatus("Set-listene er i lesemodus. Koble til nett og oppdater data før redigering.", true);
    return;
  }
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
  if (!canWriteSetlists()) {
    showStatus("Nye set-lister krever en aktiv, oppdatert OneDrive-tilkobling.", true);
    return;
  }
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
  if (!canWriteSetlists()) throw new Error("Set-listen kan ikke lagres før data er oppdatert fra OneDrive.");
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
  await updateWorkspaceSnapshot(workspace.workspaceId, { setlists });
  setlistsReadOnly = false;
  renderConnectivity();
  renderSetlistList();
  renderSetlist(draft);
  setSetlistListMessage(`${setlists.length} set-lister lastet.`);
  showStatus(`Set-listen «${draft.name}» er lagret.`, false);
}

async function preparePlayView() {
  if (!getActiveWorkspace() || currentPlayer) return;

  ui.playContent.innerHTML = '<div class="player-empty"><p>Laster set-lister …</p></div>';
  try {
    if (!setlists.length) {
      await loadSetlistsForCurrentMode();
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
    privateNotes: privateNotesState?.notes ?? {},
    onPrivateNoteChange: (songId, text) => savePrivateNote(songId, text),
    onPrivateNoteBlur: () => {
      if (workspace && privateNotesState?.dirtySongIds?.length) schedulePrivateNotesSync(workspace, PRIVATE_NOTES_BLUR_SYNC_DELAY);
    },
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
  if (!navigator.onLine) return;
  try {
    if (getAccount() && (editingSong || editingSetlist) && !confirm("Avslutte redigering uten å lagre?")) return;
    if (getAccount()) await signOut();
    else await signIn();
  } catch (error) {
    showStatus(error.message, true);
  }
});

ui.connectWorkspace.addEventListener("click", async () => {
  if (!navigator.onLine) {
    showStatus("Offline · du kan ikke koble til et nytt band.", true);
    return;
  }
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
  await refreshSetlists({ force: true });
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
    setlistsWorkspaceId = null;
    setlistsSyncedWorkspaceId = null;
    setlistsRefreshPromise = null;
    setlistsRefreshWorkspaceId = null;
    setlistsLastErrors = [];
    renderHeader();
    renderView();
    await refreshSongs();
    await initializePrivateNotes(workspace);
    await primeSetlistsForOffline();
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
    if (activeView === "songs" && getActiveWorkspace() && navigator.onLine && songsReadOnly) await refreshSongs();
    if (activeView === "setlists" && getActiveWorkspace()) await refreshSetlists();
    if (activeView === "play" && getActiveWorkspace()) await preparePlayView();
  });
});

window.addEventListener("online", async () => {
  renderConnectivity();
  renderHeader();
  const workspace = getActiveWorkspace();
  if (!workspace) return;

  if (!editingSong && activeView === "songs") {
    await refreshSongs();
  }
  if (!editingSetlist && activeView === "setlists") {
    await refreshSetlists();
  } else if (activeView !== "setlists") {
    await primeSetlistsForOffline();
  }

  await syncPrivateNotesForWorkspace(workspace);
  showStatus("Online igjen · data er oppdatert fra OneDrive.", false);
});

window.addEventListener("offline", () => {
  setlistsSyncedWorkspaceId = null;
  renderConnectivity();
  if (!editingSong && activeView === "songs" && selectedSongId) {
    const song = songs.find(item => item.id === selectedSongId);
    if (song) renderSong(song);
  }
  if (!editingSetlist && activeView === "setlists" && selectedSetlistId) {
    const setlist = setlists.find(item => item.id === selectedSetlistId);
    if (setlist) renderSetlist(setlist);
  }
  if (editingSong || editingSetlist) {
    showStatus("Nettforbindelsen er borte. Åpen redigering kan ikke lagres før du er online igjen.", true);
  }
});

window.addEventListener("beforeunload", event => {
  if (!editingSong && !editingSetlist) return;
  event.preventDefault();
  event.returnValue = "";
});

start();
