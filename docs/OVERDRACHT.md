# Overdracht

Stand van zaken voor de agent die verdergaat. Lees eerst `CLAUDE.md`, `docs/VISIE.md` en de volgende stap in `docs/STAPPENPLAN.md`. Dit document vult die aan met wat er onderweg is besloten en geleerd.

## Waar we staan

- Eeltje begint opnieuw. De app-code van een eerdere bouwsessie is weggegooid en is geen voorbeeld: lees hem niet, ook niet in de git-geschiedenis (de commits "Fase N: …").
- Wat blijft: de werkwijze (`CLAUDE.md`, de docs), CI, Dependabot, GitHub Pages met PR-previews en de kijktool. Die komen uit derde-helft (de teamapp van de eigenaar) en zijn op een statische app aangepast.
- Stap 1 t/m 7 worden parallel gebouwd volgens `docs/PARALLEL-BOUWEN.md`. Elke stap vult hieronder zijn eigen sectie "Besluiten uit stap N".

## Besluiten die afwijken van of aanvullen op de docs

- **bun in plaats van npm.** Net als in derde-helft. `package-lock.json` is weg en `bun.lock` is de lockfile; CI installeert met `--frozen-lockfile`.
- **oxlint** met dezelfde regels als derde-helft (`.oxlintrc.json`), in CI.
- **Hash-routing** (`#/liedjes/wonderwall`): GitHub Pages heeft geen fallback naar `index.html`, en met `base: './'` werkt dezelfde build in de root en in `pr-<nummer>/`.
- **Previews.** `pages.yml` publiceert naar de branch `gh-pages`: `main` in de root, een PR in `pr-<nummer>/`, en weg als de PR sluit. Geen `actions/deploy-pages`, want dat kent maar één site per repo en dus geen previews. Pushes naar `gh-pages` proberen het vijf keer opnieuw met een rebase, zodat twee runs tegelijk niet botsen. Dependabot krijgt geen preview: zijn token mag niet schrijven.
- **Eigen opslag per preview.** Alle previews delen het domein (en dus `localStorage`) met de echte app. Een preview wordt gebouwd met `VITE_PREVIEW=pr-<nummer>`; `storage.ts` plakt dat achter de sleutel en begint dan met `demoVoortgang` in plaats van een lege voortgang. De demo-voortgang wordt pas opgeslagen bij de eerste wijziging.
- **Demo-voortgang** (`src/lib/demo.ts`) ligt rond `nu`: elke dag van de afgelopen week geoefend, de weken ervoor om de dag (streak 19, want één losse gemiste dag breekt hem niet; zie stap 6), en een geschiedenis voor alle drie de challenges. `tests/demo.test.ts` bewaakt dat hij geldig is en naar bestaande liedjes verwijst.
- **Kijktool.** `tools/kijk/kijk.sh` bouwt met `VITE_PREVIEW=kijk` en serveert `dist` met `python3 -m http.server`. Licht en donker gaan via `prefers-color-scheme`, want de app volgt het systeem en heeft geen eigen schakelaar.

## Valkuilen

- **Pages op een privé-repo** kan alleen met GitHub Pro. Op een gratis account moet de repo publiek zijn.
- **Pages aanzetten** gaat eenmalig met de hand: Settings > Pages > Deploy from a branch > `gh-pages` / `(root)`. De branch bestaat pas na de eerste run van `pages.yml`.
- **De service worker** (stap 7) heeft een scope die ook `pr-*/` omvat. Zonder `navigateFallbackDenylist: [/\/pr-\d+\//]` toont een preview na installatie de app van `main`.

## Geparkeerde ideeën

- Een balkje "Preview PR 12" bovenin een preview, zodat je ziet dat je niet in de echte app zit.
- De React Compiler, net als in derde-helft. Dan vervallen `useMemo`, `useCallback` en `React.memo`.

## Besluiten uit stap 1

### Besluiten

- **Akkoorden** staan plat in `akkoorden.json`, één object per variant. `variant` is een korte url-naam (`eigen`, `klassiek`, `barre`, `3-vingers`, `klein`, `standaard`), `titel` is wat de app toont. `basisfret` ontbreekt = 1; `frets` zijn absoluut (A barré: `[5,7,7,6,5,5]` met `basisfret: 5`). Hogere posities: A barré op 5 en C barré op 3.
- **G is standaard de 4-vingerversie** (320033, familie met Cadd9, Dsus4 en Em7); `3-vingers` is de variant. Bm en F zijn standaard `klein`, met `barre` als variant.
- **De validatie luistert naar de tonen.** `validatie.ts` rekent uit welke tonen de frets laten klinken en vergelijkt dat met de naam: een verkeerde fret of een verkeerde naam valt meteen op. Ook vingers tegen frets, barré, basisfret, en onbekende velden (zo kan er geen `tekst`-veld in een liedje sluipen).
- **Liedjes:** de akkoorden zijn vormen bij `capo`; `toonsoort` is klinkend. `origineleAkkoorden` alleen bij een vereenvoudigde versie: de vormen van het origineel bij dezelfde capo. `soort` is `traditioneel` of `pop`. Maatsoorten: `2/4`, `3/4`, `4/4`, `6/8`. In x/4 is een slagpatroon 1 of 2 slagen per tel, in 6/8 één per achtste. Akkoorden in een maat moeten de tellen gelijk verdelen (dus geen 3 in 4/4).
- **Muzieklogica** (`muziek.ts`): `transponeer` houdt kruis of mol van het origineel aan, en kiest bij een natuurlijke toon de gewone spelling (Bb, Eb, Ab; maar F#m, C#m, G#m). `zelfdeAkkoord` ziet A#m = Bbm, en alle vergelijkingen met bekende akkoorden gaan daarlangs. Een capo-suggestie geeft de bekende spelling terug.
- **Vereenvoudigingen** zijn regels, geen lijst: extensies weg (E7 → E, Am7 → Am, Cadd9/G → Cadd9 → C) plus vaste vervangers zonder barré (F → Fmaj7, Bm → Bm7, B → B7). `capoSuggestie` gebruikt ze alleen als het zonder niet lukt (`vereenvoudigd` zegt welke), en kiest daarna de capo die het dichtst bij de oude ligt. Capo 0 t/m 7. De huidige capo doet mee: lukt het daar al met evenveel vereenvoudigingen (Oh! Susanna met A in plaats van A7), dan is er geen suggestie.
- **Speelbaarheid is streng:** `ontbrekendeAkkoorden` telt een vereenvoudiging niet als bekend. Stap 4 kan `vereenvoudig` gebruiken om "speel Fmaj7 voor F" te tonen.
- **Leeradvies**: het akkoord dat de meeste liedjes helemaal speelbaar maakt; bij gelijkspel het akkoord dat het vaakst ontbreekt, dan alfabetisch. Telt geen capo-suggesties mee.
- **Opslag:** `opslagSleutel(naam, preview)` geeft `eeltje.voortgang.<naam>[.<preview>]`; de voortgang is `opslagSleutel('v1')`. Een extra sleutel van een latere stap maakt hij met dezelfde helper. Wat niet te lezen is (kapotte JSON, hogere versie) gaat naar `eeltje.voortgang.kapot` en de app begint met een nieuwe voortgang; de oude sleutel blijft staan tot de eerste wijziging. `bewaar` geeft `false` als de browser weigert.
- **`useVoortgang().wis()`** wist de sleutel en zet een nieuwe voortgang (D en A op oefenen), ook in een preview. Een ander tabblad dat de opslag wijzigt, wordt meteen ingelezen.
- **Routes:** pagina's zijn default exports in `src/pages/` en krijgen hun routegegevens als props (`RouteGegevens<'akkoord'>` = `{ naam, variant? }`). `navigeer(route)` uit `useRoute.ts` voor knoppen; links gebruiken `href={naarHash(route)}`. Na elke navigatie scrollt de app naar boven en krijgt `<main>` de focus.
- **Schermvullend** rendert via een portal in `<body>`, zet de rest van de pagina op `inert`, houdt Tab binnen het paneel en geeft de focus terug bij sluiten. `App` laat de focus met rust zolang er een `[aria-modal="true"]` open is.
- **Wake Lock** zit in `src/lib/wakeLock.ts` (`maakSchermWakker`, getest): nooit twee aanvragen tegelijk, en een slot dat binnenkomt na het sluiten gaat meteen los.
- **Storage-events** van andere tabbladen beoordeelt `opslag.isEigenWijziging(sleutel, gebied)`; alleen de eigen sleutel (of een `clear`) laat `useVoortgang` opnieuw inlezen.
- **G-familie:** Wonderwall gebruikt de echte vormen Em7, G, Dsus4, A7sus4 en Cadd9 (ringvinger en pink blijven liggen). `tests/inhoud.test.ts` staat voor een liedje dat helemaal uit G, Cadd9, Dsus4, Em7 en A7sus4 bestaat meer dan 4 akkoorden toe; de rest blijft 3 of 4.
- **Placeholders:** `Binnenkort` (titel, stap, zinnetje). Meespelen en de drie challenges staan al in `Schermvullend`, zodat je Escape, de sluitknop en Wake Lock nu al kunt proberen. Oefenen is al een lijst met links naar alle subpagina's, zodat stap 3 en 5 dat scherm niet hoeven te raken.
- **Tabbalk** onderaan op mobiel (vast, met `safe-area-inset-bottom`), bovenaan vanaf 768px.

### CSS-variabelen in `src/styles.css`

- Kleuren (licht en donker): `--achtergrond`, `--vlak`, `--vlak-zacht`, `--rand`, `--tekst`, `--tekst-zacht`, `--accent`, `--accent-zacht`, `--op-accent` (tekst op accent), `--focus`, `--gevaar`.
- Status: `--status-nieuw`, `--status-oefenen`, `--status-kan-ik`, elk ook met `-vlak` voor een achtergrond.
- Ruimte: `--ruimte-1` t/m `--ruimte-7` (4, 8, 12, 16, 24, 32, 48px). `--radius`, `--radius-klein`, `--schaduw`.
- Maat: `--tikdoel` (48px), `--tabbalk-hoogte`, `--inhoud-breedte`.
- Letters: `--font`, `--letter-klein`, `--letter`, `--letter-groot`, `--letter-titel`, `--letter-reus` (meespelen en challenges).
- Klassen: `.knop`, `.knop-rustig`, `.kaart`, `.zacht`, `.verborgen`. Focus is overal een blauwe rand via `:focus-visible`; `prefers-reduced-motion` zet alle animaties uit.

### Valkuilen

- **CRLF in de worktree.** Met `core.autocrlf=true` kreeg `tools/kijk/kijk.sh` CRLF; sinds `.gitattributes` (`*.sh text eol=lf`) is dat opgelost.
- **`tools/kijk/node_modules`** kan een lege map zijn; `kijk.sh` slaat `bun install` dan over. Draai `bun install` in `tools/kijk` met de hand.
- **Headless Chrome heeft geen systeemfont**, dus screenshots tonen een monospace-letter. Op een echt apparaat is het `system-ui`.
- **TypeScript 7** (`tsc` in Go) draait met `moduleResolution: bundler`; `tsconfig.json` heeft `vite/client` en `node` als types, voor `import.meta.glob` en de tests.
- `import.meta.glob` werkt ook in Vitest; `src/data/index.ts` en `tests/data.test.ts` lezen de liedjes zo in.

### Geparkeerde ideeën

- Een liedje zonder speelbare capo kan via `vereenvoudig` toch een "speel A voor A7"-hint krijgen (stap 4).
- `isGecontroleerd(liedje, voortgang)` (geverifieerd of gecontroleerd) als één functie, voor stap 4.
- Leeradvies dat ook capo-suggesties meetelt.
- Akkoorden die het schema niet nodig heeft maar wel handig zijn: Cadd9/G, F#m, Bm7.

## Besluiten uit stap 2

### Besluiten

- **Het raster toont elk akkoord één keer** (24 namen, niet 29 zettingen), met de gekozen variant (`gekozenVariant`: voorkeur, anders standaard). De andere varianten zie je op de detailpagina. Het filter (Alle, Nieuw, Oefenen, Kan ik, met aantallen) is gewone component-state, niet in de route.
- **Detailpagina:** zonder `?variant=` toont hij je gekozen variant; met `?variant=` die variant. De variantkaarten linken met `?variant=` (bekijken) en hebben een knop "Kies deze" (voorkeur zetten). Ook de standaard kiezen wordt als voorkeur opgeslagen.
- **De geometrie zit in `src/lib/diagram.ts`** (`diagramVan`, getest tegen elke zetting in `akkoorden.json`). Een barré komt uit `Akkoord.barre`, en daarnaast ziet hij een vinger die plat over meerdere snaren op dezelfde fret ligt (de ringvinger in C barré op 3). Snaren onder een barré met dezelfde vinger krijgen geen los bolletje. Minstens 4 vakken; meer als een akkoord verder reikt. Fretnummer naast het bovenste vak bij `basisfret > 1`, anders de topkam.
- **`AkkoordDiagram`** heeft precies de afgesproken props. `klein` (max 112px) heeft geen snaarnamen en grotere stippen en cijfers; `middel` 150px, `groot` 300px. Het schaalt mee met zijn kolom (`width: 100%`). Het SVG heeft `role="img"`, `aria-label` en `<title>` uit `beschrijfAkkoord` ("A, eigen: lage E niet spelen, A open, D 2e fret middelvinger, …"). Kleuren via klassen op de css-variabelen, dus licht en donker gaan vanzelf.
- **Geluid:** `src/lib/gitaar.ts` rekent MIDI-noten per snaar, frequenties, de timing (aanslaan 25 ms tussen snaren, tokkelen 400 ms) en de Karplus-Strong-samples zelf (`karplusStrong`, met een allpass voor de toonhoogte achter de komma; de test meet de periode op een fractie van een sample). `src/audio/gitaar.ts` maakt daar AudioBuffers van (gecachet per frequentie) en speelt ze af. Opnieuw tikken laat het vorige geluid in 50 ms uitsterven (`stopGitaar`, ook bij het verlaten van de pagina).
- **`kopieerTekst`** volgt de volgorde van `akkoorden.json`, laat een lege groep weg, en zegt "Ik ken nog geen akkoorden." als er niets is. Statussen van akkoorden die niet (meer) bestaan tellen niet mee. Lukt het klembord niet (geen https, bv. de devserver op je telefoon), dan verschijnt de tekst in een tekstvak om zelf te kopiëren.
- **iOS-geluid in `geefAudioContext()`.** Die zet bij elk gebruik `navigator.audioSession.type = 'playback'` (als de browser het kent), zodat gitaar en metronoom ook klinken met de stilteschakelaar aan. Gevolg: muziek die op de achtergrond speelt, stopt. Voor een oefenapp is dat acceptabel; besluit van de orchestrator. De context wordt hervat bij `'suspended'` én `'interrupted'` (iOS na de achtergrond of een telefoontje), via `moetHervatten` in `src/lib/audio.ts`.
- **Fretnummer van twee cijfers.** `diagramVan` geeft `ruimteLinks`: genoeg plek links voor het fretnummer (`FRETNUMMER_AFSTAND` + `CIJFERBREEDTE` per cijfer, minstens 26). Een diagram vanaf fret 10 wordt dus iets breder.
- **De kopieermelding** is een `role="status"` die er altijd is; leeg is hij visueel verborgen (`.verborgen`, niet `display: none`, anders zit hij niet in de toegankelijkheidsboom). Bij elke tik wordt hij eerst leeggemaakt, zodat dezelfde melding opnieuw wordt voorgelezen.
- **`StatusLabel`** (`src/components`) is het gekleurde label met stip en tekst; stap 4 en 6 kunnen het hergebruiken. `STATUSSEN` komt nu uit `voortgang.ts`, `STATUSLABEL` uit `akkoorden.ts`.

### Valkuilen

- **css-volgorde.** `main.tsx` laadde `styles.css` ná `App`, waardoor `.knop` en `.kaart` uit de basis wonnen van de css van een component met dezelfde specificiteit. Nu eerst `styles.css`. Wie dat in een parallelle stap ook tegenkwam: dezelfde regel, makkelijk te mergen.
- **Klassenamen botsen globaal.** `StatusLabel.css` definieert `.status-nieuw`, `.status-oefenen`, `.status-kan-ik`; gebruik die namen niet voor iets anders (de statusknoppen heten `akkoord-status-…`).
- **Een SVG met `width: 100%` in een grid met `justify-items: center`** krijgt de breedte van het breedste andere kind (hier het statuslabel). Geef het grid een kolom `minmax(0, 1fr)`.
- **iOS:** `slaAan`/`tokkel` moeten direct in de tik-handler staan (niet na een `await`), anders start de AudioContext niet. Zonder `audioSession.type = 'playback'` volgt Web Audio op een iPhone de stilteschakelaar; oudere iOS-versies kennen `audioSession` niet en blijven stil met de schakelaar aan.
- **kijk.sh** noemt twee tik-routes op dezelfde pagina hetzelfde bestand (`_akkoorden-tik-…`); de tweede overschrijft de eerste. Draai ze apart.

### Geparkeerde ideeën

- Klinkende snaar laten oplichten in het diagram tijdens tokkelen.
- Akkoorden in het raster sorteren of groeperen (bv. op moeilijkheid of grondtoon); nu de volgorde van `akkoorden.json`.
- Een variant in `kopieerTekst` noemen (bv. "G (3 vingers)"), zodat `/nieuw-nummer` weet welke vorm je speelt.

## Besluiten uit stap 3

### Besluiten

- **Metronoom** (`src/audio/metronoom.ts`): `maakMetronoom({ bpm, maatsoort, accent?, onderverdeling?, opTel?, opSlag? })` met `start()`, `stop()`, `zetBpm`, `zetMaatsoort`, `zetAccent`, `zetOnderverdeling` en `loopt`. Maken raakt de AudioContext niet; pas `start()` doet dat (roep het aan in een klik, voor iOS). Een timer van 25 ms plant 100 ms vooruit op `audioContext.currentTime` (1,5 s als het tabblad verborgen is, want dan komt de timer hooguit eens per seconde). Klik = korte driehoeksgolf met een envelope; de 1 hoger en harder.
- **De planner is puur** (`planStappen` in `src/lib/metronoom.ts`, getest): elke volgende tijd komt uit de vorige geplande tijd, nooit uit de klok. Komt de timer na een bevriezing te laat, dan springt hij naar nu in plaats van alle gemiste klikken tegelijk te spelen.
- **Slagen tussen de tellen volgen (voor stap 4):** geef `onderverdeling` = slagen per tel (`slagenPerTel(slagen.length, maatsoort)` uit `muziek.ts`, dus 2 bij 8 slagen in 4/4, 1 in 6/8). Dan komt `opSlag(slag, tijd)` per slag, met `slag` vanaf 0 binnen de maat, en dat is precies de index voor `SlagpatroonWeergave actief`. `opTel(tel, tijd)` blijft per tel. Beide worden aangeroepen op het moment dat de klik klinkt (audiotijd min `currentTime`, plus `outputLatency`), dus zet je er gewoon state mee. Klikken doet hij alleen op de tel.
- **Wisselen tijdens het spelen:** een nieuw tempo geldt vanaf de volgende slag; een nieuwe maatsoort (`wisselMaatsoort`) en een nieuwe onderverdeling (`wisselOnderverdeling`) gaan in op de volgende hele tel, zodat de 1 nooit op een "&" valt. Elke geplande stap draagt zijn `onderverdeling` en `tellen`; `opSlag` slaat stappen over die nog in de oude geteld zijn, zodat er na een patroonwissel geen verkeerd pijltje oplicht. `stop()` koppelt de uitgang los, zodat wat al vooruit gepland was stil valt.
- **`useMetronoom({ bpm, maatsoort, accent?, onderverdeling? })`** geeft `{ loopt, tel, slag, start, stop, wissel }`; `tel` en `slag` zijn `null` als hij stilstaat, en hij stopt bij het verlaten van het scherm. Stap 4 en 5 kunnen die hook direct gebruiken.
- **`isAccent(tel, maatsoort)`**: alleen de 1 (ook met een doorlopende teller). In 6/8 dus geen tweede accent op 4.
- **Tap tempo:** `tapTempo(tikken)` (tijden in ms) neemt de mediaan van de laatste 4 afstanden, zodat één gemiste tik het tempo niet verpest. Een tik binnen 150 ms na de vorige tik (ook een weggevallen tik) telt niet (stuiter, toetsherhaling); `voegTikToe` bewaart daarom de ruwe tikken (laatste 16); dat ligt ruim onder de kortste tel (220 bpm is 273 ms), zodat een wat vroege tik bij een hoog tempo blijft staan. Een langzamere dubbeltik vangt de mediaan op. Na een pauze van meer dan 2,5 s begint hij opnieuw (ruim boven de 2 s van 30 bpm). `voegTikToe` houdt de lijst kort. Het scherm gebruikt `performance.now()`.
- **Geen opslag.** Tempo, maatsoort, accent en het patroon staan in het geheugen (`useMetronoomInstelling`), gedeeld door metronoom en trainer, tot je de app sluit. Geen veld in `Voortgang`.
- **Slagpatroon-trainer:** vaste patronen per maatsoort (`VASTE_SLAGPATRONEN`, een test bewaakt dat de namen kloppen met de slagen) plus de patronen uit de liedjes; een liedje met hetzelfde patroon komt bij die keuze te staan. Zelf maken = slagen toevoegen met grote knoppen tot de maat vol is (`ontwerpStatus`); in x/4 past een slag per tel of twee, in 6/8 een per achtste (zelfde regel als `slagenPasInMaat`). Een nieuwe maatsoort waarin het patroon niet past, kiest het eerste vaste patroon van die maatsoort.
- **`SlagpatroonWeergave`** heeft naast de afgesproken props een optionele `maatsoort`; dan staat eronder hoe je telt (`1 & 2 &`, via `telLabels`).
- **De tel die je ziet** (`TelWeergave`): grote bolletjes, de 1 in de accentkleur; de klinkende tel vult zich en springt even op, met `prefers-reduced-motion` alleen de kleurwissel.
- Beide schermen houden het scherm wakker zolang de metronoom loopt.

### Valkuilen

- **Namen uit de afspraken:** daar staan `parseSlagpatroon`/`parseMaatsoort`, maar stap 1 maakte `leesSlagpatroon`/`leesMaatsoort` (in `muziek.ts`). Gebruik die.
- **iPhone:** de metronoom gebruikt `geefAudioContext()` van stap 2, dus hij klinkt ook met de stilteschakelaar aan (`audioSession.type = 'playback'`) en muziek op de achtergrond stopt. Na een onderbreking (`'interrupted'`, telefoontje) staat de audioklok stil; zodra hij weer loopt, springt de planner naar nu in plaats van gemiste klikken in te halen.
- Headless Chrome in `kijk.sh` speelt de metronoom gewoon af: `/oefenen/metronoom!.metronoom-start` laat een oplichtende tel zien.

### Geparkeerde ideeën

- Een tweede, zachter accent op de 4 in 6/8.
- Een zachte klik op de tussenslagen (`onderverdeling`) als optie.
- Tempotrainer: na N maten automatisch een paar bpm sneller.

## Besluiten uit stap 4

### Besluiten

- **Meespelen is een pure toestandsmachine** (`src/lib/meespelen.ts`): `meespeelStap(stand, actie, volgorde)` met de acties `start`, `pauze`, `tel` (elke `opTel` van de metronoom), `herhaal` en `naarSectie`; `meespeelWeergave(stand, volgorde, maatsoort)` geeft alles wat het scherm toont (aftelgetal, akkoord, volgend akkoord, de maten van de huidige sectie, of er aangeslagen moet worden). Het scherm rekent zelf niets.
- **Maatgrenzen komen van de metronoom.** De stap gebruikt het telnummer uit `opTel`: elke 1 gaat naar de volgende maat. Aftellen loopt tot de volgende 1: bij de start een hele maat (in 6/8 zes achtsten), na een sprong naar een andere sectie tijdens het spelen de rest van de lopende maat. Zo valt de eerste maat altijd op het accent.
- **Sectie herhalen** onthoudt de `volgordeIndex` (niet de naam), dus het tweede couplet herhaalt zichzelf en niet het eerste. Na de laatste maat van die sectie gaat hij terug naar zijn eerste maat, tot je het uitzet; dan loopt hij gewoon door. "Naar sectie" neemt herhalen mee naar de nieuwe sectie.
- **Volgend akkoord** = het volgende akkoordvak: het tweede akkoord in de maat, anders het eerste van de volgende maat (met herhalen meegerekend). Ook als dat hetzelfde akkoord is.
- **Pauze** houdt de maat vast; opnieuw starten telt af en begint aan het begin van die maat. Na de laatste maat staat hij op "einde" en stopt de metronoom; "Opnieuw" begint vooraan.
- **Tempo** in stappen van 10%, 40 t/m 120%; `meespeelBpm` begrenst daarna op 30-220 van de metronoom (Knockin' on Heaven's Door op 40% wordt dus 30 bpm in plaats van 27).
- **Akkoordgeluid** (standaard uit): `slaAan` met je voorkeursvariant op elke 1 en bij elke akkoordwissel binnen een maat, op precies dezelfde audiotijd als de klik. Het scherm plant hem in `opPlan`: `geplandAkkoord(stand, wachtend, tel, …)` speelt de tellen die al gepland zijn maar nog niet klonken (`wachtend`) vooruit door `meespeelStap` en kijkt of op de nieuwe tel een akkoord begint. Pauze roept `stopGitaar()` aan, ook voor wat al gepland was. Herhalen, naar een sectie en geluid aan/uit halen de geplande aanslagen weg (`annuleerGeplandeGitaar`) en plannen ze opnieuw voor de nieuwe stand: `herplan(stand, wachtend, …)` geeft per wachtende tel (met zijn audiotijd) het akkoord, of niets tijdens het aftellen.
- **Uitbreidingen van gedeelde stukken (bestaand gebruik ongewijzigd):**
  - `maakMetronoom` en `useMetronoom`: optionele `opPlan(tel, tijd)`, die afgaat zodra een tel gepland wordt (ruim vóór hij klinkt) met de audiotijd van die tel. Om er geluid op te plannen; `opTel` blijft voor de UI.
  - `useMetronoom`: optionele `opTel(tel)` naast de state `tel`.
  - `slaAan(akkoord, { tijd? })` (`SpeelOpties`): begint op die audiotijd; wat ervoor klinkt, sterft pas dan uit. `src/audio/gitaar.ts` houdt alle klinkende en geplande aanslagen bij tot ze uitgeklonken zijn (`onended`), en `stopGitaar()` laat ze allemaal uitsterven (voorheen alleen de laatste). Een aanslag die al eerder stil gaat, wordt niet opnieuw aangeraakt (`moetUitsterven` in `src/lib/gitaar.ts`), anders zou hij weer gaan klinken.
  - `annuleerGeplandeGitaar()`: haalt aanslagen weg die nog moeten beginnen en zet het uitsterven terug dat voor die aanslagen gepland stond; wat nu klinkt, klinkt door.
- **Waarom `opTel` als callback:** React voegt state-updates samen; in een verborgen tabblad komen meerdere tellen tegelijk binnen en zou de state er één missen.
- **Spatiebalk:** alleen op een knop die met het toetsenbord focus kreeg (`:focus-visible`, en niet via een `pointerdown` op die knop) doet Spatie wat die knop doet. In alle andere gevallen, ook na een muisklik en op de sluitknop, is Spatie start/pauze; keydown en keyup worden dan tegengehouden, zodat de spatie het scherm nooit sluit. De hint "Spatie: start/pauze" staat er alleen bij een muis (`hover: hover` en `pointer: fine`); headless Chrome heeft die niet, dus in `kijk.sh` zie je hem niet.
- **Opnieuw na het einde** begint vooraan en wist het herhalen; anders herhaalde hij de laatste sectie terwijl je de intro zag.
- **AI-label in de lijst:** een klein, rustig "AI-versie" naast het speelbaarheidslabel.
- **Liedjeslijst** (`liedjesOverzicht` in `src/lib/liedjes.ts`): favorieten in een eigen groep bovenaan, daarna op aantal ontbrekende akkoorden, dan op titel. De ster in de lijst is alleen een teken; favoriet maken gaat op de liedjespagina.
- **Capo-suggestie als zin** (`capoSuggestieTekst`): "Met capo 5 en de vormen G, D, Em, C kan je dit spelen. Speel C voor Cmaj7." Een vereenvoudiging noemt het echte akkoord bij de nieuwe capo.
- **AI-label**: `toonAiLabel` = `bron: 'ai-gegenereerd'` en niet `isGecontroleerd` (geverifieerd in de data, of in `Voortgang.gecontroleerd`). De knop "Ik heb hem gecontroleerd" gebruikt `zetGecontroleerd`; daarna staat er "Door jou gecontroleerd" met "Terugdraaien" (`zetGecontroleerd(v, id, false)`). Bij `geverifieerd: true` geen label en geen knop.
- **`SpeelbaarheidLabel`** (`src/components`) in de kleuren van kan ik / oefenen / nieuw, met eigen klassen (`speelbaarheid-kan|bijna|mist`). **`Ster`** is een SVG, want ★ en ▶ ontbreken in sommige lettertypen (headless Chrome) of worden een emoji.
- **"Origineel: Am, C, G, F, E"** toont de hele lijst `origineleAkkoorden`; de `opmerking` van het liedje zegt wat er vereenvoudigd is.

### Valkuilen

- `react-hooks/exhaustive-deps` staat in oxlint aan (waarschuwing). Een effect dat "alleen per tel" moet draaien, kun je beter als callback schrijven.
- `react(refs)`: `useRef(beginMeespelen())` en dan `useState(ref.current)` geeft een waarschuwing; maak eerst de state en geef die aan `useRef`.
- Met `kijk.sh` zie je het meespelen lopen met `'/liedjes/wonderwall/meespelen!.meespelen-start'`; na 650 ms zit hij nog in het aftellen. Met `KIJK_EVAL='new Promise(r=>setTimeout(r,5000))'` wacht hij tot er een maat oplicht.
- `node_modules` in een verse worktree kan leeg zijn, ook al zegt iemand dat `bun install` gedaan is. Controleer `node_modules/.bin`.

### Geparkeerde ideeën

- Het tempo per liedje onthouden (nu begint hij altijd op 100%).
- Op een breed scherm de bediening naast het akkoord zetten; nu één kolom van max. 720px, die op een laptop scrolt.
- In de lijst filteren op "Kan je spelen".
- Een "speel A voor A7"-hint als er geen capo-suggestie is (`vereenvoudig`), uit stap 1.

## Besluiten uit stap 5

### Besluiten

- **Contract voor stap 6** (`src/lib/challenges.ts`):
  - `paarSleutel(a, b)`: de twee namen gesorteerd met de gewone `sort()` (codepunten) en met `-` ertussen: `paarSleutel('D', 'A') === 'A-D'`, `paarSleutel('G', 'Em') === 'Em-G'`. De one-minute-changes-pagina rekent de sleutel zelf uit, dus een link met `a` en `b` in de "verkeerde" volgorde werkt ook.
  - `reeksSleutel(akkoorden)`: in volgorde, `G-C-D`. De spider heeft altijd `SPIDER_SLEUTEL` (`'spider'`).
  - `voegResultaatToe(v, resultaat)`: plakt het resultaat achteraan `challenges`, geeft een nieuwe `Voortgang`.
  - `record(v, type, sleutel?)`: het hele `ChallengeResultaat` met de hoogste `waarde`, of `null` als er niets is. Bij gelijke waarde wint het hogere `bpm` (wisselreeks), dan het oudste (wie het eerst haalde). Zonder sleutel: het beste van het hele type, over alle paren of reeksen heen.
  - `geschiedenis(v, type, sleutel?)`: een nieuwe array, gesorteerd op `datum` van oud naar nieuw. Zonder sleutel alles van het type.
  - Verder: `beoordeel(resultaat, vorigRecord)` (`'eerste' | 'nieuw-record' | 'evenaard' | 'onder-record'`), met dezelfde vergelijking als `record` (waarde, dan tempo): wat het scherm "Nieuw record!" noemt, is daarna ook het record, `resultaatTekst(r)` ("31 wissels", "70 bpm", "1 min 30 s op 80 bpm"), `recordTekst(v, type)` ("Record 31 wissels · A-D") en `duurTekst(seconden)`. Stap 6 kan die voor de records en grafiekjes gebruiken.
- **Verloop per challenge** is een pure reducer met een stand en acties (`omcVerloop`, `spiderVerloop`, `wisselreeksVerloop`); de pagina's doen `zetStand((s) => verloop(s, actie))`. De tijd zit in de actie (`nu` uit `performance.now()`), en de fase volgt uit die tijd, niet uit het aantal timertikken: een tabblad dat op de achtergrond sliep, eindigt de minuut op tijd en telt tikken na het einde niet mee. `useKlok(actief, ms, opTijd)` stuurt de tijd door en werkt meteen bij als het tabblad terugkomt.
- **One minute changes:** 3 s aftellen, dan 60 s. Tikken tijdens het aftellen tellen niet. Standaard je eerste twee akkoorden op "oefenen" (dan "kan ik", dan de rest), anders wat de route zegt (`geldigPaar`: twee verschillende, bestaande akkoorden).
- **Spider-ladder:** begint op 50 bpm (`?bpm=` of +/- 5 vooraf), elke geslaagde ronde 5 bpm erbij tot 220. "Lukte niet, stoppen" maakt hem af; het record is het hoogste tempo dat lukte. De metronoom loopt mee in 4/4.
- **Wisselreeks:** 3 of 4 akkoorden, elk één maat van 4 tellen, één maat aftellen met de metronoom. Het akkoord volgt de tellen van de metronoom zoals je ze hoort (`opTel` van `useMetronoom`, actie `tel`): de eerste maat is aftellen, elke volgende 1 is een nieuwe maat. Zo staat het nieuwe akkoord er precies op de 1, ook als de audio na `resume()` later begint of via Bluetooth honderden ms vertraagt. De volgehouden tijd telt vanaf de eerste 1 na het aftellen. Geen twee dezelfde na elkaar, ook niet van het laatste naar het eerste (`geldigeReeks`), want dan is er geen wissel. De grote knop is "Ik ben eruit"; de waarde is het aantal hele seconden, met `bpm`. Het record is per reeks, ongeacht het tempo.
- **Scherm uit is afbreken.** Raakt de pagina verborgen tijdens het aftellen of lopen (`useVerborgen`, actie `verborgen`), dan gaat one minute changes of de wisselreeks naar `onderbroken`: niets opgeslagen, en bij terugkomen "Gestopt omdat je scherm uit ging" met opnieuw starten. Anders sloeg een vergrendelde telefoon een halve minuut op. De spider-ladder meet geen tijd (je zegt zelf of een ronde lukte), dus die loopt gewoon door.
- **Een nieuwe route op een open challenge** begint hem opnieuw: de drie pagina's hebben in `App.tsx` een `key` met hun routegegevens.
- **De klok** van one minute changes is `klokTekst(ms)`: "1:00" tot "0:00", naar boven afgerond.
- **Eén grote knop** per challenge: hetzelfde element is "Start", daarna de tikknop, zodat de focus en dus de spatiebalk blijven. Bij het openen krijgt hij de focus (een frame na `Schermvullend`, dat de sluitknop focust), anders sluit de eerste spatie de challenge.
- **Spatiebalk** (`useSpatiebalk`): op de grote knop zelf of zonder focus telt een spatie één keer (keydown, zonder herhaling; de klik bij het loslaten wordt tegengehouden). Op een andere knop, een keuzelijst of een invoer blijft de spatie van hen. Na "klaar" doet de spatie niets, zodat een late tik niet meteen een nieuwe ronde start. Een ingehouden Enter op de knop telt ook maar één keer (herhaalde toetsen gaan niet door). Getest in headless Chrome.
- **Opslaan** gaat via `useChallengeResultaat(type, sleutel, stand, resultaat)`: één keer per stand, alleen als de lib een resultaat geeft. Dat is pas bij "klaar", en niet bij 0 wissels, geen geslaagde spiderronde of minder dan een seconde volgehouden. Sluiten of Escape slaat dus niets op. Het record van vóór de poging wordt bij de start onthouden, voor "Nieuw record!".
- **Oefeningenpagina:** doel, stappen, het tabje in een `<pre>` (monospace, past op 360px), en een metronoom op het standaardtempo met `useMetronoom` en `TempoKiezer`. Heeft de oefening een slagpatroon, dan lopen de pijltjes mee. Spider en akkoordwissels linken naar hun challenge.
- **`TempoKiezer`** heeft `onMaatsoort` nu optioneel: zonder die prop is de maatsoort vast en zie je de keuze niet (de oefening bepaalt hem).
- **Demo-voortgang** niet gewijzigd: hij had al genoeg. `tests/challenges.test.ts` controleert dat `record` en `geschiedenis` er iets zinnigs uit halen (A-D 31, spider 70, G-C-D 70 s op 70 bpm).

### Valkuilen

- **`kijk.sh` splitste routes op elke komma**, dus `?akkoorden=G,C,D` brak. Nu splitst hij alleen op `,/` (een komma vóór een nieuwe route).
- **Een lopende challenge fotograferen:** `/pad!.challenge-tik` laat alleen het aftellen zien. Voor "lopen" en "klaar" heb ik een los puppeteer-script gebruikt dat `performance.now` vooruitzet (`window.__extra += 60000`); de lib rekent met die tijd, dus de minuut is zo om.
- Headless Chrome heeft geen `⇄`; de wisselpijl is daarom een svg.

### Geparkeerde ideeën

- Record van de wisselreeks per tempo (nu wint het langst volhouden, ongeacht het tempo).
- Een nieuwe gebruiker met alleen A en D krijgt in de wisselreeks A7 als derde akkoord (de volgorde van `akkoorden.json`); beter is het makkelijkste nieuwe akkoord, bijvoorbeeld E.
- Spider-ladder: starten op je record min 10 bpm, als opwarming.
- Trillen bij het einde van de minuut (`navigator.vibrate`), en een klik bij elke tik.

## Besluiten uit stap 6

### Besluiten

- **Dagen zijn lokale dagen.** `dagSleutel(d)` geeft `2026-11-24` in lokale tijd. Een sessie hoort bij de dag waarop hij begon, ook als hij over middernacht loopt. Dagen tellen gaat met `new Date(j, m, d ± n)`, nooit met ± 24 uur: rond zomer- en wintertijd is een dag 23 of 25 uur.
- **Streak straft niet** (besluit orchestrator). Hij telt de dagen waarop je oefende, terug vanaf vandaag. Eén losse dag zonder oefenen breekt hem niet (en telt niet mee); twee dagen achter elkaar wel. Vandaag telt pas als gemist als de dag om is. Sessies van 0 seconden, met een kapotte datum of na `nu` tellen niet mee. Gevolg: de demo (elke dag van de afgelopen week, daarvoor om de dag) heeft nu een streak van 19, niet 7.
- **Minuten** worden afgerond (`Math.round(seconden / 60)`) over het totaal, niet per sessie. `totaalMinuten(v, nu)` telt net als de weken geen sessies na `nu`. `minutenPerWeek(v, nu, aantalWeken)` geeft weken van maandag t/m zondag, oudste eerst, de lopende week als laatste, ook weken met 0.
- **Dagroutine** (`maakRoutine`): opwarmen 3 min (oefening `spider`, anders de eerste oefening), akkoordwissel 3 min, liedje 6 min: samen 12. Hangt alleen af van de akkoordstatussen, de inhoud en de datum (FNV-hash van `datum:onderdeel`, geen `Math.random`); sessies en challenges tellen niet mee.
- **De routine ligt de hele dag vast** (besluit orchestrator), ook als je een status wijzigt. Hij staat apart onder `opslagSleutel('routine', preview)` als `{ datum, routine }` (`BewaardeRoutine`), via `opslag.laadRoutine()` (rauw, `unknown`) en `opslag.bewaarRoutine()`. `Voortgang` blijft op versie 1; een export neemt de routine niet mee; `opslag.wis()` (en dus "Alles wissen") wist hem wel. `routineVoorVandaag(bewaard, voortgang, inhoud, nu)` is de pure keuze: een bewaarde routine van vandaag met geldige vorm en routes naar bestaande oefening, liedje en akkoorden blijft; anders `maakRoutine`. `useRoutine(voortgang)` kiest hem bij het openen van Vandaag en bewaart hem meteen. Een import vervangt de routine van vandaag niet; die volgt morgen.
- **Akkoordwissel:** paren met minstens één akkoord op "oefenen" (staat niets op oefenen: twee op "kan ik"), bij voorkeur een wissel die echt in een liedje voorkomt (opeenvolgende akkoorden in `speelVolgorde`). Ken je er minder dan twee, dan komt het `leeradvies` erbij, en anders het makkelijkste akkoord. De keuze is vast per dag, niet het paar met het laagste record (besluit orchestrator). De uitleg volgt de echte status: "X is nieuw voor je. Leer eerst de greep…", "Deze ken je al…" alleen als beide op "kan ik" staan, anders one minute changes. Route `{ pagina: 'one-minute-changes', a, b }` in de volgorde van `paarSleutel` (uit stap 5, gewone `sort()`). Statussen van akkoorden die niet in de inhoud staan, tellen niet mee.
- **Liedje:** de liedjes met de minste ontbrekende akkoorden (strikt, via `ontbrekendeAkkoorden`); daarvan liefst een met een akkoord op "oefenen". Nieuwe akkoorden uit de wissel tellen mee alsof je ze oefent, zodat het liedje aansluit ("Mist 1 akkoord: A, met G uit de wissel erbij"). Bij 2 of meer ontbrekend noemt de uitleg ze ("Mist nog D en A") in plaats van "Mist er 2". Een liedje dat pas met een capo-suggestie speelbaar wordt, telt niet mee (besluit orchestrator). Kanttekening: met alleen Em op oefenen is 2 ontbrekend het beste, want elk liedje met Em heeft 4 akkoorden.
- **Grafiek:** de as begint altijd bij 0, met hooguit 4 nette stappen (1, 2 of 5 maal een macht van 10, minstens 1, dus nooit halve ticks). Het svg meet zijn eigen breedte (`ResizeObserver`) en gebruikt die als viewBox, zodat de letters op 360 en 1280 even groot zijn. Labels onder de as: zoveel als er passen, altijd het nieuwste punt. Een lijn houdt 24px van de randen. `role="img"` met een `aria-label` uit `beschrijfGrafiek` ("Minuten per week: 8 waarden, van … naar …. Hoogste: …"). Zonder punten: "Nog niets om te laten zien."
- **Vandaag:** datum, de drie kerngetallen (`Kerngetallen`: streak, minuten vandaag, totaal) met een zin eronder (`streakZin`: wanneer je weer moet oefenen, zonder te straffen), de oefentimer, en de routine als drie tikbare kaarten (op desktop naast elkaar) naar `oefening`, `one-minute-changes?a=&b=` en `liedje`.
- **Oefentimer** (`src/lib/oefentimer.ts`, `useOefentimer`): rekent met de klok van het apparaat (`looptSinds` in epoch-ms plus `opgeteld`), niet met tikken, dus hij klopt na scherm uit, een andere pagina of een herlaad. Eén gedeelde store buiten de pagina's en bewaard onder `opslagSleutel('timer', preview)`. Start, pauze/doorgaan, "Stop en bewaar": `stopTimer` geeft een `Sessie` (start = eerste start, seconden = geoefende tijd zonder pauzes) die via `voegSessieToe` binnenkomt; minder dan een halve seconde wordt niets. Een vergeten timer telt hooguit 3 uur (`MAX_SESSIE_MS`). Een klok die terugspringt geeft geen negatieve tijd.
- **Twee tabbladen:** de timer luistert naar het `storage`-event van zijn eigen sleutel (`opslag.isTimerWijziging`, naast `isEigenWijziging`) en leest hem dan opnieuw in. Stoppen, starten of wissen in het ene tabblad ziet het andere meteen, dus "Stop" bewaart dezelfde sessie niet twee keer. Voor de zekerheid (besluit orchestrator) gooit `normaliseerVoortgang` dubbele sessies weg (zelfde `start`, de eerste blijft), zodat een export die al dubbel is zichzelf opruimt, en `voegSessieToe` voegt een sessie met een bestaande `start` niet nog eens toe. De vorm van `Voortgang` blijft gelijk, dus geen nieuwe versie.
- **Opslaan dat mislukt:** `useVoortgang().wijzig` en `vervang` geven `false` als de browser niet wilde opslaan (vol). `wijzig` past de wijziging dan toch in het geheugen toe (anders werkt de app niet zonder opslag); `vervang` (importeren) laat de oude voortgang staan, en de import meldt "Niet bewaard: de opslag van je browser is vol. Je voortgang is niet veranderd." "Stop en bewaar" gebruikt ook `vervang`: lukt het opslaan niet, dan blijft de timer gepauzeerd staan (niets kwijt na herladen) en meldt Vandaag "Niet bewaard: de opslag van je browser is vol."; nog eens stoppen bewaart hem alsnog.
- **`useNu()`**: de tijd voor streak, minuten en de routine, elke seconde bijgewerkt. `useRoutine(voortgang, nu)` kiest een nieuwe routine (en bewaart die) zodra de datum van `nu` verandert, dus Vandaag die over middernacht openstaat, krijgt de routine van de nieuwe dag. Met een tijd van bij het openen lag een sessie die je daarna begon "in de toekomst" (en sessies na `nu` tellen niet), dus de tegels bleven na "Stop en bewaar" staan.
- **Voortgang:** kerngetallen, minuten per week (8 weken, staven), per challenge een kaart met het record van het gekozen paar of de gekozen reeks (`record`), een lijn door de tijd (`geschiedenis`) en een link naar de challenge (met `a`/`b` of `akkoorden`). Je kiest het paar of de reeks met een keuzelijst; alleen sleutels met resultaten (`challengeSleutels`, het laatst geoefende eerst). Akkoordstatussen als drie groepen met namen en één link naar Akkoorden (losse namen als links waren te kleine tikdoelen).
- **Exporteren** (`src/lib/bestand.ts`): download van `exporteerVoortgang` als `eeltje-voortgang-<datum>.json`. Routine en timer gaan niet mee. De blob-url blijft 60 s geldig: iOS Safari haalt hem pas op nadat je de download bevestigt.
- **Importeren:** `leesBestand(tekst)` gooit een `Error` met een Nederlandse melding bij leeg, te groot (meer dan 5 miljoen tekens), geen JSON, geen Eeltje of een versie uit de toekomst; witruimte en een BOM eromheen mogen. Eerst een vraag "Dit vervangt je huidige voortgang. In <bestand>: 19 sessies, 6 records en 7 akkoorden" (`samenvatting`, `samenvattingTekst`), dan pas `vervang`. Bij een fout: "Niet geïmporteerd. <melding> Je voortgang is niet veranderd." `tests/bestand.test.ts` bewijst de round-trip tussen twee opslagen (twee browsers), `{"versie":1}`, een oud minimaal bestand en dat elke fout de voortgang heel laat.
- **Alles wissen:** eerst "Weet je het zeker?" met de raad om eerst te exporteren. `wis()` plus `vergeetTimer()`: voortgang, routine, timer én de opzijgezette kapotte voortgang (`eeltje.voortgang.kapot`) weg (besluit orchestrator: jij bevestigt dat alles weg mag, dus "Alles is gewist" moet waar zijn). Je begint met D en A op oefenen; die nieuwe voortgang wordt meteen bewaard, ook in een preview.
- **Focus bij de vragen:** de veilige knop krijgt de focus ("Nee, laat staan", "Annuleren"), zodat twee keer Enter niets wist of vervangt. Na sluiten gaat de focus terug naar de knop die de vraag opende, of naar de melding als die er is (`tabIndex={-1}` op de `role="status"`). Een ref (`focusNa`) en een effect na elke render, want `setState` in een effect keurt oxlint af.

### Valkuilen

- **Tijdzone in tests.** `tests/statistiek.test.ts` zet `process.env.TZ = 'Europe/Amsterdam'` bovenin het bestand (niet in `beforeAll`: de describe-blokken maken al datums bij het verzamelen) en zet hem in `afterAll` terug. Node pakt een nieuwe `TZ` tijdens het draaien op.
- **DST-tests vanaf 12:00 vangen niets**: 24 uur terug vanaf de middag blijft op de goede datum. Test vlak na middernacht.
- **oxlint (`react(purity)`)** keurt `new Date()` in de render af, ook in `useMemo`, en `react(set-state-in-effect)` keurt `setState` in een effect af. Een tijd die meeloopt: `useState(() => new Date())` plus `useKlok` die hem in de callback zet (`useNu`).
- **kijk.mjs** opende eerst `/` (Vandaag) en leegde daarna de opslag. Het effect van Vandaag kon de demo-routine pas ná dat legen bewaren, zodat `KIJK_NIEUW=1` de routine van de demo liet zien. Hij begint nu op `#/kijk-leeg` (niet-gevonden).
- **Interactie testen in headless Chrome:** een los script met `puppeteer-core` moet in `tools/kijk/` staan (daar staan de `node_modules`), en weer weg voor je commit. `Browser.setDownloadBehavior` via CDP vangt de export op, `uploadFile` op de verborgen `input[type=file]` doet de import.

### Geparkeerde ideeën

- De lopende oefentimer ook buiten Vandaag laten zien (een klein bolletje in de tabbalk).
- Na een import de routine van vandaag opnieuw maken.
- Op Voortgang standaard het paar met de meeste resultaten tonen in plaats van het laatst geoefende.

## Besluiten uit stap 7

### Besluiten

- **Commands** in `.claude/commands/`: `/nieuw-nummer <titel> van <artiest>`, `/nieuw-akkoord <naam> [variant]`, `/nieuwe-oefening <omschrijving>`. Elk met `description`, `argument-hint` en `allowed-tools` (lezen, schrijven, `bun run valideer`, `bun run test`; `/nieuw-nummer` mag ook zijn eigen liedjesbestand weghalen). Ze schrijven de regels uit het schema uit (`types.ts`, `validatie.ts`, `tests/inhoud.test.ts`) in plaats van naar die bestanden te verwijzen, zodat Claude niet eerst de code hoeft te lezen.
- **`/nieuw-nummer`** leest `mijn-akkoorden.txt` (beide groepen tellen als bekend) of vraagt erom, meldt een bestaand id in plaats van te overschrijven, gebruikt het internet niet, en kiest de capo met de minste onbekende vormen (bij gelijkspel de laagste). Een **traditioneel** liedje mag in een andere toonsoort, zodat hij zonder capo past; een popliedje blijft klinken als de opname. De G-familie (Cadd9, Dsus4, Em7) alleen als de gebruiker die vormen kent of de gewone C, D en Em ook niet; anders de gewone. 3 of 4 akkoorden per liedje, zoals de test eist.
- **Service worker zelf gebouwd, zonder dependency.** `src/sw.ts` gebruikt de pure logica uit `src/lib/pwa.ts` (`aanpak`, `precacheLijst`, `cacheNaam`, `oudeCaches`, getest). Het Vite-plugin `tools/serviceworker.ts` geeft hem als extra chunk `sw.js` mee en vult daarna `__PRECACHE__` (alle bestanden van de build plus `public/`, behalve `sw.js` en sourcemaps) en `__VERSIE__` (sha256 van al die bestanden) in. Het plugin breekt de build af als `sw.js` iets importeert, want een klassieke service worker kent geen `import`.
- **Wat hij doet:** een navigatie binnen de scope krijgt `index.html` uit de cache, een bestand uit de precache komt uit de cache, de rest gaat naar het netwerk. Alles onder `pr-<nummer>/` laat hij met rust (geen `respondWith`), ook offline. Hij leest alleen uit zijn eigen versiecache, nooit uit `caches.match` over alle caches heen, dus index.html en de assets zijn altijd van dezelfde versie. Bij het installeren haalt hij alles op met `cache: 'reload'`, langs de HTTP-cache van Pages (max-age 10 min) heen.
- **Previews registreren geen service worker** (`useNieuweVersie`: alleen bij `PROD` zonder `VITE_PREVIEW`), en het plugin maakt dan ook geen `sw.js`. De service worker van main bestrijkt `pr-*/` wel, maar laat die verzoeken door.
- **Updates:** een nieuwe versie installeert op de achtergrond en wacht. De app zoekt naar een update bij elke start en als hij weer zichtbaar wordt. Staat er een klaar, dan toont `NieuweVersie` bovenaan "Er is een nieuwe versie van Eeltje." met "Herladen" (`postMessage('activeer')` → `skipWaiting`). Wisselt de service worker, dan herlaadt elk open tabblad, zodat er nooit oude code tegen een nieuwe cache praat. Zonder klik neemt de nieuwe versie het over zodra alle vensters dicht zijn geweest. Oude `eeltje-*`-caches gaan weg bij het activeren; caches van andere apps op github.io blijven staan.
- **Manifest** `public/manifest.webmanifest`: geen `id`, relatieve `start_url` en `scope` (`./`), `standalone`, achtergrond- en themakleur `--achtergrond` (licht). `index.html` heeft de meta-tags voor iOS en Android, en `theme-color` licht en donker.
- **Iconen:** een plectrum in roomwit op `--accent`, één bron in `tools/kijk/iconen.mjs`. Dat script schrijft `public/iconen/icoon.svg` (favicon) en rendert met headless Chrome de PNG's: 192 en 512 (`any`), 512 maskable (plectrum op 60%, binnen de veilige cirkel) en `apple-touch-icon.png` van 180. Het staat in `tools/kijk` omdat het dezelfde puppeteer-core gebruikt.
- **Inhoudstest versoepeld** (`tests/inhoud.test.ts`): de bovengrens van 15 liedjes en de eis `ai-gegenereerd` / `geverifieerd: false` voor elk liedje zijn weg. Anders maakte het tweede liedje via `/nieuw-nummer` de tests rood, net als een liedje dat de eigenaar goedkeurt. De grens van 3 of 4 akkoorden (met de G-familie-uitzondering) blijft.

### Bewijs

- **Proefrun commands:** `/nieuw-nummer Twinkle Twinkle Little Star` letterlijk gevolgd met de demo-akkoorden (A, D, E, Em kan ik; Am, C, G oefenen): G zonder capo met G, C en D, in plaats van C met F. `bun run valideer` en `bun run test` groen. Liedje en `mijn-akkoorden.txt` daarna weggehaald.
- **PWA** (headless Chrome op een nep-gh-pages in `/tmp` met `python3 -m http.server`: main in `eeltje/`, een preview-build in `eeltje/pr-1/`): na het eerste bezoek is de service worker actief, en offline laadt de app weer, ook `#/akkoorden`. In `pr-1/` toont hij de eigen preview (eigen index en assets), terwijl de service worker van main de pagina controleert. Offline geeft `pr-1/` de foutpagina van de browser, niet de app van main. Een nieuwe versie van main: na herladen eerst nog de oude met de melding, na "Herladen" helemaal de nieuwe, en de oude cache is weg.

### Valkuilen

- `node_modules` in de worktree was weer leeg; `bun install --frozen-lockfile` eerst.
- **Een service worker werkt alleen op https of localhost.** De devserver op je telefoon (`http://192.168…`) heeft er dus geen, en in `bun run dev` registreert hij ook niet. Testen kan met `bun run build` en `python3 -m http.server -d dist` op localhost.
- **Vite 8 laadt `vite.config.ts` straks native.** Imports van eigen `.ts`-bestanden in de config krijgen daarom een extensie (`./tools/serviceworker.ts`); `tsconfig.json` heeft `allowImportingTsExtensions`.
- **Geen `type: 'module'` bij `register`:** Firefox kent module-service workers pas sinds kort. `sw.js` is daarom één bestand zonder imports.
- **Een nieuwe `localStorage`-sleutel of een lazy geladen pagina** hoeft niets aan de service worker te veranderen: alles uit de build komt vanzelf in de precache.
- **`mijn-akkoorden.txt`** staat in `.gitignore` (persoonlijk).
- **Geen `id` in het manifest.** `"id": "./"` wordt tegen de origin opgelost, niet tegen het manifest: dan hebben `/eeltje/` en elke `/eeltje/pr-N/` dezelfde app-id (`https://lightnerr.github.io/`). Installeer je een preview, dan vindt Chrome main "al geïnstalleerd" en opent het icoon de preview, die na het sluiten van de PR een 404 geeft. Zonder `id` is de id de `start_url`, en die is wel relatief aan het manifest. Gemeten met CDP `Page.getAppId`: `…/eeltje/` en `…/eeltje/pr-1/`.
- **`/eeltje` zonder slash** valt buiten de scope (`/eeltje/`) en opent offline niet. De README zegt: gebruik de link met slash of het icoon.

### Geparkeerde ideeën

- Een balkje "Preview PR 12" (stond al geparkeerd) zou ook laten zien dat er geen service worker draait.
- Een eigen icoon voor previews, zodat een geïnstalleerde preview niet op Eeltje lijkt.
- **Donker opstartscherm.** Het manifest kent maar één `background_color` (nu het lichte `--achtergrond`), dus in donkere modus flitst het opstartscherm even licht. Een tussenkleur oogt in beide modi vreemd; daarom zo gelaten. Kan later met een donkere kleur als de eigenaar vooral donker gebruikt.

## Besluiten uit "score zelf invullen" (na stap 7)

- **One minute changes eindigt met invullen** (wens van de eigenaar): na de minuut gaat het verloop naar `invullen` met wat je tikte als voorstel; pas `{ soort: 'invullen', wissels }` maakt hem `klaar` en dan wordt hij bewaard. Tikken mag nog, maar hoeft niet. Sluiten tijdens het invullen bewaart niets.
- **Score** is een heel getal van 0 t/m `MAX_WISSELS` (200, meer dan 3 per seconde lukt niemand). `leesWissels` leest het invulveld; een ongeldige waarde houdt "Bewaar" uit. 0 bewaart niets, zoals voorheen.
- **Het invulveld** is tekst met `inputMode="numeric"` (geen `type="number"`: die laat op desktop "2,5" of "e" toe en heeft piepkleine pijltjes), met grote −/+ knoppen. Bij het openen is het getal geselecteerd, dus typen vervangt het voorstel meteen.
- **Screenshot van het invullen:** `KIJK_EVAL` kan `performance.now` vooruitzetten nadat `kijk.sh` op Start tikte; zie de PR.
## Besluiten uit de riffs (na stap 7)

### Besluiten

- **Riffs zijn inhoud**, net als liedjes: `src/data/riffs/<id>.json`, gelezen via `src/data/index.ts`, bewaakt door `valideerRiff`. Een noot is `{ stap, snaar, fret }`; `stap` telt over de hele riff, `onderverdeling` stappen per tel (1, 2 of 4; in 6/8 is een tel een achtste). Snaren als in een tab (`E A D G B e`), want zo schrijf en lees je ze. Geen duur: een noot klinkt tot de volgende (de gitaar is per riff eenstemmig, `speelNoten` laat het vorige uitsterven).
- **De tab is data, geen tekst.** `tabVan` geeft per maat een kolom per stap (hoge e bovenaan), zodat de huidige stap kan oplichten. Lege zestienden zijn smal; past een maat toch niet (Thunderstruck op 360px), dan scrollt alleen de tab.
- **Spelen** gebruikt `useMetronoom` met `onderverdeling` van de riff: maat 0 is aftellen, daarna gaat hij steeds rond. `opPlan` plant de noten op de audioklok (eigen maatteller, want plannen loopt vóór op horen); `opTel`/`slag` zetten de cursor. Begint op 60% van het origineel, in stappen van 10% (`begrensTempo`, `meespeelBpm` uit meespelen).
- **Geen voortgang**: riffs raken `Voortgang` niet, dus geen nieuwe versie en niets in de demo.
- **`speel` in `src/audio/gitaar.ts`** neemt nu een lijst aanslagen; `slaAan`, `tokkel` en `speelNoten` maken die lijst. Gedrag van de akkoorden gelijk.
- **AI-label** zonder knop "gecontroleerd": `Voortgang.gecontroleerd` gaat over liedjes. De eigenaar zet `geverifieerd: true` in de JSON.

### Geparkeerde ideeën

- `/nieuwe-riff` als command, zoals `/nieuw-nummer`.
- Een riff-ladder (zoals de spider-ladder): na een geslaagde ronde 5% sneller, met record.
- Een riff alleen laten horen zonder metronoom, of de klik uit.

## Liedjes opgezocht (na stap 7)

- **Bloody Valentine, Love You More en In Too Deep** kende Claude niet goed genoeg uit het hoofd. Met toestemming van de eigenaar zijn alleen de toonsoort, het tempo en de akkoordenvolgorde online opgezocht; het schema is zelf geschreven en vereenvoudigd, zonder tabs en zonder tekst. `/nieuw-nummer` blijft zonder internet werken.
- Het tempo van Love You More stond nergens; 76 bpm is geschat.

## Meer riffs en Crazy Little Thing Called Love (na stap 7)

- **Vier riffs erbij**, uit het hoofd en zonder internet: Iron Man, Sunshine of Your Love, Für Elise (begin) en In de hal van de bergkoning. De toonhoogtes zijn vrij zeker, het ritme van Iron Man en Sunshine is op gevoel: de eigenaar checkt op gehoor voor hij `geverifieerd` zet.
- **Klassiek mag in een andere toonsoort**, net als traditionele liedjes: de bergkoning staat een toon lager (A-mineur), zodat alles in de eerste drie frets ligt. Sunshine is een lage versie in de eerste frets.
- **Für Elise is 3/8**, maar `Maatsoort` kent geen 3/8. Het staat als 3/4 waarin een tel een achtste van het origineel is; dat klinkt hetzelfde. Komt er vaker 3/8 voor, voeg het dan toe aan `Maatsoort`.
- **Crazy Little Thing Called Love** met D, G en C: C in plaats van Bb (geen barré), middenstuk en solo weggelaten. Zonder `mijn-akkoorden.txt` uitgegaan van de demo-akkoorden.

## Nummers uit de playlists van de eigenaar (na stap 7)

- **Gekozen uit een Spotify-export** van de eigenaar (niet in de repo): nummers die vaak terugkomen en met 3 of 4 makkelijke akkoorden te spelen zijn. Rap, EDM en metal vallen af.
- **Toonsoort en tempo uit de export**, de akkoorden uit het hoofd. Spotify geeft bij langzame nummers soms het dubbele tempo (Three Little Birds 148, Free Fallin' live 174): gehalveerd.
- Free Fallin' staat als Tom Petty (het origineel); de eigenaar luistert de live-versie van John Mayer, die hetzelfde schema heeft.

## Rock, pop-punk en metal (na stap 7)

- **Vijf liedjes** uit de playlists, akkoorden uit het hoofd, toonsoort en tempo uit de Spotify-export: You Shook Me All Night Long, Should I Stay or Should I Go, There She Goes (The La's), Semi-Charmed Life en Basket Case. Mr. Jones, Teenage Dirtbag en Year 3000 kende Claude niet goed genoeg.
- **Basket Case** staat met capo 3 en open vormen (het origineel is power chords, een halve toon lager gestemd). Spotify gaf 85 bpm; het nummer telt dubbel zo snel, maar met acht slagen per maat op 86 voelt het hetzelfde.
- **Metal-riffs zijn eigen riffs op opgezochte akkoorden** (met toestemming van de eigenaar online gezocht: toonsoort, tempo, akkoordvolgorde; geen tabs). I Hate Everything About You (F#m D E A, 89 bpm), Last Resort (Em D C Bm, 91 bpm) en Wait and Bleed (refrein Bm F#m C G; bronnen zeggen 155 tot 184 bpm, 184 gekozen). De titel zegt "(akkoorden)" waar de bekende riff zelf anders klinkt.
- **Power chords** zijn twee noten op dezelfde stap; `Riff.tsx` speelt alles met hetzelfde `deel` samen. Alles in gewone stemming, ook als het origineel drop D of drop B is.
- Duality viel af: de bronnen spraken elkaar tegen over toonsoort en akkoorden.
- **Animal I Have Become** (later toegevoegd): eigen power-chordriff op de refreinakkoorden Cm–Bb, Eb–F–Cm, 122 bpm, C-mineur. De bronnen noemden ook Eb, D-mineur en Ab als toonsoort; de akkoordensites kwamen het vaakst op C-mineur uit. Alles tussen de 6e en 10e fret.
