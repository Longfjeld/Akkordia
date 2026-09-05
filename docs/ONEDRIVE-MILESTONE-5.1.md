# ONEDRIVE-MILESTONE-5.1

## Formål

Legge til deler i set-lister før Spill-modus bygges.

Set-listen kan nå inneholde fritekstdeler som `Sett 1`, `Sett 2` og `Encore` sammen med sangene i én ordnet sekvens.

## Datamodell

Milestone 5.1 innfører Setlist schema v2:

```json
{
  "schemaVersion": 2,
  "id": "uuid",
  "name": "Konsert",
  "items": [
    {"type": "part", "name": "Sett 1"},
    {"type": "song", "songId": "song_a"},
    {"type": "song", "songId": "song_b"},
    {"type": "part", "name": "Encore"},
    {"type": "song", "songId": "song_a"}
  ]
}
```

Eksisterende schema v1-filer leses og normaliseres i minnet. De skrives som v2 først når brukeren lagrer dem.

## Test

1. Åpne en eksisterende schema v1-set-list. Kontroller at alle sanger vises i korrekt rekkefølge.
2. Velg `Rediger` og legg til `Sett 1`, `Sett 2` og `Encore` med `+ Del`.
3. Kontroller at delnavn kan redigeres direkte.
4. Flytt en sang over en delgrense med `↑/↓`.
5. Flytt en sang over en delgrense med drahåndtak.
6. Flytt en del med `↑/↓` og drahåndtak.
7. Legg samme sang inn flere ganger.
8. Lagre, last set-listene på nytt og kontroller at deler og rekkefølge er bevart.
9. Kontroller OneDrive-JSON: `schemaVersion` skal være `2`, og rekkefølgen skal ligge i `items`.
10. Kontroller at nummerering starter på nytt etter hver del i lesevisningen.
11. Test en set-list uten deler. Den skal fortsatt fungere.
12. Test ETag-konflikt på samme måte som i Milestone 5.
13. Hvis mulig, test en manglende sangreferanse. Den skal markeres og bevares ved lagring.

## Utenfor scope

- Spill-modus
- Wake Lock
- autoscroll
- offline cache/redigering
- private notater
