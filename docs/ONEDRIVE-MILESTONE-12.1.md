# Milestone 12.1 – Finjustert BPM-kant

## Mål

M12.1 justerer den grafiske BPM-pulsen etter praktisk test av M12. Offline/private-notater-funksjonen er ikke endret.

Målene er:

1. BPM-kanten skal være tydelig nok til å oppfattes perifert under spilling.
2. Selve pulsen skal ha samme visuelle varighet ved lav og høy BPM.
3. Spill-flaten skal gi bedre kontrast mot BPM-gløden enn en ren hvit bakgrunn.

## Endringer

### Fast pulsvarighet

BPM bestemmer bare når neste slag kommer. Den visuelle markeringen varer nå fast ca. 300 ms for både kanten og BPM-prikken.

```text
slag → sterk markering → fading → hvile
       <--- ca. 300 ms --->
```

Ved nytt slag restartes animasjonen eksplisitt. Dette gjelder også hvis slagene kommer så raskt at forrige animasjon ikke er helt ferdig.

### Tydeligere kant

Kanten er økt fra 2 px til 4 px og bruker en sterkere blå/cyan markering på slaget. Mellom slagene er kanten bevisst svært svak. Gløden bruker flere indre lag slik at signalet blir synlig i periferien uten å dekke innhold eller fange touch.

### Spill-bakgrunn

Spill-visningen bruker nå en svak nøytral grå (`#f3f4f6`) i stedet for ren hvit bakgrunn. Topplinjen følger samme flate. Dette øker kontrasten mot BPM-kanten uten å innføre mørk modus eller endre tekst-/akkordfarger.

## Private notater og utlogging

M12s offline-funksjon beholdes uendret. Det er et bevisst skille mellom:

- **offline med kjent Microsoft-konto:** cachede private notater kan leses og redigeres lokalt
- **eksplisitt utlogget:** private notater vises ikke før brukeren logger inn igjen

Dette er nødvendig fordi IndexedDB-cachen er isolert på Microsoft-konto + workspace. Uten kjent kontoidentitet skal appen ikke velge eller vise en tidligere brukers private cache.

## Test 1 – visuell styrke

1. Start Spill-modus på iPad eller tilsvarende primær enhet.
2. Slå på `Visuell BPM-puls`.
3. Kontroller at kanten er tydelig synlig også når du ikke ser direkte på skjermkanten.
4. Kontroller samtidig at sangtekst/akkorder fortsatt er behagelige å lese.
5. Kontroller at gløden ikke dekker eller blokkerer knapper/touch.

Forventet: kanten er klart mer synlig enn i M12, men fremstår som et beat-signal og ikke en permanent ramme.

## Test 2 – langsom BPM

1. Bruk en sang med omtrent 50–70 BPM.
2. Slå på visuell puls.
3. Observer kanten og prikken gjennom minst 8 slag.
4. Kontroller at markeringen toner helt ned etter omtrent samme korte tidsrom på hvert slag.
5. Kontroller at den ikke ligger lysende gjennom mesteparten av tiden frem til neste slag.

## Test 3 – rask BPM

1. Bruk en sang med omtrent 160–190 BPM.
2. Slå på visuell puls.
3. Observer minst 16 slag.
4. Kontroller at kanten og prikken følger hvert slag.
5. Kontroller at hvert nytt slag starter markeringen på nytt uten at pulsen låser seg i aktiv tilstand.

## Test 4 – sammenlign lav og høy BPM

Bytt mellom sangene fra test 2 og 3.

Forventet:

- avstanden mellom slag endres med BPM
- selve lys-/fade-forløpet oppleves omtrent like langt ved begge BPM-verdier

## Test 5 – av/på og regresjon

1. Slå BPM-pulsen av.
2. Kontroller at kant og prikk slutter å pulsere.
3. Slå på igjen og kontroller at de starter normalt.
4. Test neste/forrige sang.
5. Test autoscroll/count-in.
6. Test fontstørrelse.
7. Kontroller at private notater fortsatt fungerer online og offline som godkjent i M12.

## Test 6 – utlogget vs. offline

1. Mens du er innlogget, synkroniser et privat notat.
2. Gå offline uten å logge ut og kontroller at notatet fortsatt er tilgjengelig.
3. Gå online igjen og logg eksplisitt ut av Microsoft-kontoen.
4. Åpne samme sang.
5. Kontroller at appen ikke viser privatnotatet, men ber om Microsoft-innlogging.
6. Logg inn igjen med samme konto og kontroller at privatnotatet blir tilgjengelig.

Dette er forventet og beskytter konto-isolasjonen på delte enheter.

## Utenfor scope

- mørk Spill-modus
- flere farger eller Siri-lignende flerfarget kant
- egen fargeinnstilling for BPM-kant
- sterkere første slag i takt
- taktartsmodell
- endring av private-notater-lagring
