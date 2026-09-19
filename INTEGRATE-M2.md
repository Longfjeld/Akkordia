# Integrering – Milestone 2

Denne pakken er bygget direkte fra den opplastede og testede `Akkordia-current.zip`.

## Filer som endres

```text
index.html
css/app.css
js/app.js
```

## Ny fil

```text
js/songs.js
docs/ONEDRIVE-MILESTONE-2.md
```

## Dokumentasjon

Legg inn beslutningene fra:

```text
docs/DECISIONS-ADDENDUM-M2.md
```

nederst i eksisterende:

```text
docs/DECISIONS.md
```

Deretter kan `DECISIONS-ADDENDUM-M2.md` slettes.

## Ingen endringer i fungerende Milestone 1-moduler

Følgende er beholdt uendret:

```text
js/auth.js
js/config.js
js/graph.js
js/onedrive.js
js/workspaces.js
vendor/
```

## Lokal syntakskontroll

Fra repository-roten:

```bash
node --check js/app.js
node --check js/songs.js
node --check js/auth.js
node --check js/graph.js
node --check js/onedrive.js
```

Alle skal avslutte uten output/feil.

## Git-kontroll

```bash
git status
git diff
```

Etter kontroll:

```bash
git add index.html css/app.css js/app.js js/songs.js docs
git diff --cached
```

Forslag til commit:

```bash
git commit -m "Add read-only OneDrive song library"
git push
```

Vent til GitHub Pages er oppdatert og gjennomfør deretter testene i:

```text
docs/ONEDRIVE-MILESTONE-2.md
```

## Tilbakerulling

Hvis Milestone 2 gir problemer, kan commiten reverseres uten å påvirke OneDrive-dataene. Denne milepælen utfører ingen skriveoperasjoner mot `songs/`.
