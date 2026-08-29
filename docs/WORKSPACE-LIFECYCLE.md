# WORKSPACE-LIFECYCLE

## Formål

Dette dokumentet beskriver hvordan Akkordia v2 skal opprette, åpne, huske, bytte og fjerne tilkoblingen til workspaces.

Ett workspace tilsvarer normalt ett band.

Eksempel:

```text
Akkordia-data/
├── BoM/
│   ├── akkordia.json
│   ├── songs/
│   └── setlists/
└── Et annet band/
    ├── akkordia.json
    ├── songs/
    └── setlists/
```

## Prinsipp

Akkordia skal skille mellom:

```text
workspace-data
```

og:

```text
lokal kobling til workspace
```

Å fjerne et workspace fra Akkordia på en enhet skal derfor ikke slette workspace-data fra OneDrive.

## Workspace-identitet

En workspace-kobling skal ikke identifiseres ved lokal filsti eller visningsnavn.

For OneDrive skal appen lagre stabile Microsoft Graph-identifikatorer:

```json
{
  "provider": "onedrive",
  "driveId": "...",
  "itemId": "..."
}
```

`name` kan caches lokalt for visning, men `workspaceId` i `akkordia.json` er Akkordias egen stabile identitet.

## Lokal workspace-register

Den lokale appen trenger bare en liten oversikt over tilkoblede workspaces.

Eksempel:

```json
[
  {
    "workspaceId": "...",
    "name": "BoM",
    "provider": "onedrive",
    "driveId": "...",
    "itemId": "..."
  }
]
```

Denne listen lagres i `localStorage`.

### Begrunnelse

Registeret er:

- lite
- enkelt
- ikke selve offline-datasettet
- enkelt å gjenoppbygge ved å koble til workspace på nytt

IndexedDB reserveres til sang- og setlist-cache.

## Første oppstart

Hvis ingen workspaces er registrert lokalt:

```text
Start Akkordia
↓
vis velkomst
↓
"Koble til eksisterende band"
eller
"Opprett nytt band"
```

Appen skal ikke kreve at brukeren først oppretter en Akkordia-konto.

Microsoft-innlogging skjer bare når storage-provideren trenger tilgang.

## Koble til eksisterende workspace

For OneDrive:

```text
Velg "Koble til eksisterende band"
↓
logg inn hos Microsoft ved behov
↓
velg/mappe-naviger til workspace
↓
les akkordia.json
↓
valider format og schema
↓
kontroller songs/
↓
kontroller setlists/
↓
registrer workspace lokalt
↓
åpne workspace
```

Hvis `akkordia.json` mangler, skal appen ikke anta at katalogen er et workspace.

Brukeren kan i stedet tilbys å opprette et nytt workspace i den valgte katalogen.

## Opprette nytt workspace

```text
Velg "Opprett nytt band"
↓
logg inn hos storage-provider ved behov
↓
velg plassering
↓
oppgi bandnavn
↓
opprett ny underkatalog ved behov
↓
generer workspaceId
↓
opprett akkordia.json
↓
opprett songs/
↓
opprett setlists/
↓
les tilbake og valider
↓
registrer workspace lokalt
↓
åpne workspace
```

Oppretting skal være eksplisitt.

Akkordia skal aldri skrive `akkordia.json`, `songs/` eller `setlists/` i en tilfeldig mappe bare fordi brukeren har valgt den.

## Feil mappe

Hvis valgt mappe ikke er et Akkordia-workspace:

```text
Denne mappen er ikke et Akkordia-band.
```

Brukeren får to relevante valg:

```text
Velg en annen mappe
Opprett nytt band her
```

Opprettingsvalget skal kreve en eksplisitt bekreftelse.

## Bytte workspace

Når flere workspaces er registrert lokalt, skal aktivt workspace være tydelig synlig i toppområdet.

Eksempel:

```text
Akkordia        BoM ▾
```

Valg av `BoM ▾` åpner en enkel workspace-meny:

```text
BoM
Band B
Band C

+ Koble til band
+ Opprett nytt band
```

Bytte av workspace skal:

```text
avslutte eventuell Spill-modus
↓
lagre lokal preferanse for aktivt workspace
↓
åpne cache for valgt workspace
↓
synkronisere mot provider når nett er tilgjengelig
```

## Fjerne lokal kobling

Workspace-menyen skal senere tilby:

```text
Fjern fra denne enheten
```

Dette skal:

- fjerne workspace fra lokal workspace-liste
- fjerne lokal cache for workspacet etter bekreftelse
- ikke slette noe fra OneDrive

Teksten skal gjøre dette tydelig.

## Sletting av workspace

Sletting av selve workspace-dataene er en annen og langt mer destruktiv operasjon.

Denne funksjonen inngår ikke i første versjon.

Hvis funksjonen senere innføres, skal den behandles separat fra `Fjern fra denne enheten`.

## Offline

Når et tidligere registrert workspace åpnes uten nett:

```text
lokalt workspace-register
↓
lokal sang-/setlist-cache
↓
Akkordia åpnes i offline lesemodus
```

Storage-provider skal ikke være nødvendig for å lese allerede cachede sanger.

## Aktivt workspace

Sist aktive workspace lagres lokalt som `workspaceId`.

Det skal ikke lagres i `akkordia.json`, fordi ulike bandmedlemmer kan ha forskjellige aktive workspaces.

## Security boundary

Akkordia skal bare sende filoperasjoner til det workspacet brukeren faktisk har koblet til.

Selv om Microsoft Graph-tillatelsen teknisk kan gi appen tilgang til flere av brukerens filer, skal Akkordias egen storage-kode begrense operasjonene til registrert `driveId` og workspace-`itemId`.

Dette er en applikasjonsregel og ikke en erstatning for Microsofts tilgangskontroll.
