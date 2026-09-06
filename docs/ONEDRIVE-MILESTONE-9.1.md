# ONEDRIVE-MILESTONE-9.1

## Formål

Milestone 9.1 forbedrer redigering av private notater etter praktisk test av Milestone 9 på iPad og Mac.

Problemet som korrigeres er at automatisk OneDrive-synk kunne fullføres mens brukeren skrev. Etter synk ble sangvisningen rendret på nytt, textarea-elementet ble erstattet, og Safari på iPad kunne derfor lukke skjermtastaturet og avbryte skrivingen.

Målet er:

- lokal lagring skal fortsatt være rask
- brukeren skal kunne skrive uavbrutt
- OneDrive-synk skal være mindre aggressiv
- brukeren skal kunne fremtvinge synk uten en ekstra knapp
- eksisterende OneDrive-format og konfliktmodell skal ikke endres

## Ny synkmodell

### Lokal lagring

Etter endring i notatfeltet lagres teksten i IndexedDB etter omtrent:

```text
250 ms
```

Dette er fortsatt den primære sikkerheten mens brukeren skriver.

### Normal OneDrive-synk

Etter lokal lagring planlegges OneDrive-synk omtrent:

```text
5 sekunder etter siste endring
```

Ny redigering nullstiller fristen.

Eksempel:

```text
skriv
↓
IndexedDB
↓
skriv videre
↓
5-sekundersfristen starter på nytt
↓
brukeren stopper å skrive
↓
5 sekunder
↓
OneDrive
```

### Aktiv redigering blokkerer OneDrive-synk

Hvis 5-sekundersfristen går ut mens et privatnotatfelt fortsatt har fokus, blir teksten liggende trygt i IndexedDB og OneDrive-synk utsettes. Dette hindrer både fokusbytte og samtidighet mellom en pågående Graph-synk og nye lokale tastetrykk.

### Når feltet forlates

Når notatfeltet mister fokus, fremskyndes planlagt synk til omtrent:

```text
500 ms
```

Dette gjelder både vanlig sangvisning og Spill-modus.

### Ingen re-render etter vanlig notatsynk

OneDrive-synk oppdaterer tilstand og synkstatus, men skal ikke lenger kalle full `renderSong()` som del av normal notatsynk.

Dermed beholdes det eksisterende textarea-elementet mens brukeren skriver.

## Manuell synk uten ekstra knapp

Når et notat er lagret lokalt, men ikke synkronisert, viser statusen:

```text
Venter på synk
```

Når appen er online er denne teksten klikkbar. Trykk betyr:

```text
Synkroniser nå
```

Under synk vises:

```text
Synkroniserer …
```

Etter vellykket synk:

```text
Synkronisert
```

Offline vises fortsatt:

```text
Lagret lokalt · venter på nett
```

## Test 1 – iPad, sammenhengende skriving

Dette er hovedtesten for 9.1.

1. Publiser Milestone 9.1.
2. Åpne Akkordia online på iPad.
3. Bruk først Safari; gjenta senere i installert PWA.
4. Åpne en sang med privat notatfelt.
5. Trykk i feltet slik at skjermtastaturet åpnes.
6. Skriv sammenhengende i minst 15–20 sekunder.
7. Ta gjerne korte pauser på 1–3 sekunder underveis.
8. Kontroller at tastaturet forblir åpent.
9. Kontroller at markør/fokus blir stående i feltet.
10. Kontroller at ingen tegn eller deler av teksten forsvinner.
11. Stopp skrivingen, men behold fokus i feltet i minst 6 sekunder.
12. Kontroller at tastaturet fortsatt er åpent og at status kan stå som `Venter på synk`.
13. Trykk deretter utenfor feltet.
14. Kontroller at synk skjer kort tid etter at feltet mister fokus.

Forventet resultat:

```text
PASS: skrivingen blir ikke avbrutt av synk
```

## Test 2 – ingen OneDrive-synk midt i aktiv redigering

1. Endre notatet på iPad.
2. Ikke trykk utenfor feltet.
3. Vent minst 6 sekunder uten å skrive.
4. Kontroller at feltet fortsatt har fokus og at tastaturet forblir åpent.
5. Det er akseptabelt og forventet at status fortsatt viser `Venter på synk`.
6. Skriv noen nye tegn etter pausen og kontroller at de registreres normalt.
7. Trykk utenfor feltet.
8. Kontroller at synk deretter gjennomføres og at `notes.json` inneholder hele teksten.

## Test 3 – rask synk ved blur

1. Endre notatet.
2. Trykk utenfor tekstfeltet kort tid etter siste tastetrykk.
3. Kontroller at lokal lagring fullføres.
4. Kontroller at OneDrive-synk starter vesentlig raskere enn normal 5-sekundersfrist.
5. Kontroller at `notes.json` oppdateres.

Eksakt 500 ms trenger ikke måles. Målet er at synken oppleves som rask når brukeren er ferdig med feltet.

## Test 4 – manuell `Venter på synk`

1. Endre et notat online.
2. Mens status viser `Venter på synk`, trykk status-teksten.
3. Kontroller at den skifter til `Synkroniserer …`.
4. Kontroller deretter `Synkronisert`.
5. Kontroller at OneDrive-filen er oppdatert.
6. Kontroller at dette ikke åpner dialog eller ny side.

## Test 5 – offline

1. Åpne en sang mens appen er online.
2. Gå offline.
3. Endre privatnotatet.
4. Kontroller at skriving fungerer normalt.
5. Kontroller at status blir `Lagret lokalt · venter på nett`.
6. Bytt sang og tilbake.
7. Kontroller at notatet fortsatt finnes fra IndexedDB.
8. Gå online igjen.
9. Kontroller at notatet etter hvert synkroniseres til OneDrive.

## Test 6 – Spill-modus på iPad

1. Start Spill fra en set-list.
2. Åpne privatnotatet for en sang.
3. Skriv et notat i minst 10 sekunder.
4. Kontroller at skjermtastaturet ikke blir avbrutt av bakgrunnssynk.
5. Trykk utenfor feltet.
6. Vent kort og kontroller at notatet havner i OneDrive.
7. Gå ut av Spill og åpne samme sang i vanlig visning.
8. Kontroller at samme notat vises.

## Test 7 – Mac/Safari

1. Åpne samme konto og workspace i Safari på Mac.
2. Endre ett privatnotat.
3. Kontroller statusforløpet `Venter på synk` → `Synkroniserer …` → `Synkronisert`.
4. Kontroller at OneDrive-filen blir oppdatert.
5. Klikk `Venter på synk` på en ny endring og kontroller manuell synk.
6. Kontroller at vanlig sangnavigasjon fortsatt fungerer.

Denne testen bekrefter primært 9.1-mekanismen. Den er ikke en test av sanntidssamskriving mellom Mac og iPad.

## Test 8 – enkel regresjon

Kontroller til slutt:

1. Sangliste lastes online.
2. Sangvisning fungerer.
3. Set-lister lastes.
4. Spill starter.
5. Vanlig offline-cache fungerer.
6. Private notater er fortsatt isolert per Microsoft-konto/workspace.
7. Eksisterende `notes.json` brukes videre uten migrering.
8. Konfliktkopi fra Milestone 9 fungerer fortsatt dersom en slik konflikt oppstår.

## Ikke tolk dette som sanntidssamskriving

Milestone 9.1 forsøker ikke å holde to åpne nettlesere kontinuerlig identiske.

En Mac og iPad kan derfor midlertidig vise forskjellige lokale kopier selv om begge på et tidspunkt har vist `Synkronisert`. Eksterne endringer oppdages når appen senere utfører en ny synk/henting.

Dette er akseptabelt for private notater i denne milepælen. Hovedmålet er trygg lokal skriving og eventual consistency mot brukerens OneDrive.

## Utenfor scope

- sanntidssamskriving mellom enheter
- kontinuerlig polling av `notes.json`
- push-varsling ved ekstern endring
- Graph delta subscriptions
- egen synkknapp som bruker ekstra skjermplass
- endring av konfliktalgoritmen fra Milestone 9
- endring av `notes.json`-formatet
