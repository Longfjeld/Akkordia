# DATA-FORMAT

## Formål

Dette dokumentet beskriver dataformatene for Akkordia v2.

Målet er ikke minst mulig datamengde. Målet er en enkel, eksplisitt og forutsigbar datamodell som krever minst mulig kjørekode.

## Workspace-format

Et workspace representerer ett band eller ett separat samarbeidsområde.

Workspace-roten skal inneholde:

```text
<workspace>/
├── akkordia.json
├── songs/
└── setlists/
```

### `akkordia.json`

Eksempel:

```json
{
  "format": "akkordia-workspace",
  "schemaVersion": 1,
  "workspaceId": "9cfc64f0-7c47-41f4-8781-b09d3ff98d2e",
  "name": "BoM"
}
```

|Felt|Type|Påkrevd|Beskrivelse|
|:---|:---|:---|:---|
|`format`|string|Ja|Fast verdi `akkordia-workspace`|
|`schemaVersion`|number|Ja|Workspace-schema. Første versjon er `1`|
|`workspaceId`|string|Ja|Stabil UUID som ikke endres ved navneendring|
|`name`|string|Ja|Visningsnavn for band/workspace|

Workspace-ID skal være stabil. `name` kan endres senere uten å påvirke referanser.

Det skal ikke lagres aktiv set-list, sist brukte visning eller andre brukerpreferanser i `akkordia.json`.

## Sangfiler

Sanger lagres som én JSON-fil per sang i:

```text
songs/
```

Song schema v1 følger tidligere dokumentert modell.

`playback` er valgfritt. Dersom feltet mangler, bruker applikasjonen standardverdier ved kjøring.

Historisk servermetadata migreres ikke.

## Setlist schema v2

Hver set-list lagres som én JSON-fil i:

```text
setlists/
```

Schema v2 erstatter den flate `songs`-listen med én ordnet `items`-liste. Listen kan inneholde både sanger og delmarkører.

Eksempel:

```json
{
  "schemaVersion": 2,
  "id": "e03552b5-66e7-4eb7-8f2d-0c06bd88767d",
  "name": "Eksempel set-liste",
  "items": [
    {"type": "part", "name": "Sett 1"},
    {"type": "song", "songId": "song_example_a"},
    {"type": "song", "songId": "song_example_b"},
    {"type": "part", "name": "Encore"},
    {"type": "song", "songId": "song_example_a"}
  ]
}
```

|Felt|Type|Påkrevd|Beskrivelse|
|:---|:---|:---|:---|
|`schemaVersion`|number|Ja|Setlist-schema. Gjeldende versjon er `2`|
|`id`|string|Ja|Stabil UUID for set-listen|
|`name`|string|Ja|Fritt navn valgt av bruker|
|`items`|array[object]|Ja|Ordnet liste med sanger og deler|

Sangpost:

```json
{"type": "song", "songId": "song_a"}
```

Delpost:

```json
{"type": "part", "name": "Sett 1"}
```

Delnavn er fritekst. `Sett 1`, `Sett 2` og `Encore` er vanlige eksempler, men schemaet begrenser ikke antall eller navn.

Samme sang-ID kan forekomme flere ganger. Det brukes ikke permanente entry-ID-er. Rekkefølgen i `items` er set-listens rekkefølge.

Setlist schema v1 leses fortsatt. Ved lasting normaliseres en v1-fil i minnet til v2 ved å gjøre hver `songs[]`-referanse om til en `song`-post. Første lagring skriver filen som schema v2. Ingen automatisk skylagring skjer bare fordi en v1-fil leses.

Private notater inngår ikke i Setlist schema v2.

## Lokale brukerpreferanser

Følgende skal lagres lokalt på enheten og ikke i workspace-data:

|Preferanse|Lagring|
|:---|:---|
|Sist brukte workspace|IndexedDB eller tilsvarende lokal lagring|
|Sist brukte set-list|Lokal lagring|
|Vokal/koring-visning|Lokal lagring|
|Fontstørrelse|Lokal lagring|

Dette gjør at ulike bandmedlemmer kan bruke samme workspace uten å påvirke hverandres personlige visning.

## Validering av workspace

En katalog regnes som et gyldig Akkordia-workspace når:

1. `akkordia.json` finnes i katalogroten.
2. JSON-filen kan parses.
3. `format` er `akkordia-workspace`.
4. `schemaVersion` er støttet.
5. `workspaceId` finnes og er gyldig UUID.
6. `name` er en ikke-tom streng.
7. `songs/` finnes.
8. `setlists/` finnes.

Hvis brukeren velger en annen mappe, skal appen ikke skrive data dit før brukeren uttrykkelig oppretter et nytt workspace.

## Oppretting av workspace i appen

Når funksjonen implementeres skal appen:

```text
Velg mappe
↓
kontroller om akkordia.json finnes
↓
hvis ja: tilby å åpne eksisterende workspace
↓
hvis nei: tilby "Opprett nytt Akkordia-workspace"
↓
be om navn
↓
generer workspaceId
↓
opprett akkordia.json
opprett songs/
opprett setlists/
↓
valider resultatet
```

Appen skal aldri automatisk gjøre en tilfeldig valgt katalog til et workspace uten eksplisitt brukerhandling.
