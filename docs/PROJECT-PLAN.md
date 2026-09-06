# Akkordia v2 – prosjektplan

**Status:** Utkast til styringsdokument  
**Dato:** 2026-08-29  
**Kode:** `https://github.com/Longfjeld/Akkordia`  
**Publisering:** `https://longfjeld.github.io/Akkordia/`

---

## 1. Formål

Akkordia v2 skal være en enkel, stabil og driftssvak PWA for sangnotasjon, set-lister og bruk under øvelse/konsert.

Løsningen skal i størst mulig grad unngå egen serverdrift, egen brukeradministrasjon og egen tilgangsstyring. Programkoden publiseres som statiske filer fra GitHub Pages. Sangdata og set-lister lagres hos en ekstern lagringstjeneste, først og fremst OneDrive for private Microsoft-kontoer.

Tilgang til data skal styres av ACL/rettigheter hos lagringstjenesten. Akkordia skal ikke ha eget passordregister, brukerregister eller rolleadministrasjon.

### 1.1 Hovedmål

- enkel å bruke for bandmedlemmer
- enkel kode som kan leses og kontrolleres direkte i BBEdit
- minst mulig driftsavhengighet
- god tilgjengelighet også når Internett-forbindelsen er ustabil
- tydelig skille mellom sangbibliotek, set-lister og bruk under spilling
- støtte flere band/arbeidsområder med ulike datasett og tilganger
- sikker håndtering av samtidige endringer
- enkel migrering fra eksisterende Akkordia-data
- arkitektur som senere kan støtte andre lagringstjenester enn OneDrive

### 1.2 Ikke-mål for første versjon

Følgende skal ikke være krav til første produksjonsklare versjon:

- egen backend/server
- egen bruker- eller passorddatabase
- egen ACL-/rollemodell
- offline-redigering med automatisk konfliktfletting
- sanntids-samarbeid i samme dokument
- avansert automatisk merge av samtidige sangendringer
- iCloud som første lagringsprovider
- omfattende rammeverk eller build pipeline dersom dette ikke viser seg nødvendig

---

## 2. Erfaringer fra eksisterende løsning

Gjennomgangen av eksisterende kode viser at løsningen over tid har samlet mange ulike ansvarsområder i samme system.

Root-versjonen av klientkoden består av omtrent 3833 linjer i `app.js`, serverdelen omtrent 1291 linjer i `server.js`, og CSS omtrent 962 linjer. Serveren har avhengigheter for blant annet Express, SQLite, rate limiting og e-post.

Eksisterende materiale inneholder også driftskonfigurasjon for webserver, SSL, PF/NAT, Basic Auth, bruker-/gruppefiler, adminverktøy og flere tidligere kopier/varianter av applikasjonen.

Dette er ikke nødvendigvis feil isolert sett, men summen gir for mange bevegelige deler for et lite bandverktøy.

### 2.1 Prinsipp for v2

V2 skal beholde domenefunksjonalitet som har verdi for brukerne, men fjerne mest mulig infrastrukturkode.

Behold i utgangspunktet:

- sangmodell
- vokal/koring
- akkordplassering
- seksjoner/sangdeler
- transponering
- akkordpalett
- BPM
- autoscroll
- tekst-/råimport der dette fortsatt er nyttig
- utskrift dersom det fortsatt er et reelt behov
- set-lister

Fjern eller erstatt:

- Node/Express backend
- SQLite
- Basic Auth
- `.htpasswd` / `.htgroup`
- egen brukeradministrasjon
- invitasjonsflyt
- egen e-postflyt
- serverbasert bandadministrasjon
- serverens rolle som synkroniseringsmotor

---

## 3. Arkitekturprinsipp

```text
GitHub
Longfjeld/Akkordia
        │
        ▼
GitHub Pages
https://longfjeld.github.io/Akkordia/
        │
        ▼
Akkordia PWA
        │
        ├── IndexedDB
        │      └── offline-cache og lokale innstillinger
        │
        └── StorageProvider
               │
               ├── OneDriveStorage
               ├── senere DropboxStorage
               └── eventuelt LocalFolderStorage
```

### 3.1 Autoritative kilder

|Område|Autoritativ kilde|
|:---|:---|
|Programkode|GitHub-repositoriet `Longfjeld/Akkordia`|
|Publisert app|GitHub Pages fra godkjent kode|
|Sangdata|Valgt lagringstjeneste / arbeidsområde|
|Set-lister|Valgt lagringstjeneste / arbeidsområde|
|Offline-data|IndexedDB-cache, ikke autoritativ|
|Lokale UI-innstillinger|IndexedDB eller tilsvarende lokal lagring|

GitHub-repositoriet skal være eneste autoritative kilde for programkode. Serverkopier, ZIP-filer eller lokale arbeidskopier skal ikke brukes som fasit når videre utvikling starter.

---

## 4. Arbeidsområde / band

Et band representeres teknisk som et **workspace**. I brukergrensesnittet brukes i hovedsak begrepet **Band**.

Et arbeidsområde er en katalog hos lagringstjenesten med en definert Akkordia-struktur.

### 4.1 Flere arbeidsområder

Samme bruker skal kunne koble Akkordia til flere band:

```text
Akkordia
 ├── The Tumbleweeds
 ├── Band B
 └── Band C
```

Hvert band kan ha forskjellig eier, plassering og tilgangsmodell hos lagringstjenesten.

### 4.2 Brukerhandlinger

Brukeren skal kunne:

- åpne et kjent band
- bytte band
- koble til et eksisterende band
- opprette et nytt band/arbeidsområde
- fjerne et band fra listen på den lokale enheten

Å fjerne et band lokalt skal **ikke** slette filer hos lagringstjenesten.

### 4.3 Validering av valgt katalog

Hvert arbeidsområde skal inneholde en manifestfil, foreløpig kalt:

`akkordia.json`

Eksempel:

```json
{
  "format": "akkordia-workspace",
  "schemaVersion": 1,
  "workspaceId": "uuid",
  "name": "The Tumbleweeds",
  "created": "2026-08-29T18:00:00Z",
  "modified": "2026-08-29T18:00:00Z"
}
```

Hvis brukeren velger feil katalog skal Akkordia ikke opprette sangfiler der automatisk.

Appen skal i stedet gi et tydelig valg mellom eksempelvis:

- velg en annen katalog
- opprett nytt Akkordia-område her
- avbryt

Opprettelse av nytt område skal alltid være en eksplisitt handling.

---

## 5. Lagringsabstraksjon

Akkordia skal ikke spre OneDrive-spesifikk kode gjennom resten av applikasjonen.

Det opprettes derfor en liten `StorageProvider`-kontrakt.

Konseptuelt behov:

```text
connect()
disconnect()
list(path)
read(path)
create(path, data)
write(path, data, expectedVersion)
delete(path)
getMetadata(path)
```

Kontrakten skal holdes så liten som mulig.

### 5.1 Første provider

Første implementasjon:

`OneDriveStorage`

Målgruppen er først og fremst private Microsoft-kontoer.

Akkordia administrerer ikke passord. Microsoft-innlogging brukes kun til å få delegert tilgang til filene brukeren allerede har rettigheter til.

### 5.2 Fremtidige providere

Arkitekturen skal gjøre det mulig å legge til eksempelvis:

- Dropbox
- lokal mappe der nettleserstøtte gjør dette egnet
- annen skylagring med tilsvarende API

Det skal ikke utvikles flere providere før OneDrive-versjonen er stabil og det finnes et faktisk behov.

---

## 6. Foreslått filstruktur for data

```text
<workspace>/
├── akkordia.json
├── songs/
│   ├── <song-id>.json
│   ├── <song-id>.json
│   └── <song-id>.json
└── setlists/
    ├── <setlist-id>.json
    └── <setlist-id>.json
```

Private notater ligger bevisst utenfor denne delte workspace-strukturen. De lagres separat i den innloggede brukerens private OneDrive, med lokal IndexedDB-cache.

---

## 7. Sangmodell

Eksisterende eksport `ttc_all_songs.json` inneholder 16 sanger. Eksisterende sang-ID-er beholdes under migrering for å unngå unødvendige brudd i referanser.

Nye sanger kan senere bruke UUID eller tilsvarende stabil ID.

### 7.1 Én JSON per sang

Hver sang lagres som egen fil:

```text
songs/song_95788c4c51b2_19bd532ad59.json
```

Fordeler:

- mindre konfliktflate
- lettere synkronisering
- enkel feilsøking
- enkel backup
- én bruker kan redigere sang A mens en annen redigerer sang B uten konflikt
- enkel import/eksport

### 7.2 Modell som beholdes

Eksisterende eksport viser en naturlig modell med blant annet:

```text
song
 ├── id
 ├── title
 ├── chordSet
 ├── transpose
 ├── playback
 └── sections[]
       ├── id
       ├── type
       ├── label
       ├── transpose
       └── lines[]
```

Denne modellen skal brukes som utgangspunkt, ikke erstattes uten dokumentert grunn.

Server-/synkroniseringsmetadata fra gammel løsning, eksempelvis `_server`, skal ikke være en del av permanent v2-format.

### 7.3 Felles sangdata

Følgende er felles for hele bandet:

- BPM
- beats per line / tilsvarende autoscroll-grunnlag
- sangens transponering
- transponering på seksjonsnivå
- sangstruktur
- akkorder
- vokal/koring

### 7.4 Transponering

V2 trenger ikke personlig transponering i første versjon.

Transponering kan lagres:

- på sangnivå
- på seksjonsnivå

Dette gir tilstrekkelig fleksibilitet uten ekstra personlig tilstand.

---

## 8. Personlige UI-innstillinger

Individuelle innstillinger skal bare innføres når de ikke kompliserer datamodellen eller synkronisering.

### 8.1 Fontstørrelse

Fontstørrelse bør vurderes som **lokal bruker-/enhetsinnstilling**, ikke som sangdata.

Begrunnelse:

- ulik skjermstørrelse på Mac, iPad og iPhone
- ulike synsbehov
- endringen skaper ingen datakonflikt
- enkel å lagre lokalt

Foreslått modell:

```text
normal
stor
ekstra stor
```

eller en liten trinnvis kontroll i Spill-modus.

Det bør ikke lages fri zoom-/layoutlogikk dersom tre enkle nivåer dekker behovet.

### 8.2 Autoscroll

Autoscroll skal følge felles sangdata som BPM og vise hvor brukeren befinner seg i sangen.

Personlig autoscroll-hastighet skal ikke være nødvendig i normalmodellen dersom BPM/beregningen fungerer riktig.

Det kan være aktuelt med midlertidig pause/fortsett under spilling, men dette endrer ikke sangdata.

---

## 9. Set-lister

Set-lister skal få større betydning i v2 og være en hovedfunksjon, ikke bare en alternativ listevisning.

### 9.1 Én JSON per set-list

```text
setlists/<setlist-id>.json
```

Eksempel:

```json
{
  "id": "uuid",
  "name": "Folken 14. september",
  "songs": [
    "song-a",
    "song-b",
    "song-a"
  ]
}
```

Samme sang kan forekomme flere ganger i samme set-list.

Dette betyr at datastrukturen **ikke** skal anta unike sang-ID-er i `songs`-listen.

### 9.2 Ingen fritekstposter i set-listen i første modell

Fritekstposter som pause, bytte gitar eller scenekommentarer skal ikke blandes inn som egne set-list-elementer nå.

Behov av denne typen vurderes sammen med eventuell fremtidig funksjon for private notater.

### 9.3 Redigering av set-liste

Brukeren skal kunne:

- opprette set-list
- endre navn
- legge til sang
- legge til samme sang flere ganger
- endre rekkefølge
- fjerne forekomst av sang
- slette set-list

Set-listens rekkefølge er eksplisitt og autoritativ.

---

## 10. Hovedmoduser i brukergrensesnittet

V2 skal ha tydelig visuell og funksjonell avgrensning mellom ulike oppgaver.

Foreslåtte hovedmoduser:

|Modus|Formål|
|:---|:---|
|Sanger|Finne og administrere sangbiblioteket|
|Set-lister|Planlegge øvelse og konsert|
|Spill|Bruke en sang eller set-list under øvelse/konsert|

Redigering er en eksplisitt tilstand fra sangvisning, ikke en del av Spill-modus.

### 10.1 Visuell avgrensning

Hver hovedmodus skal ha:

- tydelig overskrift
- klart markert aktiv navigasjon
- kun kontroller som er relevante for modusen
- konsistent plassering av globale handlinger som bandbytte og innstillinger

Målet er å redusere antall samtidige valg på skjermen.

---

## 11. Spill-modus

Spill-modus skal være så ren som mulig.

### 11.1 Primære handlinger

Ved spilling av set-list skal brukeren enkelt kunne:

- gå til neste sang
- gå til forrige sang
- hoppe direkte til en annen sang i set-listen
- se plassering, eksempelvis `3 / 12`
- starte/pause autoscroll
- se aktuell posisjon i sangen
- justere lokal visningsstørrelse dersom dette implementeres
- avslutte Spill-modus

### 11.2 Redigering

Sanginnhold skal ikke redigeres direkte i Spill-modus.

Brukeren går eksplisitt fra Spill til Rediger dersom en endring er nødvendig.

Dette prioriterer:

- enkelhet
- redusert risiko for utilsiktede endringer
- større leseflate
- færre kontroller under faktisk spilling

### 11.3 Wake Lock

Når Spill-modus aktiveres skal appen, der nettleseren støtter dette, be om Screen Wake Lock slik at skjermen ikke sovner under bruk.

Wake Lock skal:

- aktiveres når Spill-modus starter
- frigjøres når Spill-modus avsluttes
- forsøkes gjenopprettet etter at appen kommer tilbake fra bakgrunnen dersom Spill-modus fortsatt er aktiv
- feile kontrollert dersom nettleser/OS ikke tillater funksjonen

Wake Lock skal ikke holdes aktiv unødvendig i vanlig redigerings- eller biblioteksvisning.

---

## 12. Offline-strategi

Offline-støtte er et krav for lesing og spilling.

### 12.1 Prinsipp

```text
Lagringstjeneste = autoritativ kopi
IndexedDB         = lokal cache
Service Worker    = app-shell / statiske ressurser
```

### 12.2 Første mål

|Handling|Offline i første versjon|
|:---|:---|
|Åpne installert PWA|Ja|
|Se tidligere synkroniserte sanger|Ja|
|Åpne tidligere synkroniserte set-lister|Ja|
|Spille set-list|Ja|
|Autoscroll|Ja|
|Vise lagret transponering|Ja|
|Redigere sang|Nei|
|Opprette sang|Nei|
|Endre set-list|Nei|

Offline-skriving utsettes fordi dette ellers krever kø, versjonshåndtering og merge-/konfliktlogikk.

Dette er et bevisst avvik fra «full offline first» til fordel for enkelhet og robusthet.

### 12.3 Oppstart

Ved oppstart bør appen kunne:

1. vise lokalt cachet innhold raskt
2. kontrollere nettverk/innlogging i bakgrunnen
3. kontrollere om eksterne filer er endret
4. oppdatere IndexedDB
5. oppdatere visningen uten å gjøre appen utilgjengelig mens synkronisering pågår

For set-lister er dette konkret implementert som cache-first med bakgrunnsrevalidering. RAM brukes først når tilgjengelig, ellers IndexedDB. OneDrive-revalidering skal ikke gjentas ved vanlig visningsbytte når datasettet allerede er kontrollert i samme app-økt. Eksplisitt Oppdater skal fortsatt fremtvinge ny lesing.

Appen skal alltid vise tydelig om data er:

- oppdatert
- offline/cachet
- under synkronisering
- ikke tilgjengelig

---

## 13. Samtidige endringer og konflikter

Flere brukere kan redigere samtidig. Dette må støttes fra første skriveversjon.

### 13.1 Optimistic concurrency

Ved lesing lagres filens eksterne versjonsidentifikator/ETag sammen med arbeidskopien.

Ved lagring sendes forventet versjon tilbake til storage-provider.

Prinsipp:

```text
Les song-a.json
   ↓
version = X
   ↓
rediger
   ↓
lagre bare hvis ekstern versjon fortsatt er X
```

Hvis filen er endret av en annen bruker skal Akkordia ikke stille overskriving som normalvalg.

Første versjon skal heller:

- stoppe lagringen
- informere tydelig om konflikten
- tilby å laste inn nyeste versjon
- beskytte brukerens lokale endring mot utilsiktet tap så langt dette kan gjøres enkelt

Automatisk merge er ikke et krav i første versjon.

### 13.2 Hvorfor én fil per objekt

Én fil per sang og én fil per set-list reduserer sannsynligheten for konflikt vesentlig sammenlignet med én stor felles JSON-fil.

---

## 14. Private notater

**Status: Implementert grunnmodell.**

Private notater er personlige data per sang. De er ikke del av sangfilen eller set-listen og lagres aldri i bandets delte workspace.

Valgt modell:

- lokal arbeidskopi i IndexedDB
- cache nøkklet på Microsoft-konto + workspace
- autoritativ kopi i brukerens private OneDrive
- én `notes.json` per workspace under `Akkordia/private/<workspaceId>/`
- automatisk synk når nett og autentisering er tilgjengelig
- ETag for å oppdage samtidig filendring
- merge på `songId`, slik at ulike noter ikke gir reell konflikt
- konfliktkopi bevares lokalt når samme note er endret begge steder

Private notater kan redigeres offline, også når felles sang- og set-listdata ellers er i lesemodus.

---

## 15. Språk og tekstressurser

Første brukergrensesnitt kan være norsk, men kode bør struktureres slik at andre språk kan legges til uten omfattende omskriving.

Dette skal gjøres enkelt, uten et stort i18n-rammeverk.

Eksempel:

```javascript
const strings = {
  no: {
    songs: "Sanger",
    setlists: "Set-lister",
    play: "Spill"
  }
};
```

UI-kode skal så langt praktisk mulig unngå at tekster dupliseres som tilfeldige hardkodede strenger mange steder.

Det skal ikke implementeres komplett flerspråklig UI før det finnes et faktisk behov.

---

## 16. Teknologistakk

Utgangspunktet er en statisk webapp/PWA med standard webteknologi.

|Komponent|Valg|
|:---|:---|
|HTML|Standard HTML5|
|CSS|Vanlig CSS|
|JavaScript|Moderne vanilla JavaScript / ES modules|
|PWA|Web App Manifest + Service Worker|
|Offline-data|IndexedDB|
|Kodehosting|GitHub|
|Publisering|GitHub Pages|
|Første ekstern lagring|OneDrive / Microsoft Graph|

### 16.1 Rammeverk

React, Vue, Angular eller tilsvarende skal ikke innføres uten dokumentert behov.

### 16.2 Build-verktøy

NPM/build pipeline skal ikke være et krav dersom native ES modules og statiske ressurser er tilstrekkelig.

Dersom en ekstern avhengighet senere krever bygging, skal behovet dokumenteres før dette innføres.

---

## 17. Foreslått kodestruktur

Foreløpig målstruktur:

```text
Akkordia/
├── index.html
├── manifest.webmanifest
├── sw.js
├── README.md
├── CHANGELOG.md
├── css/
│   └── app.css
├── js/
│   ├── app.js
│   ├── storage.js
│   ├── onedrive.js
│   ├── cache.js
│   ├── songs.js
│   ├── setlists.js
│   ├── player.js
│   └── strings.js
├── assets/
└── docs/
    ├── PROJECT-PLAN.md
    ├── ARCHITECTURE.md
    ├── DATA-FORMAT.md
    ├── DECISIONS.md
    └── TESTING.md
```

Dette er et utgangspunkt, ikke et krav om nøyaktig åtte JavaScript-filer.

Målet er noen få tydelige moduler, ikke én monolittisk `app.js` og ikke et stort antall mikromoduler.

---

## 18. Migrering fra gammel Akkordia

Migrering skal automatiseres og være repeterbar.

### 18.1 Kilde

Eksisterende eksport:

`ttc_all_songs.json`

Gjennomgått eksport inneholder:

|Egenskap|Verdi|
|:---|:---|
|Antall sanger|16|
|Format|Én eksportfil med `songs`|
|Eksisterende stabile sang-ID-er|Ja|
|Servermetadata|Ja, må renses|

### 18.2 Migreringsverktøy

Det skal lages et separat migreringsverktøy/script som:

1. leser gammel eksport
2. validerer forventet struktur
3. beholder eksisterende sang-ID
4. fjerner gammel server-/synkroniseringsmetadata
5. skriver én JSON-fil per sang
6. validerer resultatet
7. lager en tydelig rapport over eventuelle avvik

Migrering skal ikke være kode som kjører ved normal oppstart av Akkordia.

### 18.3 Prinsipp

Migreringskode er midlertidig verktøykode. Produksjonsappen skal ikke bære permanent kompleksitet for alle historiske formater dersom dette kan unngås.

---

## 19. Git-arbeidsflyt

`main` skal representere godkjent kode som kan publiseres.

Utvikling gjøres i korte branches, eksempelvis:

```text
feature/onedrive-storage
feature/setlist-player
feature/song-editor
fix/wake-lock
```

### 19.1 Regel for endringer

En endring skal normalt følge:

```text
beslutning / issue
       ↓
branch
       ↓
implementering
       ↓
test
       ↓
dokumentasjon
       ↓
commit
       ↓
merge til main
```

### 19.2 Commit-prinsipp

Commits bør være små nok til at formålet er tydelig.

Eksempler:

```text
feat: add workspace validation
feat: add setlist duplicate songs
fix: reacquire wake lock after visibility change
docs: document offline read strategy
```

Det er ikke nødvendig å innføre tung formell Conventional Commits-prosess, men konsistent prefiks anbefales.

---

## 20. Endringskontroll og beslutninger

Viktige arkitekturvalg dokumenteres i `docs/DECISIONS.md`.

Format:

```markdown
## ADR-0001 – Én JSON-fil per sang

**Status:** Accepted  
**Dato:** 2026-08-29

### Problem

...

### Beslutning

...

### Begrunnelse

...

### Konsekvenser

...
```

Én samlet beslutningslogg er tilstrekkelig for prosjektets størrelse.

### 20.1 Når kreves beslutningsnotat

Beslutningsnotat brukes når en endring påvirker minst ett av følgende:

- datamodell
- sikkerhetsmodell
- storage-provider-kontrakt
- offline-strategi
- synkronisering/konflikthåndtering
- hovednavigasjon eller sentral arbeidsflyt
- teknologistakk
- kompatibilitet med eksisterende data

Små CSS-justeringer eller ordinære feilrettinger trenger ikke ADR.

---

## 21. Arbeidsmetode for nye funksjoner

Før en større funksjon implementeres skal følgende være avklart:

|Spørsmål|Eksempel|
|:---|:---|
|Hvilket problem løser den?|Raskt gå til neste sang under konsert|
|Hvilken modus tilhører den?|Spill|
|Påvirker den permanent data?|Nei|
|Hvordan fungerer den offline?|Fullt|
|Kan den skape konflikt?|Nei|
|Hvordan testes den?|Set-list med tre sanger, inkludert gjentatt sang|

Deretter utvikles funksjonen så isolert som praktisk mulig.

Dokumentasjon og testbeskrivelse skal oppdateres samtidig med funksjonen.

---

## 22. Versjonering

Prosjektet bruker SemVer-prinsipp.

Under utvikling brukes `0.x.y`.

Eksempel på mulig progresjon:

|Versjon|Innhold|
|:---|:---|
|0.1.0|Rent PWA-skall, navigasjon og lokal demodata|
|0.2.0|Workspace og OneDrive-tilkobling|
|0.3.0|Sangbibliotek og lesing|
|0.4.0|Sangeredigering og konfliktsikker lagring|
|0.5.0|Set-lister|
|0.6.0|Spill-modus og Wake Lock|
|0.7.0|Full offline-lesing/cache|
|0.8.0|Migreringsverktøy og datavalidering|
|1.0.0|Første stabilt godkjente versjon|

Rekkefølgen kan justeres etter prototyping og test, men endring skal dokumenteres.

---

## 23. Teststrategi

Testing skal være enkel nok til faktisk å bli gjennomført.

### 23.1 Primære plattformer

|Plattform|Prioritet|
|:---|:---|
|macOS / Safari|Høy|
|macOS / Chromium-basert nettleser|Høy|
|iPhone / Safari / installert PWA|Høy|
|iPad / Safari / installert PWA|Høy|
|Android / Chrome / installert PWA|Middels|

### 23.2 Viktige testområder

- første oppstart
- Microsoft-innlogging
- opprette workspace
- velge eksisterende workspace
- velge feil katalog
- bytte band
- mistet tilgang til tidligere band
- kun lesetilgang
- lese sang
- opprette/redigere sang
- samtidig redigering av samme sang
- samtidig redigering av ulike sanger
- set-list med samme sang flere ganger
- omorganisere set-list
- direkte hopp i Spill-modus
- forrige/neste
- Wake Lock
- app til bakgrunn og tilbake
- offline oppstart
- offline spilling
- tilbakekomst av nettverk
- oppdatering av PWA-versjon
- migrert gammel sang

### 23.3 Automatisering

Automatiserte tester skal prioriteres for ren logikk som:

- datavalidering
- migrering
- sang-/set-list-modeller
- versjon-/konfliktlogikk

Fullt automatisert UI-testregime er ikke et krav fra starten dersom dette vil øke kompleksiteten uforholdsmessig.

---

## 24. Sikkerhetsprinsipper

- ingen hemmelig `client_secret` i GitHub Pages-kode
- ingen passord lagres av Akkordia
- ingen gamle `.htpasswd`-/`.htgroup`-filer skal inn i offentlig repository
- minste praktiske delegerte tilgang mot storage-provider skal brukes
- appen skal bare operere innen aktivt valgt workspace selv om OAuth-scope teknisk kan være bredere
- sletting skal kreve tydelig brukerhandling
- arbeidsområde skal valideres før skriving
- konflikt skal ikke løses med stille overskriving
- tokens skal håndteres etter anbefalt klientflyt for den valgte identity-provider

---

## 25. Dokumentasjon

All prosjektdokumentasjon skrives i Markdown.

### 25.1 Filer

|Fil|Formål|
|:---|:---|
|`README.md`|Kort introduksjon, installasjon og bruk|
|`docs/PROJECT-PLAN.md`|Styringsdokument og prosjektretning|
|`docs/ARCHITECTURE.md`|Detaljert komponent- og dataflyt|
|`docs/DATA-FORMAT.md`|JSON-format, felt og schema-versjoner|
|`docs/DECISIONS.md`|Arkitekturavgjørelser|
|`docs/TESTING.md`|Testplan og akseptansekriterier|
|`CHANGELOG.md`|Brukersynlige endringer per versjon|

### 25.2 Markdown-tabeller

Prosjektets tabeller skal formateres uten ekstra mellomrom rundt innholdet:

```markdown
|Navn|Verdi|
|:---|:---|
|Test|0|
```

Dette skal brukes konsekvent i dokumentasjonen.

---

## 26. Foreslåtte arkitekturbeslutninger ved prosjektstart

Følgende registreres som første beslutninger i `DECISIONS.md` når prosjektet etableres:

1. GitHub-repositoriet er eneste autoritative kilde for programkode.
2. GitHub Pages brukes som produksjonshost for PWA-en.
3. V2 har ingen egen backend i normal arkitektur.
4. Akkordia har ingen egen brukerkonto-/passordmodell.
5. Tilgang til samarbeidsdata styres av storage-providerens ACL.
6. OneDrive for private Microsoft-kontoer er første storage-provider.
7. Storage-laget abstraheres med en liten provider-kontrakt.
8. Hvert band er et separat workspace.
9. Workspace valideres med `akkordia.json` før skriving.
10. Én JSON-fil brukes per sang.
11. Én JSON-fil brukes per set-list.
12. Eksisterende sang-ID-er beholdes ved migrering.
13. BPM og transponering er felles sangdata.
14. Transponering støttes på sang- og seksjonsnivå og anvendes som ren visningslogikk på akkordnavn i Sanger og Spill.
15. Samme sang kan forekomme flere ganger i én set-list.
16. Fritekstposter er ikke del av set-list-modellen i første versjon.
17. Set-lister og Spill-modus er hovedfunksjoner i UI.
18. Spill-modus holdes fri for direkte redigering.
19. Screen Wake Lock brukes under Spill-modus der dette støttes.
20. IndexedDB brukes for offline-lesing/cache.
21. Set-lister bruker cache-first visning med OneDrive-revalidering i bakgrunnen og sesjonsferskhet for å unngå unødvendig dobbel Graph-lasting.
22. Offline-skriving utsettes til et dokumentert behov foreligger.
23. Optimistic concurrency / ekstern versjonskontroll brukes ved skriving.
24. Automatisk merge av konflikter er ikke krav i første versjon.
25. Fontstørrelse kan være lokal innstilling dersom dette kan gjøres med svært liten kompleksitet.
26. Autoscroll styres av felles sangdata/BPM og skal indikere aktuell posisjon.
27. Private notater bruker privat OneDrive-lagring med konto-/workspace-isolert IndexedDB-cache.
28. Norsk er første UI-språk, men tekstressurser struktureres for enkel senere oversettelse.
29. Vanilla HTML/CSS/JavaScript og native ES modules foretrekkes.
30. Framework/build-system innføres bare ved dokumentert behov.
31. Migrering fra gammelt format skal være et separat, repeterbart verktøy.

---

## 27. Faseplan

### Fase 0 – Etabler prosjektgrunnlag

Leveranser:

- rent GitHub-repository
- `.gitignore`
- `README.md`
- `PROJECT-PLAN.md`
- `DECISIONS.md`
- grunnleggende `ARCHITECTURE.md`
- grunnleggende `DATA-FORMAT.md`
- grunnleggende `TESTING.md`
- enkel statisk PWA som kan åpnes fra GitHub Pages

Ingen reell OneDrive-skriving før prosjektgrunnlaget er kontrollert.

### Fase 1 – Datamodell og migrering

Leveranser:

- endelig v1-schema for workspace
- endelig v1-schema for sang
- endelig v1-schema for set-list
- validator
- migreringsscript for `ttc_all_songs.json`
- migrerte testdata

### Fase 2 – Lokal funksjonell prototype

Leveranser:

- sangbibliotek
- sangvisning
- enkel redigering
- set-list-redigering
- Spill-modus
- Wake Lock
- autoscroll

Bruk lokal/test storage-provider slik at UI og domenelogikk kan utvikles uten å være avhengig av Graph under hele utviklingen.

### Fase 3 – OneDrive-integrasjon

Leveranser:

- Microsoft-innlogging
- opprette workspace
- koble til workspace
- bytte workspace
- lese/skrive filer
- håndtere read-only
- ETag/versjonskontroll
- konflikthåndtering

### Fase 4 – Offline

Leveranser:

- PWA app-shell-cache
- IndexedDB for sang/set-list
- offline oppstart
- offline Spill-modus
- synkronisering når nett kommer tilbake

### Fase 5 – Pilot

Pilot med reelt banddatasett og flere enheter.

Fokus:

- brukeropplevelse
- stabilitet
- samtidige endringer
- dårlig nett
- PWA-oppdatering
- konsert-/øvingssituasjon

### Fase 6 – 1.0

Før 1.0 skal:

- alle kritiske tester være gjennomført
- dokumentasjon være oppdatert
- migrering være kontrollert
- kjente alvorlige datatap-/konfliktfeil være lukket
- pilotbruk være godkjent

---

## 28. Prosjektregler for videre samarbeid

For å redusere risiko for misforståelser skal videre arbeid følge disse reglene:

- arbeid skal baseres på siste versjon fra prosjektets autoritative repository eller eksplisitt opplastet versjon
- ved kodegjennomgang skal aktuell versjon identifiseres før endring
- generert kode skal ikke anta at en eldre ZIP fortsatt er siste versjon
- større endringer skal kobles til dokumentert beslutning eller krav
- dokumentasjon skal oppdateres samtidig med kode når modellen eller brukerflyten endres
- gamle kopier beholdes ikke inne i produksjonsmappene som «backup»; Git håndterer historikken
- testdata og produksjonsdata holdes atskilt
- sikkerhetsrelaterte filer og credentials skal aldri committes

---

## 29. Åpne beslutninger

Følgende er bevisst ikke avgjort ennå:

|Tema|Status|
|:---|:---|
|Private notater|Privat OneDrive + lokal IndexedDB-cache|
|Eksakt OneDrive OAuth-scope og registreringsoppsett|Må spesifiseres før Fase 3|
|Eksakt JSON-schema for sang|Fastsettes i Fase 1|
|Eksakt JSON-schema for set-list|Fastsettes i Fase 1|
|Eksakt lokal fontkontroll|Prototype/test først|
|Behov for utskrift i v2|Verifiseres mot faktisk bruk|
|Dropbox-provider|Ikke planlagt før OneDrive er stabil|
|Offline-redigering|Kun ved dokumentert behov|

---

## 30. Neste konkrete steg

Neste arbeid bør ikke være full appimplementasjon.

Rekkefølgen anbefales slik:

1. etablere ny repository-struktur
2. opprette `DECISIONS.md` med beslutningene fra denne planen
3. beskrive detaljert dataformat i `DATA-FORMAT.md`
4. definere `StorageProvider`-kontrakten i `ARCHITECTURE.md`
5. lage migreringsscript og migrere `ttc_all_songs.json`
6. validere alle 16 migrerte sanger
7. lage minimal PWA med lokal test-provider
8. implementere og teste Sanger → Set-lister → Spill som hovedflyt
9. først deretter koble på OneDrive

Denne rekkefølgen gjør at størstedelen av appen kan utvikles og testes uten å være avhengig av autentisering, Graph eller ekstern lagring. Det reduserer både teknisk risiko og feilsøkingsflate.

---

## 31. Suksesskriterium

Akkordia v2 er vellykket dersom et bandmedlem kan:

```text
åpne PWA
   ↓
velge band
   ↓
finne eller åpne set-list
   ↓
starte Spill
   ↓
bruke hele øvelsen/konserten stabilt
```

uten å måtte forstå serverdrift, Akkordia-brukere, passord, database, synkroniseringsmekanismer eller tekniske lagringsdetaljer.

Det viktigste arkitekturmålet er derfor ikke flest mulig funksjoner, men **færrest mulig komponenter som kan gjøre løsningen utilgjengelig**.
