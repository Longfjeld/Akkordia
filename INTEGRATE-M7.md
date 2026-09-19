# INTEGRATE-M7

Milestone 7 er bygget direkte på siste testede `Akkordia-current(8).zip`.

## Nye filer

Kopier inn:

```text
js/offline.js
sw.js
manifest.webmanifest
docs/ONEDRIVE-MILESTONE-7.md
docs/DECISIONS-ADDENDUM-M7.md
```

## Endrede filer

Erstatt:

```text
index.html
js/app.js
css/app.css
```

## Git

Kontroller først:

```bash
git status
git diff
```

Legg til:

```bash
git add index.html js/app.js js/offline.js css/app.css sw.js manifest.webmanifest docs/ONEDRIVE-MILESTONE-7.md docs/DECISIONS-ADDENDUM-M7.md
```

Kontroller:

```bash
git diff --cached
```

Forslag til commit:

```bash
git commit -m "Add offline read cache and PWA service worker"
git push
```

## Viktig før offline-test

Etter publisering må Akkordia åpnes online minst én gang slik at:

```text
service worker
+
app shell cache
+
IndexedDB workspace snapshot
```

blir etablert.

Last gjerne siden på nytt én gang online før nett kobles fra.

## Test

Følg hele:

```text
docs/ONEDRIVE-MILESTONE-7.md
```

Desktop-test gjennomføres først. Deretter vanlig Safari på iPad, og til slutt en nyinstallert iPad-PWA.
