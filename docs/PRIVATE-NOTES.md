# Private notater

## Valgt modell

Private notater er per sang og tilhører den innloggede Microsoft-brukeren. De lagres ikke i bandets delte workspace.

```text
Brukerens OneDrive/
└── Akkordia/
    └── private/
        └── <workspaceId>/
            └── notes.json
```

IndexedDB er lokal arbeidskopi. Cache-nøkkelen inneholder både Microsoft-kontoens stabile konto-ID og `workspaceId`.

## Lagringsflyt

1. Redigering lagres lokalt i IndexedDB.
2. Sangen markeres dirty.
3. UI kan fortsette uten å vente på Microsoft Graph.
4. Når nett og token er tilgjengelig synkroniseres `notes.json`.
5. Etter bekreftet synk blir den sammenslåtte kopien ny baseversjon og dirty-listen tømmes.

Dette gjør at private notater kan redigeres offline selv om felles sangdata er i lesemodus.

## Synkronisering og redigering

Lokal lagring og OneDrive-synk er bevisst skilt.

- tekst lagres lokalt etter omtrent 250 ms
- normal OneDrive-synk planlegges omtrent 5 sekunder etter siste endring
- ny skriving nullstiller 5-sekundersfristen
- hvis notatfeltet fortsatt har fokus når fristen går ut, utsettes OneDrive-synk til redigeringen avsluttes
- når notatfeltet forlates, forsøkes synk etter omtrent 500 ms
- `Venter på synk` kan trykkes for å synkronisere umiddelbart
- synkronisering re-rendrer ikke sangvisningen eller erstatter et aktivt textarea-felt

Dette er spesielt viktig på iPad/iPhone, der erstatning av textarea under skriving ellers kan lukke skjermtastaturet og avbryte redigeringen.

## Konflikter

OneDrive ETag beskytter hele `notes.json`. Hvis filen er endret, sammenlignes hver `songId` mot sist synkroniserte baseversjon.

- bare lokal note endret: lokal note beholdes og lastes opp
- bare ekstern note endret: ekstern note tas inn lokalt
- forskjellige sang-ID-er endret: automatisk merge
- samme sang-ID endret begge steder: nyeste `updatedAt` beholdes og tapende tekst lagres lokalt som konfliktkopi

Konfliktkopien vises i vanlig sangvisning og kan gjenopprettes av brukeren.

## Sletting

Et tomt privatnotat fjernes fra den lokale `notes`-samlingen og sang-ID-en markeres dirty. Ved neste synk fjernes posten også fra `notes.json`. Basen gjør at slettingen ikke forveksles med at notatet aldri har eksistert.

## UI

Vanlig sangvisning har et eget felt for privat notat. Spill-modus har et sammenleggbart privatnotatfelt som åpnes automatisk når sangen allerede har et notat.
