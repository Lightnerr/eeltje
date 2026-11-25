---
description: Voeg een oefening toe aan oefeningen.json, met doel, stappen, eventueel een tabje en een standaardtempo
argument-hint: <omschrijving>, bv. "wisselen tussen G en C met de pink als anker"
allowed-tools: Read, Edit, Glob, Bash(bun run valideer), Bash(bun run test)
---

Voeg aan `src/data/oefeningen.json` een oefening toe voor een beginnende gitarist: **$ARGUMENTS**

## Eerst lezen

- `src/lib/types.ts` (`Oefening`) en de oefeningen die er al staan, voor toon en lengte.
- `mijn-akkoorden.txt` in de root. Hij bevat iets als "Akkoorden die ik kan: A, D, E. Aan het oefenen: G, Em." Staat hij er niet, vraag dan welke akkoorden de gebruiker kent voordat je verdergaat. Gaat de oefening over akkoorden, gebruik dan bij voorkeur akkoorden die hij aan het oefenen is.

## Regels

- **Bestaat er al een oefening met hetzelfde doel of id:** niets toevoegen, melden welke het is en stoppen.
- `id`: kebab-case, kort, Nederlands, uniek.
- `titel`: kort. `doel`: één zin, wat het je vingers oplevert.
- `stappen`: 3 tot 6 korte zinnen, met "je", in de volgorde waarin je ze doet. De laatste stap zegt hoe je het moeilijker maakt (bv. 5 bpm hoger).
- `tab` (optioneel): zes regels, **hoge e bovenaan**, elk in de vorm `e|-1-2-3-4-|`, allemaal even lang. Alleen zelf bedacht, nooit van een website.
- `standaardtempo`: 30 t/m 220 bpm, rustig beginnen (meestal 50-70).
- `maatsoort` (optioneel): `2/4`, `3/4`, `4/4` of `6/8`.
- `slagpatroon` (optioneel, alleen voor aanslagoefeningen): `D`, `U` en `-` gescheiden door spaties. In x/4 één of twee slagen per tel (4/4: 4 of 8), in 6/8 precies 6. Zonder `maatsoort` geen slagpatroon.
- Geen andere velden: de validatie keurt onbekende velden af.
- Zet hem achteraan de lijst.

## Controleren

Draai `bun run valideer` en daarna `bun run test`. Rood: repareren tot het groen is. Lukt dat niet, haal de oefening weer weg en meld waarom.

## Afsluiten

Eén korte alinea in het Nederlands: wat de oefening traint, op welk tempo je begint, en of er een tabje bij zit.
