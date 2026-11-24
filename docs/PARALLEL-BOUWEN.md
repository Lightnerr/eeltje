# Parallel bouwen met agents

Zo bouwen we een hele fase in één sessie: een orchestrator verdeelt de stappen over bouwer-agents die tegelijk werken, en elke stap gaat door dezelfde kwaliteitspoort als bij het werken met één stap. Overgenomen uit derde-helft, waar het in vijf fasen is gebruikt.

De werkwijze uit `CLAUDE.md` blijft gelden. Dit document regelt alleen wie wat doet en hoe de stappen elkaar niet in de weg zitten.

## De startprompt

Een nieuwe sessie krijgt alleen de fasespecifieke delen. De rest staat hier.

```
Lees CLAUDE.md, docs/VISIE.md, docs/OVERDRACHT.md, docs/PARALLEL-BOUWEN.md en docs/STAPPENPLAN-FASE-N.md helemaal.
Bouw stap X t/m Y volgens docs/PARALLEL-BOUWEN.md. Jij bent de orchestrator.

## Golven
<welke stappen tegelijk, welke op welke wachten, voorwerk, merge-volgorde>

## Wie legt wat vast
<tabel: stap, gedeelde functie, type of component, gebruikt door>

## Bekende botsingen
<bestanden en schermen die meerdere stappen raken, zoals types.ts, storage.ts, App.tsx en styles.css>

## Wat ik zelf nog moet checken
<bijvoorbeeld geluid of Wake Lock op mijn telefoon>
```

Bereid die delen voor als je het stappenplan schrijft. Dan hoeft de orchestrator ze niet zelf uit te zoeken.

## Rollen

- **Orchestrator.** Schrijft zelf geen featurecode. Plant, start de agents, stuurt bevindingen door, integreert en merget. Houdt de eigenaar kort op de hoogte bij elke merge en elke blokkade. Vragen van bouwers bundelt hij met AskUserQuestion; de andere agents werken intussen door.
- **Bouwer.** Eén agent per stap, in een eigen worktree (`isolation: "worktree"`) op een branch `stap-N-<naam>` vanaf de actuele `main`. Pusht niet, maakt geen PR en merget niet.
- **Reviewer.** Een verse agent per stap, niet de bouwer. Hij krijgt alleen de staptekst, de coördinatieafspraken en de diff, en niet de mening van de orchestrator of de bouwer.

## Voorbereiding

- **`/tmp/orchestratie/`** met:
  - `werkwijze.md`: de opdracht voor de bouwers (hieronder);
  - `review.md`: de opdracht voor de reviewers;
  - `status.md`: per stap de agent-id's, de poorten, de review-rondes en de merges. Na een compactie weet de orchestrator daarmee precies waar hij is.
- **Eén kijkscript** voor alle UI-checks: `tools/kijk/kijk.sh <worktree> <poort> <routes>...` (zie `CLAUDE.md`, "De app bekijken"). Een stap die een situatie nodig heeft, voegt die toe aan `demoVoortgang`; geen losse seeds of scripts.
- **Wijzigingen aan `Voortgang` legt de orchestrator vooraf vast**, met de nieuwe `versie` en de migratie in `normaliseerVoortgang`. Twee stappen die elk de versie ophogen, botsen anders bij de tweede merge.
- **Poorten per stap:** `52N0` voor `kijk.sh` (stap 3 → 5230, stap 12 → 52120).

## Golven en merge-volgorde

- Een stap start pas als de stappen waar hij op leunt in `main` zitten.
- **Voorwerk** mag eerder: alleen de delen die niet van een ongemergde stap afhangen, meestal de logica in `src/lib` met tests. Is dat af, dan stopt de bouwer. De orchestrator stuurt hem verder zodra de afhankelijkheid gemerged is.
- **Merge het kritieke pad eerst**, maar merge ook wat klaar is: een stap die eerder af is, mag erin terwijl een ander nog in review is.
- **Een stap die gedrag voor alles verandert, merge je als laatste**, zoals een andere navigatie of een nieuwe versie van de voortgang.
- Stuur na elke merge de wachtende bouwers meteen verder.

## Opdracht voor een bouwer

Geef hem de volledige staptekst en de coördinatieafspraken die hem raken, en laat hem `CLAUDE.md`, `docs/VISIE.md` en `docs/OVERDRACHT.md` zelf lezen. Daarnaast:

- De werkwijze uit `CLAUDE.md` letterlijk:
  - tests eerst, en die moeten eerst falen;
  - van binnen naar buiten;
  - een mutatiecheck als tests meteen groen zijn;
  - na elk onderdeel `bun run lint`, `bun run test` en `bun run build`, en dan committen;
  - een refactor in een eigen commit.
- Lijkt een punt uit "Klaar wanneer" fout, of botst iets met de visie: stoppen en het de orchestrator melden.
- Wat een latere stap ook gebruikt, zo vastleggen dat die het ongewijzigd kan gebruiken.
- Tests hangen niet af van de echte klok of van de volgorde waarin ze draaien.
- Een voorbeeld in `demoVoortgang` voor alles wat zonder data leeg blijft.
- De eigen UI zelf bekijken met `kijk.sh` op de eigen poort, vóór het opleveren en na elke UI-fix.
- Processen alleen stoppen via hun eigen PID of poort.
- Afronden:
  - een sectie "Besluiten uit stap N" in de overdracht;
  - de stap afvinken in het stappenplan;
  - nieuwe begrippen in de visie.
- Opleveren in het Nederlands:
  - wat er gebouwd is;
  - afwijkingen van het plan en open punten;
  - wat er in de demo-voortgang bij kwam, en de routes voor `kijk.sh`;
  - wat de eigenaar zelf op zijn telefoon moet checken (geluid, Wake Lock, installeren);
  - het pad van de worktree en de branch.

## Kwaliteitspoort per stap

1. **Review en UI-check tegelijk.** De reviewer controleert:
   - de spec (elk "Klaar wanneer"-punt);
   - of `src/lib` puur blijft en de logica daar zit en niet in een component;
   - de naamgeving en de technische regels uit `CLAUDE.md`;
   - de regels voor inhoud (geen songteksten, geen gekopieerde tabs, `ai-gegenereerd` en niet geverifieerd);
   - of de voortgang van de eigenaar heel blijft: een migratie bij een nieuwe vorm, een oude export die nog te importeren is;
   - of alles in een preview werkt: relatieve paden, het achtervoegsel op elke `localStorage`-sleutel;
   - tests die van de klok of de volgorde afhangen;
   - echte bugs.

   Alleen bevindingen met een concreet faalscenario ("als X, dan Y, terwijl Z moet"). De orchestrator draait intussen `kijk.sh` en stuurt de bevindingen van allebei in één bericht naar de bouwer. Vanaf ronde 2 toetst de reviewer alleen de nieuwe commits. Herhaal tot er niets wezenlijks overblijft.
2. **Integratie, één stap tegelijk:**
   - kijk of `main` veranderd is (ook door de eigenaar) en rebase;
   - de hele `bun run lint && bun run test && bun run build`;
   - een laatste `kijk.sh`;
   - push en maak de PR, en wacht tot de preview er staat. Die link gaat naar de eigenaar.
3. **Merge.** Na een groene poort squash-merget de orchestrator de PR zelf, maar alleen als de eigenaar dat in de startprompt toestaat. De PR-tekst is kort en functioneel, met de afwijkingen van het plan erin. Merge één PR tegelijk.

Conflicten bij het rebasen los je inhoudelijk op: behoud allebei de kanten, gooi niets weg.

## Afronden en opruimen

Per stap aan de eigenaar: gemerged ja/nee, de PR, de preview, de afwijkingen, en wat hij zelf nog moet checken. Daarna opruimen:

- **Worktrees.** Eerst controleren dat er niets ongecommit staat en dat elke branch gemerged is. Na een squash-merge is een branch geen voorouder van `main`: controleer met `git diff <merge-commit> <branch>` (leeg = alles zit erin). Geeft een map "resource busy", dan zit er een `rr-node-modules`-mount op: koppel die eerst los.
- **Branches.** Lokaal de `stap-*`- en `worktree-agent-*`-branches; op `origin` blijven alleen `main` en `gh-pages`.
- **Processen en data.** Servers van `kijk.sh` die nog draaien, en `/tmp/kijk-*`.
- **De gedeelde werkmap.** Niet zelf pullen; alleen melden of een `git pull` fast-forward gaat.

## Lessen uit derde-helft

- **Voorwerk tot en met de logica.** Een stap die zijn logica en tests al tegen de oude `main` bouwde, hoefde na de merge van zijn afhankelijkheid alleen nog het scherm te doen.
- **Vaste namen vooraf.** Leg in "Wie legt wat vast" de namen vast die stappen van elkaar gebruiken (functies, props, velden in `Voortgang`). Dan gaat elke rebase zonder vragen.
- **De naad in de CSS.** Iedereen zet een blok onderaan `styles.css`; na "beide kanten houden" valt makkelijk een sluitende accolade weg. Tel na elke rebase de accolades.
- **De eigenaar merget ook.** Fetch vlak voor elke merge opnieuw, en controleer `main` na de merge (lint, tests, build).
- **Reviewers vinden ook oude fouten.** Herstel zoiets in dezelfde stap, in een eigen commit, en zet het als afwijking in de PR.
- **Reviewers vinden fouten van de orchestrator.** Laat ook een stap die je zelf bouwde door een verse reviewer gaan.
- **Kleine fixes zelf nakijken.** Na een rebase zonder nieuwe logica of een fix van een paar regels kijkt de orchestrator de diff zelf na, in plaats van een tweede review-ronde.
- **API-limiet.** Loopt die vol, dan blijft het werk staan; na de reset gaan de agents met een kort bericht verder waar ze waren.
