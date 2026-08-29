# Akkordia v2 – migrering av eksisterende sanger

**Status:** Fase 1 migrering implementert og validert  
**Dato:** 2026-08-29

## 1. Formål

Migreringen konverterer gammel samlet eksport `ttc_all_songs.json` til Song schema v1 med én JSON-fil per sang.

Migreringen skal endre format, ikke musikalsk innhold.

## 2. Verktøy

```text
tools/migrate-v1.mjs
tools/validate-migration.mjs
```

Begge er rene Node.js-script uten eksterne pakker.

## 3. Kjør migrering

Fra repository-roten:

```bash
mkdir -p work/migration/songs
node tools/migrate-v1.mjs /sti/til/ttc_all_songs.json work/migration/songs
```

Output blir:

```text
work/migration/songs/<song-id>.json
```

`work/` er allerede egnet som lokal arbeidskatalog og bør være ignorert av Git.

## 4. Valider migreringen

```bash
node tools/validate-migration.mjs /sti/til/ttc_all_songs.json work/migration/songs
```

For den mottatte eksporten 2026-08-29 ble følgende kontrollert:

|Objekt|Antall|
|:---|:---|
|Sanger|16|
|Seksjoner|69|
|Linjer|468|
|Plasserte akkorder|294|

Valideringen kontrollerer blant annet:

- samme sang-ID og tittel
- samme `chordSet`
- samme sangtransponering
- samme eventuelle `playback`
- samme seksjons-ID, label og transponering
- definert normalisering av seksjonstype
- samme vokaltekst og harmony
- samme akkord-ID, akkordnavn og akkordposisjon
- at `_server`, `_updatedAt` og `_updatedBy` er fjernet
- at antall outputfiler er lik antall sanger

Resultat for mottatt eksport:

```text
Songs: 16
Sections: 69
Lines: 468
Chords: 294
PASS: Migration preserves all selected musical and structural data.
```

## 5. Bevisste transformasjoner

|Gammel data|Ny data|
|:---|:---|
|Én fil med `songs[]`|Én JSON-fil per sang|
|Ingen `schemaVersion` per sang|`schemaVersion: 1`|
|`Intro`|`intro`|
|`Vers`|`verse`|
|`Chorus`|`chorus`|
|`Bridge`|`bridge`|
|`Interlude`|`interlude`|
|`_server`|Fjernes|
|`_updatedAt`|Fjernes|
|`_updatedBy`|Fjernes|

`playback` legges bare inn dersom det finnes i gammel sang.

## 6. Produksjonsdata og Git

Migrerte faktiske sanger skal ikke committes til kode-repositoriet.

Anbefalt arbeidsflyt:

```text
ttc_all_songs.json
      ↓
work/migration/songs/
      ↓
validering
      ↓
import/kopiering til valgt Akkordia-workspace
```

Senere skal selve appen kunne opprette og redigere de samme Song schema v1-filene direkte gjennom valgt StorageProvider.
