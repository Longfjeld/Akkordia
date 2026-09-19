# Integrering – OneDrive milepæl 9

## 1. Utgangspunkt

Denne milepælen innfører **Private notater**.

Du har allerede kopiert filene fra:

```text
Akkordia-private-notater-endringer-20260906.zip
```

inn i ditt lokale Akkordia-repository.

**Ikke erstatt hele repositoryet.**

Det lokale repositoryet kan inneholde filer som bevisst er utelatt fra Git og ligger i `.gitignore`. De skal ikke slettes eller erstattes.

Arbeidet i denne veiledningen skal derfor gjøres mot eksisterende lokal arbeidskopi.

## 2. Filer som skal være nye eller endret

Kontroller at disse filene nå finnes i repositoryet:

```text
css/app.css
js/app.js
js/graph.js
js/player.js
js/private-notes.js
sw.js
docs/DATA-FORMAT.md
docs/DECISIONS.md
docs/PRIVATE-NOTES.md
docs/PROJECT-PLAN.md
docs/TESTING.md
```

`js/private-notes.js` og `docs/PRIVATE-NOTES.md` er nye filer.

De øvrige filene er endret.

Legg også denne milepældokumentasjonen i:

```text
docs/ONEDRIVE-MILESTONE-9.md
```

## 3. Kontroller repositoryet før commit

Fra repository-roten:

```bash
git status --short
```

Forvent at filene ovenfor vises som endret eller nye.

Kontroller deretter de faktiske kodeendringene:

```bash
git diff -- \
  css/app.css \
  js/app.js \
  js/graph.js \
  js/player.js \
  sw.js \
  docs/DATA-FORMAT.md \
  docs/DECISIONS.md \
  docs/PROJECT-PLAN.md \
  docs/TESTING.md
```

De nye filene vises ikke nødvendigvis i vanlig `git diff` før de er staged. Les dem derfor også direkte:

```bash
sed -n '1,260p' js/private-notes.js
sed -n '1,260p' docs/PRIVATE-NOTES.md
sed -n '1,320p' docs/ONEDRIVE-MILESTONE-9.md
```

## 4. Viktig: ikke rydd repositoryet automatisk

Ikke bruk kommandoer som:

```bash
git clean -fdx
```

eller andre kommandoer som sletter ignorerte filer.

Ikke pakk ut en komplett Akkordia-ZIP over repositoryet.

Denne milepælen skal integreres ved å beholde eksisterende repository og bare arbeide med de eksplisitt endrede filene.

## 5. Hva som er implementert

Private notater følger denne modellen:

```text
Bruker skriver notat
        ↓
IndexedDB
lokal arbeidskopi
        ↓
automatisk synk
        ↓
brukerens private OneDrive
Akkordia/private/<workspaceId>/notes.json
```

Viktige egenskaper:

- notat er per `songId`
- notatet tilhører innlogget Microsoft-bruker
- notatet lagres ikke i bandets delte workspace
- lokal cache isoleres på Microsoft-konto + `workspaceId`
- lokal lagring skjer før OneDrive-synk
- notater kan redigeres offline
- OneDrive ETag brukes for å oppdage samtidig endring
- merge skjer på notenivå
- konflikt på samme sang bevarer tapende tekst som konfliktkopi
- tomt notat behandles som sletting

## 6. Service worker / PWA-cache

`sw.js` er endret fordi den nye modulen:

```text
js/private-notes.js
```

må være tilgjengelig i appskallet.

Cache-navnet er oppdatert til:

```text
akkordia-shell-private-notes-v1
```

Dette er viktig for at eksisterende installasjoner ikke skal fortsette å bruke gammel JavaScript-cache.

Etter publisering skal Akkordia åpnes online og lastes på nytt før offline-test.

På en installert PWA kan det være nødvendig å avslutte og starte appen etter at den nye service workeren er aktivert.

## 7. Lokal syntakskontroll

Hvis Node.js er tilgjengelig, kjør:

```bash
for f in js/*.js; do
  node --check "$f" || exit 1
done
```

Forventet resultat:

```text
ingen syntaksfeil
```

Denne kontrollen erstatter ikke funksjonstesten.

## 8. Stage kun relevante filer

Når diffen er kontrollert:

```bash
git add \
  css/app.css \
  js/app.js \
  js/graph.js \
  js/player.js \
  js/private-notes.js \
  sw.js \
  docs/DATA-FORMAT.md \
  docs/DECISIONS.md \
  docs/PRIVATE-NOTES.md \
  docs/PROJECT-PLAN.md \
  docs/TESTING.md \
  docs/ONEDRIVE-MILESTONE-9.md
```

Kontroller deretter:

```bash
git status --short
git diff --cached
```

Kontroller spesielt at ingen lokale eller ignorerte filer har blitt tatt med.

## 9. Commit

Når staged diff er godkjent:

```bash
git commit -m "Add private per-song notes with OneDrive sync"
git push
```

## 10. Vent på GitHub Pages

Når GitHub Pages har publisert endringen, åpne:

```text
https://longfjeld.github.io/Akkordia/
```

Åpne siden online og last den på nytt minst én gang før test av offline-funksjonalitet.

Følg deretter testene i:

```text
docs/ONEDRIVE-MILESTONE-9.md
```

## 11. Ikke slett eksisterende private eller lokale filer

Denne milepælen krever ingen opprydding i repositoryet utenfor filene som er eksplisitt listet i denne veiledningen.

Filer som ligger i `.gitignore`, lokale arbeidsfiler, credentials eller andre maskinspesifikke filer skal beholdes urørt.
