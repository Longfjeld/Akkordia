# Akkordia v2 – arkitektur

**Status:** Første utkast  
**Dato:** 2026-08-29

## 1. Arkitekturmål

Arkitekturen skal minimere antall komponenter som må fungere for at et bandmedlem skal kunne åpne og bruke sanger og set-lister.

```text
GitHub Pages
    │
    ▼
Akkordia PWA
    │
    ├── UI / domenelogikk
    ├── IndexedDB cache
    ├── Service Worker
    └── StorageProvider
             │
             └── OneDriveStorage
                     │
                     ▼
                  OneDrive
```

## 2. Komponenter

|Komponent|Ansvar|
|:---|:---|
|`app.js`|Oppstart, navigasjon og overordnet tilstand|
|`chords.js`|Ren akkord-/transponeringslogikk for visning|
|`songs.js`|Sangmodell, visning og redigering|
|`setlists.js`|Set-list-modell og redigering|
|`player.js`|Spill-modus, navigasjon, autoscroll og Wake Lock|
|`storage.js`|Provider-kontrakt og provider-uavhengige operasjoner|
|`onedrive.js`|Microsoft-innlogging og OneDrive/Graph-spesifikk lagring|
|`cache.js`|IndexedDB og offline-cache|
|`strings.js`|Brukertekster og enkel språktilrettelegging|
|`sw.js`|PWA app-shell-cache og statiske ressurser|

Filnavnene er foreløpige. Ansvarsdelingen er viktigere enn eksakt navn.

## 3. StorageProvider

Resten av appen skal ikke vite hvordan OneDrive-URL-er eller Graph-endepunkter bygges.

Konseptuell kontrakt:

```javascript
connect()
disconnect()
list(path)
read(path)
create(path, data)
write(path, data, expectedVersion)
delete(path)
getMetadata(path)
```

Et `read()`-resultat bør minst kunne gi:

```text
data
version/etag
modified
```

Et `write()`-kall skal kunne feile eksplisitt med en konfliktstatus når `expectedVersion` ikke lenger er gjeldende.

## 4. Workspace

Aktivt workspace er den sentrale konteksten i appen.

Lokal informasjon om et kjent workspace bør minst inneholde:

```text
workspaceId
name
provider
providerLocator
lastOpened
```

`providerLocator` skal være provider-spesifikk og ikke spre seg inn i sang-/set-listkode.

## 5. Dataflyt ved lesing

```text
Bruker åpner band
       │
       ▼
IndexedDB har cache?
   │           │
  ja          nei
   │           │
   ▼           │
vis cache      │
   │           │
   └─────┬─────┘
         ▼
nett/innlogging tilgjengelig?
         │
       ja│
         ▼
StorageProvider
         │
         ▼
oppdater endrede objekter
         │
         ▼
IndexedDB
         │
         ▼
UI oppdateres
```

Manglende nett skal ikke blokkere tidligere synkronisert innhold.

For set-lister brukes cache-first i normal online-bruk: RAM/IndexedDB kan rendres før OneDrive-revalidering er ferdig. Cachet fellesdata behandles som midlertidig read-only inntil ferske OneDrive-objekter med item-referanse og `eTag` er lastet. En vellykket revalidering markeres som fersk for gjeldende app-økt, slik at vanlig navigasjon ikke starter en ny full Graph-lesing. Eksplisitt Oppdater fremtvinger fortsatt revalidering.

## 6. Dataflyt ved skriving

```text
Les objekt
   │
   ├── data
   └── version X
        │
        ▼
     rediger
        │
        ▼
write(data, expectedVersion=X)
        │
        ├── OK → ny version → cache → UI
        │
        └── konflikt → behold lokal arbeidskopi → informer bruker
```

## 7. UI-moduser

Appen skal ha tydelig avgrensede hovedmoduser.

|Modus|Primært ansvar|
|:---|:---|
|Sanger|Bibliotek, visning og vei inn til redigering|
|Set-lister|Opprette og organisere spillelister|
|Spill|Konsert-/øvingsvisning med minst mulig UI-støy|

Redigering kan være en under-/detailtilstand av Sanger, men skal ikke blandes inn i Spill.

## 8. Spill-modus

Spill-modus skal kunne startes fra:

- en set-list
- eventuelt en enkelt sang

Ved set-list skal følgende tilstand være tilgjengelig:

```text
setlistId
currentEntryIndex
songId
scroll/playback state
wakeLock state
```

Samme `songId` kan forekomme på flere indekser. Navigasjon skal derfor alltid baseres på set-listposisjon, ikke unik sang-ID.

## 8.1 Transponering

Transponering er en ren visningsoperasjon. Lagrede akkordnavn i sang-JSON endres ikke når `transpose` endres.

Effektiv transponering for en seksjon beregnes som:

```text
song.transpose + section.transpose
```

`chords.js` transponerer rottonen og eventuell slash-bass. Akkordkvalitet/suffiks beholdes uendret. Eksempel:

```text
Cmaj7   +2 → Dmaj7
F#m     +2 → G#m
C/G     +2 → D/A
```

Vanlig sangvisning og Spill-modus skal bruke samme funksjon. Editor viser og lagrer original akkordtekst og transpose-verdier; den omskriver ikke akkorddata. Ukjente symboler som ikke kan tolkes som et akkordnavn beholdes uendret.

## 8.2 Visuell BPM-puls

I Spill-modus er BPM-pulsen en visningsfunksjon, ikke sangdata. Den eksisterende beat-klokken bestemmer tidspunktet for hvert slag, mens den visuelle animasjonen har fast varighet på omtrent 300 ms uavhengig av BPM. Både BPM-prikken og viewport-kanten bruker samme beat-hendelse.

Spill-flaten bruker en svak nøytral grå bakgrunn for å gi bedre kontrast til den blå/cyane beat-kanten. Selve kanten fanger ikke peker-/touch-hendelser.

## 9. Autoscroll

Autoscroll skal være deterministisk basert på felles sangdata, primært BPM og sangens linje-/beatmodell.

UI skal tydelig indikere aktuell posisjon i sangen.

Pause/fortsett er lokal kjøretidstilstand og skal ikke endre sangfilen.

## 10. Wake Lock

`player.js` eier Wake Lock-livssyklusen.

Ved `visibilitychange` skal Spill-modus forsøke å gjenopprette låsen dersom:

- Spill-modus fortsatt er aktiv
- dokumentet igjen er synlig
- API-et er tilgjengelig

Feil i Wake Lock skal ikke krasje Spill-modus.

Visuell BPM-puls bruker en fast ca. 300 ms markering uavhengig av BPM. BPM bestemmer tidspunktet for slagene. Spill-kanten kan bruke en statisk flerfarget gradient der bare intensitet/glow pulserer; dette skal ikke påvirke innhold eller touch.

### 10.1 Visuell BPM-puls

Spill-modus bruker én BPM-klokke for visuelle beat-signaler. Når visuell puls er aktiv, kan samme beat-hendelse drive både den kompakte BPM-indikatoren og en subtil viewport-kant. Det skal ikke opprettes parallelle timere for de to visningene.

Kanten er ren UI-tilstand, lagres ikke i sangdata og skal ikke fange peker-/touch-hendelser.

## 11. Offline

Service Worker brukes til statiske appressurser.

IndexedDB brukes til:

- workspace-liste
- cachede sangobjekter
- cachede set-lister
- versjonsmetadata
- lokale preferanser

Sensitive tokens skal ikke behandles som ordinær persistent appdata uten at autentiseringsbibliotekets anbefalte modell tilsier dette.

Private notater er et bevisst unntak fra kravet om aktiv online-identitet: sist brukte stabile Microsoft-konto-ID kan huskes lokalt for å velge riktig konto-/workspace-isolerte IndexedDB-cache på personlige enheter. Dette gir ingen ekstern tilgang; OneDrive-synk krever fortsatt aktiv Microsoft-innlogging.

Private notater er et bevisst unntak fra regelen om ingen offline-skriving av fellesdata: de er personlige data med egen konto-/workspace-isolert IndexedDB-arbeidskopi. Ved oppstart skal denne state lastes før sanginnhold rendres, slik at notater er tilgjengelige også etter en ren offline-oppstart.

## 12. Feilmodell

Storage-laget bør normalisere feil til et lite sett appen forstår:

```text
AUTH_REQUIRED
ACCESS_DENIED
NOT_FOUND
CONFLICT
OFFLINE
INVALID_WORKSPACE
PROVIDER_ERROR
```

UI skal vise brukerorienterte meldinger og ikke rå Graph-/HTTP-feil når dette kan unngås.

## 13. Enkelhet som arkitekturregel

Ny abstraksjon skal bare innføres når den:

- fjerner reell duplisering
- isolerer en ekstern avhengighet
- gjør testing vesentlig enklere
- eller hindrer at provider-/infrastrukturkode lekker inn i domenelogikken

Ellers foretrekkes direkte og lesbar kode.
