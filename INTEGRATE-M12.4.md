# Integrasjon – Milestone 12.4

## Formål

Milestone 12.4 er siste mindre visuelle justering av BPM-pulsen før planlagt M13.

Endringen gjør to ting:

- erstatter M12.3-modellen med to synlige ringlag med ett kontinuerlig fargefelt som starter ved skjermkanten og fader mykt til null innover
- fjerner den pulserende BPM-prikken; BPM-knappen beholdes som tekstindikator og av/på-kontroll

Pulsvarighet og beat-klokke endres ikke.

Pakken legges oppå godkjent M12.3. Ikke slett eller erstatt repositoryet; kopier bare filene i endringspakken over tilsvarende filer.

## Endrede/nye filer

```text
INTEGRATE-M12.4.md
css/app.css
js/player.js
sw.js
docs/ARCHITECTURE.md
docs/ONEDRIVE-MILESTONE-12.4.md
docs/PROJECT-PLAN.md
docs/TESTING.md
```

## 1. Ta utgangspunkt i godkjent M12.3

Kontroller at arbeidskopien inneholder:

```text
INTEGRATE-M12.3.md
docs/ONEDRIVE-MILESTONE-12.3.md
```

## 2. Kopier M12.4-pakken over repositoryet

Behold katalogstrukturen. Lokale filer som ligger i `.gitignore` skal ikke slettes.

## 3. Kontroller endringene

```bash
git status --short
git diff -- css/app.css js/player.js sw.js
git diff -- docs/ARCHITECTURE.md docs/PROJECT-PLAN.md docs/TESTING.md
```

## 4. Kjør syntakskontroll og eksisterende test

```bash
node --check sw.js
find js -name '*.js' -print0 | xargs -0 -n1 node --check
npm run test:transpose
```

## 5. Publiser og test

Følg `docs/ONEDRIVE-MILESTONE-12.4.md` punkt for punkt. Prioriter Test 1 på både iPhone og iPad.

## 6. Commit når testen er godkjent

Forslag:

```bash
git add INTEGRATE-M12.4.md css/app.css js/player.js sw.js docs/ARCHITECTURE.md docs/ONEDRIVE-MILESTONE-12.4.md docs/PROJECT-PLAN.md docs/TESTING.md
git commit -m "Refine BPM edge pulse"
```
