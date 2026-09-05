# ONEDRIVE-MILESTONE-6

## Formål

Milestone 6 innfører Spill-modus for set-lister.

Målet er en ren øvings-/konsertvisning uten redigeringskontroller.

## Funksjoner

- start Spill direkte fra en set-list
- start Spill fra hovedfanen `Spill`
- forrige og neste sang
- direkte hopp til valgfri sang i set-listen
- samme sang kan forekomme flere ganger
- delnavn som `Sett 1`, `Sett 2` og `Encore` vises som kontekst
- sangposisjon vises som `3 / 12`
- autoscroll basert på BPM og `beatsPerLine`
- aktiv sanglinje markeres visuelt
- Screen Wake Lock forsøkes aktivert under Spill-modus
- Wake Lock forsøkes gjenopprettet når appen blir synlig igjen
- Wake Lock frigjøres når Spill avsluttes

## Navigasjonsmodell

Navigasjon skjer etter forekomst i set-listen, ikke etter sang-ID.

Hvis samme sang forekommer som første og siste sang er dette to separate spilleposisjoner.

Delmarkører teller ikke som sanger i `3 / 12`.

Manglende sangreferanser hoppes over i Spill-modus, men endres ikke i set-listdataene.

## Autoscroll

Hvis sangen har:

```json
"playback": {
  "bpm": 120,
  "beatsPerLine": 4
}
```

blir tiden per sanglinje:

```text
60000 / BPM * beatsPerLine
```

Hvis `playback` mangler brukes de etablerte standardverdiene:

```text
90 BPM
4 beats per linje
```

Autoscroll endrer bare lokal kjøretidstilstand og skriver ingenting til sangfilen.

## Test – desktop-nettleser

1. Åpne Akkordia i Safari på Mac.
2. Åpne en set-list med minst to deler og flere sanger.
3. Velg `Spill` fra set-listen.
4. Kontroller at vanlig app-header og hovednavigasjon forsvinner.
5. Kontroller at set-listnavn, aktuell posisjon og sangtittel vises.
6. Kontroller at aktuell del, eksempelvis `Sett 1`, vises over sangen.
7. Velg `Neste` og kontroller at riktig neste sang åpnes.
8. Velg `Forrige` og kontroller at riktig forekomst åpnes.
9. Test en set-list der samme sang forekommer flere ganger. Kontroller at navigasjon følger posisjon, ikke sang-ID.
10. Åpne `Set-list` i Spill-modus og hopp direkte til en annen sang.
11. Kontroller at hopp over en delgrense viser riktig nytt delnavn.
12. Start autoscroll.
13. Kontroller at første aktive linje er visuelt markert og at markeringen går videre etter beregnet tid.
14. Velg `Pause autoscroll` og kontroller at aktuell linje beholdes.
15. Start igjen og kontroller at autoscroll fortsetter fra samme linje.
16. Bytt til neste sang og kontroller at autoscroll er stoppet og linjeposisjon er nullstilt.
17. Kontroller en sang uten eksplisitt `playback`; UI skal vise `90 BPM · 4 beats/linje · standard`.
18. Kontroller en sang med eksplisitt playback og at dens verdier vises.
19. Velg `Avslutt` og kontroller at du kommer tilbake til samme set-list.
20. Åpne hovedfanen `Spill`, velg en set-list og kontroller samme flyt.

## Test – Wake Lock

Mens Spill-modus er aktiv:

1. La skjermen stå urørt lenger enn normal skjermdimming dersom praktisk mulig.
2. Kontroller at Spill-modus fortsatt er aktiv.
3. Bytt til en annen app/fane og tilbake.
4. Kontroller at Spill-modus fortsatt fungerer og at Wake Lock-feil ikke krasjer appen.
5. Avslutt Spill-modus.

Manglende Wake Lock-støtte eller avvist Wake Lock skal ikke regnes som funksjonsfeil dersom resten av Spill-modus fungerer. Det skal ikke vises en fatal feil.

## Sekundær touch-test

Etter desktop-testen kan vanlig Safari på iPad brukes til en enkel kontroll av:

- Forrige/Neste
- direkte hopp
- Start/Pause autoscroll
- Avslutt
- lesbarhet i stående og liggende orientering

Full installert-PWA/offline-test tas senere sammen med den samlede plattformtesten.

## Utenfor scope

- offline-cache
- offline Spill-modus
- redigering i Spill-modus
- private notater
- personlig tempojustering
