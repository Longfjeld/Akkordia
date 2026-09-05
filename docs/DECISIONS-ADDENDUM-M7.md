# DECISIONS-ADDENDUM-M7

## Offline v1 er read-only

Milestone 7 støtter offline lesing og Spill, men ikke offline skriving.

Begrunnelse:

```text
offline-skriving
→ lokal endringskø
→ konfliktoppdagelse
→ merge/retry
→ betydelig mer kode
```

Dette avvikes bevisst for å holde Akkordia enkelt og sikkert.

## OneDrive er autoritativ kilde

IndexedDB er en cache, ikke en ny datakilde.

Når online lasting lykkes erstattes lokal cache med siste validerte OneDrive-data.

## Cached data er ikke automatisk skriveklare

Når data lastes fra IndexedDB mangler de den ferske ETag-/DriveItem-konteksten som eksisterende optimistic concurrency bygger på.

Derfor forblir de read-only inntil tilsvarende online-data er lastet vellykket.

## Cache Storage og IndexedDB har ulike roller

```text
Cache Storage
→ appskall / JavaScript / CSS / manifest

IndexedDB
→ workspace-data
```

Dette skillet beholdes.

## Service worker bruker eksplisitt cacheversjon

Endringer i statiske appfiler skal følges av økt cacheversjon i `sw.js`.

Dette gjør deploy-adferden forutsigbar uten build-system.
