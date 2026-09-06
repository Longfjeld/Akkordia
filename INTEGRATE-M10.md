# Integrering – OneDrive milepæl 10

## Formål

Milestone 10 gjør set-listvisningen cache-first. Målet er at set-lister skal åpnes med omtrent samme opplevde hastighet som i offline-modus, samtidig som OneDrive fortsatt er autoritativ kilde.

Endringen skal legges **oppå eksisterende repository med Milestone 9.1**. Ikke slett, erstatt eller pakk ut et komplett nytt repository. Lokale filer som er skjult av `.gitignore` skal bli stående urørt.

## 1. Utgangspunkt

Milestone 9.1 skal allerede være implementert og testet.

Kontroller før kopiering:

```bash
git status
```

Behold eventuelle lokale filer som ikke inngår i leveransen.

## 2. Kopier kun filene fra Milestone 10-pakken

Pakken inneholder bare nye/endrede filer:

```text
INTEGRATE-M10.md
js/app.js
sw.js
docs/ARCHITECTURE.md
docs/DECISIONS.md
docs/ONEDRIVE-MILESTONE-10.md
docs/PROJECT-PLAN.md
docs/TESTING.md
```

Kopier disse til tilsvarende plassering i eksisterende repository.

**Ikke** slett andre filer eller kataloger.

## 3. Hva endringen gjør

Tidligere ble set-listene normalt hentet på nytt fra OneDrive når Set-lister-visningen ble åpnet, selv om de allerede var forhåndslastet ved oppstart.

Milestone 10 bruker i stedet denne rekkefølgen:

```text
RAM
 ↓ hvis ikke tilgjengelig
IndexedDB
 ↓ vis straks
OneDrive i bakgrunnen
 ↓
oppdater RAM + IndexedDB
```

Når cache brukes før OneDrive er kontrollert, er set-listene midlertidig i lesemodus. Etter vellykket OneDrive-kontroll aktiveres redigering igjen.

Innen samme app-økt unngås ny full Graph-lasting når set-listene allerede er kontrollert mot OneDrive. Knappen for eksplisitt oppdatering fortsetter derimot å fremtvinge ny OneDrive-lesing.

## 4. Viktig om set-listobjekter etter bakgrunnssynk

Når OneDrive-kontrollen er ferdig, byttes cacheobjektene til de ferske objektene som kom fra OneDrive. Dette gjøres også når JSON-innholdet er likt.

Årsaken er at de ferske objektene har OneDrive-referanse og `eTag` i minnet. Disse metadataene er nødvendige for korrekt optimistic concurrency ved senere redigering.

## 5. Service worker

`sw.js` bruker nytt cache-navn:

```text
akkordia-shell-cache-first-setlists-10-v1
```

Dette sørger for at installert PWA og tidligere nettleserøkter henter oppdatert `app.js`.

Etter publisering:

1. test først online i vanlig nettleser
2. gjør full reload ved behov
3. lukk og åpne installert PWA dersom gammel app-shell fortsatt er aktiv

## 6. Kontroller endringene

Fra repository-roten:

```bash
git status
git diff -- js/app.js sw.js docs/ARCHITECTURE.md docs/DECISIONS.md docs/PROJECT-PLAN.md docs/TESTING.md
git diff --no-index /dev/null INTEGRATE-M10.md || true
git diff --no-index /dev/null docs/ONEDRIVE-MILESTONE-10.md || true
```

Kontroller spesielt at ingen lokale `.gitignore`-filer eller andre lokale data er slettet.

## 7. Commit og push

Når diffen ser riktig ut:

```bash
git add INTEGRATE-M10.md js/app.js sw.js docs/ARCHITECTURE.md docs/DECISIONS.md docs/ONEDRIVE-MILESTONE-10.md docs/PROJECT-PLAN.md docs/TESTING.md
git diff --cached
git commit -m "Use cache-first loading for setlists"
git push
```

## 8. Test

Når GitHub Pages har publisert endringen, følg testene i:

```text
docs/ONEDRIVE-MILESTONE-10.md
```

Prioriter først testen av opplevd hastighet når Set-lister åpnes etter appstart.
