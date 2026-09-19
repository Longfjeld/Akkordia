# INTEGRATE-M6.1

Milestone 6.1 er bygget direkte på siste testede `Akkordia-current(7).zip`.

## Endrede filer

Erstatt:

```text
js/editor.js
css/app.css
```

Legg til:

```text
docs/ONEDRIVE-MILESTONE-6.1.md
docs/DECISIONS-ADDENDUM-M6.1.md
```

Ingen andre kjørende moduler er endret.

## Kontroll før commit

```bash
git status
git diff
```

Legg til filene og kontroller staged diff:

```bash
git add js/editor.js css/app.css docs/ONEDRIVE-MILESTONE-6.1.md docs/DECISIONS-ADDENDUM-M6.1.md
git diff --cached
```

Forslag til commit:

```bash
git commit -m "Add plain text song import"
git push
```

Gjennomfør deretter testløpet i:

```text
docs/ONEDRIVE-MILESTONE-6.1.md
```
