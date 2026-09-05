# ONEDRIVE-MILESTONE-2

## Mål

Milestone 2 skal bevise at Akkordia kan lese de migrerte Song schema v1-filene direkte fra et valgt OneDrive-workspace og vise dem korrekt nok til videre funksjonsutvikling.

Denne milepælen er bevisst skrivebeskyttet.

## Omfang

```text
Aktivt workspace
↓
OneDrive / songs/
↓
list JSON files
↓
read + validate each song
↓
alphabetical song library
↓
select song
↓
render sections, chords, vocal and harmony
```

## Ikke med i denne milepælen

```text
redigering
lagring
transpose i UI
autoscroll
set-lister
Spill-modus
offline-cache
oppretting av nye sanger
```

## Feilhåndtering

En ugyldig sangfil skal ikke stoppe resten av biblioteket.

Dersom én fil feiler:

- gyldige sanger vises fortsatt
- status viser hvor mange filer som feilet
- detaljer skrives til browser console

Dette gjør det mulig å rydde en enkelt datafil uten at hele bandets bibliotek blir utilgjengelig.

## Visningspreferanse

`Vokal + koring`, `Vokal` eller `Koring` lagres lokalt som en enkel preferanse i `localStorage`.

Preferansen endrer ikke sangdata.

## Akkordplassering

`chord.pos` tolkes som tegnposisjon.

Renderer bruker monospace-font og plasserer akkorden med:

```text
left = pos × 1ch
```

Dette bevarer datamodellens tegnbaserte plassering uten å innføre måle-/layoutkode.

## Test

### Forutsetninger

- Milestone 1 er tidligere testet vellykket.
- BoM er aktivt workspace.
- `BoM/songs/` inneholder de 16 migrerte Song schema v1-filene.

### Test 1 – oppstart

1. Åpne `https://longfjeld.github.io/Akkordia/`.
2. Logg inn hvis nødvendig.
3. Kontroller at BoM er aktivt.
4. Velg `Sanger`.

Forventet:

```text
16 sanger lastet.
```

### Test 2 – sortering

Kontroller at sangtitlene vises alfabetisk.

### Test 3 – sangvisning

Åpne minst tre representative sanger:

- en sang med vokal
- en sang med koring/harmony
- en sang med flere akkorder på samme linje

Kontroller mot eksisterende data at:

- seksjonsrekkefølge stemmer
- seksjonsnavn stemmer
- vokaltekst stemmer
- koring stemmer
- akkordnavn stemmer
- akkordene visuelt følger forventet tegnposisjon

### Test 4 – lokal visningspreferanse

Bytt mellom:

```text
Vokal + koring
Vokal
Koring
```

Last siden på nytt og kontroller at valgt visning beholdes.

### Test 5 – navigasjon

Velg `Set-lister` og `Spill`.

Forventet i denne milepælen er kun status om at funksjonen kommer senere. Gå tilbake til `Sanger` og kontroller at biblioteket fortsatt fungerer.

### Test 6 – responsivt grensesnitt

Test minst:

- Mac
- iPhone eller iPad

Kontroller at bibliotek og sanginnhold er tydelig visuelt adskilt og brukbart uten horisontal scrolling av hele siden. Enkel horisontal scrolling inne i sangvisningen er akseptabel for lange akkord-/tekstlinjer.

## Godkjenningskriterium

Milestone 2 er godkjent når de 16 migrerte sangene kan åpnes fra OneDrive og representative sanger er kontrollert mot originaldata uten tap av tekst, koring, seksjoner eller akkordplassering.
