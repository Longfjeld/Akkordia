# Integrasjon – Milestone 12.1

## Formål

Milestone 12.1 finjusterer den visuelle BPM-pulsen etter praktisk test av M12. Private notater/offline-logikken fra M12 beholdes uendret.

Pakken skal legges oppå godkjent Milestone 12. Ikke slett eller erstatt repositoryet; kopier bare filene i endringspakken over tilsvarende filer.

## Endrede/nye filer

```text
INTEGRATE-M12.1.md
css/app.css
js/player.js
sw.js
docs/ARCHITECTURE.md
docs/ONEDRIVE-MILESTONE-12.1.md
docs/PRIVATE-NOTES.md
docs/PROJECT-PLAN.md
docs/TESTING.md
```

## 1. Ta utgangspunkt i godkjent M12

Kontroller at arbeidskopien inneholder `INTEGRATE-M12.md` og `docs/ONEDRIVE-MILESTONE-12.md`.

## 2. Kopier M12.1-pakken over repositoryet

Behold katalogstrukturen. Lokale filer som `.gitignore` skal ikke slettes.

## 3. Kontroller endringene

```bash
git status --short
git diff -- js/player.js css/app.css sw.js
git diff -- docs/ARCHITECTURE.md docs/PRIVATE-NOTES.md docs/PROJECT-PLAN.md docs/TESTING.md
```

## 4. Kjør syntakskontroll og eksisterende test

```bash
node --check js/player.js
node --check sw.js
npm run test:transpose
```

## 5. Publiser og test

Følg `docs/ONEDRIVE-MILESTONE-12.1.md` punkt for punkt. Fokus er visuell lesbarhet av BPM-kanten ved både lav og høy BPM og at pulslengden oppleves lik.

## 6. Commit når testen er godkjent

Forslag:

```bash
git add INTEGRATE-M12.1.md css/app.css js/player.js sw.js docs/ARCHITECTURE.md docs/ONEDRIVE-MILESTONE-12.1.md docs/PRIVATE-NOTES.md docs/PROJECT-PLAN.md docs/TESTING.md
git commit -m "Tune BPM edge pulse timing and contrast"
```
