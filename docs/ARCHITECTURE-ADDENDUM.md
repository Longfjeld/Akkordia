# ARCHITECTURE – workspace og set-lister

## Workspace

Ett workspace tilsvarer ett band eller ett separat samarbeidsområde.

```text
Storage provider
└── Workspace
    ├── akkordia.json
    ├── songs/
    └── setlists/
```

`akkordia.json` identifiserer katalogen som et Akkordia-workspace.

## Flere workspaces

Samme klient kan være koblet til flere workspaces.

```text
Akkordia
├── BoM
├── Band B
└── Band C
```

Koblingen mellom brukerens lokale app og workspace lagres lokalt.

Å fjerne et workspace fra appen skal bare fjerne lokal kobling. Det skal ikke slette data hos storage-provider.

## Set-lister

Set-lister er separate filer.

```text
setlists/
├── <uuid>.json
├── <uuid>.json
└── ...
```

Set-listene refererer til sanger med sang-ID.

Samme sang kan forekomme flere ganger.

Spill-modus navigerer etter indeks i set-listen, ikke etter unik sang-ID.

## Oppretting

Ved oppretting av nytt workspace genererer appen:

```text
akkordia.json
songs/
setlists/
```

Deretter valideres hele strukturen før workspacet tas i bruk.
