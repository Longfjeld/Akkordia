# Integrering av Milestone 5

## Forutsetning

Denne leveransen er bygget direkte på den testede versjonen i:

```text
Akkordia-current(4).zip
```

Alle Milestone 4-tester var oppgitt som bestått før denne leveransen ble laget.

## Filer som skal kopieres

Kopier/erstatt:

```text
index.html
css/app.css
js/app.js
```

Legg til:

```text
js/setlists.js
js/setlist-editor.js
docs/ONEDRIVE-MILESTONE-5.md
```

Innholdet i:

```text
docs/DECISIONS-ADDENDUM-M5.md
```

legges nederst i eksisterende:

```text
docs/DECISIONS.md
```

Deretter kan `DECISIONS-ADDENDUM-M5.md` slettes.

## Kontroll før commit

Kjør:

```bash
git status
git diff
```

Kontroller spesielt at eksisterende autentiserings- og providerfiler ikke er endret:

```text
js/auth.js
js/config.js
js/graph.js
js/onedrive.js
js/songs.js
js/editor.js
js/workspaces.js
```

Milestone 5 trenger ingen nye npm-avhengigheter.

## JavaScript-kontroll

Kjør:

```bash
node --check js/app.js
node --check js/setlists.js
node --check js/setlist-editor.js
```

Alle skal fullføre uten feil.

## Commit

Forslag:

```bash
git add index.html css/app.css js/app.js js/setlists.js js/setlist-editor.js docs
git diff --cached
git commit -m "Add set-list workflow"
git push
```

## Funksjonstest

Når GitHub Pages er oppdatert, gjennomfør hele:

```text
docs/ONEDRIVE-MILESTONE-5.md
```

Primær test gjøres fortsatt i vanlig Safari på Mac.
