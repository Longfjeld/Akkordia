# Integrering – Milestone 11: fungerende transpose

## Formål

Milestone 11 kobler eksisterende `transpose`-verdier til faktisk visning av akkorder. Tidligere ble verdiene lagret og vist som metadata, men akkordnavnene ble rendret direkte fra `chord.name`.

Endringen skal legges **oppå repository-versjonen som inneholder Milestone 10**. Ikke slett eller erstatt hele repositoryet. Lokale filer som er skjult av `.gitignore` skal bli stående urørt.

## 1. Utgangspunkt

Kontroller før kopiering:

```bash
git status
```

Milestone 10 skal allerede være implementert og testet.

## 2. Kopier kun filene fra Milestone 11-pakken

Pakken inneholder bare nye/endrede filer:

```text
INTEGRATE-M11.md
js/app.js
js/chords.js
js/player.js
sw.js
package.json
tools/test-transpose.mjs
docs/ARCHITECTURE.md
docs/DATA-FORMAT.md
docs/DECISIONS.md
docs/ONEDRIVE-MILESTONE-11.md
docs/PROJECT-PLAN.md
docs/TESTING.md
```

Kopier dem til tilsvarende plassering i eksisterende repository.

**Ikke** slett andre filer eller kataloger.

## 3. Hva endringen gjør

Effektiv transpose beregnes per seksjon:

```text
song.transpose + section.transpose
```

Eksempel:

```text
lagret akkord: C
song.transpose: +2
section.transpose: -1
vises som: C#
```

Lagringsformatet endres ikke. `chord.name` forblir `C` i JSON.

## 4. Ny felles modul

`js/chords.js` inneholder ren logikk for:

- beregning av effektiv transpose
- transponering av rottonen
- transponering av eventuell slash-bass
- bevaring av akkordsuffiks som `m`, `maj7`, `sus4`, `add9` og lignende
- kontrollert fallback: ukjente symboler beholdes uendret

Samme modul brukes av både vanlig sangvisning og Spill-modus.

## 5. Enharmonisk navngivning

Ved negativ transponering av en naturlig tone foretrekkes b-navn, eksempelvis:

```text
C -2 → Bb
```

Ved positiv transponering foretrekkes #-navn:

```text
C +1 → C#
```

Hvis originalnoten allerede bruker `b` eller `#`, beholdes denne navnestilen så langt 12-tonemodellen tillater det.

## 6. Service worker

`sw.js` bruker nytt cache-navn:

```text
akkordia-shell-transpose-11-v1
```

og cacher den nye `js/chords.js`.

Etter publisering kan installert PWA måtte lukkes og åpnes igjen for å ta i bruk ny app-shell.

## 7. Automatisk logikktest

Kjør fra repository-roten:

```bash
npm run test:transpose
```

Forventet resultat:

```text
OK: 15 transpose-kontroller
```

## 8. Kontroller diff

```bash
git status
git diff -- js/app.js js/player.js sw.js package.json docs/ARCHITECTURE.md docs/DATA-FORMAT.md docs/DECISIONS.md docs/PROJECT-PLAN.md docs/TESTING.md
git diff --no-index /dev/null js/chords.js || true
git diff --no-index /dev/null tools/test-transpose.mjs || true
git diff --no-index /dev/null INTEGRATE-M11.md || true
git diff --no-index /dev/null docs/ONEDRIVE-MILESTONE-11.md || true
```

## 9. Commit og push

Når diff og test ser riktig ut:

```bash
git add INTEGRATE-M11.md js/app.js js/chords.js js/player.js sw.js package.json tools/test-transpose.mjs docs/ARCHITECTURE.md docs/DATA-FORMAT.md docs/DECISIONS.md docs/ONEDRIVE-MILESTONE-11.md docs/PROJECT-PLAN.md docs/TESTING.md
git diff --cached
git commit -m "Apply transpose when rendering chords"
git push
```

## 10. Praktisk test

Etter publisering følger du:

```text
docs/ONEDRIVE-MILESTONE-11.md
```

Prioriter først enkel global transpose i vanlig sangvisning, deretter kombinasjon med seksjons-transpose og til slutt Spill-modus.
