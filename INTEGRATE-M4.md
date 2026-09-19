# Integrering – Milestone 4

## Utgangspunkt

Denne leveransen er bygget direkte på den opplastede og testede versjonen:

```text
Akkordia-current(3).zip
```

Milestone 4 endrer bare editorlaget og CSS for visuell akkordredigering.

## Filer som skal erstattes

Kopier følgende filer fra leveransen til repositoryet og erstatt eksisterende filer:

```text
js/editor.js
css/app.css
```

## Dokumentasjon

Kopier:

```text
docs/ONEDRIVE-MILESTONE-4.md
```

inn i repositoryets `docs/`.

Legg innholdet fra:

```text
docs/DECISIONS-ADDENDUM-M4.md
```

nederst i eksisterende:

```text
docs/DECISIONS.md
```

Når innholdet er flettet inn, trenger ikke `DECISIONS-ADDENDUM-M4.md` ligge permanent i repositoryet.

## Ingen endring kreves i

Milestone 4 krever ingen endring i:

```text
index.html
js/app.js
js/auth.js
js/config.js
js/graph.js
js/onedrive.js
js/songs.js
js/storage.js
js/workspaces.js
vendor/
```

Dette er bevisst for å redusere regresjonsrisiko i allerede verifiserte funksjoner.

## Lokal syntakskontroll

Kjør:

```bash
node --check js/editor.js
node --check js/app.js
node --check js/songs.js
```

Alle tre skal avslutte uten output/feil.

## Kontroller Git-endringer

```bash
git status
git diff -- js/editor.js css/app.css docs/
```

Kontroller spesielt at det ikke har kommet utilsiktede endringer i autentiserings- eller Graph-koden.

## Commit

Når kontrollen er OK:

```bash
git add js/editor.js css/app.css docs/ONEDRIVE-MILESTONE-4.md docs/DECISIONS.md
git diff --cached
git commit -m "Add visual chord editor"
git push
```

## Test

Vent til GitHub Pages har publisert committen.

Gjennomfør deretter hele testløpet i:

```text
docs/ONEDRIVE-MILESTONE-4.md
```

Primærtest gjøres først i Safari på Mac.

Touch-test i vanlig Safari på iPad kan gjennomføres etterpå. Installert PWA på iPad behandles fortsatt som et eget plattformtestpunkt.
