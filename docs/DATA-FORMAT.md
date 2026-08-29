# Akkordia v2 – dataformat

**Status:** Foreløpig schema  
**Dato:** 2026-08-29

Formatet skal stabiliseres og valideres før produksjonsdata skrives av v2.

## 1. Workspace-struktur

```text
<workspace>/
├── akkordia.json
├── songs/
│   └── <song-id>.json
└── setlists/
    └── <setlist-id>.json
```

## 2. `akkordia.json`

Foreløpig:

```json
{
  "format": "akkordia-workspace",
  "schemaVersion": 1,
  "workspaceId": "550e8400-e29b-41d4-a716-446655440000",
  "name": "The Tumbleweeds",
  "created": "2026-08-29T18:00:00Z",
  "modified": "2026-08-29T18:00:00Z"
}
```

|Felt|Type|Krav|
|:---|:---|:---|
|`format`|string|Må være `akkordia-workspace`|
|`schemaVersion`|integer|Starter på `1`|
|`workspaceId`|string|Stabil unik ID|
|`name`|string|Visningsnavn for band/område|
|`created`|ISO 8601|string i UTC anbefales|
|`modified`|ISO 8601|string i UTC anbefales|

## 3. Sangfil

Eksisterende sangmodell beholdes så langt praktisk mulig.

Foreløpig eksempel:

```json
{
  "schemaVersion": 1,
  "id": "song_95788c4c51b2_19bd532ad59",
  "title": "O Children",
  "chordSet": [],
  "transpose": 0,
  "playback": {
    "bpm": 100,
    "beatsPerLine": 4
  },
  "sections": []
}
```

Eksakt struktur for `chordSet`, `sections`, `lines` og akkordposisjoner skal utledes fra eksisterende eksport og dokumenteres før migreringsscriptet låses.

### 3.1 Felt som ikke skal migreres direkte

Gamle server-/synkroniseringsfelt skal ikke beholdes bare av historiske årsaker, eksempelvis:

```text
_server
_updatedAt
_updatedBy
```

Dersom noen av disse viser seg å ha funksjonell verdi skal dette vurderes eksplisitt før de eventuelt erstattes av nye felt.

## 4. Transponering

`transpose` på sangnivå er felles banddata.

Seksjoner kan også ha egen `transpose` dersom eksisterende modell krever dette.

Personlig transponering lagres ikke i v1-formatet.

## 5. Playback

BPM er felles sangdata.

`beatsPerLine` eller tilsvarende felt beholdes dersom dette er modellen som brukes for å beregne autoscroll.

Autoscrollens midlertidige posisjon, pause-/play-status eller UI-posisjon skal ikke lagres permanent i sangfilen.

## 6. Set-list

Foreløpig format:

```json
{
  "schemaVersion": 1,
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "Folken 14. september",
  "songs": [
    "song-a",
    "song-b",
    "song-a"
  ]
}
```

|Felt|Type|Krav|
|:---|:---|:---|
|`schemaVersion`|integer|Starter på `1`|
|`id`|string|Stabil unik set-list-ID|
|`name`|string|Visningsnavn|
|`songs`|array|string-ID-er i eksplisitt rekkefølge|

Duplikate sang-ID-er er tillatt og meningsfulle.

Fritekstposter inngår ikke i første format.

## 7. Filnavn

Sangfil:

```text
songs/<song-id>.json
```

Set-listfil:

```text
setlists/<setlist-id>.json
```

ID skal være stabil. Tittel/navn skal ikke brukes som primær filidentitet fordi titler kan endres og kan inneholde tegn som gir provider-spesifikke problemer.

## 8. Schema-versjonering

Hver permanent datafil skal inneholde `schemaVersion`.

Ved senere schemaendring skal migrering være eksplisitt og testbar. Appen skal ikke stille endre ukjent schema uten kontroll.

## 9. Private notater

Ikke definert i schema v1 ennå.

Status: Deferred.
