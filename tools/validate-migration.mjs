#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const TYPE_MAP = {
  Intro: 'intro',
  Vers: 'verse',
  Chorus: 'chorus',
  Bridge: 'bridge',
  Interlude: 'interlude',
};

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}
function equal(label, expected, actual) {
  if (JSON.stringify(expected) !== JSON.stringify(actual)) {
    fail(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    return false;
  }
  return true;
}

const [, , sourceFile, migratedDir] = process.argv;
if (!sourceFile || !migratedDir) {
  console.error('Usage: node tools/validate-migration.mjs <ttc_all_songs.json> <migrated-directory>');
  process.exit(2);
}

const source = JSON.parse(fs.readFileSync(sourceFile, 'utf8'));
if (!Array.isArray(source.songs)) {
  console.error('FAIL: Source has no songs array.');
  process.exit(1);
}

const stats = { songs: 0, sections: 0, lines: 0, chords: 0 };
let ok = true;

for (const oldSong of source.songs) {
  const file = path.join(migratedDir, `${oldSong.id}.json`);
  if (!fs.existsSync(file)) {
    fail(`Missing migrated file for ${oldSong.id}`);
    ok = false;
    continue;
  }
  const song = JSON.parse(fs.readFileSync(file, 'utf8'));
  stats.songs += 1;

  ok &= equal(`${oldSong.id} schemaVersion`, 1, song.schemaVersion);
  ok &= equal(`${oldSong.id} id`, oldSong.id, song.id);
  ok &= equal(`${oldSong.id} title`, oldSong.title, song.title);
  ok &= equal(`${oldSong.id} chordSet`, oldSong.chordSet, song.chordSet);
  ok &= equal(`${oldSong.id} transpose`, oldSong.transpose, song.transpose);
  ok &= equal(`${oldSong.id} playback`, oldSong.playback, song.playback);

  for (const forbidden of ['_server', '_updatedAt', '_updatedBy']) {
    if (Object.hasOwn(song, forbidden)) {
      fail(`${oldSong.id} still contains ${forbidden}`);
      ok = false;
    }
  }

  ok &= equal(`${oldSong.id} section count`, oldSong.sections.length, song.sections.length);
  for (let s = 0; s < oldSong.sections.length; s += 1) {
    const a = oldSong.sections[s];
    const b = song.sections[s];
    stats.sections += 1;
    ok &= equal(`${oldSong.id}/section ${s} id`, a.id, b.id);
    ok &= equal(`${oldSong.id}/section ${s} type`, TYPE_MAP[a.type], b.type);
    ok &= equal(`${oldSong.id}/section ${s} label`, a.label, b.label);
    ok &= equal(`${oldSong.id}/section ${s} transpose`, a.transpose, b.transpose);
    ok &= equal(`${oldSong.id}/section ${s} line count`, a.lines.length, b.lines.length);

    for (let l = 0; l < a.lines.length; l += 1) {
      const x = a.lines[l];
      const y = b.lines[l];
      stats.lines += 1;
      ok &= equal(`${oldSong.id}/section ${s}/line ${l} vocal`, x.vocal, y.vocal);
      ok &= equal(`${oldSong.id}/section ${s}/line ${l} harmony`, x.harmony, y.harmony);
      ok &= equal(`${oldSong.id}/section ${s}/line ${l} chords`, x.chords, y.chords);
      stats.chords += x.chords.length;
    }
  }
}

const jsonFiles = fs.readdirSync(migratedDir).filter((name) => name.endsWith('.json'));
ok &= equal('migrated file count', source.songs.length, jsonFiles.length);

console.log(`Songs: ${stats.songs}`);
console.log(`Sections: ${stats.sections}`);
console.log(`Lines: ${stats.lines}`);
console.log(`Chords: ${stats.chords}`);
if (ok && !process.exitCode) {
  console.log('PASS: Migration preserves all selected musical and structural data.');
}
