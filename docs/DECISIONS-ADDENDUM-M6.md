# DECISIONS-ADDENDUM-M6

## Spill navigerer etter set-listforekomst

Spill-modus bruker en flat liste av spillbare sangforekomster generert fra `setlist.items`.

Samme `songId` kan forekomme flere ganger og behandles som separate posisjoner.

## Deler er kontekst, ikke spilleposter

`part`-poster brukes som kontekst for etterfølgende sanger, men teller ikke i spillerens sangnummer.

## Autoscroll bruker sangdata

Autoscroll beregnes fra `playback.bpm` og `playback.beatsPerLine`.

Hvis playback mangler brukes 90 BPM og 4 beats per linje som runtime-standard. Standardverdiene skrives ikke automatisk til sangfilen.

## Autoscroll stopper ved sangbytte

Forrige, Neste og direkte hopp stopper autoscroll og nullstiller aktiv linje for den nye sangen.

Dette reduserer risikoen for at en ny sang begynner å rulle utilsiktet.

## Wake Lock eies av player.js

Wake Lock aktiveres bare under aktiv Spill-modus, gjenopprettes best-effort etter `visibilitychange` og frigjøres ved avslutning.

Wake Lock-feil skal ikke stoppe Spill-modus.

## Spill er read-only

Spill-modus inneholder ingen direkte redigering av sang eller set-list.
