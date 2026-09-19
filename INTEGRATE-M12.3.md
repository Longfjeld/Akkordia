# Integrasjon – Milestone 12.3

## Formål

Milestone 12.3 bygger videre på godkjent M12.2 og gjør én avgrenset visuell forbedring:

- BPM-kanten i Spill-modus blir tydeligere med 8 px mettet ytterkant og et separat transparent glødlag som fader innover

Pulsvarighet, BPM-prikk og øvrig Spill-logikk endres ikke.

Pakken skal legges oppå godkjent Milestone 12.2. Ikke slett eller erstatt repositoryet; kopier bare filene i endringspakken over tilsvarende filer.

## Endrede/nye filer

```text
INTEGRATE-M12.3.md
css/app.css
sw.js
docs/ARCHITECTURE.md
docs/ONEDRIVE-MILESTONE-12.3.md
docs/PROJECT-PLAN.md
docs/TESTING.md
```

## 1. Ta utgangspunkt i godkjent M12.2

Kontroller at arbeidskopien inneholder:

```text
INTEGRATE-M12.2.md
docs/ONEDRIVE-MILESTONE-12.2.md
```

## 2. Kopier M12.3-pakken over repositoryet

Behold katalogstrukturen. Lokale filer som ligger i `.gitignore` skal ikke slettes.

## 3. Kontroller endringene

```bash
git status --short
git diff -- css/app.css sw.js
git diff -- docs/ARCHITECTURE.md docs/PROJECT-PLAN.md docs/TESTING.md
```

## 4. Kjør syntakskontroll og eksisterende test

```bash
node --check sw.js
find js -name '*.js' -print0 | xargs -0 -n1 node --check
npm run test:transpose
```

## 5. Publiser og test

Følg `docs/ONEDRIVE-MILESTONE-12.3.md` punkt for punkt.

Prioriter Test 1 i faktisk spillemiljø; M12.3 er først og fremst en visuell kalibrering.

## 6. Commit når testen er godkjent

Forslag:

```bash
git add INTEGRATE-M12.3.md css/app.css sw.js docs/ARCHITECTURE.md docs/ONEDRIVE-MILESTONE-12.3.md docs/PROJECT-PLAN.md docs/TESTING.md
git commit -m "Strengthen BPM edge pulse"
```
