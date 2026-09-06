# ONEDRIVE-MILESTONE-10

## Formål

Milestone 10 forbedrer opplevd ytelse for set-lister ved å bruke eksisterende RAM-/IndexedDB-cache før appen venter på OneDrive.

Bakgrunnen er praktisk observasjon av at set-lister åpnes merkbart raskere når Akkordia er offline. Online-flyten gjorde tidligere en full OneDrive-lesing ved åpning av Set-lister-visningen, selv om de samme set-listene kunne være forhåndslastet ved oppstart.

Målet er:

- set-lister skal vises umiddelbart når lokal cache finnes
- OneDrive skal fortsatt være autoritativ kilde
- redigering skal ikke tillates mot ukontrollert cache
- samme set-listdatasett skal ikke lastes unødvendig flere ganger i samme app-økt
- eksplisitt Oppdater skal fortsatt kunne fremtvinge ny OneDrive-lesing
- eksisterende offline- og konfliktmodell skal beholdes

## Ny lesemodell

### Før

```text
Åpne Set-lister
      ↓
OneDrive: list setlists/
      ↓
én Graph-lesing per JSON-fil
      ↓
vent
      ↓
vis set-lister
      ↓
oppdater IndexedDB
```

### Milestone 10

```text
Åpne Set-lister
      ↓
RAM tilgjengelig?
  ja ↓      nei
    vis      ↓
         IndexedDB?
          ja ↓
            vis
             ↓
       OneDrive i bakgrunnen
             ↓
       oppdater RAM/cache
             ↓
       aktiver redigering
```

Dersom ingen lokal cache finnes, må første innlasting fortsatt vente på OneDrive.

## Sesjonscache

Når set-listene én gang er kontrollert mot OneDrive i gjeldende app-økt, regnes RAM-kopien som oppdatert for den økten.

Bytte mellom:

```text
Sanger → Set-lister → Sanger → Set-lister
```

skal derfor ikke starte en ny full Graph-lesing hver gang.

Dette er ikke sanntidssynk. Dersom en annen enhet endrer en set-list, kan brukeren bruke den eksisterende Oppdater-funksjonen for å hente fersk versjon umiddelbart.

## Oppstart

Ved appstart:

1. eksisterende set-listcache leses fra IndexedDB
2. cache legges i RAM
3. hvis appen er online og innlogget startes OneDrive-kontroll i bakgrunnen
4. appoppstart blokkeres ikke av hele set-listnedlastingen
5. når OneDrive svarer oppdateres RAM og IndexedDB

Hvis brukeren åpner Set-lister mens bakgrunnskontrollen fortsatt pågår, vises cache straks og den samme pågående OneDrive-operasjonen gjenbrukes. Det skal ikke startes en ny parallell full lasting.

## Midlertidig lesemodus

Cache som ennå ikke er kontrollert mot OneDrive kan brukes til:

- visning
- valg av set-list
- Spill

men ikke til redigering av fellesdata.

Når OneDrive-kontrollen lykkes, går set-listene tilbake til normal skrivbar online-modus.

## Hvorfor UI kan oppdateres etter bakgrunnskontroll selv om JSON er lik

Set-listobjektene som lastes fra OneDrive får intern informasjon om:

- drive
- item-ID
- `eTag`

Disse metadataene brukes når en eksisterende set-list lagres med `If-Match`.

Derfor erstattes cacheobjektene av OneDrive-objektene etter kontrollen. Dette er nødvendig for at senere redigering skal oppdatere eksisterende fil og beholde konfliktsikker lagring.

## Manuell Oppdater

Eksisterende Oppdater-funksjon skal fortsatt være en eksplisitt tvungen refresh.

Den skal:

1. kontakte OneDrive selv om sesjonscachen allerede er fersk
2. hente set-listene på nytt
3. oppdatere IndexedDB
4. oppdatere visningen

Dette gir brukeren en enkel måte å hente endringer fra en annen enhet uten kontinuerlig polling.

# Tester

## Test 1 – hovedtest: rask åpning fra cache

Forberedelse:

1. Kjør Akkordia online minst én gang slik at set-listcache finnes.
2. Lukk appen/nettleserfanen.
3. Start Akkordia på nytt online.

Test:

1. Vent til sangvisningen er tilgjengelig.
2. Åpne `Set-lister` relativt raskt etter oppstart.
3. Observer hvor raskt listen blir synlig.
4. Kontroller at cached set-lister vises før full OneDrive-henting er ferdig dersom bakgrunnshentingen fortsatt pågår.
5. Kontroller statusmelding, eksempelvis:

```text
N set-lister fra lokal cache · oppdaterer fra OneDrive …
```

6. Vent til OneDrive-kontrollen er ferdig.
7. Kontroller at status går over til synkronisert/oppdatert tilstand.

Forventet resultat:

```text
PASS: Set-listene oppleves tilgjengelige omtrent umiddelbart fra lokal cache.
```

## Test 2 – ingen dobbel lasting ved rask navigasjon

1. Start appen online med eksisterende cache.
2. Åpne Set-lister mens oppstartsoppdateringen fortsatt kan være i gang.
3. Bytt tilbake til Sanger.
4. Åpne Set-lister igjen.
5. Kontroller at UI fortsatt responderer raskt.
6. Hvis nettleserens utviklerverktøy brukes, kontroller at navigasjonen ikke utløser en ny komplett serie med Graph-lesinger per set-list hver gang.

Det viktigste funksjonelle resultatet er at navigasjon ikke stopper og venter på en ny full OneDrive-runde.

## Test 3 – sesjonscache etter fullført synk

1. Start online.
2. Vent til set-listene er ferdig synkronisert.
3. Åpne Set-lister.
4. Bytt til Sanger.
5. Gå tilbake til Set-lister flere ganger.
6. Kontroller at listen vises umiddelbart.
7. Kontroller at status kan vise at data allerede er synkronisert i denne økten.

## Test 4 – Oppdater fremtvinger OneDrive-lesing

1. Ha Akkordia åpen på enhet A.
2. Endre eller opprett en set-list fra enhet B, eller gjør en kjent endring direkte gjennom normal Akkordia-bruk på en annen klient.
3. På enhet A: åpne Set-lister.
4. Kontroller at sesjonscachen kan vise gammel versjon før eksplisitt refresh.
5. Trykk eksisterende `Oppdater`.
6. Kontroller at endringen fra enhet B blir hentet.
7. Kontroller at den nye versjonen vises.

Dette bekrefter at Milestone 10 ikke har gjort Oppdater-knappen til en ren cache-operasjon.

## Test 5 – redigering etter bakgrunnssynk

1. Start appen online med eksisterende set-listcache.
2. Åpne Set-lister raskt.
3. Hvis OneDrive-kontrollen ikke er ferdig, kontroller at ny/rediger-funksjon midlertidig ikke er tilgjengelig.
4. Vent til OneDrive-kontrollen er ferdig.
5. Åpne en eksisterende set-list for redigering.
6. Gjør en liten endring.
7. Lagre.
8. Kontroller at eksisterende JSON-fil oppdateres og at det **ikke** opprettes en duplikatfil.
9. Last set-listene på nytt og kontroller at endringen består.

Denne testen er viktig fordi cacheobjektene ikke selv inneholder OneDrive `eTag`/item-metadata.

## Test 6 – faktisk endring i OneDrive under oppstart

1. Sørg for at cache på enhet A inneholder versjon X av en set-list.
2. Endre samme set-list på enhet B slik at OneDrive inneholder versjon Y.
3. Start Akkordia på enhet A online.
4. Åpne Set-lister raskt.
5. Kontroller at versjon X kan vises først fra cache.
6. Vent på bakgrunnsoppdatering.
7. Kontroller at visningen går over til versjon Y.
8. Kontroller at videre redigering tar utgangspunkt i versjon Y.

## Test 7 – offline beholdes uendret

1. Synkroniser online.
2. Gå offline.
3. Start eller åpne Akkordia.
4. Åpne Set-lister.
5. Kontroller at cached set-lister vises.
6. Kontroller tydelig offline-status.
7. Kontroller at felles set-listdata er kun lesing.
8. Start Spill fra en cached set-list.
9. Kontroller at Spill fungerer som før.

## Test 8 – tilbake online

1. Start offline med cached set-lister.
2. Åpne Set-lister.
3. Gå online igjen.
4. Kontroller at appen revaliderer set-listene mot OneDrive.
5. Kontroller at redigering aktiveres igjen etter vellykket oppdatering.

## Test 9 – ingen cache

Denne testen kan gjøres i en ren nettleserprofil eller etter å ha fjernet nettstedets IndexedDB-data.

1. Start Akkordia uten set-listcache.
2. Logg inn og velg workspace.
3. Åpne Set-lister.
4. Kontroller at appen viser lasting fra OneDrive.
5. Kontroller at set-listene vises når Graph-lesingen er ferdig.
6. Last appen på nytt.
7. Kontroller at neste åpning nå kan bruke cache-first.

## Test 10 – enkel regresjon

Kontroller til slutt:

1. Sanger lastes og vises som før.
2. Sangeredigering fungerer.
3. Set-listredigering og lagring fungerer.
4. Ny set-list kan opprettes.
5. Spill kan startes fra set-list.
6. Private notater fra Milestone 9/9.1 fungerer.
7. Offline-lesing fungerer.
8. Service worker oppdateres til Milestone 10-cache.

## Utenfor scope

- cache-first-optimalisering av sangbiblioteket
- Graph delta queries
- kontinuerlig polling etter eksterne endringer
- sanntidsoppdatering mellom flere enheter
- manuell global Offline-mode
- offline-redigering av felles sang-/set-listdata
- endring av JSON-schema for set-lister
