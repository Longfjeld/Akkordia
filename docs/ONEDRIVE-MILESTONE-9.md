# ONEDRIVE-MILESTONE-9

## Formål

Milestone 9 innfører **Private notater** per sang.

Målet er at en bruker skal kunne skrive egne notater til en sang uten at notatet blir en del av bandets delte data.

Private notater skal:

```text
være personlige
+
følge brukeren mellom enheter
+
fungere offline
+
aldri kreve egen Akkordia-backend
```

## Lagringsmodell

Private notater lagres i to lag:

```text
IndexedDB
└── lokal arbeidskopi og synkstatus

brukerens private OneDrive
└── Akkordia/
    └── private/
        └── <workspaceId>/
            └── notes.json
```

Bandets delte workspace inneholder ikke private notater.

## Identitet og isolasjon

Lokal cache nøkkles på:

```text
Microsoft account ID + workspaceId
```

Dette skal hindre at:

- bruker A ser bruker Bs lokale private notater på samme enhet
- notater fra Band A blandes med notater fra Band B

## Notat per sang

Et privat notat tilhører en stabil `songId`.

Samme sang brukt flere ganger i samme set-list viser derfor samme private notat.

Notatet er ikke knyttet til en bestemt forekomst i set-listen.

## Lokal lagring

Når teksten endres:

```text
redigering
↓
IndexedDB
↓
dirty
↓
OneDrive-synk når mulig
```

UI skal ikke vente på Graph før notatet regnes som lokalt lagret.

Dette gjør private notater skrivbare også offline.

## OneDrive-format

Eksempel:

```json
{
  "format": "akkordia-private-notes",
  "schemaVersion": 1,
  "workspaceId": "<workspace-id>",
  "updatedAt": "2026-09-06T10:00:00.000Z",
  "notes": {
    "<song-id>": {
      "text": "Capo 2. Start rolig.",
      "updatedAt": "2026-09-06T09:59:55.000Z"
    }
  }
}
```

## Synkronisering

OneDrive-filen har én ETag for hele `notes.json`.

Hvis filen er endret siden klienten leste den, sammenlignes notatene per `songId` mot sist synkroniserte base.

### Ulike sanger

Hvis to enheter endrer forskjellige sanger:

```text
Enhet A: sang 1 endret
Enhet B: sang 2 endret
```

skal begge endringer kunne flettes automatisk.

Dette regnes ikke som en reell notekonflikt.

### Samme sang

Hvis to enheter har endret samme sang siden felles base:

```text
lokal note endret
+
ekstern note endret
```

oppstår konflikt.

Nyeste `updatedAt` beholdes som aktiv versjon.

Den tapende teksten lagres lokalt som konfliktkopi slik at tekst ikke går permanent tapt.

Konfliktkopien vises i vanlig sangvisning og kan gjenopprettes.

## Sletting

Når notatfeltet tømmes:

- notatet fjernes lokalt
- sangen markeres dirty
- slettingen synkroniseres til `notes.json`

Tom tekst skal derfor ikke bli liggende som en tom note i OneDrive.

## Vanlig sangvisning

Sangvisningen har eget felt:

```text
Privat notat
```

Status viser om notatet er lokalt lagret/synkronisert.

Ved konflikt skal den bevarte konfliktkopien kunne vises og gjenopprettes.

## Spill-modus

Spill har et sammenleggbart felt:

```text
Privat notat
```

Hvis sangen allerede har et privat notat, åpnes feltet automatisk.

Notatet kan redigeres også i Spill.

Private notater er dermed et eksplisitt unntak fra prinsippet om at felles sang-/set-listdata ikke redigeres i Spill.

---

# Test

Testene bør gjennomføres i rekkefølge.

Ikke start konflikt- eller fler-enhetstest før normal online-, reload- og offline-test fungerer.

## Før test

1. Publiser Milestone 9 til GitHub Pages.
2. Åpne Akkordia online.
3. Last siden på nytt minst én gang.
4. Kontroller at riktig band/workspace åpnes.
5. Kontroller at eksisterende sanger og set-lister fortsatt lastes normalt.
6. Åpne nettleserens utviklerverktøy dersom dette er praktisk, slik at eventuelle JavaScript-/Graph-feil blir synlige.

## Test A – grunnleggende online-lagring

1. Åpne en sang som ikke tidligere har privat notat.
2. Finn feltet `Privat notat`.
3. Skriv en tydelig testtekst, for eksempel:

```text
Privat test A – Mac
```

4. Vent kort slik at automatisk lagring/synk får kjørt.
5. Naviger til en annen sang.
6. Gå tilbake til testsangen.
7. Kontroller at notatet fortsatt vises.
8. Last hele Akkordia-siden på nytt.
9. Åpne sangen igjen.
10. Kontroller at notatet fortsatt vises.

Forventet:

```text
notatet beholdes etter navigasjon og full reload
```

## Test B – OneDrive-struktur

Etter Test A, åpne brukerens egen OneDrive.

Kontroller at følgende struktur er opprettet:

```text
Akkordia/
└── private/
    └── <workspaceId>/
        └── notes.json
```

Kontroller at `notes.json`:

- har `format: "akkordia-private-notes"`
- har `schemaVersion: 1`
- har riktig `workspaceId`
- inneholder testsangens `songId`
- inneholder teksten fra Test A

Kontroller samtidig at notatet **ikke** finnes i bandets delte workspace/sangfil.

## Test C – Spill-modus

1. Legg testsangen i en set-list dersom den ikke allerede finnes der.
2. Start Spill.
3. Naviger til testsangen.
4. Kontroller at `Privat notat` vises.
5. Fordi sangen allerede har notat, kontroller at feltet åpnes automatisk.
6. Kontroller at teksten fra Test A vises.
7. Endre teksten til:

```text
Privat test C – endret i Spill
```

8. Gå til neste sang.
9. Gå tilbake.
10. Kontroller at endringen fortsatt vises.
11. Avslutt Spill.
12. Åpne sangen i vanlig sangvisning.
13. Kontroller at samme tekst vises der.

## Test D – samme sang flere ganger i set-list

1. Lag eller bruk en set-list der samme sang forekommer minst to ganger.
2. Start Spill.
3. Åpne første forekomst.
4. Skriv eller endre privatnotatet.
5. Gå til den andre forekomsten av samme sang.
6. Kontroller at samme notat vises.

Forventet:

```text
privatnotatet følger songId, ikke set-listposisjon
```

## Test E – sletting

1. Åpne testsangen i vanlig sangvisning.
2. Tøm hele privatnotatet.
3. Vent på synk.
4. Naviger bort og tilbake.
5. Kontroller at feltet fortsatt er tomt.
6. Last siden på nytt.
7. Kontroller igjen.
8. Kontroller `notes.json` i OneDrive.

Forventet:

```text
songId-en er fjernet fra notes-samlingen
```

## Test F – offline-redigering

Før denne testen: opprett et nytt privatnotat online og kontroller at det er synkronisert.

1. Koble enheten fra nett eller bruk nettleserens offline-modus.
2. Last Akkordia på nytt hvis appskallet og workspace-snapshot allerede er cached.
3. Kontroller at felles sangdata fortsatt behandles som offline/read-only.
4. Åpne sangen med privatnotatet.
5. Kontroller at eksisterende privatnotat vises.
6. Endre teksten til:

```text
Privat test F – skrevet offline
```

7. Naviger bort og tilbake mens enheten fortsatt er offline.
8. Kontroller at endringen beholdes.
9. Hvis mulig, avslutt og start PWA/nettlesersiden på nytt fortsatt offline.
10. Kontroller at notatet fortsatt vises.

Forventet:

```text
private notater er skrivbare og vedvarende lokalt offline
```

## Test G – tilbake online og synk

Fortsett direkte fra Test F.

1. Koble enheten til nett igjen.
2. Vent til Akkordia registrerer online-tilstand.
3. Åpne eller bytt sang dersom nødvendig for å utløse normal synkflyt.
4. Kontroller at offline-endringen fortsatt vises.
5. Last siden på nytt online.
6. Kontroller at teksten fortsatt vises.
7. Kontroller `notes.json` i OneDrive.

Forventet:

```text
offline-endringen er lastet opp uten datatap
```

## Test H – synk mellom to enheter/nettlesere

Bruk samme Microsoft-konto og samme band på to klienter, eksempelvis:

```text
Mac Safari
+
iPad PWA
```

1. Åpne Akkordia online på begge.
2. Kontroller at samme testsang er tilgjengelig.
3. På enhet A: skriv:

```text
Privat test H – fra enhet A
```

4. Vent på synk.
5. På enhet B: last Akkordia på nytt eller åpne workspace på nytt.
6. Åpne samme sang.
7. Kontroller at teksten fra enhet A vises.
8. Endre notatet på enhet B.
9. Vent på synk.
10. Last/oppdater på enhet A.
11. Kontroller at endringen fra B kommer tilbake.

## Test I – merge av forskjellige sanger

Bruk to klienter med samme Microsoft-konto og samme workspace.

Før testen skal begge klienter ha lastet samme synkroniserte utgangspunkt.

1. På enhet A: gå offline.
2. På enhet A: endre privatnotatet til sang 1.
3. På enhet B, fortsatt online: endre privatnotatet til sang 2.
4. Vent til B har synkronisert.
5. Koble A online igjen.
6. La A synkronisere.
7. Oppdater begge klienter.
8. Kontroller sang 1 og sang 2.

Forventet:

```text
begge notatendringene finnes
ingen konfliktmelding for ulike songId-er
```

## Test J – konflikt på samme sang

Denne testen verifiserer at tekst ikke blir stille overskrevet og mistet.

Bruk to klienter med samme Microsoft-konto og samme workspace.

### Etabler felles base

1. Sett samme sangnote til:

```text
Felles base for konflikttest
```

2. Synkroniser.
3. Last/oppdater begge klienter slik at begge har samme base.

### Lag konflikt

4. Sett enhet A offline.
5. Endre samme sang på A til:

```text
Konfliktversjon A – offline
```

6. La A forbli offline.
7. På enhet B, online, endre samme sang til:

```text
Konfliktversjon B – online
```

8. Vent til B har synkronisert til OneDrive.
9. Koble A online igjen.
10. La A synkronisere.

### Kontroller

11. Åpne sangen i vanlig sangvisning på A.
12. Kontroller at én av versjonene er aktiv.
13. Kontroller at den andre teksten finnes som konfliktkopi.
14. Bruk gjenoppretting av konfliktkopien.
15. Kontroller at gjenopprettet tekst blir aktivt privatnotat.
16. Vent på synk og last siden på nytt.
17. Kontroller at gjenopprettet tekst fortsatt finnes.

Forventet:

```text
ingen av de to konflikttekstene går permanent tapt
```

Merk: aktiv versjon velges etter `updatedAt`, så hvilken av A/B som først blir stående kan avhenge av faktisk redigeringstidspunkt.

## Test K – workspace-isolasjon

Bruk to forskjellige Akkordia-workspaces/band.

1. I Band A: legg et privatnotat på en sang.
2. Bytt til Band B.
3. Kontroller at notatet fra Band A ikke dukker opp på en sang i Band B.
4. Opprett et privatnotat i Band B.
5. Bytt tilbake til Band A.
6. Kontroller at Band A-notatet fortsatt er uendret.

Kontroller gjerne OneDrive-strukturen:

```text
Akkordia/private/<workspace-A>/notes.json
Akkordia/private/<workspace-B>/notes.json
```

## Test L – konto-isolasjon

Denne testen er særlig relevant på en delt nettleser/enhet.

1. Logg inn som Microsoft-bruker A.
2. Åpne et workspace og opprett et privatnotat.
3. Logg ut/bytt Microsoft-konto i Akkordia.
4. Logg inn som Microsoft-bruker B.
5. Åpne samme delte workspace dersom bruker B har tilgang.
6. Kontroller at bruker As lokale private notat ikke vises for bruker B.
7. Logg tilbake som bruker A.
8. Kontroller at bruker As notat fortsatt er tilgjengelig.

Forventet:

```text
lokal IndexedDB-cache er isolert på Microsoft-konto + workspace
```

## Test M – regresjon

Etter at private-notat-testene passerer, kontroller minimum:

1. Sanger lastes normalt online.
2. Eksisterende sangeredigering og lagring fungerer online.
3. Set-lister åpnes og lagres normalt.
4. Spill starter og Forrige/Neste fungerer.
5. Autoscroll fungerer.
6. BPM-puls/count-in fra Milestone 8 fungerer.
7. Wake Lock feiler kontrollert eller fungerer som før.
8. Offline sanger/set-lister/Spill fungerer fortsatt.
9. Privatnotatfeltet påvirker ikke akkord-/tekstlayout på en uheldig måte.
10. Touch-kontroller på iPad/iPhone er fortsatt brukbare.

## Test – installert PWA på iPad

Etter at desktop-testene A–G passerer:

1. Åpne siste publiserte Akkordia i Safari online.
2. Kontroller at den nye versjonen er aktiv.
3. Start installert PWA.
4. Kontroller et eksisterende privatnotat.
5. Rediger notatet online.
6. Avslutt og start PWA-en på nytt.
7. Kontroller at notatet er bevart.
8. Aktiver flymodus.
9. Start PWA-en.
10. Rediger privatnotatet offline.
11. Avslutt og start PWA-en igjen fortsatt offline.
12. Kontroller at endringen er bevart.
13. Gå online igjen.
14. Kontroller at endringen synkroniseres.
15. Kontroller samme note fra Mac eller annen klient.

## Godkjenningskriterier

Milestone 9 kan regnes som godkjent når minimum følgende passerer:

|Område|Krav|
|:---|:---|
|Online lagring|Notat beholdes etter reload|
|OneDrive|Riktig privat fil opprettes|
|Personvern|Notat lagres ikke i delt workspace|
|Per sang|Samme songId gir samme note i alle forekomster|
|Spill|Notat kan vises og redigeres|
|Offline|Notat kan redigeres og overleve restart|
|Re-synk|Offline-endring kommer til OneDrive|
|Flere enheter|Samme bruker får notater på begge|
|Ulike sanger|Automatisk merge uten tap|
|Samme sang|Konfliktkopi bevares|
|Workspace-isolasjon|Notater blandes ikke mellom band|
|Konto-isolasjon|Notater blandes ikke mellom brukere|
|Regresjon|Sanger, set-lister, Spill og offline fungerer fortsatt|

## Utenfor scope

- deling av private notater med andre brukere
- private notater per set-listforekomst
- sanntidssynk mens to klienter skriver samtidig
- avansert tekstmerge på linje-/tegnnivå
- egen backend eller database
- andre lagringsprovidere enn OneDrive
- kryptering av private notater inne i bandets workspace
