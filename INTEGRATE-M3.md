# Integrering av Milestone 3

Denne leveransen er bygget på siste opplastede og testede `Akkordia-current.zip` etter Milestone 2.

## Filer som skal erstattes

Kopier følgende filer til repositoryet og erstatt eksisterende versjoner:

```text
index.html
css/app.css
js/app.js
js/graph.js
js/songs.js
```

## Ny fil

Legg til:

```text
js/editor.js
```

## Dokumentasjon

Legg til:

```text
docs/ONEDRIVE-MILESTONE-3.md
```

Legg inn innholdet fra:

```text
docs/DECISIONS-ADDENDUM-M3.md
```

nederst i eksisterende:

```text
docs/DECISIONS.md
```

Deretter kan addendum-filen slettes.

## Syntakskontroll

Fra repository-roten:

```bash
node --check js/app.js
node --check js/editor.js
node --check js/graph.js
node --check js/songs.js
```

## Git-kontroll

```bash
git status
git diff
```

Legg til filene:

```bash
git add index.html css/app.css js/app.js js/editor.js js/graph.js js/songs.js docs
```

Kontroller staged endringer:

```bash
git diff --cached
```

Forslag til commit:

```bash
git commit -m "Add song editing and OneDrive save support"
```

Push:

```bash
git push
```

Vent til GitHub Pages har publisert endringen.

## Test

Gjennomfør testene i:

```text
docs/ONEDRIVE-MILESTONE-3.md
```

Bruk helst en ny testsang ved konflikt- og strukturelle tester.

Ikke fortsett til neste milepæl før redigering, ny sang og konfliktbeskyttelse er verifisert.
