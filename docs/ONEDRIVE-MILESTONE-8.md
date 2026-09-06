# ONEDRIVE-MILESTONE-8

## Formål

Milestone 8 forbedrer Spill-modus for faktisk øvelse og fremføring.

Målet er at de viktigste kontrollene alltid er tilgjengelige, samtidig som mest mulig skjermplass brukes til sangen.

## Spill-layout

Spill har nå:

```text
fast kompakt toppområde
↓
sangtittel
↓
sanginnhold
↓
fast kontrollrad nederst
```

Toppområdet viser:

```text
Avslutt | del + posisjon | BPM-puls | − A +
```

Eksempel:

```text
×     Sett 1 · 3 / 12     ● 92 BPM    − A +
```

Set-listens navn vises i oversikten, men tar ikke permanent plass i Spill-toppen.

## Fast bunnkontroll

Følgende er alltid tilgjengelig nederst:

```text
← Forrige | ▶ Auto | Neste →
```

Autoscroll går aldri automatisk videre til neste sang.

Ved sangbytte stopper autoscroll og neste sang starter øverst.

## Fontstørrelse

Fontstørrelsen kan justeres med:

```text
− A +
```

Tilgjengelige nivåer:

|Nivå|Skala|
|:---|:---|
|1|80 %|
|2|90 %|
|3|100 %|
|4|110 %|
|5|125 %|
|6|140 %|

Valget lagres lokalt på enheten.

Akkorder og tekst skaleres sammen slik at eksisterende tegnbaserte `chord.pos` fortsatt brukes.

## Setlist-oversikt

Trykk på del/posisjon i toppfeltet for å åpne oversikten.

Oversikten viser:

```text
Set-listnavn

Sett 1
1  Sang A
2  Sang B

Sett 2
1  Sang C
2  Sang D

Encore
1  Sang E
```

Aktuell sang markeres tydelig.

Trykk på en sang for å hoppe direkte til den.

Nummereringen i oversikten starter på nytt ved hver del. Den globale posisjonen i toppen forblir eksempelvis `7 / 12`.

## BPM-indikator

Spill viser sangens BPM i toppfeltet.

Hvis sangen ikke har eksplisitt `playback.bpm`, brukes fortsatt runtime-standard:

```text
90 BPM
```

BPM endres ikke fra Spill-modus.

## Visuell puls

Trykk på BPM-indikatoren for å slå visuell puls av eller på.

Indikatoren gir ett diskret visuelt slag per beat.

Dette er ikke en lydmetronom.

Pulsinnstillingen lagres lokalt på enheten.

## Count-in før Auto

I setlist-oversikten finnes lokal innstilling:

```text
Count-in: 4 slag før Auto
```

Når den er aktiv og brukeren trykker `▶ Auto`:

```text
4 · Auto
3 · Auto
2 · Auto
1 · Auto
↓
⏸ Auto
```

Autoscroll starter etter fire BPM-slag.

Count-in bruker samme BPM som sangen.

### Puls og count-in er uavhengige

Hvis visuell puls allerede kjører, bruker count-in den eksisterende pulsklokken uten å starte rytmen på nytt.

Hvis visuell puls er slått av, vises slagene midlertidig under count-in, og pulsindikatoren stopper igjen etterpå.

Count-in er alltid fire slag i denne versjonen.

Det kalles bevisst ikke «én takt», fordi Song schema ikke inneholder taktart eller `beatsPerBar`.

## Lokale preferanser

Følgende lagres bare lokalt:

|Preferanse|Lagring|
|:---|:---|
|Fontstørrelse|`localStorage`|
|Visuell puls av/på|`localStorage`|
|Count-in av/på|`localStorage`|

Ingen av disse innstillingene skrives til OneDrive.

## Test – desktop

1. Åpne Akkordia online på Mac.
2. Start Spill fra en set-list med minst to deler.
3. Kontroller at vanlig app-header og hovednavigasjon er skjult.
4. Kontroller at toppområdet blir stående mens sangen ruller.
5. Kontroller at bunnkontrollen blir stående.
6. Test Forrige og Neste.
7. Kontroller at autoscroll stopper ved sangbytte.
8. Trykk del/posisjon i toppen.
9. Kontroller at setlist-oversikten åpnes.
10. Kontroller at deler vises tydelig og at nummereringen starter på nytt per del.
11. Hopp direkte til en annen sang.
12. Kontroller at korrekt sang og del vises.
13. Test `−` og `+` for fontstørrelse gjennom alle nivåer.
14. Kontroller at akkordplasseringen fortsatt følger teksten.
15. Avslutt Spill og start på nytt. Kontroller at fontstørrelsen huskes.
16. Slå visuell BPM-puls på.
17. Kontroller at indikatoren pulserer omtrent i sangens BPM.
18. Bytt til en sang med annen BPM og kontroller at pulshastigheten endres.
19. Slå pulsen av og kontroller at den stopper.
20. Åpne setlist-oversikten og slå på `Count-in: 4 slag før Auto`.
21. Lukk oversikten og trykk `▶ Auto`.
22. Kontroller nedtelling `4`, `3`, `2`, `1` og at autoscroll deretter starter.
23. Trykk Auto under count-in og kontroller at count-in avbrytes.
24. Gjenta med visuell puls aktiv og kontroller at pulsen fortsetter gjennom count-in.
25. Kontroller at autoscroll fortsatt stopper på siste linje og ikke bytter sang automatisk.
26. Kontroller Wake Lock etter samme test som Milestone 6.

## Test – touch/iPad

Etter desktop-test:

1. Åpne siste versjon på iPad.
2. Start Spill.
3. Kontroller at topp- og bunnkontroller ikke dekker nødvendig sanginnhold.
4. Kontroller at alle kontrollene er enkle å treffe med touch.
5. Test raskt gjentatte trykk på font `−/+` uten uønsket double-tap-zoom.
6. Åpne/lukk setlist-oversikten flere ganger.
7. Hopp mellom sanger og deler.
8. Test BPM-puls.
9. Test 4-slags count-in.
10. Test autoscroll med liten og stor font.
11. Gjenta i installert PWA.
12. Gjenta Spill offline med data som allerede er cached.

## Utenfor scope

- lydmetronom
- endring av BPM i Spill
- taktart / `beatsPerBar`
- auto-next til neste sang
- swipe eller skjulte tap-soner
- tastatursnarveier
- redigering fra Spill
