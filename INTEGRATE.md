# Integrering

Denne leveransen etablerer:

```text
workspace-livssyklus
lokalt workspace-register
minimal app-shell
plan for OneDrive-integrasjon
```

## Kopier til repository

Kopier:

```text
index.html
css/
js/
docs/WORKSPACE-LIFECYCLE.md
docs/ONEDRIVE-INTEGRATION-PLAN.md
```

til tilsvarende plasseringer i Akkordia-repositoryet.

Innholdet i:

```text
docs/DECISIONS-ADDENDUM.md
```

legges nederst i eksisterende:

```text
docs/DECISIONS.md
```

Deretter kan `DECISIONS-ADDENDUM.md` slettes.

## Før commit

Kontroller:

```bash
git status
git diff
```

Legg til:

```bash
git add index.html css js docs
```

Kontroller staged endringer:

```bash
git diff --cached
```

Forslag til commit:

```bash
git commit -m "Add workspace lifecycle and initial app shell"
```

## Neste tekniske forutsetning

Før OneDrive-integrasjonen kan implementeres og testes må Akkordia få en Microsoft app registration for en SPA.

Se:

```text
docs/ONEDRIVE-INTEGRATION-PLAN.md
```
