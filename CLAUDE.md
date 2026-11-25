# CLAUDE.md

Eeltje: een oefenapp voor een beginnende gitarist. Akkoorden, liedjes, oefeningen, challenges en voortgang. Statische site zonder backend en zonder accounts, gehost op GitHub Pages. Elke PR krijgt daar een eigen preview.

- **Wat en waarom:** `docs/VISIE.md`. Lees dit bij de start van elke sessie.
- **Wat er nu gebouwd wordt:** `docs/STAPPENPLAN.md` (stap 1 t/m 7, de eerste versie). Werk één stap tegelijk af.
- **Wat eerdere stappen besloten en leerden:** `docs/OVERDRACHT.md`. Lees dit ook bij de start.
- **Een hele fase tegelijk bouwen met agents:** `docs/PARALLEL-BOUWEN.md`.

## Commando's

```bash
bun install                      # pakketten
bun run dev                      # lokaal, ook bereikbaar vanaf je telefoon op hetzelfde netwerk
bun run test                     # alle tests (Vitest)
bun run valideer                 # alleen de inhoud: akkoorden, liedjes, oefeningen tegen het schema
bun run lint                     # oxlint
bun run build                    # typecheck + productiebuild in dist/
VITE_PREVIEW=lokaal bun run dev  # als preview: eigen opslag die met de demo-voortgang begint
tools/kijk/kijk.sh . 5177 /vandaag,/liedjes/wonderwall   # screenshots, zie "De app bekijken"
```

## Mappenstructuur

```
docs/              VISIE.md, STAPPENPLAN.md, OVERDRACHT.md, PARALLEL-BOUWEN.md
src/lib/           pure logica: types, muziek (transponeren, capo, speelbaarheid), voortgang, route, storage, validatie, demo, akkoorden (raster, kopieertekst), diagram, gitaar (toonhoogtes, Karplus-Strong), metronoom, slagpatroon, liedjes (lijst, AI-label), meespelen (toestandsmachine), challenges (record, geschiedenis) en het verloop per challenge (oneMinuteChanges, spiderLadder, wisselreeks), routine (dagroutine), statistiek (streak, minuten), oefentimer, bestand (export/import), grafiek (schaal en ticks)
src/data/          inhoud als JSON: akkoorden.json, oefeningen.json, liedjes/<id>.json; index.ts laadt ze
src/audio/         Web Audio: context.ts (gedeelde AudioContext), metronoom en Karplus-Strong-gitaar
src/components/    herbruikbare UI met eigen css: Tabbalk, Schermvullend, Binnenkort, AkkoordDiagram (SVG), StatusLabel, TempoKiezer, TelWeergave, SlagpatroonWeergave, SpeelbaarheidLabel, Ster, AkkoordKiezer, ChallengeUitslag, StartTempo, Grafiek (SVG), Kerngetallen
src/hooks/         React-hooks (useRoute, useVoortgang, useWakeLock, useMetronoom, useMetronoomInstelling, useSpatiebalk, useKlok, useVerborgen, useChallengeResultaat, useRoutine, useOefentimer, useNu)
src/pages/         één component per route (default export), met een eigen css-bestand ernaast
tests/             Vitest, één bestand per module in src/lib
tools/kijk/        screenshots met headless Chrome, geen onderdeel van de app
.claude/commands/  /nieuw-nummer, /nieuw-akkoord, /nieuwe-oefening (stap 7)
.github/workflows/ ci.yml (lint, test, build, audit) en pages.yml (main en PR-previews)
```

## Werkwijze

1. **Plan eerst.** Lees de stap in het stappenplan en geef een kort plan voordat je code schrijft. Is iets onduidelijk of in strijd met de visie, vraag het dan in plaats van te gokken.
2. **Eén stap per branch.** Maak `stap-N-<naam>` vanaf de actuele `main`. De eigenaar werkt soms in dezelfde map: controleer `main` vóór je pusht en rebase als die is veranderd.
3. **Tests eerst.** Logica in `src/lib` krijgt eerst een test die faalt, en dan pas de code. Worden nieuwe tests in één keer groen, breek dan even de regel die ze testen (een sortering omdraaien, een grens verschuiven) en controleer dat ze falen.
4. **Van binnen naar buiten.** Eerst de pure logica in `src/lib` met tests, dan de opslag en de hooks, dan de schermen.
5. **Wees kritisch op wat er al staat.** Plak niet alleen je eigen code erbij. Kijk ook naar de code die je raakt: duplicatie, onduidelijke namen, logica in een component die in `src/lib` hoort. Verbeter dat, maar alleen als het echt iets oplevert (eenvoudiger, duidelijker, beter testbaar). Check achteraf of die winst er ook is, anders terugdraaien. Gedrag blijft gelijk, tests blijven groen, en een refactor krijgt een eigen commit.
6. **Klein en groen.** Na elk werkend onderdeel `bun run lint`, `bun run test` en `bun run build`, en dan committen. Commit nooit met falende tests, typefouten of lintfouten.
7. **Echt bekijken.** Geef je functie een voorbeeld in `demoVoortgang` (`src/lib/demo.ts`), zodat hij in de preview en in `kijk.sh` iets laat zien. Bekijk de UI op 360px en op desktop, licht en donker, met `tools/kijk/kijk.sh` (zie hieronder). Geluid, trillen en Wake Lock kun je niet screenshotten: noem die in de PR onder "Zelf checken".
8. **Afronden.** Vink de stap af in het stappenplan en commit. Werk `docs/OVERDRACHT.md` bij: besluiten, valkuilen en geparkeerde ideeën uit deze stap. Nieuwe begrippen gaan in de begrippenlijst van `docs/VISIE.md`.
9. **PR.** Push en maak de PR met `gh pr create`: een korte, functionele tekst over wat je ermee kunt, wat je in de preview moet openen, wat de eigenaar zelf op zijn telefoon moet checken, en de afwijkingen van het stappenplan expliciet erin. De Pages-workflow zet de preview-link in de PR. Merge niet zelf; de eigenaar zegt wanneer en squasht.

## Architectuur

- **Geen backend.** Alles draait in de browser. Persoonlijke voortgang staat in `localStorage`, en alleen `src/lib/storage.ts` weet dat. De rest van de app gebruikt `opslag` en `useVoortgang`.
- **`src/lib` is puur.** Geen React, geen DOM, geen `localStorage`, geen `new Date()` diep in een functie: de tijd komt binnen als parameter (`nu = new Date()` als standaard mag). Zo blijft alles met Vitest te testen.
- **Inhoud is data.** Akkoorden, liedjes en oefeningen staan als JSON in `src/data/` en worden alleen via `src/data/index.ts` gelezen. Nieuwe inhoud vraagt geen code. `validatie.ts` bewaakt het schema; `tests/data.test.ts` draait hem over alle inhoud.
- **De voortgang heeft een versie.** Verandert de vorm van `Voortgang`, verhoog dan `versie` en laat `normaliseerVoortgang` de oude vorm omzetten. Een oud exportbestand moet altijd te importeren blijven.
- **Routes met een hash** (`#/liedjes/wonderwall`, via `useRoute`). GitHub Pages kent geen fallback naar `index.html`, dus echte paden geven daar een 404.
- **Geluid en diagrammen zelf gemaakt.** Geluid via de Web Audio API (een klik voor de metronoom, Karplus-Strong voor de gitaar), diagrammen als eigen SVG-component. Geen audiobestanden, geen library voor geluid of diagrammen.

## Naamgeving

- **Domeinbegrippen zijn Nederlands:** types, functies, variabelen, bestanden en componenten. Bijvoorbeeld `speelbaarheidsLabel(ontbrekendeAkkoorden(...))`, `Liedje.secties`, `AkkoordStatus`. Gebruik de begrippenlijst in `docs/VISIE.md` en verzin geen synoniemen.
- **Gitaarjargon blijft zoals gitaristen het zeggen:** capo, barré, bpm, de challenges `one-minute-changes` en `spider-ladder`.
- **Technische begrippen en React-conventies blijven Engels:** `useRoute`, `Backend`, `props`, `href`.
- Geen accenten in namen. Meervouden in het Nederlands (`akkoorden`, `liedjes`).
- UI-teksten zijn Nederlands, kort en vriendelijk; je praat tegen één beginnende gitarist ("je").

## De app bekijken

`tools/kijk/kijk.sh <worktree> <poort> <route[,route]>...` kopieert de worktree (ook ongecommit), bouwt hem als preview, serveert hem op die poort en maakt screenshots in `/tmp/kijk-<poort>/shots` (360 en 1280 breed, licht en donker). Daarna stopt de server weer. Voorbeeld:

```bash
tools/kijk/kijk.sh . 5177 /vandaag,/akkoorden,/akkoorden/A,/liedjes,/liedjes/wonderwall /voortgang
```

- **Routes** zijn de hash-routes zonder `#`. Met `/pad!selector` tikt hij vóór de screenshot op dat element.
- **Data:** de preview begint met `demoVoortgang` (een maand geoefend, A, D, E en Em op "kan ik", G, C en Am op "oefenen"). Met `KIJK_NIEUW=1` zie je de app als nieuwe gebruiker.
- **Opties** staan bovenin `kijk.mjs`, zoals `KIJK_HOOGTE=640`, `KIJK_BREEDTES=360` of `KIJK_LATEN=1` (de server blijft draaien).
- **Een PR-preview op Pages** fotografeer je zonder bouwen: `KIJK_BASE=https://lightnerr.github.io/eeltje/pr-12 bun tools/kijk/kijk.mjs /tmp/pr-12 /vandaag`.
- **Nodig:** Chrome in de sandbox (`/usr/bin/google-chrome`). In een verse sandbox eerst `rr-node-modules` en dan `bun install` in `tools/kijk`.

## GitHub Pages

- `main` staat in de root van de branch `gh-pages`, elke open PR in `pr-<nummer>/`. Sluit je de PR, dan verdwijnt de map. Alles via `.github/workflows/pages.yml`.
- **Alle paden relatief.** `base: './'` in `vite.config.ts`. Gebruik nooit een pad dat met `/` begint voor eigen bestanden (iconen, manifest, service worker), anders werkt het in een preview niet.
- **Een preview raakt je echte voortgang niet.** Hij wordt gebouwd met `VITE_PREVIEW=pr-<nummer>`: eigen `localStorage`-sleutel, en hij begint met `demoVoortgang`. Elke nieuwe `localStorage`-sleutel krijgt hetzelfde achtervoegsel.
- **De service worker van `main` blijft van de previews af.** Zijn scope omvat ook `pr-*/`: sluit die uit van de navigatie-fallback en de precache (`navigateFallbackDenylist: [/\/pr-\d+\//]`), anders krijg je in een preview de app van `main` te zien.

## Inhoud toevoegen

- **Nooit songteksten** en geen tabs die van websites zijn overgenomen. Een liedje is alleen een akkoordenschema, tempo en slagpatroon.
- Liedjes die Claude maakt krijgen `bron: "ai-gegenereerd"` en `geverifieerd: false`. Alleen de eigenaar zet iets op geverifieerd.
- Elk akkoord in een liedje staat in `akkoorden.json`, met een vingerzetting die echt klopt. `bun run valideer` en `bun run test` zijn groen voordat je commit.
- Gebruik de commands: `/nieuw-nummer`, `/nieuw-akkoord`, `/nieuwe-oefening`. Ze lezen `mijn-akkoorden.txt` in de root (de tekst van de knop "Kopieer mijn akkoorden").

## Tests snel houden

`bun run test` duurt nu ongeveer een seconde. Houd dat zo:

- Test de logica in `src/lib`, niet de schermen. Een component dat logica nodig heeft, krijgt die uit een functie in `src/lib`.
- Tests draaien in de `node`-omgeving. Voeg geen jsdom of happy-dom toe zonder overleg.
- **Niet op de klok leunen.** Geef een vaste datum mee (`new Date('2026-11-24T12:00:00')`), wacht nooit echt op timers (gebruik `vi.useFakeTimers()` als het moet), en laat tests niet van elkaars volgorde afhangen.

## Technische regels

- **Vite + React + TypeScript**, `strict` aan, geen ongebruikte variabelen. Gewone CSS, mobile-first, getest op 360px breed.
- **Pakketbeheer met bun** (`bun install`, `bun run …`), ook in CI. Gebruik geen npm of `package-lock.json`.
- **Alles gratis.** Alleen gratis, open-source pakketten, en alleen als het echt nodig is. Twijfel je over een licentie, vraag het dan eerst.
- **Licht en donker** volgen het systeem (`prefers-color-scheme`).
- **Met een gitaar op schoot:** tikdoelen van minstens 48px, grote letters in meespeelmodus en challenges, en Wake Lock waar de browser het kan.
- **Toegankelijk:** alles werkt met het toetsenbord, de focus is zichtbaar, en `prefers-reduced-motion` wordt gerespecteerd.
- **Offline en installeerbaar** als PWA. Een nieuwe functie werkt ook zonder netwerk.

## Niet doen

- Geen functionaliteit bouwen die niet in de huidige stap staat; noteer ideeën in plaats daarvan.
- Geen backend, geen accounts, geen login, geen analytics en geen externe of betaalde diensten. Na het laden praat de app met niemand.
- Geen songteksten en geen gekopieerde tabs, ook niet "even als voorbeeld".
- Geen audiobestanden of libraries voor geluid of akkoorddiagrammen.
- Nooit de voortgang van de eigenaar weggooien: geen sleutel hernoemen of de vorm veranderen zonder migratie in `normaliseerVoortgang`.
