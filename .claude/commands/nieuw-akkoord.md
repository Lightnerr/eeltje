---
description: Voeg een akkoord of een variant toe aan akkoorden.json, met een vingerzetting die echt klopt
argument-hint: <naam> [variant], bv. "F#m" of "C barre"
allowed-tools: Read, Edit, Glob, Bash(bun run valideer), Bash(bun run test)
---

Voeg aan `src/data/akkoorden.json` dit akkoord toe: **$ARGUMENTS**. Eerste woord = de naam, een tweede woord = de variant.

## Eerst lezen

- `src/lib/types.ts` (`Akkoord`, `Barre`) en de akkoorden die er al staan in `src/data/akkoorden.json`.
- `mijn-akkoorden.txt` in de root, als die er is: welke vingerzettingen de gebruiker al kent. Staat hij er niet, ga dan gewoon door; voor een akkoord is dat niet nodig.

## Regels

- **Naam:** grondtoon met `#` of `b` en een suffix die `ontleedAkkoord` in `src/lib/muziek.ts` kent (`m`, `7`, `m7`, `maj7`, `6`, `m6`, `9`, `add9`, `sus2`, `sus4`, `7sus4`, `dim`, `dim7`, `m7b5`, `aug`, `5`), eventueel met `/bas`. Een andere suffix kan niet: meld dat en stop.
- **Bestaat de variant al** (zelfde `naam` en `variant`): niets veranderen, melden en stoppen.
- **Variant:** kort, kleine letters en streepjes (`standaard`, `klein`, `barre`, `3-vingers`, `open`). `titel` is wat de app toont ("Standaard", "Barré op 5", "3 vingers").
- **Frets en vingers** van lage E naar hoge e. `"x"` = niet spelen, `0` = open. Vingers: 0 = geen, 1 t/m 4 = wijsvinger t/m pink. Een open of niet gespeelde snaar heeft vinger 0; elke gegrepen snaar een vinger; een vinger ligt op één fret.
- **De tonen moeten kloppen.** De validatie rekent uit welke tonen klinken (standaardstemming EADGBE) en vergelijkt dat met de naam: geen vreemde tonen, en de verplichte tonen klinken. Reken het zelf na voor je schrijft.
- **Barré:** ligt één vinger over meerdere snaren op dezelfde fret, zet dan `barre: { fret, vanSnaar, totSnaar }` (snaren 0 = lage E t/m 5 = hoge e). De buitenste snaren liggen op de barréfret en geen snaar ertussen is lager of `"x"`.
- **Hogere positie:** `basisfret` = de bovenste fret van het diagram (weglaten = 1). Alle gegrepen frets liggen tussen `basisfret` en `basisfret + 4`. Frets blijven absoluut.
- **Moeilijkheid** 1 t/m 5: 1 = open akkoord met 2-3 vingers, 2 = 3-4 vingers of een rek, 3 = kleine barré of lastige rek, 4 = barré over 5 snaren, 5 = volle barré.
- **Standaard:** precies één variant per naam heeft `"standaard": true`. Een nieuwe naam: deze wordt de standaard. Een extra variant: `false`, tenzij de gebruiker vraagt hem standaard te maken; zet dan de oude op `false`.
- Voor een beginner: liever een open of kleine vorm als standaard en de barré als variant.
- Zet het nieuwe akkoord bij de andere varianten van dezelfde naam, anders alfabetisch tussen de andere namen.
- Een `omschrijving` alleen als die echt helpt ("Ringvinger en pink blijven liggen vanaf G").

## Controleren

Draai `bun run valideer` en daarna `bun run test`. Rood: repareer de zetting tot alles groen is. Lukt dat niet, haal het akkoord weer weg en meld waarom.

## Afsluiten

Eén korte alinea in het Nederlands: welke zetting (frets en vingers), welke moeilijkheid, of het een barré is en of het de standaard werd.
