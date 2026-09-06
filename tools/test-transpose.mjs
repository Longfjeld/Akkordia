import assert from "node:assert/strict";
import { effectiveTranspose, transposeChordName } from "../js/chords.js";

const cases = [
  ["C", 2, "D"],
  ["C", -2, "Bb"],
  ["C#", 2, "D#"],
  ["Db", 2, "Eb"],
  ["Am", 2, "Bm"],
  ["F#m", 2, "G#m"],
  ["Bbmaj7", 2, "Cmaj7"],
  ["Dadd9", -2, "Cadd9"],
  ["C/G", 2, "D/A"],
  ["Dsus4/F#", -2, "Csus4/E"],
  ["G7", 12, "G7"],
  ["N.C.", 2, "N.C."],
  ["H", 2, "H"]
];

for (const [name, semitones, expected] of cases) {
  assert.equal(transposeChordName(name, semitones), expected, `${name} transpose ${semitones}`);
}

assert.equal(effectiveTranspose(2, -1), 1);
assert.equal(effectiveTranspose(-2, 2), 0);

console.log(`OK: ${cases.length + 2} transpose-kontroller`);
