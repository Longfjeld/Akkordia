# Akkordia v2 – beslutningslogg

**Status:** Aktiv  
**Sist oppdatert:** 2026-08-29

Denne filen dokumenterer varige arkitektur- og produktbeslutninger. Små feilrettinger og ordinære visuelle justeringer trenger ikke eget ADR-punkt.

---

## ADR-0001 – GitHub er autoritativ kilde for programkode

**Status:** Accepted  
**Dato:** 2026-08-29

### Problem

Tidligere versjoner finnes i flere kopier og på ulike driftssteder. Dette øker risikoen for at endringer baseres på feil versjon.

### Beslutning

`https://github.com/Longfjeld/Akkordia` er eneste autoritative kilde for Akkordia v2-programkode.

### Konsekvenser

- gamle ZIP-er brukes som historisk referanse, ikke som løpende fasit
- Git-historikk erstatter manuelle backupkopier av kildefiler
- `main` skal representere godkjent/publiserbar kode

---

## ADR-0002 – Statisk PWA uten egen backend

**Status:** Accepted  
**Dato:** 2026-08-29

### Beslutning

Akkordia v2 bygges som statisk PWA publisert fra GitHub Pages. Normal arkitektur skal ikke kreve egen Node-, Apache-, database- eller applikasjonsserver.

### Begrunnelse

Målet er færre driftsavhengigheter og høyere tilgjengelighet.

---

## ADR-0003 – Tilgang styres av lagringstjenesten

**Status:** Accepted  
**Dato:** 2026-08-29

### Beslutning

Akkordia skal ikke ha eget brukerregister, passordregister eller egen ACL-modell. Tilgang til samarbeidsdata følger storage-providerens rettigheter.

### Konsekvenser

- privat Microsoft-konto er første identitetsmodell
- read-only og read/write håndteres ut fra faktisk filtilgang
- Akkordia må håndtere manglende tilgang kontrollert

---

## ADR-0004 – Ett workspace per band

**Status:** Accepted  
**Dato:** 2026-08-29

### Beslutning

Hvert band representeres av et separat workspace hos lagringstjenesten. Et workspace identifiseres av `akkordia.json`.

### Konsekvenser

- bruker kan koble til flere band
- bruker kan bytte band uten å logge ut
- feil katalog kan oppdages før data skrives

---

## ADR-0005 – Én JSON-fil per sang

**Status:** Accepted  
**Dato:** 2026-08-29

### Beslutning

Hver sang lagres som egen JSON-fil under `songs/`.

### Begrunnelse

Dette reduserer konfliktflate, gjør synkronisering enklere og gir en lett forståelig filstruktur.

---

## ADR-0006 – Én JSON-fil per set-list

**Status:** Accepted  
**Dato:** 2026-08-29

### Beslutning

Hver set-list lagres som egen JSON-fil under `setlists/`.

Samme sang-ID kan forekomme flere ganger i samme set-list.

---

## ADR-0007 – Felles musikalske innstillinger

**Status:** Accepted  
**Dato:** 2026-08-29

### Beslutning

BPM, autoscroll-grunnlag og transponering er felles sangdata. Transponering kan finnes både på sangnivå og seksjonsnivå.

Personlig transponering innføres ikke i første versjon.

---

## ADR-0008 – Set-lister og Spill er hovedarbeidsflyt

**Status:** Accepted  
**Dato:** 2026-08-29

### Beslutning

Brukergrensesnittet organiseres rundt tre tydelige hovedmoduser:

- Sanger
- Set-lister
- Spill

Spill-modus skal være ren og fri for direkte sangeredigering.

---

## ADR-0009 – Screen Wake Lock i Spill-modus

**Status:** Accepted  
**Dato:** 2026-08-29

### Beslutning

Akkordia ber om Screen Wake Lock når Spill-modus er aktiv, der nettleseren støtter dette.

Wake Lock skal frigis når Spill-modus avsluttes.

---

## ADR-0010 – Offline-lesing, men ikke offline-skriving i første versjon

**Status:** Accepted  
**Dato:** 2026-08-29

### Beslutning

Service Worker cacher app-shell. IndexedDB cacher tidligere synkroniserte sanger og set-lister.

Offline-lesing og spilling skal fungere. Offline-redigering utsettes.

### Begrunnelse

Offline-skriving introduserer synkroniseringskø, konfliktfletting og vesentlig mer kompleksitet.

---

## ADR-0011 – Optimistic concurrency ved skriving

**Status:** Accepted  
**Dato:** 2026-08-29

### Beslutning

Storage-providerens versjonsidentifikator/ETag brukes for å kontrollere at en fil ikke er endret siden den ble lest.

Stille overskriving av en nyere ekstern versjon skal ikke være normal oppførsel.

---

## ADR-0012 – Vanilla webteknologi foretrekkes

**Status:** Accepted  
**Dato:** 2026-08-29

### Beslutning

HTML, CSS, moderne vanilla JavaScript og native ES modules brukes som utgangspunkt.

React/Vue/Angular eller build-system innføres bare ved dokumentert behov.

---

## ADR-0013 – Eksisterende sang-ID-er beholdes ved migrering

**Status:** Accepted  
**Dato:** 2026-08-29

### Beslutning

ID-er i eksisterende `ttc_all_songs.json` beholdes i migrerte v2-filer.

Nye sanger kan bruke en nyere ID-standard uten å endre gamle ID-er.

---

## ADR-0014 – Enkel språktilrettelegging

**Status:** Accepted  
**Dato:** 2026-08-29

### Beslutning

Første UI er norsk. Brukertekster samles i en enkel ressursstruktur slik at flere språk kan legges til senere uten omfattende omskriving.

Et stort i18n-rammeverk brukes ikke fra starten.

---

## ADR-0015 – Lokal fontstørrelse kan støttes

**Status:** Accepted  
**Dato:** 2026-08-29

### Beslutning

Fontstørrelse kan være en lokal enhets-/brukerpreferanse dersom dette implementeres med liten kompleksitet, eksempelvis noen få faste nivåer.

Den skal ikke lagres som felles sangdata.

---

## ADR-0016 – Private notater lagres i brukerens private OneDrive med lokal cache

**Status:** Accepted  
**Dato:** 2026-09-06

### Problem

Private notater skal følge personen mellom enheter, kunne brukes offline og ikke være lesbare for andre medlemmer av bandets delte workspace.

### Beslutning

Private notater er per sang, uavhengig av forekomst i set-list. IndexedDB er lokal arbeidskopi og offline-cache, mens brukerens private OneDrive er autoritativ vedvarende lagring mellom enheter.

Hver Microsoft-konto får én `notes.json` per workspace under `Akkordia/private/<workspaceId>/`. Notatene indekseres med stabil `songId`. Lokal cache nøkkles på Microsoft-konto + `workspaceId`, slik at private data ikke deles mellom brukere på samme nettleser.

Lokal lagring skjer først og skal fungere offline. Synkronisering mot OneDrive skjer separat. OneDrive ETag brukes til å oppdage samtidige filendringer, men merge og konfliktavgjørelse skjer på notenivå. Endringer i forskjellige sanger kan derfor flettes automatisk. Hvis samme sangnote er endret begge steder, beholdes vinneren og den tapende teksten lagres lokalt som konfliktkopi.

---

## ADR-0017 – Dataformat optimaliseres for enkel kjørekode

**Status:** Accepted  
**Dato:** 2026-08-29

### Beslutning

JSON er brukerdata, ikke programkode. Dataformatet skal derfor ikke minimeres for sin egen skyld. Eksplisitte og eventuelt noe redundante data er akseptabelt når dette gir enklere, tydeligere og mer robust kjørekode.

### Konsekvenser

- enkel programlogikk prioriteres foran minimale JSON-filer
- felt fjernes bare når de ikke har funksjonell verdi
- `chordSet` beholdes eksplisitt og beregnes ikke fra plasserte akkorder

---

## ADR-0018 – Playback er valgfritt i Song schema v1

**Status:** Accepted  
**Dato:** 2026-08-29

### Beslutning

`playback` er valgfritt i sangfilen. Manglende `playback` fylles ikke automatisk inn under migrering.

Appen kan bruke standardverdi ved visning/avspilling, og redigering i appen kan senere opprette eller endre `playback` eksplisitt.

---

## ADR-0019 – Gammel server- og endringsmetadata migreres ikke

**Status:** Accepted  
**Dato:** 2026-08-29

### Beslutning

`_server`, `_updatedAt` og `_updatedBy` fjernes ved migrering.

Historiske metadata fra gammel driftsmodell skal ikke påvirke v2-datamodellen.

---

## ADR-0020 – Seksjonstyper bruker normaliserte interne koder

**Status:** Accepted  
**Dato:** 2026-08-29

### Beslutning

Følgende migrering brukes:

|Gammel verdi|Schema v1|
|:---|:---|
|`Intro`|`intro`|
|`Vers`|`verse`|
|`Chorus`|`chorus`|
|`Bridge`|`bridge`|
|`Interlude`|`interlude`|

`label` beholdes uendret og brukes som brukerens visningstekst.

---

## ADR-0021 – Vokal/koring-visning er lokal preferanse

**Status:** Accepted  
**Dato:** 2026-08-29

### Beslutning

Appen kan tilby visning av hovedvokal, koring/harmony eller begge. Valget er lokal bruker-/enhetspreferanse og skal ikke lagres som felles sangdata.

---

## ADR-0022 – Produksjonsdata lagres ikke i kode-repositoriet

**Status:** Accepted  
**Dato:** 2026-08-29

### Beslutning

GitHub-repositoriet inneholder programkode, dokumentasjon, test-/migreringsverktøy og eventuelle syntetiske testdata. Faktiske banddata og migrerte sangfiler skal lagres i workspace hos storage-provider og ikke i kode-repositoriet.

# DECISIONS – tillegg

## ADR-0024 – `localStorage` brukes til lite workspace-register og preferanser

Status: Accepted

### Beslutning

Akkordia bruker `localStorage` til:

```text
registrerte workspace-referanser
aktiv workspaceId
små lokale UI-preferanser
```

IndexedDB brukes senere til faktisk offline-cache for sanger og set-lister.

### Begrunnelse

Dette reduserer kjørekode og holder enkel konfigurasjon adskilt fra datasett/cache.

---

## ADR-0025 – OneDrive-workspace identifiseres med `driveId` og `itemId`

Status: Accepted

### Beslutning

Akkordia skal ikke bruke lokal synkroniseringssti eller mappenavn som teknisk identitet for et OneDrive-workspace.

En provider-referanse bruker stabile Graph-ID-er.

---

## ADR-0026 – Workspace opprettes bare eksplisitt

Status: Accepted

### Beslutning

Valg av en vanlig mappe skal aldri automatisk skrive Akkordia-filer til mappen.

Brukeren må eksplisitt velge å opprette nytt workspace.

---

## ADR-0027 – Fjerne lokal workspace-kobling er ikke sletting

Status: Accepted

### Beslutning

`Fjern fra denne enheten` fjerner bare lokal registrering og cache.

Sletting av data hos storage-provider er en separat funksjon og inngår ikke i første versjon.

---

## ADR-0028 – Ingen generell lokal mappevelger som primær arkitektur

Status: Accepted

### Beslutning

Første reelle storage-provider er OneDrive via Microsoft Graph.

Akkordia skal ikke basere hovedarkitekturen på nettleserens lokale File System Access API.

### Begrunnelse

Målplattformene omfatter Mac, iPhone og iPad. En providerbasert modell gir mer konsistent flerbruker-, delings- og tilgangsadferd.

# DECISIONS – tillegg

## ADR-0029 – MSAL vendoreres som statisk tredjepartsfil

Status: Accepted

### Beslutning

Akkordia bruker en eksplisitt versjon av `@azure/msal-browser` hentet med npm og kopiert til `vendor/`.

GitHub Pages laster den lokale filen. Det brukes ikke ekstern MSAL-CDN i produksjon.

### Begrunnelse

Microsoft har avviklet CDN-distribusjon for nyere MSAL Browser-versjoner. Lokal statisk hosting gir samtidig en enkel GitHub Pages-applikasjon uten runtime-build og uten ekstra CDN-avhengighet.

---

## ADR-0030 – OneDrive milepæl 1 bruker enkel Graph-basert mappevelger

Status: Accepted

### Beslutning

Akkordia lister mapper direkte med Microsoft Graph i stedet for å introdusere en separat file-picker SDK.

### Begrunnelse

Dette krever lite kode, gir full kontroll over workspace-valideringen og kan senere utvides med delte elementer dersom behovet krever det.

# DECISIONS – Milestone 2 tillegg

## ADR-0029 – Sangbiblioteket leser individuelle JSON-filer direkte

Status: Accepted

### Beslutning

Milestone 2 lister JSON-filene i `songs/` og leser hver sangfil direkte.

Det innføres ikke `index.json`.

### Begrunnelse

Dette følger tidligere beslutning om å prioritere enkel kjørekode og eksplisitte data fremfor ekstra indeks- og synkroniseringslogikk.

---

## ADR-0030 – Ugyldig enkeltfil stopper ikke sangbiblioteket

Status: Accepted

### Beslutning

Sangfiler lastes uavhengig. En ugyldig fil rapporteres, mens øvrige gyldige sanger fortsatt vises.

---

## ADR-0031 – Akkordposisjon rendres med `ch`

Status: Accepted

### Beslutning

`chord.pos` behandles som tegnposisjon og vises i monospace-layout med CSS-enheten `ch`.

### Begrunnelse

Dette tilsvarer eksisterende datamodell og krever svært lite kjørekode.

---

## ADR-0032 – Vokal/koring-visning er lokal preferanse

Status: Accepted

### Beslutning

Valg mellom `vocal`, `harmony` og `both` lagres i `localStorage` og endrer ikke sangfilene.

# DECISIONS – tillegg for Milestone 3

## ADR-0032 – Eksplisitt lagring, ikke autosave

Status: Accepted

### Beslutning

Redigering lagres først når brukeren velger `Lagre`.

### Begrunnelse

Dette gir enklere kode, færre Graph-kall og en tydeligere konfliktmodell ved samtidig redigering.

---

## ADR-0033 – ETag brukes ved oppdatering av sang

Status: Accepted

### Beslutning

Eksisterende sangfiler lagres med `If-Match` mot ETag som ble lest sammen med filen.

### Begrunnelse

Akkordia skal ikke stille overskrive endringer gjort av en annen bruker.

---

## ADR-0034 – Sangfilnavn følger stabil sang-ID

Status: Accepted

### Beslutning

Nye filer får filnavn:

```text
<song-id>.json
```

Sangtittel brukes ikke som filnavn.

### Begrunnelse

Tittel kan endres uten rename-operasjon, og filreferansen forblir stabil.

---

## ADR-0035 – Første editor er strukturert, ikke grafisk

Status: Accepted

### Beslutning

Milestone 3 redigerer akkordposisjon eksplisitt som tegnposisjon.

Grafisk plassering av akkorder direkte over tekst er utsatt.

### Begrunnelse

Første mål er korrekt og stabil skriving av hele Song schema v1 med minst mulig kjørekode. UI-et kan forbedres senere uten dataformatendring.

---

## ADR-0036 – Sletting av sang utsettes

Status: Accepted

### Beslutning

Milestone 3 kan opprette og endre sanger, men ikke slette dem.

### Begrunnelse

Sletting er en destruktiv operasjon og bør få egen UX og testmodell.

# DECISIONS – tillegg Milestone 4

## ADR-0032 – Visuell akkordplassering bruker eksisterende `chord.pos`

Status: Accepted

### Beslutning

Dra-og-slipp skal ikke introdusere en egen pikselposisjon eller separat layoutmodell.

Når en akkord slippes, konverteres pekerposisjonen direkte til nærmeste heltallsbaserte tegnposisjon og lagres i eksisterende `chord.pos`.

### Begrunnelse

Dette bevarer Song schema v1 og gjør vanlig visning, visuell redigering og numerisk finjustering til tre grensesnitt mot samme data.

---

## ADR-0033 – Dra og numerisk finjustering skal eksistere samtidig

Status: Accepted

### Beslutning

Dra-og-slipp er primær metode for rask plassering.

Valgt akkord kan i tillegg finjusteres med:

```text
numerisk posisjonsfelt
− ett tegn
+ ett tegn
```

### Begrunnelse

Visuell plassering er rask, mens heltallsposisjon gir presis kontroll uten mer data- eller synkroniseringslogikk.

---

## ADR-0034 – Pointer Events brukes for visuell akkordflytting

Status: Accepted

### Beslutning

Editoren bruker Pointer Events (`pointerdown`, `pointermove`, `pointerup`) i stedet for å basere seg på klassisk HTML5 drag-and-drop.

### Begrunnelse

Akkordia skal brukes med mus/trackpad på Mac og touch på iPhone/iPad/Android. Én pekerbasert implementasjon reduserer plattformspesifikk kode.

---

## ADR-0035 – Akkordpaletten er avledet direkte fra `chordSet`

Status: Accepted

### Beslutning

Den visuelle akkordpaletten rendres direkte fra sangens eksplisitte `chordSet`.

Paletten har ikke egen lagringsmodell.

### Begrunnelse

`chordSet` er allerede autoritativt sangdata. En separat palettmodell ville introdusert unødvendig kode og risiko for inkonsistens.

# DECISIONS – tillegg Milestone 5

## ADR-0037 – Setlist schema v1 beholdes uendret

Status: Accepted

### Beslutning

Set-lister lagres fortsatt som:

```text
schemaVersion
id
name
songs[]
```

Milestone 5 legger ikke til entry-ID-er, dato, type eller annen metadata.

---

## ADR-0038 – Midlertidige entry-nøkler brukes bare i editoren

Status: Accepted

### Beslutning

Editoren kan opprette en midlertidig lokal nøkkel for hver rad mens set-listen redigeres.

Disse nøklene brukes bare for UI, spesielt når samme sang forekommer flere ganger.

Ved lagring serialiseres kun sang-ID-ene tilbake til `songs[]`.

### Begrunnelse

Dette gir enkel dra-/flyttelogikk uten å komplisere det permanente dataformatet.

---

## ADR-0039 – Manglende sangreferanser bevares

Status: Accepted

### Beslutning

Hvis en set-list refererer til en sang-ID som ikke finnes i det lastede sangbiblioteket, markeres referansen som manglende i UI.

Akkordia skal ikke automatisk fjerne referansen.

### Begrunnelse

En manglende eller midlertidig utilgjengelig sangfil skal ikke føre til stille endring eller datatap i set-listen.

---

## ADR-0040 – Set-lister bruker samme optimistic concurrency-modell som sanger

Status: Accepted

### Beslutning

Eksisterende set-listfiler lagres med OneDrive `eTag` og `If-Match`.

HTTP 412 behandles som redigeringskonflikt og skal ikke overskrives automatisk.

---

## ADR-0041 – Sist valgte set-liste er lokal preferanse

Status: Accepted

### Beslutning

Sist valgte set-list lagres lokalt per `workspaceId`.

Dette feltet lagres ikke i `akkordia.json` eller set-listfilen.

# DECISIONS-ADDENDUM-M5.1

## Setlist schema v2

Set-lister bruker én ordnet `items`-liste med to posttyper:

```text
song
part
```

Deler er markører i samme sekvens som sangene, ikke separate nestede sanglister.

## Delnavn

Delnavn er fritekst. UI kan foreslå vanlige navn som `Sett 1`, `Sett 2` og `Encore`, men schemaet har ingen fast enum.

## Kompatibilitet

Schema v1 støttes ved lesing og normaliseres i minnet til v2. Migrering til v2 skjer først ved eksplisitt lagring.

## Identitet

Det innføres ikke permanente entry-ID-er. Midlertidige UI-nøkler brukes fortsatt bare under redigering og lagres ikke i JSON.

---

## ADR-0042 – Set-lister bruker cache-first med bakgrunnsrevalidering

Status: Accepted

### Beslutning

Når lokal set-listcache finnes skal Akkordia vise RAM/IndexedDB-data før full OneDrive-lesing er ferdig. OneDrive er fortsatt autoritativ kilde og revalideres i bakgrunnen.

Cachet fellesdata er midlertidig read-only inntil revalidering lykkes. Etter vellykket kontroll regnes set-listene som ferske for gjeldende app-økt. Eksplisitt Oppdater fremtvinger ny OneDrive-lesing.

### Begrunnelse

Set-listlasting består av kataloglisting og én Graph-lesing per JSON-fil og har merkbar ventetid. IndexedDB inneholder allerede komplett datasett for offline-bruk. Cache-first gir derfor offline-lignende responstid uten å introdusere en egen manuell Offline-mode eller endre autoritativ lagring.

---

## ADR-0043 – Transponering er avledet visning, ikke omskriving av akkorddata

Status: Accepted

### Beslutning

Lagrede akkordnavn beholdes uendret. Ved visning beregnes effektiv transpose som `song.transpose + section.transpose`, og akkordnavn transponeres i en felles ren funksjon som brukes både i Sanger og Spill.

Rotnote og eventuell slash-bass transponeres. Akkordkvalitet/suffiks beholdes. Ukjente symboler beholdes uendret.

### Begrunnelse

Dette gjør transpose reversibelt uten datamigrering eller gjentatt omskriving av sangfilene. Samme sangdata kan vises i annen toneart uten å miste original akkordtekst, og seksjonsvise avvik kan kombineres med sangens globale transpose.
