# Integrasjon – Milestone 12.2

## Formål

Milestone 12.2 bygger videre på godkjent M12.1 og gjør to avgrensede forbedringer:

1. private notater kan brukes fra lokal cache også når brukeren er online, men ikke aktivt innlogget i Microsoft
2. BPM-kanten får tydeligere flerfarget glød uten å endre den faste 300 ms-pulsen

Pakken skal legges oppå godkjent Milestone 12.1. Ikke slett eller erstatt repositoryet; kopier bare filene i endringspakken over tilsvarende filer.

## Endrede/nye filer

```text
INTEGRATE-M12.2.md
css/app.css
js/app.js
js/private-notes.js
sw.js
docs/ARCHITECTURE.md
docs/DECISIONS.md
docs/ONEDRIVE-MILESTONE-12.2.md
docs/PRIVATE-NOTES.md
docs/PROJECT-PLAN.md
docs/TESTING.md
```

## 1. Ta utgangspunkt i godkjent M12.1

Kontroller at arbeidskopien inneholder:

```text
INTEGRATE-M12.1.md
docs/ONEDRIVE-MILESTONE-12.1.md
```

## 2. Kopier M12.2-pakken over repositoryet

Behold katalogstrukturen. Lokale filer som ligger i `.gitignore` skal ikke slettes.

## 3. Kontroller endringene

```bash
git status --short
git diff -- js/app.js js/private-notes.js css/app.css sw.js
git diff -- docs/ARCHITECTURE.md docs/DECISIONS.md docs/PRIVATE-NOTES.md docs/PROJECT-PLAN.md docs/TESTING.md
```

## 4. Kjør syntakskontroll og eksisterende test

```bash
node --check js/app.js
node --check js/private-notes.js
node --check sw.js
npm run test:transpose
```

## 5. Publiser og test

Følg `docs/ONEDRIVE-MILESTONE-12.2.md` punkt for punkt.

Test først private notater utlogget, deretter BPM-kanten. Ikke bland resultatene fra de to funksjonene.

## 6. Commit når testen er godkjent

Forslag:

```bash
git add INTEGRATE-M12.2.md css/app.css js/app.js js/private-notes.js sw.js docs/ARCHITECTURE.md docs/DECISIONS.md docs/ONEDRIVE-MILESTONE-12.2.md docs/PRIVATE-NOTES.md docs/PROJECT-PLAN.md docs/TESTING.md
git commit -m "Keep private notes available locally and strengthen BPM pulse"
```
