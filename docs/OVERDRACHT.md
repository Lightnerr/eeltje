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
- **Demo-voortgang** (`src/lib/demo.ts`) ligt rond `nu`: elke dag van de afgelopen week geoefend (streak 7), de weken ervoor om de dag, en een geschiedenis voor alle drie de challenges. `tests/demo.test.ts` bewaakt dat hij geldig is en naar bestaande liedjes verwijst.
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
- **`StatusLabel`** (`src/components`) is het gekleurde label met stip en tekst; stap 4 en 6 kunnen het hergebruiken. `STATUSSEN` komt nu uit `voortgang.ts`, `STATUSLABEL` uit `akkoorden.ts`.

### Valkuilen

- **css-volgorde.** `main.tsx` laadde `styles.css` ná `App`, waardoor `.knop` en `.kaart` uit de basis wonnen van de css van een component met dezelfde specificiteit. Nu eerst `styles.css`. Wie dat in een parallelle stap ook tegenkwam: dezelfde regel, makkelijk te mergen.
- **Klassenamen botsen globaal.** `StatusLabel.css` definieert `.status-nieuw`, `.status-oefenen`, `.status-kan-ik`; gebruik die namen niet voor iets anders (de statusknoppen heten `akkoord-status-…`).
- **Een SVG met `width: 100%` in een grid met `justify-items: center`** krijgt de breedte van het breedste andere kind (hier het statuslabel). Geef het grid een kolom `minmax(0, 1fr)`.
- **iOS:** `slaAan`/`tokkel` moeten direct in de tik-handler staan (niet na een `await`), anders start de AudioContext niet. Web Audio volgt op een iPhone de stille-modusschakelaar: staat die aan, dan hoor je niets.
- **kijk.sh** noemt twee tik-routes op dezelfde pagina hetzelfde bestand (`_akkoorden-tik-…`); de tweede overschrijft de eerste. Draai ze apart.

### Geparkeerde ideeën

- Klinkende snaar laten oplichten in het diagram tijdens tokkelen.
- Akkoorden in het raster sorteren of groeperen (bv. op moeilijkheid of grondtoon); nu de volgorde van `akkoorden.json`.
- Een variant in `kopieerTekst` noemen (bv. "G (3 vingers)"), zodat `/nieuw-nummer` weet welke vorm je speelt.
