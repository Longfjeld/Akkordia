# Akkordia v2 – teststrategi

**Status:** Første utkast  
**Dato:** 2026-08-29

## 1. Mål

Testing skal primært beskytte mot:

- datatap
- feil workspace
- stille overskriving ved konflikt
- utilgjengelighet offline
- feil i Spill-modus
- problemer ved PWA-oppdatering

Testopplegget skal være enkelt nok til å brukes ved hver relevant endring.

## 2. Primære plattformer

|Plattform|Prioritet|
|:---|:---|
|macOS + Safari|Høy|
|macOS + Chromium-basert nettleser|Høy|
|iPhone + Safari/PWA|Høy|
|iPad + Safari/PWA|Høy|
|Android + Chrome/PWA|Middels|

## 3. Kritiske brukerflyter

### 3.1 Første gangs bruk

- åpne PWA
- koble til Microsoft-konto
- velge eksisterende workspace
- velge feil mappe og få kontrollert feilmelding
- opprette nytt workspace eksplisitt

### 3.2 Flere band

- koble til minst to workspaces
- bytte mellom dem
- kontrollere at sangdata ikke blandes
- fjerne lokal workspace-referanse uten å slette eksterne data

### 3.3 Sang

- åpne sang
- redigere og lagre
- transponere hele sangen
- transponere seksjon
- kontrollere BPM
- kontrollere autoscroll

### 3.4 Samtidighet

Scenario A:

- bruker 1 åpner sang A
- bruker 2 åpner sang A
- bruker 1 lagrer
- bruker 2 forsøker å lagre gammel versjon
- lagring skal stoppes som konflikt

Scenario B:

- bruker 1 redigerer sang A
- bruker 2 redigerer sang B
- begge skal kunne lagre uten konflikt

### 3.5 Set-liste

- opprette set-list
- legge inn samme sang to ganger
- endre rekkefølge
- slette én forekomst uten å slette alle forekomster av samme sang
- lagre og åpne igjen

### 3.6 Spill-modus

- starte fra set-list
- neste
- forrige
- hoppe direkte til vilkårlig posisjon
- samme sang på flere posisjoner
- pause/fortsett autoscroll
- avslutte Spill-modus
- kontrollere at redigeringskontroller ikke vises

### 3.7 Wake Lock

- starte Spill-modus
- kontrollere at Wake Lock forespørres der støttet
- sende app til bakgrunnen
- returnere til app
- kontrollere gjenoppretting
- avslutte Spill og kontrollere release
- kontrollere at manglende Wake Lock-støtte ikke stopper spilling

### 3.8 Offline

- synkroniser band
- koble fra nett
- start PWA på nytt
- åpne sanger
- åpne set-list
- bruk Spill-modus
- kontrollere tydelig offline-status
- koble til nett igjen
- kontrollere oppdatering uten datatap

### 3.9 Cache-first set-lister

- start online med eksisterende IndexedDB-cache
- åpne Set-lister og kontroller at cache vises før full OneDrive-lesing er ferdig
- kontroller midlertidig read-only frem til revalidering
- bytt mellom visninger og kontroller at full Graph-lasting ikke gjentas unødvendig i samme økt
- bruk eksplisitt Oppdater og kontroller at OneDrive faktisk leses på nytt
- rediger og lagre etter revalidering og kontroller at eksisterende fil oppdateres uten duplikat
- gå offline/online og kontroller ny revalidering

### 3.10 Transponering

- sett `song.transpose` til `+2` og kontroller at f.eks. `C` vises som `D`
- sett `song.transpose` til `-2` og kontroller at `C` vises som `Bb`
- sett `song.transpose = +2` og `section.transpose = -1` og kontroller effektiv `+1`
- kontroller at akkordkvalitet beholdes, f.eks. `F#m` → `G#m` ved `+2`
- kontroller slash-akkord, f.eks. `C/G` → `D/A` ved `+2`
- kontroller både vanlig sangvisning og Spill-modus
- lagre sangen og kontroller at `chord.name` i JSON fortsatt er originalverdien
- sett transpose tilbake til `0` og kontroller at originalakkordene vises igjen
- kjør `npm run test:transpose`

## 4. Migreringstest

`ttc_all_songs.json` skal migreres automatisk.

For hver sang kontrolleres minst:

- ID er uendret
- tittel er uendret
- antall seksjoner er forventet
- akkord-/linjedata er bevart
- transpose er bevart
- playback-data er bevart der de finnes
- gammel servermetadata er fjernet
- generert JSON er gyldig

Alle 16 sanger i den nåværende eksporten skal passere før migreringsverktøyet anses godkjent for dette datasettet.

## 5. Automatiserte tester

Automatiser først ren logikk:

- schema-validering
- migrering
- set-list med duplikate sang-ID-er
- storage conflict mapping
- private notes: offline lagring, konto-isolasjon, notenivå-merge og konfliktkopi
- transpose-funksjoner
- autoscroll-beregninger

UI-automatisering innføres bare der den gir tydelig verdi sammenlignet med vedlikeholdskostnaden.

## 6. Akseptansekriterier før 1.0

|Område|Krav|
|:---|:---|
|Datatap|Ingen kjent kritisk feil|
|Konflikter|Stille overskriving skal ikke skje|
|Offline-lesing|Fungerer på primære mobile plattformer|
|Spill-modus|Kan brukes gjennom hel set-list|
|Wake Lock|Fungerer eller feiler kontrollert|
|Migrering|Alle testede eksisterende sanger migreres korrekt|
|Dokumentasjon|Oppdatert mot faktisk implementasjon|

---

## Fase 1 – migreringstest

Migreringsverktøyet skal alltid valideres mot kildeeksport før data tas i bruk.

Kommando:

```bash
node tools/validate-migration.mjs /sti/til/ttc_all_songs.json work/migration/songs
```

Godkjent referanseresultat for mottatt eksport 2026-08-29:

|Kontroll|Forventet|
|:---|:---|
|Sanger|16|
|Seksjoner|69|
|Linjer|468|
|Plasserte akkorder|294|
|Musikalsk/strukturell datalikhet|PASS|
|Gammel metadata fjernet|PASS|
|Seksjonstype-normalisering|PASS|
