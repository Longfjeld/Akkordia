const DEFAULT_BPM = 90;
const DEFAULT_BEATS_PER_LINE = 4;
const FONT_LEVELS = [0.8, 0.9, 1, 1.1, 1.25, 1.4];
const FONT_KEY = "akkordia.player.fontScale.v1";
const PULSE_KEY = "akkordia.player.visualPulse.v1";
const COUNT_IN_KEY = "akkordia.player.countIn.v1";
const COUNT_IN_BEATS = 4;

export function createPlayer(container, { setlist, songs, lyricsView = "both", privateNotes = {}, onPrivateNoteChange = null, onPrivateNoteBlur = null, onExit }) {
  const songById = new Map(songs.map(song => [song.id, song]));
  const entries = buildPlayableEntries(setlist, songById);
  let currentIndex = 0;
  let lineIndex = 0;
  let scrollTimer = null;
  let running = false;
  let autoButton = null;
  let wakeLock = null;
  let destroyed = false;

  let fontScale = readFontScale();
  let pulseEnabled = readBoolean(PULSE_KEY, false);
  let countInEnabled = readBoolean(COUNT_IN_KEY, false);
  let pulseTimer = null;
  let pulseFlashTimer = null;
  let pulseIndicator = null;
  let bpmLabel = null;
  let countInRemaining = 0;

  if (!entries.length) {
    container.replaceChildren();
    const empty = document.createElement("div");
    empty.className = "player-empty";
    empty.innerHTML = "<h1>Ingen sanger å spille</h1><p>Set-listen inneholder ingen tilgjengelige sanger.</p>";
    const exit = button("Tilbake til set-lister", "secondary");
    exit.addEventListener("click", onExit);
    empty.append(exit);
    container.append(empty);
    return { destroy };
  }

  const shell = document.createElement("section");
  shell.className = "player-shell";
  shell.style.setProperty("--player-font-scale", String(fontScale));
  document.body.classList.add("is-playing");
  container.replaceChildren(shell);

  document.addEventListener("visibilitychange", onVisibilityChange);
  render();
  syncPulseClock(true);
  requestWakeLock();

  return { destroy };

  function render() {
    const entry = entries[currentIndex];
    const song = entry.song;
    const playback = playbackFor(song);
    shell.replaceChildren();

    const top = document.createElement("header");
    top.className = "player-topbar";

    const exit = button("×", "secondary player-exit");
    exit.title = "Avslutt Spill";
    exit.setAttribute("aria-label", "Avslutt Spill");
    exit.addEventListener("click", onExit);

    const identity = button("", "player-identity-button");
    identity.setAttribute("aria-label", "Åpne set-list");
    const context = document.createElement("strong");
    context.textContent = entry.partName || "Set-list";
    const position = document.createElement("span");
    position.className = "muted";
    position.textContent = `${currentIndex + 1} / ${entries.length}`;
    identity.append(context, position);
    identity.addEventListener("click", openSetlistDialog);

    const tools = document.createElement("div");
    tools.className = "player-top-tools";

    const bpm = button("", `player-bpm${pulseEnabled ? " is-enabled" : ""}`);
    bpm.title = pulseEnabled ? "Slå av visuell puls" : "Slå på visuell puls";
    bpm.setAttribute("aria-pressed", String(pulseEnabled));
    pulseIndicator = document.createElement("span");
    pulseIndicator.className = "player-beat-dot";
    pulseIndicator.setAttribute("aria-hidden", "true");
    bpmLabel = document.createElement("span");
    bpmLabel.textContent = `${playback.bpm} BPM`;
    bpm.append(pulseIndicator, bpmLabel);
    bpm.addEventListener("click", () => {
      pulseEnabled = !pulseEnabled;
      localStorage.setItem(PULSE_KEY, String(pulseEnabled));
      bpm.classList.toggle("is-enabled", pulseEnabled);
      bpm.setAttribute("aria-pressed", String(pulseEnabled));
      bpm.title = pulseEnabled ? "Slå av visuell puls" : "Slå på visuell puls";
      syncPulseClock(true);
    });

    const fontControls = document.createElement("div");
    fontControls.className = "player-font-controls";
    const smaller = button("−", "secondary player-font-step");
    smaller.setAttribute("aria-label", "Mindre tekst");
    const fontLabel = document.createElement("span");
    fontLabel.className = "player-font-label";
    fontLabel.textContent = "A";
    const larger = button("+", "secondary player-font-step");
    larger.setAttribute("aria-label", "Større tekst");
    smaller.disabled = fontScale <= FONT_LEVELS[0];
    larger.disabled = fontScale >= FONT_LEVELS.at(-1);
    smaller.addEventListener("click", () => changeFont(-1));
    larger.addEventListener("click", () => changeFont(1));
    fontControls.append(smaller, fontLabel, larger);

    tools.append(bpm, fontControls);
    top.append(exit, identity, tools);
    shell.append(top);

    const heading = document.createElement("div");
    heading.className = "player-song-heading";
    const title = document.createElement("h1");
    title.textContent = song.title;
    heading.append(title);
    shell.append(heading);

    const note = document.createElement("details");
    note.className = "player-private-note";
    note.open = Boolean(privateNotes?.[song.id]?.text);
    const noteSummary = document.createElement("summary");
    noteSummary.textContent = "Privat notat";
    const noteText = document.createElement("textarea");
    noteText.rows = 3;
    noteText.placeholder = onPrivateNoteChange ? "Dine private notater til denne sangen …" : "Logg inn med Microsoft for å bruke private notater.";
    noteText.value = privateNotes?.[song.id]?.text ?? "";
    noteText.disabled = !onPrivateNoteChange;
    let noteTimer = null;
    const persistNote = async () => {
      clearTimeout(noteTimer);
      noteTimer = null;
      if (!onPrivateNoteChange) return;
      const text = noteText.value;
      if (text.length) privateNotes[song.id] = { text, updatedAt: new Date().toISOString() };
      else delete privateNotes[song.id];
      try {
        await Promise.resolve(onPrivateNoteChange(song.id, text));
      } catch (error) {
        console.warn("Privatnotatet kunne ikke lagres:", error);
      }
    };
    noteText.addEventListener("input", () => {
      clearTimeout(noteTimer);
      noteTimer = setTimeout(() => persistNote(), 250);
    });
    noteText.addEventListener("blur", async () => {
      if (noteTimer) await persistNote();
      await Promise.resolve(onPrivateNoteBlur?.());
    });
    note.append(noteSummary, noteText);
    shell.append(note);

    const body = document.createElement("div");
    body.className = "player-song";
    body.dataset.songId = song.id;
    for (const section of song.sections) {
      const block = document.createElement("section");
      block.className = `player-section section-${section.type}`;
      const sectionHeading = document.createElement("h2");
      sectionHeading.textContent = section.label || section.type;
      block.append(sectionHeading);
      for (const line of section.lines) block.append(renderPlayerLine(line, lyricsView));
      body.append(block);
    }
    shell.append(body);

    const controls = document.createElement("footer");
    controls.className = "player-controls";
    const previous = button("← Forrige", "secondary player-nav-button");
    previous.disabled = currentIndex === 0;
    previous.addEventListener("click", () => goTo(currentIndex - 1));

    const auto = button("", "primary player-autoscroll");
    autoButton = auto;
    auto.addEventListener("click", toggleAutoscroll);
    updateAutoscrollButton();

    const next = button("Neste →", "secondary player-nav-button");
    next.disabled = currentIndex === entries.length - 1;
    next.addEventListener("click", () => goTo(currentIndex + 1));

    controls.append(previous, auto, next);
    shell.append(controls);

    updateActiveLine();
    syncPulseClock(true);
  }

  function openSetlistDialog() {
    const dialog = document.createElement("dialog");
    dialog.className = "player-setlist-dialog";

    const panel = document.createElement("div");
    panel.className = "player-setlist-panel";
    const header = document.createElement("header");
    header.className = "player-setlist-dialog-header";
    const heading = document.createElement("div");
    const title = document.createElement("h2");
    title.textContent = setlist.name;
    const sub = document.createElement("p");
    sub.className = "muted";
    sub.textContent = `${currentIndex + 1} / ${entries.length}`;
    heading.append(title, sub);
    const close = button("×", "secondary player-dialog-close");
    close.setAttribute("aria-label", "Lukk set-list");
    close.addEventListener("click", () => dialog.close());
    header.append(heading, close);

    const preferences = document.createElement("div");
    preferences.className = "player-performance-settings";
    preferences.append(
      checkboxSetting("Visuell BPM-puls", pulseEnabled, value => {
        pulseEnabled = value;
        localStorage.setItem(PULSE_KEY, String(value));
        syncPulseClock(true);
        render();
      }),
      checkboxSetting("Count-in: 4 slag før Auto", countInEnabled, value => {
        countInEnabled = value;
        localStorage.setItem(COUNT_IN_KEY, String(value));
      })
    );

    const list = document.createElement("div");
    list.className = "player-overlay-list";
    let lastPart = null;
    let partNumber = 0;
    entries.forEach((entry, index) => {
      if (entry.partName !== lastPart) {
        if (entry.partName) {
          const part = document.createElement("div");
          part.className = "player-overlay-part";
          part.textContent = entry.partName;
          list.append(part);
        }
        lastPart = entry.partName;
        partNumber = 0;
      }
      partNumber += 1;
      const item = button("", "player-overlay-song");
      item.classList.toggle("is-current", index === currentIndex);
      const number = document.createElement("span");
      number.className = "player-overlay-number";
      number.textContent = String(partNumber);
      const name = document.createElement("span");
      name.textContent = entry.song.title;
      item.append(number, name);
      item.addEventListener("click", () => {
        dialog.close();
        goTo(index);
      });
      list.append(item);
    });

    panel.append(header, preferences, list);
    dialog.append(panel);
    shell.append(dialog);
    dialog.addEventListener("close", () => dialog.remove(), { once: true });
    dialog.addEventListener("click", event => {
      if (event.target === dialog) dialog.close();
    });
    dialog.showModal();
  }

  function checkboxSetting(labelText, checked, onChange) {
    const label = document.createElement("label");
    label.className = "player-setting-row";
    const text = document.createElement("span");
    text.textContent = labelText;
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = checked;
    input.addEventListener("change", () => onChange(input.checked));
    label.append(text, input);
    return label;
  }

  function changeFont(direction) {
    let index = FONT_LEVELS.findIndex(value => value === fontScale);
    if (index < 0) index = FONT_LEVELS.indexOf(1);
    index = Math.max(0, Math.min(FONT_LEVELS.length - 1, index + direction));
    fontScale = FONT_LEVELS[index];
    localStorage.setItem(FONT_KEY, String(fontScale));
    shell.style.setProperty("--player-font-scale", String(fontScale));
    render();
  }

  function goTo(index) {
    if (index < 0 || index >= entries.length || index === currentIndex) return;
    stopAutoscroll();
    cancelCountIn();
    currentIndex = index;
    lineIndex = 0;
    render();
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function toggleAutoscroll() {
    if (running || countInRemaining > 0) {
      stopAutoscroll();
      cancelCountIn();
    } else if (countInEnabled) {
      beginCountIn();
    } else {
      startAutoscroll();
    }
    updateAutoscrollButton();
  }

  function beginCountIn() {
    countInRemaining = COUNT_IN_BEATS;
    updateAutoscrollButton();
    syncPulseClock(false);
  }

  function cancelCountIn() {
    countInRemaining = 0;
    updateAutoscrollButton();
    syncPulseClock(false);
  }

  function startAutoscroll(preserveBeatFlash = false) {
    const lines = getLines();
    if (!lines.length) return;
    countInRemaining = 0;
    running = true;
    updateActiveLine(true);
    scheduleNextLine();
    updateAutoscrollButton();
    if (!preserveBeatFlash) syncPulseClock(false);
  }

  function stopAutoscroll() {
    running = false;
    if (scrollTimer) clearTimeout(scrollTimer);
    scrollTimer = null;
    updateAutoscrollButton();
  }

  function scheduleNextLine() {
    if (!running || destroyed) return;
    const song = entries[currentIndex].song;
    const playback = playbackFor(song);
    const delay = (60000 / playback.bpm) * playback.beatsPerLine;
    scrollTimer = setTimeout(() => {
      const lines = getLines();
      if (lineIndex < lines.length - 1) {
        lineIndex += 1;
        updateActiveLine(true);
        scheduleNextLine();
      } else {
        stopAutoscroll();
      }
    }, delay);
  }

  function updateAutoscrollButton() {
    if (!autoButton) return;
    if (countInRemaining > 0) {
      autoButton.textContent = `${countInRemaining} · Auto`;
      autoButton.setAttribute("aria-label", `Count-in ${countInRemaining} slag igjen. Trykk for å avbryte.`);
    } else if (running) {
      autoButton.textContent = "⏸ Auto";
      autoButton.setAttribute("aria-label", "Pause autoscroll");
    } else {
      autoButton.textContent = "▶ Auto";
      autoButton.setAttribute("aria-label", countInEnabled ? "Start autoscroll med 4 slag count-in" : "Start autoscroll");
    }
  }

  function syncPulseClock(resetPhase) {
    const shouldRun = pulseEnabled || countInRemaining > 0;
    if (!shouldRun) {
      clearPulseClock();
      return;
    }
    if (pulseTimer && !resetPhase) return;
    clearPulseClock();
    scheduleBeat(resetPhase ? 0 : beatDelay());
  }

  function scheduleBeat(delay) {
    if (destroyed || (!pulseEnabled && countInRemaining <= 0)) return;
    pulseTimer = setTimeout(() => {
      pulseTimer = null;
      onBeat();
      scheduleBeat(beatDelay());
    }, Math.max(0, delay));
  }

  function onBeat() {
    flashBeat();
    if (countInRemaining > 0) {
      countInRemaining -= 1;
      updateAutoscrollButton();
      if (countInRemaining === 0) {
        startAutoscroll(true);
      }
    }
  }

  function beatDelay() {
    return 60000 / playbackFor(entries[currentIndex].song).bpm;
  }

  function flashBeat() {
    if (!pulseIndicator) return;
    pulseIndicator.classList.add("is-beat");
    if (pulseFlashTimer) clearTimeout(pulseFlashTimer);
    pulseFlashTimer = setTimeout(() => {
      pulseIndicator?.classList.remove("is-beat");
      pulseFlashTimer = null;
    }, Math.min(160, beatDelay() * 0.35));
  }

  function clearPulseClock() {
    if (pulseTimer) clearTimeout(pulseTimer);
    if (pulseFlashTimer) clearTimeout(pulseFlashTimer);
    pulseTimer = null;
    pulseFlashTimer = null;
    pulseIndicator?.classList.remove("is-beat");
  }

  function getLines() {
    return [...shell.querySelectorAll(".player-song-line")];
  }

  function updateActiveLine(scroll = false) {
    const lines = getLines();
    if (!lines.length) return;
    lineIndex = Math.max(0, Math.min(lineIndex, lines.length - 1));
    lines.forEach((line, index) => line.classList.toggle("is-current", index === lineIndex));
    if (scroll) lines[lineIndex].scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function requestWakeLock() {
    if (destroyed || document.visibilityState !== "visible" || !("wakeLock" in navigator)) return;
    try {
      wakeLock = await navigator.wakeLock.request("screen");
      wakeLock.addEventListener("release", () => { wakeLock = null; });
    } catch (error) {
      console.info("Wake Lock kunne ikke aktiveres:", error);
    }
  }

  async function releaseWakeLock() {
    try { await wakeLock?.release(); } catch { /* no-op */ }
    wakeLock = null;
  }

  function onVisibilityChange() {
    if (destroyed) return;
    if (document.visibilityState === "visible") {
      if (!wakeLock) requestWakeLock();
      syncPulseClock(true);
    } else {
      clearPulseClock();
    }
  }

  function destroy() {
    destroyed = true;
    stopAutoscroll();
    cancelCountIn();
    clearPulseClock();
    document.removeEventListener("visibilitychange", onVisibilityChange);
    releaseWakeLock();
    document.body.classList.remove("is-playing");
    container.replaceChildren();
  }
}

function buildPlayableEntries(setlist, songById) {
  const entries = [];
  let partName = "";
  for (const item of setlist.items) {
    if (item.type === "part") {
      partName = item.name;
      continue;
    }
    if (item.type !== "song") continue;
    const song = songById.get(item.songId);
    if (!song) continue;
    entries.push({ song, partName });
  }
  return entries;
}

function playbackFor(song) {
  return {
    bpm: song.playback?.bpm ?? DEFAULT_BPM,
    beatsPerLine: song.playback?.beatsPerLine ?? DEFAULT_BEATS_PER_LINE
  };
}

function renderPlayerLine(line, view) {
  const row = document.createElement("div");
  row.className = "player-song-line";

  const chordLine = document.createElement("div");
  chordLine.className = "chord-line";
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

function readFontScale() {
  const value = Number(localStorage.getItem(FONT_KEY));
  return FONT_LEVELS.includes(value) ? value : 1;
}

function readBoolean(key, fallback) {
  const value = localStorage.getItem(key);
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function button(label, className = "") {
  const node = document.createElement("button");
  node.type = "button";
  node.className = className;
  node.textContent = label;
  return node;
}
