const SHARP_NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const FLAT_NOTES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

const NOTE_INDEX = new Map([
  ["C", 0], ["B#", 0],
  ["C#", 1], ["DB", 1],
  ["D", 2],
  ["D#", 3], ["EB", 3],
  ["E", 4], ["FB", 4],
  ["E#", 5], ["F", 5],
  ["F#", 6], ["GB", 6],
  ["G", 7],
  ["G#", 8], ["AB", 8],
  ["A", 9],
  ["A#", 10], ["BB", 10],
  ["B", 11], ["CB", 11]
]);

export function transposeChordName(name, semitones = 0) {
  if (typeof name !== "string" || !name) return name;
  const amount = normalizeAmount(semitones);
  if (amount === 0) return name;

  const match = name.match(/^([A-Ga-g])([#b]?)([^/]*)((?:\/)([A-Ga-g])([#b]?))?$/);
  if (!match) return name;

  const [, rootLetter, rootAccidental, suffix, slashPart, bassLetter, bassAccidental] = match;
  const root = transposeNote(`${rootLetter}${rootAccidental}`, amount, accidentalStyle(rootAccidental, amount));
  if (!root) return name;

  if (!slashPart) return `${root}${suffix}`;

  const bass = transposeNote(`${bassLetter}${bassAccidental}`, amount, accidentalStyle(bassAccidental, amount));
  if (!bass) return name;
  return `${root}${suffix}/${bass}`;
}

export function effectiveTranspose(songTranspose = 0, sectionTranspose = 0) {
  const song = Number.isFinite(songTranspose) ? songTranspose : 0;
  const section = Number.isFinite(sectionTranspose) ? sectionTranspose : 0;
  return song + section;
}

function transposeNote(note, semitones, style) {
  const key = note[0].toUpperCase() + note.slice(1).replace("b", "B");
  const index = NOTE_INDEX.get(key);
  if (index === undefined) return null;
  const next = mod(index + semitones, 12);
  return (style === "flat" ? FLAT_NOTES : SHARP_NOTES)[next];
}

function accidentalStyle(accidental, semitones) {
  if (accidental === "b") return "flat";
  if (accidental === "#") return "sharp";
  return semitones < 0 ? "flat" : "sharp";
}

function normalizeAmount(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.trunc(value);
}

function mod(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}
