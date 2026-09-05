import { createChord, createLine, createSection, validateSong } from "./songs.js";

const SECTION_TYPES = [
  ["intro", "Intro"],
  ["verse", "Vers"],
  ["chorus", "Refreng"],
  ["bridge", "Bridge"],
  ["interlude", "Interlude"]
];

export function cloneSong(song) {
  return structuredClone(song);
}

export function renderSongEditor(container, draft, { onSave, onCancel }) {
  container.replaceChildren();

  const editor = el("div", "song-editor");
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
  basics.append(field("Akkordsett", textInput(draft.chordSet.join(", "), value => {
    draft.chordSet = [...new Set(value.split(",").map(item => item.trim()).filter(Boolean))];
  }, "C, G, Am, F")));

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

  const sectionsHost = el("div", "editor-sections");
  editor.append(sectionsHost);

  const addSection = button("+ Legg til seksjon", "secondary editor-add");
  addSection.addEventListener("click", () => {
    draft.sections.push(createSection());
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
      renderSections();
    });
    card.append(addLine);
    return card;
  }

  function renderLine(section, line, lineIndex) {
    const row = el("div", "line-editor");
    const fields = el("div", "line-editor-fields");
    fields.append(
      field("Vokal", textInput(line.vocal, value => { line.vocal = value; })),
      field("Koring", textInput(line.harmony, value => { line.harmony = value; }))
    );
    row.append(fields);

    const chords = el("div", "chord-editors");
    const chordTitle = el("div", "chord-editor-title");
    chordTitle.textContent = "Akkorder";
    chords.append(chordTitle);

    line.chords.forEach((chord, chordIndex) => {
      const chordRow = el("div", "chord-editor-row");
      const name = textInput(chord.name, value => { chord.name = value.trim(); });
      const pos = numberInput(chord.pos, value => { chord.pos = Math.max(0, Math.trunc(value)); }, 0);
      const remove = dangerButton("×", () => {
        line.chords.splice(chordIndex, 1);
        renderSections();
      });
      remove.setAttribute("aria-label", `Fjern akkord ${chord.name || chordIndex + 1}`);
      chordRow.append(field("Akkord", name), field("Posisjon", pos), remove);
      chords.append(chordRow);
    });

    const addChord = button("+ Akkord", "secondary small");
    addChord.addEventListener("click", () => {
      line.chords.push(createChord());
      renderSections();
    });
    chords.append(addChord);
    row.append(chords);

    const actions = el("div", "editor-row-actions");
    actions.append(
      moveButton("↑", lineIndex > 0, () => move(section.lines, lineIndex, lineIndex - 1)),
      moveButton("↓", lineIndex < section.lines.length - 1, () => move(section.lines, lineIndex, lineIndex + 1)),
      dangerButton("Fjern linje", () => {
        if (section.lines.length === 1) return;
        section.lines.splice(lineIndex, 1);
        renderSections();
      }, section.lines.length === 1)
    );
    row.append(actions);
    return row;
  }

  function move(array, from, to) {
    const [item] = array.splice(from, 1);
    array.splice(to, 0, item);
    renderSections();
  }

  renderSections();
  container.append(editor);
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
