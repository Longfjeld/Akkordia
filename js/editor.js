import { createChord, createLine, createSection, validateSong } from "./songs.js";

const SECTION_TYPES = [
  ["intro", "Intro"],
  ["verse", "Vers"],
  ["chorus", "Refreng"],
  ["bridge", "Bridge"],
  ["interlude", "Interlude"]
];

const MIN_LINE_COLUMNS = 32;
const LINE_PADDING_COLUMNS = 8;

export function cloneSong(song) {
  return structuredClone(song);
}

export function renderSongEditor(container, draft, { onSave, onCancel }) {
  container.replaceChildren();

  let selectedChordId = null;
  let dragState = null;
  const dropTargets = new WeakMap();

  const editor = el("div", "song-editor visual-song-editor");
  const toolbar = el("div", "editor-toolbar");
  const heading = el("h1");
  heading.textContent = "Rediger sang";
  const toolbarActions = el("div", "editor-toolbar-actions");
  const cancel = button("Avbryt", "secondary");
  const save = button("Lagre", "primary");
  toolbarActions.append(cancel, save);
  toolbar.append(heading, toolbarActions);
  editor.append(toolbar);

  const message = el("div", "message hidden");
  editor.append(message);

  const basics = el("section", "editor-card");
  basics.append(field("Tittel", textInput(draft.title, value => { draft.title = value; })));

  const chordSetInput = textInput(
    draft.chordSet.join(", "),
    value => {
      draft.chordSet = parseChordSet(value);
      renderPalette();
    },
    "C, G, Am, F"
  );
  basics.append(field("Akkordsett", chordSetInput));

  const basicsGrid = el("div", "editor-grid");
  basicsGrid.append(field("Transpose", numberInput(draft.transpose, value => { draft.transpose = value; })));

  const playbackEnabled = Boolean(draft.playback);
  const playbackToggle = document.createElement("input");
  playbackToggle.type = "checkbox";
  playbackToggle.checked = playbackEnabled;
  const playbackLabel = el("label", "checkbox-field");
  playbackLabel.append(playbackToggle, document.createTextNode(" BPM/autoscroll-data"));
  basicsGrid.append(playbackLabel);
  basics.append(basicsGrid);

  const playbackFields = el("div", `editor-grid playback-fields${playbackEnabled ? "" : " hidden"}`);
  const bpmInput = numberInput(draft.playback?.bpm ?? 90, value => {
    if (draft.playback) draft.playback.bpm = value;
  }, 1);
  const beatsInput = numberInput(draft.playback?.beatsPerLine ?? 4, value => {
    if (draft.playback) draft.playback.beatsPerLine = value;
  }, 1);
  playbackFields.append(field("BPM", bpmInput), field("Beats per linje", beatsInput));
  basics.append(playbackFields);

  playbackToggle.addEventListener("change", () => {
    if (playbackToggle.checked) {
      draft.playback = {
        bpm: Number(bpmInput.value) || 90,
        beatsPerLine: Number(beatsInput.value) || 4
      };
      playbackFields.classList.remove("hidden");
    } else {
      delete draft.playback;
      playbackFields.classList.add("hidden");
    }
  });

  editor.append(basics);

  const paletteCard = el("section", "editor-card chord-palette-card");
  const paletteHeader = el("div", "chord-palette-header");
  const paletteTitle = el("div", "chord-palette-title");
  paletteTitle.textContent = "Akkordpalett";
  const paletteHelp = el("div", "muted chord-palette-help");
  paletteHelp.textContent = "Dra en akkord til ønsket tegnposisjon på en sanglinje.";
  paletteHeader.append(paletteTitle, paletteHelp);
  const palette = el("div", "chord-palette");
  paletteCard.append(paletteHeader, palette);
  editor.append(paletteCard);

  const sectionsHost = el("div", "editor-sections");
  editor.append(sectionsHost);

  const addSection = button("+ Legg til seksjon", "secondary editor-add");
  addSection.addEventListener("click", () => {
    draft.sections.push(createSection());
    selectedChordId = null;
    renderSections();
  });
  editor.append(addSection);

  cancel.addEventListener("click", () => onCancel());
  save.addEventListener("click", async () => {
    try {
      validateSong(draft);
      setMessage(message, "Lagrer …");
      save.disabled = true;
      cancel.disabled = true;
      await onSave(draft);
    } catch (error) {
      setMessage(message, error.message, true);
    } finally {
      save.disabled = false;
      cancel.disabled = false;
    }
  });

  function renderPalette() {
    palette.replaceChildren();
    if (!draft.chordSet.length) {
      const empty = el("span", "muted");
      empty.textContent = "Legg inn akkorder i feltet «Akkordsett» for å fylle paletten.";
      palette.append(empty);
      return;
    }

    for (const chordName of draft.chordSet) {
      const chip = button(chordName, "palette-chord");
      chip.title = `Dra ${chordName} til en sanglinje`;
      installDragSource(chip, { chordName });
      palette.append(chip);
    }
  }

  function renderSections() {
    sectionsHost.replaceChildren();
    draft.sections.forEach((section, sectionIndex) => {
      sectionsHost.append(renderSection(section, sectionIndex));
    });
  }

  function renderSection(section, sectionIndex) {
    const card = el("section", "editor-card section-editor");
    const top = el("div", "section-editor-header");
    const type = document.createElement("select");
    const known = new Set(SECTION_TYPES.map(([value]) => value));
    for (const [value, label] of SECTION_TYPES) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      type.append(option);
    }
    if (!known.has(section.type)) {
      const option = document.createElement("option");
      option.value = section.type;
      option.textContent = section.type;
      type.append(option);
    }
    type.value = section.type;
    type.addEventListener("change", () => { section.type = type.value; });

    const label = textInput(section.label ?? "", value => { section.label = value; });
    const transpose = numberInput(section.transpose, value => { section.transpose = value; });
    top.append(field("Type", type), field("Navn", label), field("Transpose", transpose));

    const sectionActions = el("div", "editor-row-actions");
    sectionActions.append(
      moveButton("↑", sectionIndex > 0, () => move(draft.sections, sectionIndex, sectionIndex - 1)),
      moveButton("↓", sectionIndex < draft.sections.length - 1, () => move(draft.sections, sectionIndex, sectionIndex + 1)),
      dangerButton("Fjern seksjon", () => {
        if (draft.sections.length === 1) return;
        draft.sections.splice(sectionIndex, 1);
        selectedChordId = null;
        renderSections();
      }, draft.sections.length === 1)
    );

    card.append(top, sectionActions);

    const linesHost = el("div", "line-editors");
    section.lines.forEach((line, lineIndex) => {
      linesHost.append(renderLine(section, line, lineIndex));
    });
    card.append(linesHost);

    const addLine = button("+ Linje", "secondary small");
    addLine.addEventListener("click", () => {
      section.lines.push(createLine());
      selectedChordId = null;
      renderSections();
    });
    card.append(addLine);
    return card;
  }

  function renderLine(section, line, lineIndex) {
    const row = el("div", "line-editor visual-line-editor");

    const visual = el("div", "visual-line");
    const columns = lineColumns(line);
    visual.style.setProperty("--line-columns", String(columns));

    const dropZone = el("div", "chord-drop-zone");
    dropZone.style.width = `${columns}ch`;
    dropZone.setAttribute("aria-label", "Visuell akkordplassering");
    dropTargets.set(dropZone, { line, columns });

    const guide = el("div", "chord-position-guide");
    const chordTrack = el("div", "editor-chord-track");
    chordTrack.style.width = `${columns}ch`;

    for (const chord of line.chords) {
      const chip = button(chord.name, `placed-chord${selectedChordId === chord.id ? " is-selected" : ""}`);
      chip.style.left = `${chord.pos}ch`;
      chip.title = `${chord.name} · posisjon ${chord.pos}`;
      chip.addEventListener("click", event => {
        if (event.detail !== 0) return;
        event.stopPropagation();
        selectedChordId = chord.id;
        renderSections();
      });
      installDragSource(chip, { chord, sourceLine: line });
      chordTrack.append(chip);
    }

    const vocalPreview = el("div", "visual-lyric visual-vocal");
    vocalPreview.textContent = line.vocal || "\u00a0";
    const harmonyPreview = el("div", "visual-lyric visual-harmony");
    harmonyPreview.textContent = line.harmony || "\u00a0";

    dropZone.append(guide, chordTrack, vocalPreview, harmonyPreview);
    visual.append(dropZone);
    row.append(visual);

    const fields = el("div", "line-editor-fields");
    const vocalInput = textInput(line.vocal, value => {
      line.vocal = value;
      vocalPreview.textContent = value || "\u00a0";
      resizeVisualLine(dropZone, chordTrack, line);
    });
    const harmonyInput = textInput(line.harmony, value => {
      line.harmony = value;
      harmonyPreview.textContent = value || "\u00a0";
      resizeVisualLine(dropZone, chordTrack, line);
    });
    fields.append(field("Vokal", vocalInput), field("Koring", harmonyInput));
    row.append(fields);

    const selectedChord = line.chords.find(chord => chord.id === selectedChordId);
    if (selectedChord) row.append(renderChordInspector(line, selectedChord, chordTrack));

    const actions = el("div", "editor-row-actions");
    actions.append(
      moveButton("↑", lineIndex > 0, () => move(section.lines, lineIndex, lineIndex - 1)),
      moveButton("↓", lineIndex < section.lines.length - 1, () => move(section.lines, lineIndex, lineIndex + 1)),
      dangerButton("Fjern linje", () => {
        if (section.lines.length === 1) return;
        section.lines.splice(lineIndex, 1);
        selectedChordId = null;
        renderSections();
      }, section.lines.length === 1)
    );
    row.append(actions);
    return row;
  }

  function renderChordInspector(line, chord, chordTrack) {
    const inspector = el("div", "chord-inspector");
    const title = el("div", "chord-inspector-title");
    title.textContent = "Valgt akkord";

    const name = textInput(chord.name, value => {
      chord.name = value.trim();
      const chip = chordTrack.querySelector(`[data-chord-id="${cssEscape(chord.id)}"]`);
      if (chip) chip.textContent = chord.name || "?";
    });

    const pos = numberInput(chord.pos, value => {
      setChordPosition(chord, value);
      updateSelectedChordPosition(chordTrack, chord);
    }, 0);

    const minus = button("−", "secondary small position-step");
    const plus = button("+", "secondary small position-step");
    minus.setAttribute("aria-label", "Flytt akkord ett tegn til venstre");
    plus.setAttribute("aria-label", "Flytt akkord ett tegn til høyre");
    minus.addEventListener("click", () => {
      setChordPosition(chord, chord.pos - 1);
      pos.value = String(chord.pos);
      updateSelectedChordPosition(chordTrack, chord);
    });
    plus.addEventListener("click", () => {
      setChordPosition(chord, chord.pos + 1);
      pos.value = String(chord.pos);
      updateSelectedChordPosition(chordTrack, chord);
    });

    const posControls = el("div", "position-controls");
    posControls.append(minus, pos, plus);

    const remove = dangerButton("Slett akkord", () => {
      const index = line.chords.indexOf(chord);
      if (index >= 0) line.chords.splice(index, 1);
      selectedChordId = null;
      renderSections();
    });

    inspector.append(
      title,
      field("Akkord", name),
      field("Posisjon", posControls),
      remove
    );
    return inspector;
  }

  function installDragSource(node, source) {
    if (source.chord) node.dataset.chordId = source.chord.id;

    node.addEventListener("pointerdown", event => {
      if (event.button !== undefined && event.button !== 0) return;
      event.preventDefault();
      node.setPointerCapture?.(event.pointerId);

      const ghost = el("div", "chord-drag-ghost");
      ghost.textContent = source.chord?.name || source.chordName;
      document.body.append(ghost);
      moveGhost(ghost, event.clientX, event.clientY);

      dragState = {
        pointerId: event.pointerId,
        source,
        sourceNode: node,
        ghost,
        startX: event.clientX,
        startY: event.clientY,
        moved: false,
        target: null
      };

      node.addEventListener("pointermove", onPointerMove);
      node.addEventListener("pointerup", onPointerUp, { once: true });
      node.addEventListener("pointercancel", onPointerCancel, { once: true });
    });
  }

  function onPointerMove(event) {
    if (!dragState || event.pointerId !== dragState.pointerId) return;
    const distance = Math.hypot(event.clientX - dragState.startX, event.clientY - dragState.startY);
    if (distance > 4) dragState.moved = true;
    moveGhost(dragState.ghost, event.clientX, event.clientY);

    const targetNode = document.elementFromPoint(event.clientX, event.clientY)?.closest?.(".chord-drop-zone") ?? null;
    setActiveDropTarget(targetNode);
  }

  function onPointerUp(event) {
    if (!dragState || event.pointerId !== dragState.pointerId) return;
    const current = dragState;
    const targetNode = document.elementFromPoint(event.clientX, event.clientY)?.closest?.(".chord-drop-zone") ?? current.target;
    finishDrag();

    if (!current.moved) {
      if (current.source.chord) {
        selectedChordId = current.source.chord.id;
        renderSections();
      }
      return;
    }
    if (!targetNode) return;

    const target = dropTargets.get(targetNode);
    if (!target) return;
    const pos = positionFromPointer(targetNode, target.columns, event.clientX);

    if (current.source.chord) {
      const chord = current.source.chord;
      const sourceLine = current.source.sourceLine;
      if (sourceLine !== target.line) {
        const sourceIndex = sourceLine.chords.indexOf(chord);
        if (sourceIndex >= 0) sourceLine.chords.splice(sourceIndex, 1);
        target.line.chords.push(chord);
      }
      chord.pos = pos;
      selectedChordId = chord.id;
    } else {
      const chord = createChord();
      chord.name = current.source.chordName;
      chord.pos = pos;
      target.line.chords.push(chord);
      selectedChordId = chord.id;
    }

    renderSections();
  }

  function onPointerCancel(event) {
    if (!dragState || event.pointerId !== dragState.pointerId) return;
    finishDrag();
  }

  function setActiveDropTarget(node) {
    if (!dragState) return;
    if (dragState.target === node) return;
    dragState.target?.classList.remove("is-drag-target");
    dragState.target = node;
    dragState.target?.classList.add("is-drag-target");
  }

  function finishDrag() {
    if (!dragState) return;
    dragState.target?.classList.remove("is-drag-target");
    dragState.sourceNode.removeEventListener("pointermove", onPointerMove);
    dragState.ghost.remove();
    dragState = null;
  }

  function resizeVisualLine(dropZone, chordTrack, line) {
    const columns = lineColumns(line);
    dropZone.style.width = `${columns}ch`;
    chordTrack.style.width = `${columns}ch`;
    dropTargets.set(dropZone, { line, columns });
  }

  function updateSelectedChordPosition(chordTrack, chord) {
    const chip = chordTrack.querySelector(`[data-chord-id="${cssEscape(chord.id)}"]`);
    if (!chip) return;
    chip.style.left = `${chord.pos}ch`;
    chip.title = `${chord.name} · posisjon ${chord.pos}`;
  }

  function move(array, from, to) {
    const [item] = array.splice(from, 1);
    array.splice(to, 0, item);
    selectedChordId = null;
    renderSections();
  }

  renderPalette();
  renderSections();
  container.append(editor);
}

function lineColumns(line) {
  const textLength = Math.max(line.vocal?.length ?? 0, line.harmony?.length ?? 0);
  const chordExtent = Math.max(
    0,
    ...line.chords.map(chord => chord.pos + Math.max(1, chord.name?.length ?? 0))
  );
  return Math.max(MIN_LINE_COLUMNS, textLength + LINE_PADDING_COLUMNS, chordExtent + 4);
}

function positionFromPointer(dropZone, columns, clientX) {
  const rect = dropZone.getBoundingClientRect();
  if (!rect.width) return 0;
  const ratio = (clientX - rect.left) / rect.width;
  return Math.max(0, Math.round(ratio * columns));
}

function setChordPosition(chord, value) {
  chord.pos = Math.max(0, Math.trunc(Number(value) || 0));
}

function moveGhost(ghost, x, y) {
  ghost.style.transform = `translate(${Math.round(x + 10)}px, ${Math.round(y + 10)}px)`;
}

function parseChordSet(value) {
  return [...new Set(value.split(",").map(item => item.trim()).filter(Boolean))];
}

function cssEscape(value) {
  if (globalThis.CSS?.escape) return CSS.escape(value);
  return value.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
}

function el(tag, className = "") {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

function field(labelText, control) {
  const label = el("label", "editor-field");
  const span = el("span");
  span.textContent = labelText;
  label.append(span, control);
  return label;
}

function textInput(value, onInput, placeholder = "") {
  const input = document.createElement("input");
  input.type = "text";
  input.value = value ?? "";
  input.placeholder = placeholder;
  input.addEventListener("input", () => onInput(input.value));
  return input;
}

function numberInput(value, onInput, min = null) {
  const input = document.createElement("input");
  input.type = "number";
  input.step = "1";
  if (min !== null) input.min = String(min);
  input.value = Number.isFinite(value) ? String(value) : "0";
  input.addEventListener("input", () => onInput(Number(input.value)));
  return input;
}

function button(text, className = "") {
  const node = document.createElement("button");
  node.type = "button";
  node.textContent = text;
  if (className) node.className = className;
  return node;
}

function moveButton(text, enabled, action) {
  const node = button(text, "secondary small icon-action");
  node.disabled = !enabled;
  node.addEventListener("click", action);
  return node;
}

function dangerButton(text, action, disabled = false) {
  const node = button(text, "danger small");
  node.disabled = disabled;
  node.addEventListener("click", action);
  return node;
}

function setMessage(node, message, isError = false) {
  node.textContent = message;
  node.classList.toggle("hidden", !message);
  node.classList.toggle("error", isError);
}
