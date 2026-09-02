# DECISIONS – tillegg

## ADR-0029 – MSAL vendoreres som statisk tredjepartsfil

Status: Accepted

### Beslutning

Akkordia bruker en eksplisitt versjon av `@azure/msal-browser` hentet med npm og kopiert til `vendor/`.

GitHub Pages laster den lokale filen. Det brukes ikke ekstern MSAL-CDN i produksjon.

### Begrunnelse

Microsoft har avviklet CDN-distribusjon for nyere MSAL Browser-versjoner. Lokal statisk hosting gir samtidig en enkel GitHub Pages-applikasjon uten runtime-build og uten ekstra CDN-avhengighet.

---

## ADR-0030 – OneDrive milepæl 1 bruker enkel Graph-basert mappevelger

Status: Accepted

### Beslutning

Akkordia lister mapper direkte med Microsoft Graph i stedet for å introdusere en separat file-picker SDK.

### Begrunnelse

Dette krever lite kode, gir full kontroll over workspace-valideringen og kan senere utvides med delte elementer dersom behovet krever det.
