# Milestone 12.2 – Lokale private notater uten aktiv innlogging og tydeligere BPM-kant

## Mål

M12.2 følger opp praktisk test av M12.1.

Målene er:

1. Private notater skal være tilgjengelige fra lokal cache selv om Microsoft-økten ikke er aktiv.
2. Microsoft-innlogging skal være nødvendig for synkronisering, ikke for lokal bruk av allerede etablert private-note-cache.
3. BPM-kanten skal være mer synlig gjennom farge og metning, uten å øke pulsvarigheten eller bli en permanent sterk ramme.

## Private notater – lokal identitet

Akkordia lagrer fortsatt private notater i IndexedDB med nøkkel:

```text
Microsoft account ID + workspace ID
```

M12.2 husker i tillegg sist brukte private-note-konto-ID i `localStorage`.

Dette er kun en identifikator som gjør at appen kan finne riktig lokale IndexedDB-post. Det lagres ikke Microsoft-token, passord eller annen autentiseringshemmelighet.

Oppførselen blir:

```text
innlogget
→ lokal cache tilgjengelig
→ OneDrive-synk tilgjengelig

uten nett, kjent konto
→ lokal cache tilgjengelig
→ OneDrive-synk venter

online, men utlogget
→ lokal cache tilgjengelig
→ OneDrive-synk venter på innlogging
```

Dersom en annen Microsoft-konto senere logger inn, brukes den kontoens separate private-note-cache. M12.2 bygger på prosjektets forutsetning om personlige, ikke delte enheter.

## BPM-kant

Pulsvarigheten er fortsatt fast ca. 300 ms og uavhengig av BPM.

Kanten bruker nå en fast gradient rundt skjermen:

```text
cyan → blå → fiolett → magenta → cyan
```

På hvert slag økes metning, lysstyrke og glow kraftig før alt tones tilbake. Gradientens plassering roterer ikke; det er intensiteten som pulserer. Dette gir mer visuell separasjon uten å introdusere en kontinuerlig animert «regnbuekant».

BPM-prikken bruker samme fargefamilie og samme 300 ms timing.

## Test 1 – private notater innlogget

1. Logg inn med Microsoft.
2. Åpne en sang med et eksisterende privat notat.
3. Endre notatet.
4. Vent til status viser at notatet er synkronisert.
5. Oppdater siden.

Forventet: notatet er fortsatt synlig og synkronisert.

## Test 2 – logg ut, fortsatt online

1. Start fra godkjent test 1.
2. Logg eksplisitt ut av Microsoft.
3. La enheten fortsatt være online.
4. Åpne samme sang.

Forventet:

- privatnotatet vises fortsatt
- notatfeltet kan redigeres
- appen ber ikke om innlogging bare for å vise notatet
- synkronisering mot OneDrive skjer ikke

## Test 3 – rediger utlogget

1. Mens du fortsatt er utlogget, endre privatnotatet.
2. Vent til lokal lagring er ferdig.
3. Bytt sang og tilbake, eller oppdater appen.
4. Kontroller notatet igjen.

Forventet:

- endringen er bevart lokalt
- status viser `Lagret lokalt · logg inn for synk`
- ingen Graph-skriving forsøkes

## Test 4 – logg inn igjen og synkroniser

1. Logg inn igjen med samme Microsoft-konto.
2. Åpne sangen med lokal endring.
3. Vent på automatisk synk, eller bruk `Venter på synk` når den vises.
4. Kontroller `notes.json` i OneDrive.

Forventet: den lokale endringen synkroniseres til samme private `notes.json` uten datatap.

## Test 5 – offline-regresjon

1. Synkroniser privatnotatet.
2. Gå offline.
3. Start PWA på nytt.
4. Kontroller at notatet kan leses og redigeres.
5. Gå online igjen.

Forventet: M12-funksjonen fungerer som før.

## Test 6 – BPM-kant farge og tydelighet

1. Start Spill-modus.
2. Slå på visuell BPM-puls.
3. Observer kanten uten å fokusere direkte på skjermkanten.
4. Test både svak og normal omgivelsesbelysning.

Forventet:

- pulsen er tydeligere enn i M12.1
- flere farger gir bedre separasjon enn ensfarget blå
- kanten oppleves fortsatt som beat-signal, ikke som en permanent dekorativ ramme
- innhold og touch-kontroller påvirkes ikke

## Test 7 – BPM timing

Gjenta test med ca. 60 BPM og ca. 180 BPM.

Forventet:

- avstanden mellom slag følger BPM
- selve farge/glow-pulsen varer omtrent 300 ms ved begge tempo
- raske slag restartes korrekt

## Test 8 – BPM av/på og regresjon

1. Slå pulsen av og på.
2. Bytt sang.
3. Test autoscroll/count-in.
4. Test fontstørrelse.
5. Avslutt og start Spill på nytt.

Forventet: eksisterende funksjoner oppfører seg som før.

## Utenfor scope

- full Liquid Glass-redesign av PWA
- mørk Spill-modus
- brukerdefinerte BPM-farger
- roterende/animert gradient rundt kanten
- sterkere markering av første taktslag
- synkronisering uten Microsoft-innlogging
- støtte for delte enheter med valg mellom flere lokale private-note-profiler
