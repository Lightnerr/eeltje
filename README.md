# Eeltje

Oefenapp voor een beginnende gitarist: akkoorden, liedjes, oefeningen, challenges en voortgang. Geen account, geen backend, werkt offline. De app draait op https://lightnerr.github.io/eeltje/. Zie `docs/VISIE.md` voor het waarom en `docs/STAPPENPLAN.md` voor de bouwvolgorde.

## GitHub Pages aanzetten (eenmalig)

1. Pages op een privé-repo kan alleen met GitHub Pro. Met een gratis account zet je de repo eerst op publiek (Settings > General > Danger Zone > Change visibility).
2. Merge iets naar `main` of start de workflow **Pages** met de hand (Actions > Pages > Run workflow). Die maakt de branch `gh-pages`.
3. Settings > Pages > Build and deployment: **Deploy from a branch**, branch `gh-pages`, map `/ (root)`.
4. Na een minuut staat de app op https://lightnerr.github.io/eeltje/.

## Previews

Elke PR krijgt een eigen versie op `https://lightnerr.github.io/eeltje/pr-<nummer>/`; de link komt als reactie in de PR. Een preview heeft een eigen opslag die begint met verzonnen voortgang, dus je echte voortgang blijft heel. Sluit of merge je de PR, dan verdwijnt de preview.

## Op je telefoon installeren

- **iPhone (Safari):** open de app, tik op Deel en dan op "Zet op beginscherm".
- **Android (Chrome):** open de app, tik op ⋮ en dan op "App installeren" (of "Toevoegen aan startscherm").

Gebruik de link mét slash aan het eind (`…/eeltje/`), of open Eeltje via het geïnstalleerde icoon: zonder slash opent hij niet offline.

Daarna opent Eeltje als een gewone app, ook zonder internet (open hem één keer met internet, dan staat alles erop). Je voortgang staat op het apparaat zelf: neem hem mee met Voortgang > Exporteren en Importeren.

Is er een nieuwe versie, dan zie je bovenaan "Er is een nieuwe versie van Eeltje" met een knop Herladen. Tik je niet, dan krijg je hem de volgende keer dat je de app opnieuw start.

## Lokaal ontwikkelen

```bash
bun install
bun run dev        # http://localhost:5173, met --host ook vanaf je telefoon op hetzelfde wifi
bun run test
bun run valideer  # alleen de inhoud tegen het schema
bun run lint
bun run build
```

De service worker (offline) zit alleen in de build, niet in `bun run dev`. Offline proberen: `bun run build`, dan `python3 -m http.server -d dist` en open http://localhost:8000.

Nieuwe liedjes, akkoorden en oefeningen voeg je toe met Claude Code: `/nieuw-nummer Riptide van Vance Joy`, `/nieuw-akkoord`, `/nieuwe-oefening`. Plak eerst de tekst van de knop "Kopieer mijn akkoorden" in `mijn-akkoorden.txt` in de root (wordt niet ingecheckt). Claude maakt dan een beginnersversie die bij jouw akkoorden past, zonder songtekst en gemarkeerd als AI-versie.

## Keuzes

- **Hash-routes** (`#/liedjes/...`), omdat GitHub Pages geen fallback naar `index.html` heeft.
- **bun** voor pakketbeheer, net als in derde-helft.
- **Opnieuw begonnen.** De app is vanaf nul opnieuw gebouwd; alleen de werkwijze, CI, Pages en de kijktool bleven.
- **Eén CSS-bestand per scherm en component**, naast het component. `styles.css` heeft alleen de basis en de variabelen, zodat stappen die tegelijk gebouwd worden elkaar niet raken.
- **G is standaard de versie met 4 vingers** (past bij Cadd9 en Dsus4); de versie met 3 vingers is een variant die je als voorkeur kunt kiezen.
- **Wonderwall heeft 5 akkoorden** (Em7, G, Dsus4, A7sus4, Cadd9): dat is één vingerfamilie, dus een uitzondering op "3 of 4 akkoorden".
- **Kapotte voortgang wordt niet weggegooid** maar apart bewaard, zodat er niets verloren gaat.
- **Geluid ook met de stilteschakelaar aan** (iPhone): zodra je zelf geluid start, zet de app de afspeelsessie op "playback". Muziek die op de achtergrond speelt, stopt dan.
- **Het akkoordenraster toont elk akkoord één keer**, in de variant die je koos (anders de standaard). De andere varianten staan op de detailpagina.
- **Spatie in meespelen** is start/pauze. Alleen een knop die je met het toetsenbord (Tab) hebt gekozen, bedien je met de spatie; zo sluit de spatie nooit per ongeluk het scherm.
- **Het akkoordgeluid bij meespelen wordt op de audioklok ingepland**, tegelijk met de klik, ook met een Bluetooth-koptelefoon.
- **Een challenge stopt als je scherm uitgaat** (vergrendelen, ander tabblad). Dan wordt er niets opgeslagen, zodat een halve minuut nooit als record telt.
- **Het record van de wisselreeks** geldt per reeks akkoorden; bij gelijke tijd telt het hogere tempo.
- **De streak straft niet:** één dag overslaan mag, twee dagen achter elkaar breekt hem.
- **De dagroutine ligt de hele dag vast**, ook als je overdag een akkoord op "kan ik" zet. Hij wordt apart bewaard, niet in je voortgang.
- **De oefentimer loopt door** als je naar een challenge of liedje gaat, en na herladen. Een vergeten timer telt hooguit 3 uur.
- **"Alles wissen" wist echt alles** van dit apparaat (ook de routine, de timer en een reservekopie van een kapotte voortgang), na bevestiging.
- **De service worker is zelf gebouwd**, zonder extra pakket: een klein Vite-plugin zet de lijst met bestanden van de build erin. Elke versie heeft een eigen cache, dus je ziet nooit een half-oude app.
- **Een update vraagt eerst** ("Herladen") in plaats van zomaar te verversen terwijl je speelt.
- **Previews hebben geen service worker**, en die van de echte app laat `pr-<nummer>/` met rust. Zo zie je in een preview altijd de preview, ook als je de app al hebt geïnstalleerd.
- **Het icoon is een plectrum**, zelf getekend als SVG; de PNG's maakt `tools/kijk/iconen.mjs`.
- **Commands voor nieuwe inhoud** (`/nieuw-nummer` en de andere) werken zonder internet, uit wat Claude van het liedje weet: nooit tekst, nooit tabs van websites.
- Meer besluiten staan in `docs/OVERDRACHT.md`.
