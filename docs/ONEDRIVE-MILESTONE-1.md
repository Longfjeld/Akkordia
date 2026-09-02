# OneDrive – milepæl 1

## Mål

Første OneDrive-milepæl skal bare bevise denne kjeden:

```text
Akkordia på GitHub Pages
↓
Microsoft-innlogging
↓
Microsoft Graph
↓
OneDrive-mappevelger
↓
les akkordia.json
↓
valider workspace
↓
registrer valgt band lokalt
```

Sangbibliotek, redigering, set-lister og offline-cache inngår ikke i denne milepælen.

## App registration

|Innstilling|Verdi|
|:---|:---|
|Client ID|`9ec284d6-9099-4b14-b260-50152bb88bc9`|
|Authority|`https://login.microsoftonline.com/common`|
|Redirect URI|`https://longfjeld.github.io/Akkordia/`|
|Graph delegated permissions|`User.Read`, `Files.ReadWrite`|

Det skal ikke finnes noen client secret.

## MSAL

Akkordia bruker `@azure/msal-browser` v5 som statisk tredjepartsfil under `vendor/`.

NPM brukes bare for å hente en eksplisitt versjon av biblioteket under utvikling. GitHub Pages trenger ingen Node-prosess eller build-kjede.

```text
npm install
npm run vendor:msal
```

`node_modules/` skal ikke committes. `vendor/msal-browser.min.js`, lisensfilen og versjonsfilen committes.

## Mappevelger

Mappevelgeren starter i brukerens OneDrive-rot og viser bare mapper.

Når brukeren velger `Bruk denne mappen`, må valgt mappe inneholde:

```text
akkordia.json
songs/
setlists/
```

`akkordia.json` må dessuten ha:

```text
format = akkordia-workspace
schemaVersion = 1
gyldig workspaceId
ikke-tomt name
```

## Lokal registrering

Et godkjent OneDrive-workspace lagres lokalt omtrent slik:

```json
{
  "workspaceId": "...",
  "name": "BoM",
  "provider": "onedrive",
  "driveId": "...",
  "itemId": "..."
}
```

Det lagres ikke lokal OneDrive-filbane som teknisk identitet.

## Test

1. Åpne `https://longfjeld.github.io/Akkordia/`.
2. Trykk `Koble til band`.
3. Logg inn med den private Microsoft-kontoen.
4. Godta nødvendige Graph-rettigheter dersom Microsoft spør.
5. Trykk `Koble til band` igjen dersom redirecten returnerer til startsiden.
6. Naviger til `Akkordia-data` → `BoM`.
7. Trykk `Bruk denne mappen`.
8. Kontroller at toppområdet viser `BoM`.
9. Last siden på nytt.
10. Kontroller at `BoM` fortsatt vises som aktivt band.

## Forventede feiltester

|Test|Forventet resultat|
|:---|:---|
|Velg `Akkordia-data` i stedet for `BoM`|Avvises fordi `akkordia.json` mangler|
|Velg mappe uten `songs/`|Avvises|
|Velg mappe uten `setlists/`|Avvises|
|Ikke innlogget og trykk `Koble til band`|Microsoft-innlogging starter|
|Oppdater siden etter vellykket kobling|Aktivt workspace beholdes lokalt|
