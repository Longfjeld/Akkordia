# DECISIONS

## ADR-0017 – Workspace har kun navn som brukerdefinert metadata

Status: Accepted

### Beslutning

Workspace schema v1 inneholder kun ett brukerdefinert metadatafelt: `name`.

Det legges ikke inn beskrivelse, dato, type eller andre felt før et dokumentert behov finnes.

### Begrunnelse

Dette holder både datamodell og brukergrensesnitt enkelt.

---

## ADR-0018 – Workspace bruker stabil UUID

Status: Accepted

### Beslutning

Hvert workspace får en stabil `workspaceId` som UUID.

Workspace-navn kan endres uten at ID endres.

---

## ADR-0019 – Set-list har kun navn og ordnet liste med sang-ID-er

Status: Accepted

### Beslutning

Setlist schema v1 består av:

```text
schemaVersion
id
name
songs[]
```

Det legges ikke inn dato, type eller kalenderfelt.

---

## ADR-0020 – Ingen egne setlist-entry-ID-er i schema v1

Status: Accepted

### Beslutning

Set-listens `songs` er en ordnet array med sang-ID-er.

Samme sang-ID kan forekomme flere ganger.

### Begrunnelse

Posisjonen i arrayet er tilstrekkelig for navigasjon og rekkefølge. Egen entry-ID ville økt kompleksiteten uten et nåværende behov.

---

## ADR-0021 – Aktiv set-list er lokal brukerpreferanse

Status: Accepted

### Beslutning

Workspace-data skal ikke lagre hvilken set-list som er aktiv eller sist brukt.

Dette lagres lokalt per enhet/bruker.

### Begrunnelse

Flere bandmedlemmer kan bruke samme workspace samtidig uten å påvirke hverandres arbeidsflyt.

---

## ADR-0022 – Ingen `index.json` for sanger i v1

Status: Accepted

### Beslutning

Appen lister innholdet i `songs/` og leser nødvendige sangdata direkte.

En egen sangindeks innføres bare dersom målt ytelse viser at det er nødvendig.

---

## ADR-0023 – Private notater utsettes

Status: Accepted

### Beslutning

Private notater inngår ikke i workspace-, song- eller setlist-schema v1.

Funksjonen vurderes separat senere.
