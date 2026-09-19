# INTEGRATE-M8

Milestone 8 er bygget direkte på den avtalte baseline:

```text
Akkordia-current(20260906-072011).zip
```

## Endrede filer

Erstatt:

```text
js/player.js
css/app.css
sw.js
```

Legg til:

```text
docs/ONEDRIVE-MILESTONE-8.md
docs/DECISIONS-ADDENDUM-M8.md
```

Ingen data-schema er endret.

## Service worker

Cacheversjonen er endret til:

```text
akkordia-shell-m8-v1
```

Dette er nødvendig fordi `player.js` og `app.css` er endret.

## Git

Kontroller først:

```bash
git status
git diff
```

Legg til:

```bash
git add js/player.js css/app.css sw.js docs/ONEDRIVE-MILESTONE-8.md docs/DECISIONS-ADDENDUM-M8.md
```

Kontroller staged diff:

```bash
git diff --cached
```

Forslag til commit:

```bash
git commit -m "Improve performance mode UX"
git push
```

Etter GitHub Pages-publisering bør Akkordia åpnes online og lastes på nytt minst én gang slik at den nye service-worker-cachen aktiveres.

Gjennomfør deretter hele testen i:

```text
docs/ONEDRIVE-MILESTONE-8.md
```
