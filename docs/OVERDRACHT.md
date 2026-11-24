# Overdracht

Stand van zaken voor de agent die verdergaat. Lees eerst `CLAUDE.md`, `docs/VISIE.md` en de volgende stap in `docs/STAPPENPLAN.md`. Dit document vult die aan met wat er onderweg is besloten en geleerd.

## Waar we staan

- Stap 1 is af: projectopzet, types, inhoud (akkoorden, 15 liedjes, oefeningen), storage, muzieklogica en validatie, met 62 tests.
- De schermen van stap 2 t/m 6 zijn nog placeholders.
- De werkwijze, de kijktool, CI, Dependabot en GitHub Pages met PR-previews komen uit derde-helft (de teamapp van de eigenaar) en zijn op een statische app aangepast.

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
