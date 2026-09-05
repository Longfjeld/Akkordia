# ONEDRIVE-MILESTONE-5

## Formål

Milestone 5 etablerer set-lister som en komplett redigerbar arbeidsflyt før Spill-modus implementeres.

Milestone omfatter:

```text
les setlists/
opprett set-liste
rediger navn
legg til sanger
samme sang flere ganger
endre rekkefølge
fjern sang fra set-listen
lagre til OneDrive
ETag-basert konfliktvern
lokal husking av sist valgte set-liste
```

Setlist schema v1 endres ikke.

## Forutsetninger

Følgende skal allerede fungere:

```text
Microsoft-innlogging
OneDrive workspace
BoM
songs/
sangbibliotek
sangredigering
setlists/-mappe
```

## Testmiljø

Primær funksjonstest gjennomføres i Safari på Mac mot:

```text
https://longfjeld.github.io/Akkordia/
```

Installert PWA på iPad testes senere sammen med øvrig PWA/offline-funksjonalitet.

## Test 1 – åpne Set-lister

1. Åpne Akkordia.
2. Kontroller at BoM er aktivt workspace.
3. Velg `Set-lister` i hovednavigasjonen.

Forventet:

```text
Set-lister-visningen åpnes.
Eksisterende JSON-filer i setlists/ listes.
Hvis katalogen er tom vises en tydelig melding.
```

## Test 2 – opprett ny set-liste

1. Velg `+ Ny set-liste`.
2. Sett navn til for eksempel:

```text
Test M5
```

3. Legg til minst tre sanger.
4. Legg samme sang til to ganger.
5. Lagre.

Forventet:

```text
Ny JSON-fil opprettes i setlists/.
Set-listen vises i venstre liste.
Samme sang kan forekomme flere ganger.
```

Kontroller gjerne filen i OneDrive. Formatet skal være:

```json
{
  "schemaVersion": 1,
  "id": "<uuid>",
  "name": "Test M5",
  "songs": [
    "song_...",
    "song_...",
    "song_..."
  ]
}
```

Det skal ikke være lagret UI-entry-ID-er eller andre nye felter.

## Test 3 – rekkefølge med knapper

1. Rediger `Test M5`.
2. Flytt en sang med `↑` eller `↓`.
3. Lagre.
4. Last siden på nytt.

Forventet:

```text
Ny rekkefølge beholdes etter reload.
```

## Test 4 – rekkefølge med dra

1. Rediger set-listen.
2. Dra en rad ved hjelp av `☰`-håndtaket til en annen plassering.
3. Lagre.
4. Last siden på nytt.

Forventet:

```text
Raden flyttes.
Rekkefølgen lagres i songs-arrayet.
```

## Test 5 – duplikater

1. Legg samme sang til minst to ganger.
2. Flytt bare den ene forekomsten.
3. Fjern bare den andre forekomsten.
4. Lagre.

Forventet:

```text
Forekomstene kan håndteres uavhengig i editoren.
JSON inneholder fortsatt bare sang-ID-er.
```

## Test 6 – åpne sang fra set-list

1. Åpne en lagret set-liste i lesemodus.
2. Klikk på en sang.

Forventet:

```text
Akkordia bytter til Sanger.
Riktig sang åpnes.
```

## Test 7 – sist valgte set-liste

1. Velg en bestemt set-liste.
2. Last siden på nytt.
3. Gå til `Set-lister`.

Forventet:

```text
Sist valgte set-liste åpnes igjen dersom den fortsatt finnes.
```

Denne preferansen skal være lokal og skal ikke endre `akkordia.json`.

## Test 8 – avbryt redigering

1. Rediger en set-liste.
2. Gjør endringer.
3. Velg `Avbryt`.

Forventet:

```text
Ingen endringer skrives til OneDrive.
Opprinnelig set-liste vises igjen.
```

## Test 9 – navigasjon med ulagrede endringer

1. Rediger en set-liste.
2. Gjør en endring uten å lagre.
3. Velg `Sanger` eller `Spill`.

Forventet:

```text
Akkordia spør om redigeringen skal avsluttes uten lagring.
```

## Test 10 – ETag-konflikt

Bruk en test-set-list.

1. Åpne samme set-list i to nettleserfaner.
2. I fane A: rediger og lagre.
3. I fane B: rediger den eldre kopien og forsøk å lagre.

Forventet:

```text
Fane B skal ikke overskrive fane A stille.
Akkordia skal stoppe lagringen og be om at set-listene lastes på nytt.
```

## Test 11 – manglende sangreferanse

Denne testen er valgfri og kan gjennomføres på en egen test-set-list.

Legg manuelt inn en ikke-eksisterende sang-ID i en set-listfil, for eksempel:

```text
song_missing_test
```

Last set-listen på nytt.

Forventet:

```text
Set-listen lastes.
Den manglende sangen markeres tydelig.
Sang-ID-en fjernes ikke automatisk.
```

Dette er bevisst for å unngå stille datatap.

## Avgrensning

Milestone 5 inneholder ikke:

```text
Spill-modus
Wake Lock
autoscroll
offline-cache
private notater
sletting av selve set-listfilen
```

Disse behandles separat.
