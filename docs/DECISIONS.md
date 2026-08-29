# Akkordia v2 – beslutningslogg

**Status:** Aktiv  
**Sist oppdatert:** 2026-08-29

Denne filen dokumenterer varige arkitektur- og produktbeslutninger. Små feilrettinger og ordinære visuelle justeringer trenger ikke eget ADR-punkt.

---

## ADR-0001 – GitHub er autoritativ kilde for programkode

**Status:** Accepted  
**Dato:** 2026-08-29

### Problem

Tidligere versjoner finnes i flere kopier og på ulike driftssteder. Dette øker risikoen for at endringer baseres på feil versjon.

### Beslutning

`https://github.com/Longfjeld/Akkordia` er eneste autoritative kilde for Akkordia v2-programkode.

### Konsekvenser

- gamle ZIP-er brukes som historisk referanse, ikke som løpende fasit
- Git-historikk erstatter manuelle backupkopier av kildefiler
- `main` skal representere godkjent/publiserbar kode

---

## ADR-0002 – Statisk PWA uten egen backend

**Status:** Accepted  
**Dato:** 2026-08-29

### Beslutning

Akkordia v2 bygges som statisk PWA publisert fra GitHub Pages. Normal arkitektur skal ikke kreve egen Node-, Apache-, database- eller applikasjonsserver.

### Begrunnelse

Målet er færre driftsavhengigheter og høyere tilgjengelighet.

---

## ADR-0003 – Tilgang styres av lagringstjenesten

**Status:** Accepted  
**Dato:** 2026-08-29

### Beslutning

Akkordia skal ikke ha eget brukerregister, passordregister eller egen ACL-modell. Tilgang til samarbeidsdata følger storage-providerens rettigheter.

### Konsekvenser

- privat Microsoft-konto er første identitetsmodell
- read-only og read/write håndteres ut fra faktisk filtilgang
- Akkordia må håndtere manglende tilgang kontrollert

---

## ADR-0004 – Ett workspace per band

**Status:** Accepted  
**Dato:** 2026-08-29

### Beslutning

Hvert band representeres av et separat workspace hos lagringstjenesten. Et workspace identifiseres av `akkordia.json`.

### Konsekvenser

- bruker kan koble til flere band
- bruker kan bytte band uten å logge ut
- feil katalog kan oppdages før data skrives

---

## ADR-0005 – Én JSON-fil per sang

**Status:** Accepted  
**Dato:** 2026-08-29

### Beslutning

Hver sang lagres som egen JSON-fil under `songs/`.

### Begrunnelse

Dette reduserer konfliktflate, gjør synkronisering enklere og gir en lett forståelig filstruktur.

---

## ADR-0006 – Én JSON-fil per set-list

**Status:** Accepted  
**Dato:** 2026-08-29

### Beslutning

Hver set-list lagres som egen JSON-fil under `setlists/`.

Samme sang-ID kan forekomme flere ganger i samme set-list.

---

## ADR-0007 – Felles musikalske innstillinger

**Status:** Accepted  
**Dato:** 2026-08-29

### Beslutning

BPM, autoscroll-grunnlag og transponering er felles sangdata. Transponering kan finnes både på sangnivå og seksjonsnivå.

Personlig transponering innføres ikke i første versjon.

---

## ADR-0008 – Set-lister og Spill er hovedarbeidsflyt

**Status:** Accepted  
**Dato:** 2026-08-29

### Beslutning

Brukergrensesnittet organiseres rundt tre tydelige hovedmoduser:

- Sanger
- Set-lister
- Spill

Spill-modus skal være ren og fri for direkte sangeredigering.

---

## ADR-0009 – Screen Wake Lock i Spill-modus

**Status:** Accepted  
**Dato:** 2026-08-29

### Beslutning

Akkordia ber om Screen Wake Lock når Spill-modus er aktiv, der nettleseren støtter dette.

Wake Lock skal frigis når Spill-modus avsluttes.

---

## ADR-0010 – Offline-lesing, men ikke offline-skriving i første versjon

**Status:** Accepted  
**Dato:** 2026-08-29

### Beslutning

Service Worker cacher app-shell. IndexedDB cacher tidligere synkroniserte sanger og set-lister.

Offline-lesing og spilling skal fungere. Offline-redigering utsettes.

### Begrunnelse

Offline-skriving introduserer synkroniseringskø, konfliktfletting og vesentlig mer kompleksitet.

---

## ADR-0011 – Optimistic concurrency ved skriving

**Status:** Accepted  
**Dato:** 2026-08-29

### Beslutning

Storage-providerens versjonsidentifikator/ETag brukes for å kontrollere at en fil ikke er endret siden den ble lest.

Stille overskriving av en nyere ekstern versjon skal ikke være normal oppførsel.

---

## ADR-0012 – Vanilla webteknologi foretrekkes

**Status:** Accepted  
**Dato:** 2026-08-29

### Beslutning

HTML, CSS, moderne vanilla JavaScript og native ES modules brukes som utgangspunkt.

React/Vue/Angular eller build-system innføres bare ved dokumentert behov.

---

## ADR-0013 – Eksisterende sang-ID-er beholdes ved migrering

**Status:** Accepted  
**Dato:** 2026-08-29

### Beslutning

ID-er i eksisterende `ttc_all_songs.json` beholdes i migrerte v2-filer.

Nye sanger kan bruke en nyere ID-standard uten å endre gamle ID-er.

---

## ADR-0014 – Enkel språktilrettelegging

**Status:** Accepted  
**Dato:** 2026-08-29

### Beslutning

Første UI er norsk. Brukertekster samles i en enkel ressursstruktur slik at flere språk kan legges til senere uten omfattende omskriving.

Et stort i18n-rammeverk brukes ikke fra starten.

---

## ADR-0015 – Lokal fontstørrelse kan støttes

**Status:** Accepted  
**Dato:** 2026-08-29

### Beslutning

Fontstørrelse kan være en lokal enhets-/brukerpreferanse dersom dette implementeres med liten kompleksitet, eksempelvis noen få faste nivåer.

Den skal ikke lagres som felles sangdata.

---

## ADR-0016 – Private notater utsettes

**Status:** Deferred  
**Dato:** 2026-08-29

### Problem

V2 har ikke egen Akkordia-brukeridentitet, og det er derfor ikke avgjort hvor private notater bør lagres.

### Beslutning

Funksjonen tas ikke inn i første permanente datamodell før lagrings- og synkroniseringsmodell er besluttet.
