#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const SECTION_TYPES = new Map([
  ['Intro', 'intro'],
  ['Vers', 'verse'],
  ['Chorus', 'chorus'],
  ['Bridge', 'bridge'],
  ['Interlude', 'interlude'],
]);

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function usage() {
  console.log('Usage: node tools/migrate-v1.mjs <ttc_all_songs.json> <output-directory>');
}

const [, , inputFile, outputDir] = process.argv;
if (!inputFile || !outputDir) {
  usage();
  process.exit(2);
}
if (!fs.existsSync(inputFile)) fail(`Input file not found: ${inputFile}`);

const source = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
if (!source || !Array.isArray(source.songs)) fail('Expected top-level object with a songs array.');

fs.mkdirSync(outputDir, { recursive: true });

let sectionCount = 0;
let lineCount = 0;
let chordCount = 0;

for (const song of source.songs) {
  if (!song.id || typeof song.id !== 'string') fail('Song without a valid id.');
  if (!song.title || typeof song.title !== 'string') fail(`Song ${song.id} has no valid title.`);
  if (!Array.isArray(song.chordSet)) fail(`Song ${song.id} has no chordSet array.`);
  if (!Array.isArray(song.sections)) fail(`Song ${song.id} has no sections array.`);

  const migrated = {
    schemaVersion: 1,
    id: song.id,
    title: song.title,
    chordSet: [...song.chordSet],
    transpose: Number.isFinite(song.transpose) ? song.transpose : 0,
  };

  // playback is deliberately optional in schema v1.
  if (song.playback !== undefined) {
    migrated.playback = {
      bpm: song.playback.bpm,
      beatsPerLine: song.playback.beatsPerLine,
    };
  }

  migrated.sections = song.sections.map((section) => {
    sectionCount += 1;
    const normalizedType = SECTION_TYPES.get(section.type);
    if (!normalizedType) {
      fail(`Unknown section type '${section.type}' in song ${song.id}, section ${section.id}.`);
    }
    if (!Array.isArray(section.lines)) {
      fail(`Section ${section.id} in song ${song.id} has no lines array.`);
    }

    return {
      id: section.id,
      type: normalizedType,
      label: section.label ?? '',
      transpose: Number.isFinite(section.transpose) ? section.transpose : 0,
      lines: section.lines.map((line) => {
        lineCount += 1;
        if (!Array.isArray(line.chords)) {
          fail(`A line in section ${section.id} has no chords array.`);
        }
        const chords = line.chords.map((chord) => {
          chordCount += 1;
          return {
            id: chord.id,
            name: chord.name,
            pos: chord.pos,
          };
        });
        return {
          vocal: line.vocal ?? '',
          harmony: line.harmony ?? '',
          chords,
        };
      }),
    };
  });

  const destination = path.join(outputDir, `${song.id}.json`);
  fs.writeFileSync(destination, `${JSON.stringify(migrated, null, 2)}\n`, 'utf8');
}

console.log(`Migrated ${source.songs.length} songs.`);
console.log(`Sections: ${sectionCount}`);
console.log(`Lines: ${lineCount}`);
console.log(`Chords: ${chordCount}`);
console.log(`Output: ${path.resolve(outputDir)}`);
