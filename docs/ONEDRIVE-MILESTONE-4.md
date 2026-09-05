# ONEDRIVE-MILESTONE-4

## Mål

Milestone 4 forbedrer sangredigeringen uten å endre Song schema v1.

Hovedmålet er en visuell akkordeditor der samme `chord.pos` kan endres på tre måter:

```text
dra akkorden
numerisk posisjon
− / + ett tegn
```

Alle metodene skriver til samme heltallsverdi i JSON.

## Omfang

Milestone 4 legger til:

- akkordpalett basert på sangens `chordSet`
- dra ny akkord fra paletten til en sanglinje
- dra eksisterende akkord til ny tegnposisjon
- flytt eksisterende akkord mellom sanglinjer ved dra-og-slipp
- snap til nærmeste tegnposisjon
- valg av akkord ved klikk/tastatur
- numerisk finjustering av `pos`
- `−` og `+` for ett tegn om gangen
- redigering og sletting av valgt akkord
- løpende visuell forhåndsvisning av vokal og koring
- Pointer Events for samme grunnmekanisme på mus, trackpad og touch

Milestone 4 endrer ikke:

- autentisering
- OneDrive workspace-modell
- Song schema v1
- ETag/konflikthåndtering
- set-lister
- Spill-modus
- offline-redigering

## Datamodell

En akkord lagres fortsatt slik:

```json
{
  "id": "chord_...",
  "name": "Am",
  "pos": 15
}
```

Ingen pikselposisjon lagres.

`pos` er tegnposisjon og skal være et heltall større enn eller lik null.

## Visuell plassering

Editoren viser sanglinjen med monospace-font.

Når en akkord slippes, beregnes nærmeste tegnposisjon fra pekerens horisontale plassering i linjen.

Det betyr at visuell dra-og-slipp og eksisterende read-only-renderer bruker samme posisjonsmodell.

## Testmiljø for denne milepælen

Primær funksjonell test:

```text
Safari på Mac
```

Touch testes gjerne i Safari på iPad etter at desktop-testene passerer.

Installert iPad-PWA er fortsatt et eget plattformtestpunkt og trenger ikke blokkere denne milepælen.

## Test 1 – regresjon før redigering

1. Åpne Akkordia fra GitHub Pages.
2. Logg inn.
3. Åpne BoM.
4. Kontroller at sanglisten lastes.
5. Åpne flere eksisterende sanger.

Forventet:

- Milestone 2-visningen fungerer som før.
- Akkordplassering i vanlig sangvisning er uendret.

## Test 2 – akkordpalett

1. Åpne en eksisterende sang.
2. Velg `Rediger`.
3. Finn `Akkordpalett`.

Forventet:

- Paletten inneholder sangens `chordSet`.
- Endring i feltet `Akkordsett` oppdaterer paletten uten lagring/reload.

## Test 3 – legg til akkord med dra-og-slipp

1. Dra en akkord fra paletten til en sanglinje.
2. Slipp omtrent over et ord/tegn.

Forventet:

- En ny akkord vises på linjen.
- Akkorden blir valgt.
- Kontrollfeltet `Valgt akkord` vises.
- `Posisjon` inneholder en heltallsverdi.

## Test 4 – flytt eksisterende akkord

1. Dra en eksisterende akkord horisontalt på samme linje.
2. Slipp den på et nytt sted.

Forventet:

- Akkordens ID beholdes.
- Bare `pos` endres.
- Akkorden snapper til en tegnposisjon.

## Test 5 – finjustering med − og +

1. Velg en akkord.
2. Noter `Posisjon`.
3. Trykk `−`.
4. Trykk `+` to ganger.

Forventet:

- `−` reduserer posisjon med nøyaktig 1, men aldri under 0.
- `+` øker posisjon med nøyaktig 1.
- Akkorden flytter seg visuelt samtidig.

## Test 6 – direkte tallverdi

1. Velg en akkord.
2. Skriv eksempelvis `12` i `Posisjon`.

Forventet:

- Akkorden flyttes til tegnposisjon 12.
- JSON-modellen beholder et heltall.

## Test 7 – endre akkordnavn

1. Velg en akkord.
2. Endre akkordnavnet, for eksempel `C` til `Cmaj7`.

Forventet:

- Den visuelle akkorden oppdateres umiddelbart.
- Endringen lagres normalt når sangen lagres.

Merk: `chordSet` endres ikke automatisk. Akkordsettet er eksplisitt sangdata og redigeres i eget felt.

## Test 8 – flytt akkord mellom linjer

1. Dra en eksisterende akkord fra én sanglinje til en annen.

Forventet:

- Akkorden fjernes fra opprinnelig linje.
- Samme akkord-ID legges på mållinjen.
- Ny `pos` beregnes på mållinjen.

## Test 9 – tekstoppdatering

1. Endre vokaltekst i en linje.
2. Endre koring i samme linje.

Forventet:

- Visuell forhåndsvisning oppdateres mens det skrives.
- Eksisterende akkorder beholdes.
- Linjen utvider arbeidsflaten ved behov.

## Test 10 – lagre og lese tilbake

1. Gjør minst én visuell akkordendring.
2. Noter valgt akkords posisjon.
3. Lagre sangen.
4. Last sangbiblioteket på nytt eller reload siden.
5. Åpne samme sang.

Forventet:

- Akkorden vises på samme tegnposisjon.
- Endret tekst/akkordnavn er bevart.
- Vanlig sangvisning rendrer samme data korrekt.

## Test 11 – ny sang

1. Opprett en ny sang.
2. Legg inn akkorder i `Akkordsett`.
3. Dra akkorder til en linje.
4. Lagre.
5. Reload.

Forventet:

- Ny sang opprettes og kan leses tilbake.
- Akkordposisjoner er bevart.

## Test 12 – eksisterende editorfunksjoner

Kontroller fortsatt:

- legg til/fjern/flytt linje
- legg til/fjern/flytt seksjon
- seksjonstype
- seksjonstranspose
- sangtranspose
- valgfri BPM/autoscroll-data
- vokal og koring

Forventet:

- Funksjonene fra Milestone 3 virker som før.

## Test 13 – konfliktregresjon

Gjennomfør samme ETag-konflikttest som i Milestone 3 med en testsang.

Forventet:

- En eldre versjon kan ikke stille overskrive nyere data.
- Konflikt stopper lagring med tydelig melding.

## Test 14 – touch i Safari på iPad

Dette er en sekundær test etter at desktop-testene passerer.

1. Åpne GitHub Pages-versjonen i vanlig Safari på iPad.
2. Rediger en testsang.
3. Dra en palettakkord til en linje.
4. Dra en eksisterende akkord.
5. Bruk `−`, `+` og numerisk posisjon.

Forventet:

- Touch bruker samme Pointer Events-flyt.
- Siden skal ikke kreve klassisk HTML5 drag-and-drop.

Feil som bare opptrer i installert PWA dokumenteres separat og trenger ikke automatisk behandles som feil i Milestone 4.
