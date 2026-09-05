# ONEDRIVE-MILESTONE-6.1

## Formål

Gjøre det enkelt å opprette eller erstatte en lengre sangtekst uten å lime inn én linje om gangen.

Milestone 6.1 legger til én enkel importmetode: lim inn ren tekst i et eget felt.

## Format

Seksjoner markeres med hakeparenteser:

```text
[Vers 1]
Første linje
Andre linje

[Chorus]
Første refrenglinje
Andre refrenglinje

[Bridge]
En annen del
```

Følgende vanlige markører gjenkjennes som interne seksjonstyper:

|Markør/prefiks|Intern type|
|:---|:---|
|`Vers` / `Verse`|`verse`|
|`Chorus` / `Refreng`|`chorus`|
|`Bridge` / `Bro`|`bridge`|
|`Intro` / `Innledning`|`intro`|
|`Interlude` / `Mellomspill`|`interlude`|

Andre markører beholdes som seksjonsnavn og får intern type `verse`.

Hvis teksten ikke inneholder noen seksjonsmarkør, importeres alt som `Vers 1`.

## Mapping

Hver vanlig tekstlinje blir én eksisterende Song schema v1-linje:

```json
{
  "vocal": "Tekstlinjen",
  "harmony": "",
  "chords": []
}
```

Blanke linjer beholdes som blanke sanglinjer.

Importen oppretter ikke akkorder, koring, transpose eller playback-data.

## Sikkerhet

Import erstatter sangens eksisterende seksjoner.

Hvis sangen allerede inneholder meningsfull tekst, koring, akkorder eller endret seksjonsstruktur, må brukeren bekrefte erstatningen.

Importen endrer bare kladden i editoren. OneDrive-filen endres ikke før brukeren velger `Lagre`.

## Test

1. Opprett en ny sang.
2. Velg `Importer tekst`.
3. Lim inn:

```text
[Vers 1]
Linje 1
Linje 2

[Chorus]
Refreng 1
Refreng 2
```

4. Velg `Importer`.
5. Kontroller at `Vers 1` og `Chorus` blir separate seksjoner.
6. Kontroller at tekstlinjene ligger i `Vokal`.
7. Kontroller at blank linje beholdes.
8. Kontroller at `Chorus` får intern type `chorus`.
9. Lagre sangen, last den på nytt og kontroller resultatet.
10. Test tekst uten markører. Alt skal bli `Vers 1`.
11. Test en ukjent markør, for eksempel `[Solo]`. Navnet skal beholdes og intern type skal bli `verse`.
12. Åpne en eksisterende sang med tekst/akkorder og start import. Kontroller at du får bekreftelse før eksisterende seksjoner erstattes.
13. Avbryt bekreftelsen og kontroller at eksisterende sang ikke endres.
14. Importer og velg deretter `Avbryt` i hovededitoren. Kontroller at OneDrive-filen fortsatt er uendret.

## Utenfor scope

- filopplasting/import fra `.txt`
- Markdown-parser
- automatisk gjenkjenning av akkordlinjer
- import av koring
- import av BPM eller transpose
