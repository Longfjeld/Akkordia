# INTEGRATE-M6

Milestone 6 er bygget direkte på siste testede `Akkordia-current(6).zip`.

## Nye filer

Kopier inn:

```text
js/player.js
docs/ONEDRIVE-MILESTONE-6.md
docs/DECISIONS-ADDENDUM-M6.md
```

## Endrede filer

Erstatt med versjonene fra leveransen:

```text
js/app.js
index.html
css/app.css
```

## Kontroll før commit

```bash
git status
git diff
```

Legg til filene:

```bash
git add js/player.js js/app.js index.html css/app.css docs/ONEDRIVE-MILESTONE-6.md docs/DECISIONS-ADDENDUM-M6.md
```

Kontroller staged endringer:

```bash
git diff --cached
```

Forslag til commit:

```bash
git commit -m "Add setlist play mode with autoscroll and wake lock"
git push
```

Når GitHub Pages er oppdatert, gjennomfør testen i:

```text
docs/ONEDRIVE-MILESTONE-6.md
```

Ikke gå videre til offline-cache før Milestone 6-testen er bestått.
