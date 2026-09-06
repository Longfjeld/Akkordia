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

## 11. Offline

Service Worker brukes til statiske appressurser.

IndexedDB brukes til:

- workspace-liste
- cachede sangobjekter
- cachede set-lister
- versjonsmetadata
- lokale preferanser

Sensitive tokens skal ikke behandles som ordinær persistent appdata uten at autentiseringsbibliotekets anbefalte modell tilsier dette.

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
