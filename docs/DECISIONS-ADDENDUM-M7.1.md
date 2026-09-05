# DECISIONS-ADDENDUM-M7.1

## Appikoner

Eksisterende `assets/icon-192.png` og `assets/icon-512.png` brukes direkte.

Det opprettes ikke ekstra kopier av samme grafikk.

## Touch-adferd

`touch-action: manipulation` brukes på interaktive kontroller for å redusere utilsiktet double-tap-zoom.

Global brukerzoom sperres ikke.

Begrunnelse:

```text
bedre betjening av små gjentatte kontroller
+
bevarer pinch-to-zoom
+
minimal kode
```

## Service-worker-versjon

Endring av appskall/manifest/assets krever eksplisitt ny cacheversjon.
