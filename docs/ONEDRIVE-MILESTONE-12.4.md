# Milestone 12.4 – Kontinuerlig BPM-puls fra skjermkanten

## Mål

M12.4 følger opp praktisk test av M12.3. To separate maskerte lag ble oppfattet som to tydelige streker som slo seg av og på. Målet er i stedet at beatet skal oppleves som lys/farge som kommer fra selve skjermkanten og fyller mykt innover.

Dette er siste mindre BPM-justering før den større visuelle M13-milepælen.

## Endring

M12.4 bruker ett eneste fullskjermslag for BPM-signalet:

```text
skjermkant
│
████████▓▒░
██████▓▒░
████▓▒░
██▓░
▒░
                 transparent → innhold
```

Fargefeltet bruker en statisk cyan/blå/fiolett/magenta-gradient rundt viewporten. En kontinuerlig alfamaske gjør feltet sterkt helt ved skjermkanten og gradvis transparent innover til null rundt 34 px.

Det finnes ikke lenger en separat 8 px ring og et eget glow-lag. BPM-prikken er også fjernet. BPM-knappen viser fortsatt BPM og brukes til å slå visuell puls av/på.

Beat-animasjonen varer fortsatt omtrent 300 ms uavhengig av BPM.

## Test 1 – visuell kontinuitet

1. Start Spill-modus på iPhone eller iPad.
2. Slå på visuell BPM-puls.
3. Se primært på sanginnholdet, ikke direkte på kanten.
4. Observer pulsen ved flere slag.
5. Gjenta på både iPhone og iPad.

Forventet:

- pulsen oppleves som om den kommer fra skjermkanten og fyller innover
- ytterst er fargen tydelig og mettet
- fargen fader kontinuerlig og mykt til full transparens innover
- det er ingen separat indre eller ytre «strek nummer to»
- pulsen er lettere å oppfatte perifert enn M12.3

## Test 2 – BPM-kontroll

1. Kontroller BPM-knappen i Spill-modus.
2. Slå pulsen av og på.
3. Kontroller at BPM-tallet fortsatt vises.

Forventet:

- ingen pulserende prikk vises i knappen
- knappen slår fortsatt kantpulsen av/på
- knappen viser korrekt BPM

## Test 3 – timing og regresjon

1. Test ca. 60 BPM.
2. Test ca. 180 BPM.
3. Scroll og bruk Spill-kontroller.
4. Test count-in og autoscroll.
5. Bytt sang og avslutt/start Spill-modus.

Forventet:

- BPM bestemmer avstanden mellom slagene
- hver puls varer fortsatt omtrent 300 ms
- raske slag restarter pulsen korrekt
- kanten blokkerer ikke touch eller scrolling
- øvrig Spill-funksjonalitet er uendret

## Utenfor scope

- ytterligere mindre kalibreringer av BPM-kanten før M13
- roterende gradient
- taktart/fremhevet førsteslag
- mørk Spill-modus
- Liquid Glass-inspirert redesign
