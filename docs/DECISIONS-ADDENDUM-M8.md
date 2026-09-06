# DECISIONS-ADDENDUM-M8

## Spill er et fremføringsgrensesnitt

Spill prioriterer sanginnhold og få, forutsigbare kontroller fremfor vanlig appnavigasjon.

## Fast topp og bunn

Toppområdet gir kontekst, BPM og fontkontroll.

Bunnområdet gir alltid:

```text
Forrige / Auto / Neste
```

Dette prioriteres foran noen ekstra synlige tekstlinjer.

## Fontstørrelse er lokal

Fontstørrelse er en enhets-/brukerpreferanse og lagres ikke i sangdata.

Faste trinn brukes for å holde layout og testing forutsigbar.

## Visuell puls er ikke metronomlyd

Milestone 8 legger bare til en visuell BPM-indikator.

Lyd holdes utenfor scope for å unngå audio-policy, volumkontroll og nye plattformavhengigheter.

## Count-in er fire slag

Count-in beskrives eksplisitt som fire slag, ikke som én takt.

Begrunnelse: dagens Song schema har BPM, men ingen taktart eller `beatsPerBar`.

## Puls og autoscroll er separate

Visuell puls kan kjøre uten autoscroll.

Autoscroll kan kjøre uten permanent visuell puls.

Når count-in brukes, deler den BPM-klokke med den visuelle pulsen.

## Ingen schemaendring

Milestone 8 endrer ikke Song schema eller Setlist schema.
