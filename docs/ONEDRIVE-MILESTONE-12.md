# Milestone 12 – Private notater offline og BPM-kant

## Mål

Denne milepælen har to avgrensede mål:

1. Private notater som allerede finnes i lokal IndexedDB skal være synlige og redigerbare etter at PWA-en startes på nytt offline.
2. Visuell BPM-puls i Spill-modus skal kunne oppfattes perifert som en subtil pulserende kant rundt hele skjermen.

Felles sang- og set-listdata er fortsatt read-only offline.

## Årsak til offline-feilen

Ved oppstart ble sangene lastet og rendret før `privateNotesState` ble lest fra IndexedDB. Online kunne senere synkronisering skjule problemet, men ved ren offline-oppstart fantes ingen etterfølgende OneDrive-synk som gjorde notatet synlig.

M12 leser derfor privatnotat-state før sangvisningen rendres.

## BPM-kant

Den eksisterende BPM-klokken i `player.js` brukes videre. Det innføres ikke en ny timer.

Når `Visuell BPM-puls` er aktiv:

- eksisterende BPM-prikk pulserer som før
- en tynn kant rundt hele viewporten får sterkere glød på hvert slag
- gløden toner raskt ned igjen
- kanten fanger ikke touch/musehendelser
- redusert bevegelse (`prefers-reduced-motion`) respekteres ved å fjerne overgangsanimasjonen

Dette er bevisst en første visuell prototype. Farge, styrke, tykkelse og fading kan justeres etter praktisk test på iPad/iPhone/Mac.

## Test 1 – privat notat etter offline-oppstart

1. Start Akkordia online.
2. Åpne en sang og skriv et privat notat.
3. Vent til status viser at notatet er synkronisert.
4. Lukk PWA-en helt.
5. Koble enheten fra nett.
6. Start PWA-en på nytt.
7. Åpne samme sang.
8. Kontroller at privatnotatet er synlig.
9. Kontroller at vanlig `Rediger` fortsatt ikke er tilgjengelig offline.

Forventet: privatnotatet vises, mens felles sangdata fortsatt er read-only.

## Test 2 – rediger privat notat offline

1. Fortsett offline fra test 1.
2. Endre teksten i privatnotatet.
3. Vent et øyeblikk eller forlat feltet.
4. Kontroller status `Lagret lokalt · venter på nett`.
5. Bytt til en annen sang og tilbake.
6. Kontroller at endringen fortsatt finnes.
7. Lukk PWA-en helt og start den igjen mens enheten fortsatt er offline.
8. Kontroller at endringen fortsatt finnes.

## Test 3 – synk etter at nettet kommer tilbake

1. Koble enheten til nett igjen.
2. Kontroller at privatnotatet synkroniseres.
3. Kontroller at status endres til `Synkronisert`.
4. Kontroller gjerne på en annen enhet at den nye teksten blir tilgjengelig der etter synk.

## Test 4 – privat notat i Spill-modus offline

1. Gå offline med cachede sanger og set-lister.
2. Start Spill-modus.
3. Åpne en sang som har privat notat.
4. Kontroller at notatet vises.
5. Endre notatet.
6. Avslutt Spill og åpne sangen i vanlig visning.
7. Kontroller at endringen er bevart lokalt.

## Test 5 – BPM-kant

1. Start Spill-modus på en sang med kjent BPM.
2. Slå på `Visuell BPM-puls` via BPM-knappen.
3. Kontroller at både BPM-prikken og kanten pulserer i samme takt.
4. Prøv minst én langsom og én rask BPM.
5. Kontroller at kanten ikke hindrer knapper, scrolling eller touch.
6. Slå pulsen av og kontroller at både prikkpuls og kantpuls stopper.

Vurder spesielt om kanten er synlig perifert uten å være distraherende. Dette er parameterne vi eventuelt finjusterer etter testen:

- kanttykkelse
- glødestyrke
- farge/intensitet
- hvor raskt gløden toner ned

## Test 6 – regresjon

Kontroller kort:

- online sangvisning
- set-lister
- Spill neste/forrige
- autoscroll og count-in
- fontstørrelse i Spill
- transpose i vanlig visning og Spill
- Wake Lock der tilgjengelig

## Utenfor scope

- annen puls på første slag i takt
- flere farger langs kanten
- taktartsmodell
- offline-redigering av felles sang-/set-listdata
- endring av privatnotatenes lagringsformat
