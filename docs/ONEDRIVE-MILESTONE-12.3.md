# Milestone 12.3 – Tydeligere BPM-kant

## Mål

M12.3 følger opp praktisk test av M12.2. Funksjonelt var BPM-pulsen korrekt, men viewport-kanten var fortsatt for svak til å oppfattes godt perifert under spilling.

Målet er å øke synligheten uten å gjøre hele Spill-visningen blinkende eller forstyrrende.

## Endring

M12.3 endrer bare den visuelle kanten i Spill-modus. Beat-klokken, BPM-prikken og den faste pulsvarigheten på ca. 300 ms beholdes.

Kanten består nå av to lag:

```text
skjermkant
│
████████        8 px mettet flerfarget ytterring
██████▓▓
████▓▓▒▒        bredere glødlag
██▓▒░
▒░
                transparent → innhold
```

Ytterlaget bruker full metning i cyan/blå/fiolett/magenta-gradienten. Et separat lag går ca. 24 px innover og blurres slik at opasiteten gradvis faller til null. Fargen desatureres ikke innover; den blir transparent.

Mellom slagene er ytterkanten nesten usynlig og glødlaget helt borte. På hvert beat får begge lag full visuell intensitet og tones ned over ca. 300 ms.

## Test 1 – synlighet

1. Start Spill-modus på iPad/iPhone eller tilsvarende skjerm.
2. Slå på visuell BPM-puls.
3. Se på sanginnholdet, ikke direkte på skjermkanten.
4. Vurder om beatet kan oppfattes perifert.
5. Gjenta i både normalt lys og mørkere spillemiljø.

Forventet:

- ytterkanten er tydeligere enn i M12.2
- den fremstår som en mettet lyssone langs skjermkanten
- gløden fader mykt innover
- signalet er tydelig på beatet, men ikke en permanent sterk ramme mellom slagene

## Test 2 – timing

1. Test ca. 60 BPM.
2. Test ca. 180 BPM.
3. Sammenlign selve pulsens varighet.

Forventet:

- avstanden mellom slag følger BPM
- hver visuell puls varer fortsatt omtrent 300 ms
- raske slag restarter animasjonen korrekt
- BPM-prikken oppfører seg som i M12.2

## Test 3 – regresjon

1. Slå BPM-pulsen av og på.
2. Scroll i sangen mens pulsen er aktiv.
3. Bruk Spill-kontrollene.
4. Bytt sang og avslutt/start Spill-modus.
5. Test autoscroll/count-in.

Forventet: kanten fanger ingen peker-/touch-hendelser og øvrig Spill-funksjonalitet er uendret.

## Utenfor scope

- endring av BPM-prikkens størrelse eller timing
- roterende/animert gradient
- mørk Spill-modus
- full Liquid Glass-redesign
- sterkere førsteslag i takt
- brukerdefinerte BPM-farger
