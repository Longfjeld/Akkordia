# Akkordia v2 – dataformat

**Status:** Song schema v1 fastsatt  
**Dato:** 2026-08-29

## 1. Prinsipper

Dataformatet skal først og fremst gjøre applikasjonskoden enkel, tydelig og robust. JSON-filene er data, ikke programkode, og trenger derfor ikke minimeres dersom eksplisitte datafelt reduserer behovet for beregning eller særlogikk i appen.

Permanent brukerdata skal være forståelig og migrerbart uten avhengighet til gammel Akkordia-server.

## 2. Workspace-struktur

```text
<workspace>/
├── akkordia.json
├── songs/
│   └── <song-id>.json
└── setlists/
    └── <setlist-id>.json
```

Produksjonsdata for band skal ligge i workspace hos storage-provider, ikke i GitHub-repositoriet med programkoden.

## 3. `akkordia.json`

Foreløpig workspace-format:

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
|`created`|ISO 8601|Opprettelsestidspunkt|
|`modified`|ISO 8601|Siste endring av workspace-metadata|

Workspace-formatet er ikke endelig låst i Fase 1. Song schema v1 er låst.

## 4. Song schema v1

Hver sang lagres som egen fil:

```text
songs/<song-id>.json
```

Eksempel:

```json
{
  "schemaVersion": 1,
  "id": "song_95788c4c51b2_19bd532ad59",
  "title": "O Children",
  "chordSet": [
    "Em",
    "C",
    "Am",
    "G",
    "D",
    "Cmaj7"
  ],
  "transpose": 0,
  "playback": {
    "bpm": 60,
    "beatsPerLine": 4
  },
  "sections": []
}
```

`playback` er valgfritt. Appen kan bruke standardverdier dersom feltet mangler. Nye og redigerte sanger kan få eksplisitt `playback` når brukeren setter BPM/autoscroll-data.

|Felt|Type|Krav|
|:---|:---|:---|
|`schemaVersion`|integer|Obligatorisk, verdi `1`|
|`id`|string|Obligatorisk stabil sang-ID|
|`title`|string|Obligatorisk|
|`chordSet`|array|Obligatorisk liste over sangens akkordpalett|
|`transpose`|number|Felles transponering for hele sangen|
|`playback`|object|Valgfritt|
|`sections`|array|Obligatorisk|

### 4.1 Playback

Når feltet finnes:

```json
{
  "bpm": 90,
  "beatsPerLine": 4
}
```

|Felt|Type|Betydning|
|:---|:---|:---|
|`bpm`|number|Felles BPM for sangen|
|`beatsPerLine`|number|Antall beats som brukes per sanglinje ved autoscroll|

Fravær av `playback` er gyldig schema v1 og skal ikke fylles automatisk ved migrering.

## 5. Seksjoner

Eksempel:

```json
{
  "id": "sec_d81fe2267deb3_19bd70cb924",
  "type": "verse",
  "label": "Vers 1",
  "transpose": 0,
  "lines": []
}
```

Interne seksjonstyper i schema v1:

|Type|Betydning|
|:---|:---|
|`intro`|Intro|
|`verse`|Vers|
|`chorus`|Refreng/chorus|
|`bridge`|Bridge|
|`interlude`|Interlude/mellomspill|

`type` er en intern kode. `label` er brukerens visningstekst og beholdes uendret.

Seksjonsnivået har egen `transpose`. Effektiv transponering kan dermed beregnes fra sangens felles `transpose` og seksjonens `transpose`.

## 6. Linjer

Hver sanglinje har følgende struktur:

```json
{
  "vocal": "Pass me that lovely little gun",
  "harmony": "",
  "chords": []
}
```

|Felt|Type|Krav|
|:---|:---|:---|
|`vocal`|string|Hovedvokal/tekst, tom streng tillatt|
|`harmony`|string|Koring/harmony, tom streng tillatt|
|`chords`|array|Plasserte akkorder, tom array tillatt|

Vokal/koring-visning er en lokal UI-preferanse og lagres ikke i sangfilen.

## 7. Akkorder

Plassert akkord:

```json
{
  "id": "ch_721f96cc51bc2_19bd7ef3e2b",
  "name": "Em",
  "pos": 0
}
```

|Felt|Type|Betydning|
|:---|:---|:---|
|`id`|string|Stabil ID for akkordforekomsten|
|`name`|string|Akkordnavn|
|`pos`|number|Tegn-/kolonneposisjon på sanglinjen|

`chordSet` skal ikke beregnes automatisk bare fra plasserte akkorder. Eksisterende data viser at akkordsettet kan inneholde akkorder som ennå ikke er plassert i sangen.

## 8. Metadata fra gammel løsning

Følgende felt migreres ikke:

```text
_server
_updatedAt
_updatedBy
```

Storage-providerens filmetadata brukes senere for lagringsrelatert versjons- og endringsinformasjon.

## 9. ID-er

Eksisterende sang-, seksjons- og akkord-ID-er beholdes ved migrering.

Nye objekter som opprettes direkte i Akkordia v2 kan bruke en ny ID-generator, men appen må støtte eksisterende ID-er uten konvertering.

## 10. Set-list schema v1

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
|`songs`|array|Sang-ID-er i eksplisitt rekkefølge|

Samme sang-ID kan forekomme flere ganger i samme set-list. Spill-modus må derfor navigere etter posisjon i set-listen og ikke anta at sang-ID er unik i listen.

Fritekstposter inngår ikke i set-list-formatet.

## 11. Schema-versjonering

Permanente datafiler skal ha `schemaVersion` der formatet er versjonert av Akkordia.

Ukjent schema-versjon skal ikke endres eller overskrives stille. Eventuelle senere schemaendringer skal ha eksplisitt og testbar migrering.

## 12. Private notater

Ikke definert i schema v1.

Status: Deferred.
