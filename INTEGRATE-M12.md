# Integrasjon – Milestone 12

## Formål

Milestone 12 retter offline-visning av private notater og legger til en første grafisk prototype for BPM-puls rundt hele Spill-visningen.

Pakken skal legges oppå godkjent Milestone 11. Ikke slett eller erstatt repositoryet; kopier bare filene i endringspakken over tilsvarende filer.

## Endrede/nye filer

```text
INTEGRATE-M12.md
css/app.css
js/app.js
js/player.js
sw.js
docs/ARCHITECTURE.md
docs/ONEDRIVE-MILESTONE-12.md
docs/PRIVATE-NOTES.md
docs/PROJECT-PLAN.md
docs/TESTING.md
```

## 1. Ta utgangspunkt i godkjent M11

Kontroller at arbeidskopien inneholder `INTEGRATE-M11.md` og `docs/ONEDRIVE-MILESTONE-11.md`.

## 2. Kopier M12-pakken over repositoryet

Behold katalogstrukturen. Lokale filer som `.gitignore` skal ikke slettes.

## 3. Kontroller endringene

```bash
git status --short
git diff -- js/app.js js/player.js css/app.css sw.js
git diff -- docs/ARCHITECTURE.md docs/PRIVATE-NOTES.md docs/PROJECT-PLAN.md docs/TESTING.md
```

## 4. Kjør syntakskontroll og eksisterende test

```bash
node --check js/app.js
node --check js/player.js
node --check sw.js
npm run test:transpose
```

## 5. Publiser og test

Følg `docs/ONEDRIVE-MILESTONE-12.md` punkt for punkt. Viktigst er offline-oppstart med et eksisterende privatnotat før BPM-kanten vurderes visuelt.

## 6. Commit når testen er godkjent

Forslag:

```bash
git add INTEGRATE-M12.md css/app.css js/app.js js/player.js sw.js docs/ARCHITECTURE.md docs/ONEDRIVE-MILESTONE-12.md docs/PRIVATE-NOTES.md docs/PROJECT-PLAN.md docs/TESTING.md
git commit -m "Fix offline private notes and add BPM edge pulse"
```
