# Stappenplan Eeltje

Dit is het bouwplan voor de eerste versie. Het waarom en de begrippen staan in `docs/VISIE.md`, de vaste werkafspraken in `CLAUDE.md`. Dit document zegt **wat** er per stap gebouwd wordt en **wanneer** een stap af is.

## Hoe dit plan gebruikt wordt

- Werk de stappen op volgorde af, **één stap per sessie en per branch** (`stap-N-<naam>`). Begin met: "Lees CLAUDE.md, docs/VISIE.md, docs/OVERDRACHT.md en stap N uit docs/STAPPENPLAN.md. Maak eerst een plan."
- "Klaar wanneer" is de specificatie: de stap is af als elk punt aantoonbaar klopt, in de preview of in een test.
- Nieuwe begrippen gaan in dezelfde stap in de begrippenlijst van `docs/VISIE.md`.
- Vink de stap af in het overzicht hieronder zodra hij af is, en commit.
- Latere uitbreidingen krijgen een eigen plan: `docs/STAPPENPLAN-FASE-2.md` enzovoort, in dezelfde vorm.

## Overzicht

- [x] Stap 1: Projectopzet, datamodellen, voorbeelddata en muzieklogica
- [x] Stap 2: Akkoorden
- [ ] Stap 3: Metronoom en slagpatroon
- [ ] Stap 4: Liedjes en meespelen
- [ ] Stap 5: Oefeningen en challenges
- [ ] Stap 6: Vandaag en voortgang
- [ ] Stap 7: PWA, commands en README

---

## Stap 1: Projectopzet, datamodellen, voorbeelddata en muzieklogica

**Doel.** Een app die bouwt en test, met alle inhoud en de logica waar de schermen op leunen.

**Opdracht**

- Vite + React + TypeScript met hash-routing en vijf tabbladen (Vandaag, Akkoorden, Liedjes, Oefenen, Voortgang).
- De types uit de visie in `src/lib/types.ts`. Akkoorden (minstens A, Am, C, D, Dm, E, Em, G en G met 3 vingers, Cadd9, Asus2, Dsus2, Fmaj7, F klein, Bm klein, E7, A7, D7, B7, en de eigen A als standaard), 12 tot 15 liedjes (traditioneel en pop, 3 of 4 simpele akkoorden, `geverifieerd: false`) en de oefeningen.
- `storage.ts` als enige plek voor de voortgang, met export, import en een versie. Bij de eerste start D en A op "oefenen".
- Muzieklogica met tests: transponeren, capo, speelbaarheid, vereenvoudigingen, capo-suggestie, leeradvies, slagpatroon en maatsoort.
- Een validatie van alle inhoud tegen het schema (`bun run valideer`).

**Klaar wanneer**

- `bun run test` en `bun run build` slagen; de validatie keurt alle inhoud goed.
- De vijf tabbladen zijn bereikbaar en de app opent op Vandaag.

---

## Stap 2: Akkoorden

**Doel.** Je ziet hoe elk akkoord gegrepen wordt, hoort hoe het klinkt en houdt bij hoe ver je bent.

**Opdracht**

- Een SVG-akkoorddiagram als eigen component: vingernummers in de bolletjes, x en o boven de snaren, snaarnamen eronder, fretnummer bij een hogere positie, en een barré.
- Een raster met alle akkoorden, met filter op status.
- Detailpagina: groot diagram, afspelen (aangeslagen en per snaar getokkeld, Karplus-Strong), varianten (een andere als voorkeur kiezen) en de status.
- "Kopieer mijn akkoorden" naar het klembord.

**Klaar wanneer**

- Elk akkoord uit `akkoorden.json` staat in het raster en het diagram klopt met zijn frets en vingers (ook de barré van F en de positie van een hoger akkoord).
- Een status of een voorkeursvariant zetten blijft staan na herladen.
- Afspelen werkt op een telefoon (eigenaar checkt het geluid in de preview).

---

## Stap 3: Metronoom en slagpatroon

**Doel.** In de maat leren spelen.

**Opdracht**

- Een metronoom in `src/audio` die op de audioklok plant (niet op `setInterval`), zodat hij strak blijft. 30 tot 220 bpm, tap tempo, accent op de 1, maatsoort en een tel die je ziet.
- Slagpatroon-trainer: een patroon kiezen of zelf ontwerpen; de pijltjes lopen mee met de metronoom.

**Klaar wanneer**

- Tap tempo, de grenzen van het tempo en de plaats van het accent zijn getest in `src/lib`.
- De metronoom loopt een minuut zonder hoorbaar te verlopen (eigenaar checkt in de preview).

---

## Stap 4: Liedjes en meespelen

**Doel.** Liedjes vinden die je kunt spelen, en ze meespelen.

**Opdracht**

- Lijst met per liedje het speelbaarheidslabel en de capo-suggestie, en bovenaan "Welk akkoord moet ik nu leren?".
- Liedjespagina: het schema per maat, kleine diagrammen, het slagpatroon als pijltjes, het label "AI-versie, nog niet gecontroleerd" met een knop om hem als gecontroleerd te markeren, en favoriet maken.
- Meespeelmodus: aftellen, metronoom, optioneel het akkoordgeluid, de huidige maat licht op, het volgende akkoord staat klaar, tempo van 40% tot 120%, een sectie herhalen. Schermvullend en met Wake Lock.

**Klaar wanneer**

- Met de demo-voortgang toont de lijst alle drie de soorten labels en minstens één capo-suggestie.
- De meespeelmodus volgt `speelVolgorde`, ook met een herhaalde sectie.

---

## Stap 5: Oefeningen en challenges

**Doel.** Vingers sterker en sneller maken, met een record om te verbreken.

**Opdracht**

- Oefeningenpagina's met doel, stappen, tabje en metronoom op het standaardtempo.
- One minute changes, spider-ladder en wisselreeks, elk schermvullend, met de spatiebalk waar het kan, het resultaat opgeslagen en het record erbij.

**Klaar wanneer**

- Een resultaat komt in de voortgang en het record klopt (getest).
- De demo-voortgang heeft van elke challenge een geschiedenis, en de challenges tonen het record.

---

## Stap 6: Vandaag en voortgang

**Doel.** Elke dag weten wat je gaat doen, en zien dat je vooruitgaat.

**Opdracht**

- Vandaag: de dagroutine (`maakRoutine`), de oefentimer, streak en totaal aantal minuten.
- Voortgang: grafiekjes per challenge (eigen SVG), records, streak, minuten per week, akkoordstatussen, export en import als bestand, en "Alles wissen" met bevestiging.

**Klaar wanneer**

- Een export van de ene browser is te importeren in een andere, en geeft dezelfde voortgang.
- Een kapot of vreemd bestand importeren geeft een duidelijke melding en laat de voortgang heel.

---

## Stap 7: PWA, commands en README

**Doel.** Installeerbaar, offline, en makkelijk uit te breiden.

**Opdracht**

- PWA: manifest, iconen en een service worker. Offline bruikbaar. De service worker van `main` blijft van `pr-*/` af (zie `CLAUDE.md`, "GitHub Pages").
- `.claude/commands/nieuw-nummer.md`, `nieuw-akkoord.md` en `nieuwe-oefening.md` volgens de opdracht van de eigenaar: `mijn-akkoorden.txt` lezen (of vragen), een beginnersversie maken, geen tekst, `ai-gegenereerd` en niet geverifieerd, valideren, tests draaien, en in één alinea samenvatten wat er vereenvoudigd is.
- README: wat de app is, lokaal draaien, Pages aanzetten, op de telefoon installeren, en de keuzes.

**Klaar wanneer**

- De app op `main` is te installeren op een telefoon en opent zonder netwerk (eigenaar checkt).
- Een PR-preview toont zijn eigen versie, niet die van `main`, ook nadat de app van `main` is geïnstalleerd.
- `/nieuw-nummer` voegt een liedje toe dat de validatie en de tests haalt.
