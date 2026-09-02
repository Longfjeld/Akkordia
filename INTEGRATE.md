# Integrering – OneDrive milepæl 1

## 1. Kopier filer

Kopier følgende til rotkatalogen for Akkordia-repositoryet:

```text
index.html
css/
js/
tools/vendor-msal.mjs
package.json
docs/ONEDRIVE-MILESTONE-1.md
```

Legg innholdet i:

```text
docs/DECISIONS-ADDENDUM.md
```

nederst i eksisterende:

```text
docs/DECISIONS.md
```

og slett deretter `DECISIONS-ADDENDUM.md`.

## 2. `.gitignore`

Kontroller at følgende finnes:

```gitignore
node_modules/
```

`vendor/` skal ikke ignoreres.

## 3. Hent MSAL

Fra repository-roten på Mac:

```bash
npm install
npm run vendor:msal
```

Dette skal opprette:

```text
vendor/msal-browser.min.js
vendor/MSAL-LICENSE.txt
vendor/MSAL-VERSION.txt
package-lock.json
```

`node_modules/` skal ikke committes.

## 4. Kontroller

```bash
git status
git diff
```

Kontroller spesielt at Client ID i:

```text
js/config.js
```

er:

```text
9ec284d6-9099-4b14-b260-50152bb88bc9
```

## 5. Commit

```bash
git add index.html css js tools package.json package-lock.json vendor docs
git diff --cached
git commit -m "Add Microsoft sign-in and OneDrive workspace connection"
git push
```

## 6. Vent på GitHub Pages

Når GitHub Pages har publisert endringen, åpne:

```text
https://longfjeld.github.io/Akkordia/
```

Følg testene i:

```text
docs/ONEDRIVE-MILESTONE-1.md
```

## Viktig

Denne milepælen skriver ikke til OneDrive. Den leser mapper og `akkordia.json` og lagrer bare workspace-referansen lokalt i nettleseren.
