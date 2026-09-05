# ONEDRIVE-MILESTONE-7.1

## Formål

Milestone 7.1 er en liten PWA-polering etter at offline-funksjonaliteten i Milestone 7 er verifisert.

Endringen omfatter:

- appikoner i PWA-manifestet
- `apple-touch-icon` for iPhone/iPad
- vanlig PNG-favicon
- caching av ikonene i service worker
- redusert risiko for utilsiktet double-tap-zoom på interaktive kontroller

## Appikoner

Følgende eksisterende prosjektfiler brukes:

```text
assets/
├── icon-192.png
└── icon-512.png
```

`manifest.webmanifest` refererer til begge størrelsene.

`index.html` bruker `icon-192.png` som:

```text
apple-touch-icon
favicon
```

Dette holder løsningen enkel og unngår flere dupliserte ikonfiler.

## Double-tap-zoom

Følgende CSS brukes på interaktive kontroller:

```css
button,
input,
select,
textarea,
summary,
[role="button"] {
  touch-action: manipulation;
}
```

Målet er å hindre at raske gjentatte trykk på blant annet `+` og `−` tolkes som double-tap-zoom.

Vanlig pinch-to-zoom deaktiveres ikke.

Det brukes derfor ikke:

```text
user-scalable=no
maximum-scale=1
```

## Service worker

Service-worker-cachen økes fra:

```text
akkordia-shell-m7-v1
```

til:

```text
akkordia-shell-m7-1-v1
```

slik at eksisterende installasjoner henter den nye versjonen og ikonene.

## Test

1. Publiser Milestone 7.1.
2. Åpne Akkordia online og last siden på nytt.
3. Kontroller at appen fortsatt fungerer online.
4. Gå offline og kontroller at appen fortsatt starter.
5. På Mac: kontroller at nettleseren viser Akkordia-ikon der favicon støttes.
6. På iPad/iPhone: fjern eventuell gammel Hjem-skjerm-installasjon.
7. Åpne Akkordia i Safari og legg den til på Hjem-skjermen på nytt.
8. Kontroller at Akkordia-ikonet brukes.
9. Åpne sangeditoren på touch-enhet.
10. Trykk raskt flere ganger på `+`/`−` for akkordposisjon.
11. Kontroller at kontrollen reagerer uten at siden zoomer ved double-tap.
12. Kontroller fortsatt at vanlig pinch-to-zoom fungerer.
13. Kontroller at Spill-modus og offline-funksjoner fortsatt virker.

## Utenfor scope

- flere ikonstørrelser
- maskable icons
- splash screens
- egen installasjonsdialog
- full PWA-branding
