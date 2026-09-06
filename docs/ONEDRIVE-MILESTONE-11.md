# ONEDRIVE-MILESTONE-11

## Formål

Milestone 11 ferdigstiller eksisterende transpose-funksjon. `song.transpose` og `section.transpose` har allerede vært del av sangformatet og editoren, men verdiene påvirket ikke rendring av akkordnavn.

Målet er:

- global transpose skal påvirke alle akkorder i sangen
- seksjons-transpose skal legges til global transpose
- samme resultat skal vises i Sanger og Spill
- lagrede akkordnavn skal ikke omskrives
- vanlige akkordsuffiks og slash-akkorder skal støttes
- ukjente symboler skal ikke ødelegges

## Modell

Effektiv transpose for hver seksjon:

```text
effektiv transpose = song.transpose + section.transpose
```

Eksempel:

```text
song.transpose = +2
section.transpose = -1
C → C#
```

Transponering skjer bare ved rendering. JSON beholder original akkordtekst.

## Støttet tolkning

Eksempler:

```text
C       +2 → D
Am      +2 → Bm
F#m     +2 → G#m
Bbmaj7  +2 → Cmaj7
C/G     +2 → D/A
```

Akkordparseren tolker rottonen først og eventuell bassnote etter `/`. Teksten mellom disse beholdes som akkordkvalitet/suffiks.

Symboler som ikke matcher et støttet akkordmønster beholdes uendret.

# Tester

## Test 1 – automatisert logikk

Fra repository-roten:

```bash
npm run test:transpose
```

Forventet:

```text
OK: 15 transpose-kontroller
```

## Test 2 – global transpose +2

1. Åpne en sang som inneholder kjente akkorder, gjerne `C`, `F`, `G` eller `Am`.
2. Velg Rediger.
3. Sett sangens `Transpose` til `2`.
4. Lagre.
5. Kontroller vanlig sangvisning.

Forvent eksempler:

```text
C  → D
F  → G
G  → A
Am → Bm
```

Kontroller at metadata viser `Transpose: +2`.

## Test 3 – negativ transpose

1. Sett global `Transpose` til `-2`.
2. Lagre.
3. Kontroller en original `C`.

Forventet:

```text
C → Bb
```

## Test 4 – kombinasjon av sang og seksjon

1. Sett global transpose til `+2`.
2. Sett én seksjon til `-1`.
3. La en annen seksjon stå på `0`.
4. Lagre.
5. Sammenlign samme eller tilsvarende akkord i de to seksjonene.

Forventet:

```text
seksjon 0:  effektiv +2
seksjon -1: effektiv +1
```

En lagret `C` skal dermed vises som henholdsvis `D` og `C#`.

## Test 5 – akkordkvalitet

Kontroller minst én akkord med suffiks.

Eksempler:

```text
F#m   +2 → G#m
Cmaj7 +2 → Dmaj7
Dadd9 -2 → Cadd9
G7    +2 → A7
```

Suffikset skal være uendret.

## Test 6 – slash-akkord

Bruk eller legg midlertidig inn en akkord som:

```text
C/G
```

Sett transpose til `+2`.

Forventet:

```text
C/G → D/A
```

Både rot og bassnote skal transponeres.

## Test 7 – Spill-modus

1. Legg testsangen i en set-list.
2. Start Spill.
3. Kontroller akkordene mot vanlig sangvisning.

Forventet:

```text
PASS: Sanger og Spill viser samme transponerte akkorder.
```

## Test 8 – lagrede data skal ikke omskrives

1. Noter en original akkord, eksempelvis `C`.
2. Sett transpose til `+2` og lagre.
3. Kontroller at UI viser `D`.
4. Åpne/rediger sangen igjen eller inspiser JSON i OneDrive.
5. Kontroller at akkorden fortsatt er lagret som:

```json
{"name":"C"}
```

Transpose-feltet skal være endret, ikke akkordnavnet.

## Test 9 – tilbake til null

1. Sett global og seksjons-transpose tilbake til `0`.
2. Lagre.
3. Kontroller visningen.

Forventet:

```text
Originale akkordnavn vises igjen uten datakonvertering.
```

## Test 10 – akkordsett

Hvis sangen har `chordSet`, kontroller at akkordsettet i vanlig sangvisning følger global `song.transpose`.

Seksjons-transpose skal ikke brukes på det globale akkordsettet.

## Test 11 – regresjon

Kontroller til slutt:

1. Sangredigering og lagring fungerer.
2. Akkordplassering (`chord.pos`) er uendret.
3. Set-lister og cache-first fra M10 fungerer.
4. Spill-navigasjon og autoscroll fungerer.
5. Private notater fungerer.
6. Offline-visning bruker samme transponeringslogikk fordi den opererer på cachede sangdata.
7. PWA får ny service-worker-cache.

## Utenfor scope

- automatisk toneartsanalyse
- valg mellom enharmoniske navn basert på musikalsk toneart
- omskriving av lagrede akkordnavn
- transponering av fritekst i vokal-/koringsfelt
- individuell personlig transpose per bruker
- transponering per set-listforekomst
