# ONEDRIVE-MILESTONE-3

## Mål

Milestone 3 gjør sangbiblioteket skrivbart.

Følgende skal fungere:

```text
åpne eksisterende sang
↓
Rediger
↓
endre Song schema v1-data
↓
Lagre
↓
OneDrive
```

og:

```text
+ Ny sang
↓
opprett Song schema v1
↓
Lagre
↓
ny <song-id>.json i songs/
```

## Omfang

Milestone 3 støtter redigering av:

|Data|Støttet|
|:---|:---|
|Tittel|Ja|
|Akkordsett|Ja|
|Felles transpose|Ja|
|Valgfri BPM/autoscroll-data|Ja|
|Seksjonstype|Ja|
|Seksjonsnavn|Ja|
|Seksjonstranspose|Ja|
|Rekkefølge på seksjoner|Ja|
|Vokaltekst|Ja|
|Koring|Ja|
|Rekkefølge på linjer|Ja|
|Akkordnavn|Ja|
|Akkordposisjon|Ja|
|Legge til/fjerne akkorder|Ja|

Sletting av hele sanger inngår ikke i denne milepælen.

## Redigeringsmodell

Editoren er i første versjon strukturert etter JSON-modellen.

Akkordposisjon redigeres som et heltall som tilsvarer tegnposisjonen i sanglinjen.

Dette er bevisst enklere enn en grafisk dra-og-slipp-editor. En mer direkte akkordplasseringsfunksjon kan bygges senere uten å endre dataformatet.

## Samtidighet

Eksisterende sangfiler lagres med filens ETag som `If-Match`.

Hvis en annen bruker har lagret samme sang etter at den ble lastet inn, skal Graph avvise lagringen i stedet for at Akkordia overskriver den andre brukerens endring.

Akkordia viser da:

```text
Sangen er endret av en annen bruker siden du åpnet den.
Last inn sangbiblioteket på nytt før du prøver igjen.
```

## Nye sanger

Nye sanger får:

```text
song_<UUID>
```

som stabil sang-ID.

Filnavnet blir:

```text
<song-id>.json
```

Tittel og filnavn er dermed uavhengige. En senere navneendring av sangen krever ikke filrename.

## Testrekkefølge

Utfør testene i vanlig desktop-nettleser først.

### Test 1 – eksisterende sang

1. Åpne Akkordia.
2. Velg en sang.
3. Velg `Rediger`.
4. Gjør en liten, reversibel endring i tittelen eller teksten.
5. Velg `Lagre`.
6. Kontroller at lesemodus viser endringen.
7. Last siden på nytt.
8. Kontroller at endringen fortsatt finnes.
9. Reverter endringen og lagre på nytt.

Forventet resultat: endringen lagres i samme JSON-fil i OneDrive.

### Test 2 – seksjon og linje

1. Rediger en test-/ufarlig sang.
2. Legg til en ny seksjon.
3. Legg til minst to linjer.
4. Flytt en linje opp/ned.
5. Endre seksjonstranspose.
6. Lagre og last siden på nytt.

Forventet resultat: struktur og rekkefølge bevares.

### Test 3 – akkorder

1. Rediger en test-/ufarlig sang.
2. Legg til en akkord.
3. Sett akkordnavn og posisjon.
4. Lagre.
5. Kontroller lesemodus.
6. Last siden på nytt og kontroller igjen.

Forventet resultat: akkorden vises på angitt tegnposisjon.

### Test 4 – playback valgfritt

1. Åpne en sang uten `playback`.
2. Aktiver BPM/autoscroll-data.
3. Sett BPM og beats per linje.
4. Lagre og last på nytt.
5. Rediger på nytt og deaktiver BPM/autoscroll-data.
6. Lagre og last på nytt.

Forventet resultat: `playback` kan både opprettes og fjernes.

### Test 5 – ny sang

1. Velg `+ Ny sang`.
2. Sett tittel.
3. Legg inn minst én tekstlinje og én akkord.
4. Lagre.
5. Kontroller at sangen dukker opp alfabetisk i biblioteket.
6. Last siden på nytt.
7. Kontroller at sangen fortsatt finnes.

Forventet resultat: ny JSON-fil opprettes i `songs/`.

### Test 6 – konflikt

Bruk en ny testsang slik at reelle data ikke risikeres.

1. Åpne samme sang i to separate nettlesersesjoner.
2. Start redigering i begge før noen lagrer.
3. Lagre endring A i første sesjon.
4. Lagre en annen endring B i andre sesjon.

Forventet resultat: første lagring lykkes. Andre lagring skal stoppes med konfliktmelding og skal ikke overskrive den første.

### Test 7 – avbryt redigering

1. Rediger en sang.
2. Endre data uten å lagre.
3. Velg `Avbryt`.

Forventet resultat: lesemodus viser den sist lagrede versjonen.

### Test 8 – navigering med ulagrede endringer

1. Start redigering.
2. Endre noe.
3. Velg en annen sang eller en annen hovedvisning.

Forventet resultat: Akkordia spør før redigeringen forlates.

## Ikke testet i denne milepælen

Følgende kommer senere:

```text
sletting av sang
direkte grafisk akkordplassering
offline-redigering
set-lister
Spill-modus
Wake Lock
```
