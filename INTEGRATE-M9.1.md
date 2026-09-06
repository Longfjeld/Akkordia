# Integrering – OneDrive milepæl 9.1

## Formål

Milestone 9.1 er en liten korrigering etter praktisk test av private notater på iPad og Mac.

Endringen skal legges **oppå eksisterende repository**. Ikke slett, erstatt eller pakk ut et komplett nytt repository. Filer som ligger lokalt og er skjult av `.gitignore` skal bli stående urørt.

## 1. Utgangspunkt

Milestone 9 / Private notater skal allerede være kopiert inn lokalt.

Kontroller gjerne før du kopierer 9.1:

```bash
git status
```

Hvis du har lokale, ikke-committede endringer du vil beholde, noter dem før videre arbeid.

## 2. Kopier kun filene fra 9.1-pakken

Pakken inneholder bare nye/endrede filer:

```text
INTEGRATE.md
css/app.css
js/app.js
js/player.js
sw.js
docs/PRIVATE-NOTES.md
docs/ONEDRIVE-MILESTONE-9.1.md
```

Kopier disse til tilsvarende plassering i eksisterende repository.

**Ikke** slett andre filer eller kataloger.

## 3. Hva endringen gjør

Private notater beholder rask lokal lagring, men OneDrive-synk skjer ikke lenger midt i normal skriving:

```text
input
  ↓ ca. 250 ms
IndexedDB
  ↓
Venter på synk
  ↓ ca. 5 s etter siste endring
OneDrive
```

Hvis notatfeltet fortsatt har fokus når 5-sekundersfristen går ut, utføres ingen OneDrive-synk midt i redigeringen. Når feltet forlates forsøkes synk raskere, etter omtrent 500 ms.

`Venter på synk` er klikkbar når appen er online og kan brukes som manuell **Synkroniser nå** uten en ekstra knapp.

Vanlig OneDrive-synk re-rendrer ikke lenger sangvisningen. Dette hindrer at Safari/iPad erstatter textarea-elementet og lukker skjermtastaturet mens brukeren skriver.

## 4. Service worker

`sw.js` bruker nytt cache-navn:

```text
akkordia-shell-private-notes-9-1-v1
```

Dette er nødvendig for at installert PWA og tidligere besøkte nettlesere skal hente oppdatert JavaScript/CSS.

Etter publisering bør første test gjøres online med full reload. På installert PWA kan det være nødvendig å lukke og åpne appen etter at ny service worker er aktivert.

## 5. Kontroller endringene

Fra repository-roten:

```bash
git status
git diff -- INTEGRATE.md css/app.css js/app.js js/player.js sw.js docs/PRIVATE-NOTES.md docs/ONEDRIVE-MILESTONE-9.1.md
```

Kontroller spesielt at ingen lokale `.gitignore`-filer eller andre lokale data er slettet.

## 6. Commit og push

Når diffen ser riktig ut:

```bash
git add INTEGRATE.md css/app.css js/app.js js/player.js sw.js docs/PRIVATE-NOTES.md docs/ONEDRIVE-MILESTONE-9.1.md
git diff --cached
git commit -m "Improve private note sync while editing"
git push
```

## 7. Test

Når GitHub Pages har publisert endringen, følg testene i:

```text
docs/ONEDRIVE-MILESTONE-9.1.md
```

Prioriter iPad-testen først, fordi dette er hovedårsaken til 9.1.
