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

Daarna opent Eeltje als een gewone app, ook zonder internet. Je voortgang staat op het apparaat zelf: neem hem mee met Voortgang > Exporteren en Importeren.

## Lokaal ontwikkelen

```bash
bun install
bun run dev        # http://localhost:5173, met --host ook vanaf je telefoon op hetzelfde wifi
bun run test
bun run lint
bun run build
```

Nieuwe liedjes, akkoorden en oefeningen voeg je toe met Claude Code: `/nieuw-nummer Riptide van Vance Joy`, `/nieuw-akkoord`, `/nieuwe-oefening`. Plak eerst de tekst van de knop "Kopieer mijn akkoorden" in `mijn-akkoorden.txt`.

## Keuzes

- **Hash-routes** (`#/liedjes/...`), omdat GitHub Pages geen fallback naar `index.html` heeft.
- **bun** voor pakketbeheer, net als in derde-helft.
- Meer besluiten staan in `docs/OVERDRACHT.md`.
