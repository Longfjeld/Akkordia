# INTEGRATE-M7.1

Milestone 7.1 er bygget direkte på siste testede `Akkordia-current(10).zip`.

## Endrede filer

Erstatt:

```text
index.html
manifest.webmanifest
sw.js
css/app.css
```

Legg til:

```text
docs/ONEDRIVE-MILESTONE-7.1.md
docs/DECISIONS-ADDENDUM-M7.1.md
```

`assets/` er allerede en del av repositoryet og skal ikke erstattes.

## Git

Kontroller:

```bash
git status
git diff
```

Legg til:

```bash
git add index.html manifest.webmanifest sw.js css/app.css docs/ONEDRIVE-MILESTONE-7.1.md docs/DECISIONS-ADDENDUM-M7.1.md
```

Kontroller staged diff:

```bash
git diff --cached
```

Forslag til commit:

```bash
git commit -m "Add PWA icons and touch polish"
git push
```

## Viktig

Service-worker-cacheversjonen er endret. Etter publisering bør siden åpnes online og lastes på nytt før offline-test.

Følg deretter:

```text
docs/ONEDRIVE-MILESTONE-7.1.md
```
