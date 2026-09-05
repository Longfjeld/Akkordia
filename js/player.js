const DEFAULT_BPM = 90;
const DEFAULT_BEATS_PER_LINE = 4;

export function createPlayer(container, { setlist, songs, lyricsView = "both", onExit }) {
  const songById = new Map(songs.map(song => [song.id, song]));
  const entries = buildPlayableEntries(setlist, songById);
  let currentIndex = 0;
  let lineIndex = 0;
  let timer = null;
  let running = false;
  let autoButton = null;
  let wakeLock = null;
  let destroyed = false;

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
  document.body.classList.add("is-playing");
  container.replaceChildren(shell);

  document.addEventListener("visibilitychange", onVisibilityChange);
  render();
  requestWakeLock();

  return { destroy };

  function render() {
    const entry = entries[currentIndex];
    const song = entry.song;
    shell.replaceChildren();

    const top = document.createElement("header");
    top.className = "player-topbar";

    const exit = button("Avslutt", "secondary player-exit");
    exit.addEventListener("click", onExit);

    const identity = document.createElement("div");
    identity.className = "player-identity";
    const setlistName = document.createElement("strong");
    setlistName.textContent = setlist.name;
    const position = document.createElement("span");
    position.className = "muted";
    position.textContent = `${currentIndex + 1} / ${entries.length}`;
    identity.append(setlistName, position);

    const jump = document.createElement("details");
    jump.className = "player-jump";
    const summary = document.createElement("summary");
    summary.textContent = "Set-list";
    jump.append(summary, renderJumpList());

    top.append(exit, identity, jump);
    shell.append(top);

    const heading = document.createElement("div");
    heading.className = "player-song-heading";
    if (entry.partName) {
      const part = document.createElement("div");
      part.className = "player-part";
      part.textContent = entry.partName;
      heading.append(part);
    }
    const title = document.createElement("h1");
    title.textContent = song.title;
    const playback = playbackFor(song);
    const meta = document.createElement("div");
    meta.className = "player-meta muted";
    meta.textContent = `${playback.bpm} BPM · ${playback.beatsPerLine} beats/linje${song.playback ? "" : " · standard"}`;
    heading.append(title, meta);
    shell.append(heading);

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
    const previous = button("← Forrige", "secondary");
    previous.disabled = currentIndex === 0;
    previous.addEventListener("click", () => goTo(currentIndex - 1));

    const auto = button(running ? "Pause autoscroll" : "Start autoscroll", "primary player-autoscroll");
    autoButton = auto;
    auto.addEventListener("click", toggleAutoscroll);

    const next = button("Neste →", "secondary");
    next.disabled = currentIndex === entries.length - 1;
    next.addEventListener("click", () => goTo(currentIndex + 1));

    controls.append(previous, auto, next);
    shell.append(controls);

    updateActiveLine();
  }

  function renderJumpList() {
    const list = document.createElement("div");
    list.className = "player-jump-list";
    let lastPart = null;
    entries.forEach((entry, index) => {
      if (entry.partName && entry.partName !== lastPart) {
        const part = document.createElement("div");
        part.className = "player-jump-part";
        part.textContent = entry.partName;
        list.append(part);
        lastPart = entry.partName;
      }
      const item = button(`${index + 1}. ${entry.song.title}`, "player-jump-song");
      item.classList.toggle("is-current", index === currentIndex);
      item.addEventListener("click", event => {
        goTo(index);
        event.currentTarget.closest("details")?.removeAttribute("open");
      });
      list.append(item);
    });
    return list;
  }

  function goTo(index) {
    if (index < 0 || index >= entries.length || index === currentIndex) return;
    stopAutoscroll();
    currentIndex = index;
    lineIndex = 0;
    render();
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function toggleAutoscroll() {
    if (running) stopAutoscroll();
    else startAutoscroll();
    updateAutoscrollButton();
  }

  function startAutoscroll() {
    const lines = getLines();
    if (!lines.length) return;
    running = true;
    updateActiveLine(true);
    scheduleNext();
  }

  function stopAutoscroll() {
    running = false;
    if (timer) clearTimeout(timer);
    timer = null;
  }

  function scheduleNext() {
    if (!running || destroyed) return;
    const song = entries[currentIndex].song;
    const playback = playbackFor(song);
    const delay = (60000 / playback.bpm) * playback.beatsPerLine;
    timer = setTimeout(() => {
      const lines = getLines();
      if (lineIndex < lines.length - 1) {
        lineIndex += 1;
        updateActiveLine(true);
        scheduleNext();
      } else {
        stopAutoscroll();
        updateAutoscrollButton();
      }
    }, delay);
  }

  function updateAutoscrollButton() {
    if (autoButton) autoButton.textContent = running ? "Pause autoscroll" : "Start autoscroll";
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
    if (!destroyed && document.visibilityState === "visible" && !wakeLock) requestWakeLock();
  }

  function destroy() {
    destroyed = true;
    stopAutoscroll();
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

function button(label, className = "") {
  const node = document.createElement("button");
  node.type = "button";
  node.className = className;
  node.textContent = label;
  return node;
}
