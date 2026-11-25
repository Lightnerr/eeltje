---
description: Maak een beginnersversie van een liedje (alleen akkoordenschema, tempo en slagpatroon) die past bij jouw akkoorden
argument-hint: <titel> van <artiest>, bv. "Riptide van Vance Joy"
allowed-tools: Read, Write, Edit, Glob, Bash(bun run valideer), Bash(bun run test), Bash(rm src/data/liedjes/*.json)
---

Maak een vereenvoudigde beginnersversie van **$ARGUMENTS** als `src/data/liedjes/<id>.json`.

## Harde regels

- **Nooit songtekst**, ook geen regel of titel van een couplet als sectienaam. Sectienamen zijn `intro`, `couplet`, `refrein`, `brug`, `outro` en dergelijke.
- **Geen tabs of akkoorden van websites.** Gebruik het internet niet. Werk uit je eigen muzikale kennis van het akkoordenschema. Ken je het liedje niet goed genoeg, zeg dat dan en stop.
- `"bron": "ai-gegenereerd"` en `"geverifieerd": false`. Alleen de eigenaar zet iets op geverifieerd.

## 1. Wat kent de gebruiker?

Lees `mijn-akkoorden.txt` in de root. Daarin staat de tekst van de knop "Kopieer mijn akkoorden", bv. "Akkoorden die ik kan: A, D, E. Aan het oefenen: G, Em." Beide groepen tellen als **bekend**. Staat het bestand er niet (of staat er "Ik ken nog geen akkoorden."), vraag dan welke akkoorden hij kent en wacht op het antwoord.

## 2. Bestaat het al?

Het id is de titel in kebab-case: kleine letters, cijfers en streepjes, zonder leestekens (`knockin-on-heavens-door`). Staat `src/data/liedjes/<id>.json` er al, of een liedje met dezelfde titel en artiest: **niet overschrijven**. Meld het en stop.

## 3. De beginnersversie

Lees eerst `src/lib/types.ts` (`Liedje`), `src/data/akkoorden.json` en één bestaand liedje als voorbeeld (bv. `src/data/liedjes/let-it-be.json`).

- **Origineel:** bepaal de klinkende toonsoort en de akkoorden van het origineel.
- **Traditioneel liedje:** dat heeft geen vaste toonsoort. Kies de toonsoort waarin de vormen zonder capo het best passen bij wat de gebruiker kent (G, C, D, A, E, Am, Em, Dm), en sla de capo dan over. Een popliedje blijft klinken zoals de opname.
- **Capo en vormen:** kies een capo van 0 t/m 7 waarbij de vormen zo veel mogelijk bekende akkoorden zijn. De vorm = het klinkende akkoord min de capo in halve tonen (`vormBijCapo` in `src/lib/muziek.ts`). Probeer elke capo en kies die met de minste onbekende vormen; bij gelijkspel de laagste capo.
- **Vereenvoudigen** waar nodig, net als `vereenvoudigingen` in `muziek.ts`: extensies weg (E7 → E, Am7 → Am, Cadd9 → C, Dsus4 → D), en zonder barré: F → Fmaj7, Bm → Bm7 of de kleine Bm, B → B7. Een `/bas` mag weg. Beter een bekend kaal akkoord dan een onbekende extensie.
- **G-familie:** G (4 vingers), Cadd9, Dsus4, Em7 en A7sus4 delen ringvinger en pink: wisselen is maar twee vingers verzetten. Valt het liedje bij een capo op G, C, D en Em, en kent de gebruiker die familievormen (of kent hij C, D en Em ook niet), speel dan Cadd9, Dsus4 en Em7 en zet de echte akkoorden in `origineleAkkoorden`. Kent hij de gewone C, D en Em wel, houd die dan. Een liedje dat helemaal uit de familie bestaat, mag meer dan 4 akkoorden hebben.
- **3 of 4 verschillende akkoorden** in het hele liedje (de test eist dat, behalve voor een liedje dat helemaal uit de G-familie bestaat). Heeft het origineel er meer, laat dan doorgangsakkoorden weg of vervang ze door een verwant akkoord dat er al in zit (bv. Am voor C/B, de V voor een V7).
- **Ontbreekt er toch een akkoord**, kies dan het makkelijkste (laagste `moeilijkheid` in `akkoorden.json`, geen barré).
- **Elk akkoord staat in `akkoorden.json`.** Ontbreekt een vorm, kies dan een vorm die er wel staat, of voeg hem toe volgens de regels in `.claude/commands/nieuw-akkoord.md` (frets en vingers die echt kloppen; de validatie rekent de tonen na).
- **`origineleAkkoorden`:** alleen als je iets vereenvoudigd of weggelaten hebt. Dat zijn de vormen van het origineel bij dezelfde capo, in volgorde van eerste keer spelen. Zet in `opmerking` één zin wat er vereenvoudigd is ("Fmaj7 in plaats van F, zodat je geen barré nodig hebt.").

## 4. Het JSON-bestand

- `id`, `titel`, `artiest` (traditioneel = `"Traditioneel"`), `soort`: `"traditioneel"` of `"pop"`.
- `toonsoort`: de **klinkende** toonsoort, een grondtoon eventueel met `m` (`G`, `F#m`, `Bb`).
- `capo`: de gekozen capo. Alle akkoorden in de maten zijn de **vormen** die je bij die capo grijpt.
- `maatsoort`: `2/4`, `3/4`, `4/4` of `6/8`.
- `bpm`: 30 t/m 220, het tempo van het origineel, en het telt de **noemer**: in 6/8 tel je achtsten (een 6/8 met 60 punten per maathelft is 180 bpm).
- `slagpatroon`: `D` (omlaag), `U` (omhoog), `-` (rust), gescheiden door spaties. In x/4 één of twee slagen per tel (4/4: 4 of 8, 3/4: 3 of 6, 2/4: 2 of 4); in 6/8 precies 6. Houd het eenvoudig, bv. `D - D U - U D U` in 4/4, `D - D U D U` in 3/4.
- `secties`: elke sectie één keer, met een naam en maten. Een maat is een lijst van 1 t/m 4 akkoorden die de tellen gelijk verdelen: in 4/4 1, 2 of 4; in 3/4 en 6/8 1 of 3; in 2/4 1 of 2. Houd wissels voor een beginner liefst op hele maten.
- `volgorde`: de sectienamen in speelvolgorde, herhalingen mogen. Elke sectie komt er minstens één keer in.
- Geen andere velden. Een onbekend veld (zoals `tekst`) keurt de validatie af.

## 5. Controleren

Draai `bun run valideer` en daarna `bun run test`. Rood: lees de fout en repareer het bestand tot alles groen is. Lukt dat niet, haal het bestand weg (`rm src/data/liedjes/<id>.json`, en ook een akkoord dat je erbij zette) en meld waarom.

## 6. Afsluiten

Eén alinea in het Nederlands, aan de gebruiker ("je"): wat er vereenvoudigd is ten opzichte van het origineel, welke capo, en welke akkoorden je nog mist (of "Je kunt hem meteen spelen"). Meld ook als je een akkoord aan `akkoorden.json` hebt toegevoegd.
