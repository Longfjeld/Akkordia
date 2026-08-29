# ONEDRIVE-INTEGRATION-PLAN

## Mål

Første storage-provider skal være OneDrive for private Microsoft-kontoer.

Akkordia er en statisk Single Page Application og skal ikke ha client secret eller egen autentiseringsserver.

## Autentisering

Bruk:

```text
@azure/msal-browser
```

med Authorization Code Flow + PKCE.

Microsofts dokumentasjon beskriver MSAL Browser som biblioteket for JavaScript-SPA-er og støtter personlige Microsoft-kontoer.

## App registration

Før OneDrive-koden kan testes må Akkordia registreres som en SPA hos Microsoft.

Foreslått registrering:

|Innstilling|Verdi|
|:---|:---|
|Navn|`Akkordia`|
|Kontotype|Personal Microsoft accounts|
|Plattform|Single-page application (SPA)|
|Produksjons-redirect|`https://longfjeld.github.io/Akkordia/`|

For lokal utvikling legges en lokal HTTPS/HTTP redirect URI til når lokal utviklingsserver er bestemt.

## Graph permission

Første versjon trenger delegert:

```text
Files.ReadWrite
```

Denne tillatelsen støttes for personlige Microsoft-kontoer.

Akkordia skal likevel selv avgrense filoperasjoner til det eksplisitt valgte workspacet.

## Provider-kontrakt

Providerlaget skal holdes lite.

Foreslått kontrakt:

```javascript
connect()
disconnect()
getWorkspace(ref)
listFolders(ref)
listFiles(ref)
readJson(ref, path)
writeJson(ref, path, value, options)
createFolder(ref, name)
deleteItem(ref, path)
```

Kontrakten skal justeres dersom implementasjonen viser at færre operasjoner er tilstrekkelig.

## Faseinndeling

### Trinn A

- registrer Akkordia som Microsoft SPA
- få innlogging til å fungere
- hent Graph-token
- vis innlogget Microsoft-konto

### Trinn B

- naviger i OneDrive-mapper
- velg eksisterende BoM-mappe
- les `akkordia.json`
- valider workspace
- registrer BoM lokalt

### Trinn C

- les `songs/`
- vis sangbibliotek
- cache offline

### Trinn D

- opprett nytt workspace fra appen
- opprett `akkordia.json`
- opprett `songs/`
- opprett `setlists/`

### Trinn E

- rediger og lagre sang
- bruk ETag / optimistic concurrency

## Best practice

Det skal ikke legges secrets i GitHub-repositoryet.

`clientId` for en SPA er ikke en secret og kan ligge i klientkonfigurasjonen.

Tokens håndteres av MSAL og skal ikke kopieres inn i Akkordias egne JSON-filer eller workspace-data.
