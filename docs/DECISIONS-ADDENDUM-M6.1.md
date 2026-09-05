# DECISIONS-ADDENDUM-M6.1

## Én enkel tekstimportmetode

Akkordia støtter i første omgang bare innliming av ren tekst i et eget importfelt.

Det innføres ikke separat filimport eller Markdown-parser.

## Seksjonsmarkører

Seksjoner kan angis med enkel syntaks:

```text
[Vers 1]
[Chorus]
[Bridge]
```

Syntaksen er menneskelesbar og krever ingen ekstern parser.

## Import erstatter seksjoner

Tekstimport erstatter eksisterende seksjoner i editorens kladd.

Hvis kladden allerede inneholder meningsfullt innhold, kreves eksplisitt bekreftelse.

Ingen data skrives til OneDrive før vanlig `Lagre` brukes.

## Song schema

Milestone 6.1 endrer ikke Song schema v1. Importfunksjonen produserer bare eksisterende seksjons- og linjeobjekter.
