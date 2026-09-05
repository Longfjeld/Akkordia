# ONEDRIVE-MILESTONE-7

## Formål

Milestone 7 etablerer første robuste offline-versjon av Akkordia.

Målet er:

```text
appskall tilgjengelig offline
+
sanger tilgjengelig offline
+
set-lister tilgjengelig offline
+
Spill-modus tilgjengelig offline
```

Offline-redigering inngår ikke.

## Arkitektur

To separate cacher brukes:

```text
Service Worker / Cache Storage
└── selve PWA-koden og appskallet

IndexedDB
└── siste validerte workspace-snapshot
    ├── songs
    └── setlists
```

OneDrive er fortsatt autoritativ datakilde.

IndexedDB er bare en lokal lesecache.

## Første online-lasting

Når et workspace lastes online:

1. sanger leses og valideres fra OneDrive
2. sangene lagres i IndexedDB
3. set-lister leses og valideres fra OneDrive
4. set-listene lagres i IndexedDB

Dette gjør at set-listene også er tilgjengelige offline selv om brukeren ikke åpnet Set-lister-fanen før forbindelsen forsvant.

## Offline

Når nett ikke er tilgjengelig:

```text
lokalt workspace-register
↓
IndexedDB
↓
Sanger / Set-lister / Spill
```

UI viser:

```text
Offline · kun lesing
```

Følgende er tilgjengelig:

|Funksjon|Offline|
|:---|:---|
|Lese sanger|Ja|
|Vokal/koring-visning|Ja|
|Lese set-lister|Ja|
|Spill-modus|Ja|
|Autoscroll|Ja|
|Wake Lock|Best effort, avhengig av plattform|
|Redigere sang|Nei|
|Opprette sang|Nei|
|Redigere set-list|Nei|
|Opprette set-list|Nei|
|Koble til nytt workspace|Nei|

## Fallback ved Graph-feil

Hvis nettleseren rapporterer online, men OneDrive/Graph-kallet feiler, forsøker Akkordia å bruke siste lokale snapshot.

Data som kommer fra fallback-cache behandles som read-only selv om `navigator.onLine` er `true`.

Dette er viktig: cached objekter har ikke den ferske ETag-/DriveItem-konteksten som kreves for sikker lagring.

## Tilbake online

Når forbindelsen kommer tilbake forsøker Akkordia å oppdatere data fra OneDrive.

Eksisterende cached data blir ikke skriveklare bare fordi nettleseren rapporterer online. Online-data må først lastes vellykket.

## Service worker

`sw.js` cacher appskallet.

Navigasjon bruker:

```text
network first
→ cache fallback
```

Statiske filer bruker:

```text
cache first
→ oppdater cache fra nett i bakgrunnen
```

Cache-navnet versjoneres eksplisitt:

```text
akkordia-shell-m7-v1
```

Ved senere endringer i statiske filer skal cacheversjonen økes.

## Før første offline-test

Etter at Milestone 7 er publisert:

1. åpne Akkordia online
2. vent til sanger er lastet
3. kontroller at set-listene er tilgjengelige
4. last siden på nytt én gang online
5. gjennomfør deretter offline-testen

Dette sikrer at service worker og datasnapshot er etablert.

## Desktop-test

1. Åpne Akkordia online i Safari/Chrome på Mac.
2. Kontroller at status viser `Online`.
3. Kontroller at sanger lastes fra OneDrive.
4. Åpne en sang.
5. Åpne Set-lister og kontroller at set-listene er tilgjengelige.
6. Start Spill og kontroller normal navigasjon/autoscroll.
7. Gå ut av Spill.
8. Koble Mac-en fra nett eller bruk nettleserens offline-funksjon.
9. Last Akkordia på nytt.
10. Kontroller at appskallet åpnes.
11. Kontroller `Offline · kun lesing`.
12. Kontroller at sangbiblioteket vises.
13. Åpne flere sanger.
14. Kontroller at Rediger og `+ Ny sang` ikke kan brukes.
15. Åpne Set-lister.
16. Kontroller at set-listene vises fra offline-cache.
17. Kontroller at redigering/oppretting av set-list er deaktivert.
18. Start Spill fra en cached set-list.
19. Test Forrige/Neste, direkte hopp og autoscroll.
20. Koble til nett igjen.
21. Kontroller at appen går tilbake til online-status og oppdaterer OneDrive-data.
22. Kontroller at redigering blir tilgjengelig igjen etter vellykket online-lasting.

## Fallback-test

Test også forskjellen mellom «offline» og «Graph utilgjengelig»:

1. Ha gyldig cache.
2. La nettleseren fortsatt være online.
3. Fremprovoser om mulig en Graph-feil eller avbryt nettforbindelsen etter at siden er lastet.
4. Kontroller at cached data brukes.
5. Kontroller at dataene behandles som read-only.
6. Gjenopprett forbindelsen og kontroller at online-data kan lastes på nytt.

## iPad Safari-test

Etter at desktop-testen passerer:

1. Åpne Akkordia i vanlig Safari på iPad mens du er online.
2. Logg inn og åpne BoM.
3. Kontroller sanger, set-lister og Spill.
4. Last siden på nytt online.
5. Aktiver flymodus.
6. Åpne/last Akkordia på nytt i Safari.
7. Kontroller offline sanger, set-lister og Spill.

## Installert PWA på iPad

Dette er første milepæl der den installerte PWA-en skal testes systematisk igjen.

1. Fjern en eventuell gammel Akkordia-installasjon fra Hjem-skjermen.
2. Åpne siste Akkordia-versjon i Safari online.
3. Kontroller at online-funksjonene virker.
4. Legg Akkordia til på Hjem-skjermen på nytt.
5. Start PWA-en online.
6. Kontroller at BoM åpnes og Graph-tilgangen fungerer.
7. Avslutt appen.
8. Aktiver flymodus.
9. Start PWA-en.
10. Kontroller at cached sanger og set-lister er tilgjengelige.
11. Start Spill offline.
12. Gå online igjen og kontroller at normal OneDrive-tilgang kommer tilbake.

Den tidligere observerte `403 Access denied` i en eldre installert iPad-PWA skal derfor retestes her med en ny installasjon.

## Førstegangsbruk uten nett

Hvis en enhet aldri tidligere har lastet workspace-data online, finnes ingen IndexedDB-cache.

Akkordia skal da vise en tydelig melding om at offline-data ikke finnes.

Dette er forventet adferd.

## Utenfor scope

- offline-redigering
- kø av lokale endringer
- konfliktmerge
- bakgrunnssynkronisering av endringer
- sletting av offline-cache fra UI
- branding/appikoner
