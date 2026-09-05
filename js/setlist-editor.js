export function renderSetlistEditor(container, setlist, songs, { onCancel, onSave }) {
  const songById = new Map(songs.map(song => [song.id, song]));
  const entries = setlist.items.map(item => makeEntry(item));
  let dragState = null;

  container.replaceChildren();

  const editor = el("div", "setlist-editor");
  const toolbar = el("header", "setlist-editor-toolbar");
  const heading = el("h1");
  heading.textContent = setlist.name || "Set-liste";
  const actions = el("div", "editor-toolbar-actions");
  const cancel = button("Avbryt", "secondary");
  const save = button("Lagre", "primary");
  actions.append(cancel, save);
  toolbar.append(heading, actions);
  editor.append(toolbar);

  const message = el("div", "message hidden");
  message.setAttribute("aria-live", "polite");
  editor.append(message);

  const name = document.createElement("input");
  name.type = "text";
  name.value = setlist.name;
  name.addEventListener("input", () => {
    setlist.name = name.value;
    heading.textContent = name.value.trim() || "Set-liste";
  });
  editor.append(field("Navn", name));

  const layout = el("div", "setlist-editor-layout");
  const available = el("section", "editor-card setlist-song-picker");
  const availableHeading = el("div", "setlist-sequence-heading");
  const availableTitle = el("h2");
  availableTitle.textContent = "Sangbibliotek";
  const addPart = button("+ Del", "secondary small");
  addPart.addEventListener("click", addPartEntry);
  availableHeading.append(availableTitle, addPart);
  available.append(availableHeading);

  const filter = document.createElement("input");
  filter.type = "search";
  filter.placeholder = "Filtrer sanger";
  filter.className = "setlist-filter";
  available.append(filter);

  const availableList = el("div", "setlist-available-list");
  available.append(availableList);

  const sequence = el("section", "editor-card setlist-sequence-card");
  const sequenceHeading = el("div", "setlist-sequence-heading");
  const sequenceTitle = el("h2");
  sequenceTitle.textContent = "Rekkefølge";
  const count = el("span", "muted");
  sequenceHeading.append(sequenceTitle, count);
  sequence.append(sequenceHeading);

  const sequenceList = el("div", "setlist-sequence");
  sequence.append(sequenceList);
  layout.append(available, sequence);
  editor.append(layout);
  container.append(editor);

  filter.addEventListener("input", renderAvailable);
  cancel.addEventListener("click", () => onCancel());
  save.addEventListener("click", async () => {
    try {
      const trimmed = setlist.name.trim();
      if (!trimmed) throw new Error("Set-listen må ha et navn.");
      setlist.name = trimmed;
      setlist.schemaVersion = 2;
      setlist.items = entries.map(entry =>
        entry.type === "part"
          ? { type: "part", name: entry.name.trim() }
          : { type: "song", songId: entry.songId }
      );
      if (setlist.items.some(item => item.type === "part" && !item.name)) {
        throw new Error("Alle deler må ha et navn.");
      }
      setMessage(message, "Lagrer …");
      save.disabled = true;
      cancel.disabled = true;
      await onSave(setlist);
    } catch (error) {
      setMessage(message, error.message, true);
    } finally {
      save.disabled = false;
      cancel.disabled = false;
    }
  });

  renderAvailable();
  renderSequence();

  function renderAvailable() {
    availableList.replaceChildren();
    const needle = filter.value.trim().toLocaleLowerCase("nb");
    const filtered = songs.filter(song => song.title.toLocaleLowerCase("nb").includes(needle));

    if (!filtered.length) {
      const empty = el("p", "muted");
      empty.textContent = songs.length ? "Ingen sanger passer filteret." : "Sangbiblioteket er tomt.";
      availableList.append(empty);
      return;
    }

    for (const song of filtered) {
      const row = el("div", "setlist-available-row");
      const title = el("span");
      title.textContent = song.title;
      const add = button("+", "secondary small");
      add.setAttribute("aria-label", `Legg til ${song.title}`);
      add.addEventListener("click", () => {
        entries.push(makeEntry({ type: "song", songId: song.id }));
        renderSequence();
      });
      row.append(title, add);
      availableList.append(row);
    }
  }

  function addPartEntry() {
    const suggested = suggestPartName(entries);
    const value = window.prompt("Navn på del", suggested);
    if (value === null) return;
    const name = value.trim();
    if (!name) return;
    entries.push(makeEntry({ type: "part", name }));
    renderSequence();
  }

  function renderSequence() {
    sequenceList.replaceChildren();
    const songCount = entries.filter(entry => entry.type === "song").length;
    const partCount = entries.filter(entry => entry.type === "part").length;
    count.textContent = `${songCount} ${songCount === 1 ? "sang" : "sanger"}${partCount ? ` · ${partCount} ${partCount === 1 ? "del" : "deler"}` : ""}`;

    if (!entries.length) {
      const empty = el("p", "muted setlist-empty");
      empty.textContent = "Legg til sanger eller deler.";
      sequenceList.append(empty);
      return;
    }

    let numberWithinPart = 0;
    entries.forEach((entry, index) => {
      if (entry.type === "part") numberWithinPart = 0;
      else numberWithinPart += 1;

      const song = entry.type === "song" ? songById.get(entry.songId) : null;
      const missing = entry.type === "song" && !song;
      const row = el("div", `setlist-entry setlist-entry-${entry.type}${missing ? " is-missing" : ""}`);
      row.dataset.entryKey = entry.key;

      const handle = button("☰", "setlist-drag-handle");
      handle.type = "button";
      handle.title = "Dra for å endre rekkefølge";
      handle.setAttribute("aria-label", `Flytt ${entry.type === "part" ? entry.name : song?.title ?? entry.songId}`);
      installDrag(handle, entry.key);

      const number = el("span", "setlist-entry-number");
      number.textContent = entry.type === "part" ? "" : String(numberWithinPart);

      const label = el("div", "setlist-entry-label");
      if (entry.type === "part") {
        const partName = document.createElement("input");
        partName.type = "text";
        partName.className = "setlist-part-name";
        partName.value = entry.name;
        partName.setAttribute("aria-label", "Navn på del");
        partName.addEventListener("input", () => { entry.name = partName.value; });
        label.append(partName);
      } else {
        const title = el("strong");
        title.textContent = song?.title ?? "Mangler sang";
        label.append(title);
        if (!song) {
          const id = el("small", "muted");
          id.textContent = entry.songId;
          label.append(id);
        }
      }

      const rowActions = el("div", "setlist-entry-actions");
      rowActions.append(
        moveButton("↑", index > 0, () => moveEntry(index, index - 1)),
        moveButton("↓", index < entries.length - 1, () => moveEntry(index, index + 1)),
        dangerButton("Fjern", () => {
          entries.splice(index, 1);
          renderSequence();
        })
      );

      row.append(handle, number, label, rowActions);
      sequenceList.append(row);
    });
  }

  function moveEntry(from, to) {
    if (from === to || to < 0 || to >= entries.length) return;
    const [entry] = entries.splice(from, 1);
    entries.splice(to, 0, entry);
    renderSequence();
  }

  function installDrag(handle, entryKey) {
    handle.addEventListener("pointerdown", event => {
      if (event.button !== undefined && event.button !== 0) return;
      event.preventDefault();
      handle.setPointerCapture?.(event.pointerId);
      dragState = {
        pointerId: event.pointerId,
        entryKey,
        startY: event.clientY,
        moved: false
      };
      handle.addEventListener("pointermove", onPointerMove);
      handle.addEventListener("pointerup", onPointerUp, { once: true });
      handle.addEventListener("pointercancel", onPointerCancel, { once: true });
    });
  }

  function onPointerMove(event) {
    if (!dragState || event.pointerId !== dragState.pointerId) return;
    if (Math.abs(event.clientY - dragState.startY) > 4) dragState.moved = true;
    if (!dragState.moved) return;

    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest?.(".setlist-entry");
    document.querySelectorAll(".setlist-entry.is-drop-target").forEach(node => node.classList.remove("is-drop-target"));
    if (target && target.dataset.entryKey !== dragState.entryKey) target.classList.add("is-drop-target");
  }

  function onPointerUp(event) {
    if (!dragState || event.pointerId !== dragState.pointerId) return;
    const state = dragState;
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest?.(".setlist-entry");
    finishDrag(event.currentTarget, event);
    if (!state.moved || !target || target.dataset.entryKey === state.entryKey) return;

    const from = entries.findIndex(entry => entry.key === state.entryKey);
    const to = entries.findIndex(entry => entry.key === target.dataset.entryKey);
    if (from >= 0 && to >= 0) moveEntry(from, to);
  }

  function onPointerCancel(event) {
    finishDrag(event.currentTarget, event);
  }

  function finishDrag(handle, event) {
    handle?.removeEventListener("pointermove", onPointerMove);
    try { handle?.releasePointerCapture?.(event.pointerId); } catch { /* no-op */ }
    dragState = null;
    document.querySelectorAll(".setlist-entry.is-drop-target").forEach(node => node.classList.remove("is-drop-target"));
  }
}

function makeEntry(item) {
  return item.type === "part"
    ? { key: crypto.randomUUID(), type: "part", name: item.name }
    : { key: crypto.randomUUID(), type: "song", songId: item.songId };
}

function suggestPartName(entries) {
  const partNames = entries.filter(entry => entry.type === "part").map(entry => entry.name.trim().toLocaleLowerCase("nb"));
  const setCount = partNames.filter(name => /^sett\s+\d+$/.test(name)).length;
  if (!partNames.length) return "Sett 1";
  if (setCount < 2 && !partNames.includes(`sett ${setCount + 1}`)) return `Sett ${setCount + 1}`;
  if (!partNames.includes("encore")) return "Encore";
  return `Sett ${setCount + 1}`;
}

function moveButton(label, enabled, action) {
  const node = button(label, "secondary small icon-action");
  node.disabled = !enabled;
  node.addEventListener("click", action);
  return node;
}

function dangerButton(label, action) {
  const node = button(label, "danger small");
  node.addEventListener("click", action);
  return node;
}

function button(label, className = "") {
  const node = document.createElement("button");
  node.type = "button";
  node.className = className;
  node.textContent = label;
  return node;
}

function field(label, control) {
  const wrapper = el("label", "editor-field setlist-name-field");
  const text = el("span");
  text.textContent = label;
  wrapper.append(text, control);
  return wrapper;
}

function el(tag, className = "") {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

function setMessage(node, text, isError = false) {
  node.textContent = text;
  node.classList.toggle("hidden", !text);
  node.classList.toggle("error", isError);
  node.classList.toggle("success", Boolean(text) && !isError);
}
