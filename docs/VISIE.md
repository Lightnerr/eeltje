# Eeltje – Projectvisie

## Doel

Eén plek om gitaar te leren, voor iemand die net begonnen is. Je ziet elke dag wat je kunt oefenen, welke liedjes je al kunt spelen en hoe je vooruitgaat. De app is een oefenmaatje, geen lesmethode: hij zegt welk akkoord je nu het meest oplevert, laat je meespelen in een tempo dat je aankunt, en maakt van saaie vingeroefeningen een challenge met een record.

De app werkt op laptop en telefoon, zonder account, zonder login, zonder backend en zonder betaalde diensten. Hij is installeerbaar op het beginscherm en werkt offline, ook als de telefoon op een standaard naast je staat.

## Gebruiker

Er is één gebruiker: de eigenaar, een beginnende gitarist. Er zijn geen rollen en geen accounts. Zijn voortgang staat alleen op zijn eigen apparaat. Met export en import neemt hij hem mee van laptop naar telefoon en terug.

Hij houdt vaak een gitaar vast terwijl hij tikt. Alles moet dus met één vinger te bedienen zijn, met grote tikdoelen, en leesbaar op een armlengte afstand.

## Principes

- **Rustig en overzichtelijk.** Eén ding tegelijk, geen meldingen, geen gamification die zeurt. Een streak motiveert, maar straft niet.
- **Eerlijk over de inhoud.** Liedjes die een AI maakte, staan als "AI-versie, nog niet gecontroleerd" tot de eigenaar ze heeft gecontroleerd. Een vereenvoudigde versie zegt welke akkoorden het origineel had.
- **Geen songteksten en geen gekopieerde tabs.** Alleen akkoordenschema's, tempo en slagpatroon. Zo blijft de repo vrij van auteursrecht.
- **Inhoud groeit via Claude Code.** Nieuwe liedjes, akkoorden en oefeningen zijn JSON-bestanden. De eigenaar typt `/nieuw-nummer Riptide van Vance Joy` en Claude maakt een beginnersversie die bij zijn akkoorden past.
- **Zelf gemaakt waar het kan.** Geluid via de Web Audio API, diagrammen als SVG. Geen audiobestanden, geen externe libraries voor de kern.

## Functionaliteit (eerste versie)

### Vandaag

Een dagroutine van 10 tot 15 minuten die de app zelf samenstelt: opwarmen met de spider, één akkoordwissel-challenge met akkoorden die je aan het oefenen bent, en één liedje dat je (bijna) kunt spelen. De routine is de hele dag hetzelfde. Daaronder een oefentimer, je streak en het totaal aantal geoefende minuten.

### Akkoorden

Een raster met akkoorddiagrammen: vingernummers in de bolletjes, x en o boven de snaren, snaarnamen eronder, en het fretnummer bij een hogere positie. Tik op een akkoord voor een groot diagram, het geluid (aangeslagen en per snaar getokkeld), de varianten, en de status: nieuw, oefenen of kan ik. Je filtert op status. De knop "Kopieer mijn akkoorden" maakt een tekst als "Akkoorden die ik kan: A, D, E. Aan het oefenen: G, Em." om in een chat of in `mijn-akkoorden.txt` te plakken.

Voor A is de eigen variant de standaard: D-snaar vinger 2, G-snaar vinger 1, B-snaar vinger 3, alle drie op de 2e fret.

### Liedjes

Een lijst met per liedje de speelbaarheid: "Kan je spelen", "Mist 1 akkoord: G" of "Mist er 3". Een akkoord op "oefenen" of "kan ik" telt als bekend. De capo-suggestie rekent uit of een liedje met een capo en andere vormen wel speelbaar wordt met wat je kent. Bovenaan: "Welk akkoord moet ik nu leren?", het akkoord dat de meeste nieuwe liedjes speelbaar maakt.

De liedjespagina toont het schema per maat, kleine diagrammen van de gebruikte akkoorden en het slagpatroon als pijltjes. In de meespeelmodus tel je af, loopt de metronoom (eventueel met het akkoordgeluid), licht de huidige maat op en staat het volgende akkoord al klaar. Het tempo gaat van 40% tot 120% van het origineel, en je kunt één sectie herhalen.

### Oefenen en challenges

- **Metronoom:** 30 tot 220 bpm, tap tempo, accent op de 1, maatsoort en een tel die je ziet.
- **Slagpatroon-trainer:** kies of ontwerp een patroon; pijltjes omhoog en omlaag lopen mee met de metronoom.
- **Oefeningen:** spider, chromatisch loopje, akkoordwissels en basisaanslag, met uitleg in stappen en eventueel een tabje.
- **One minute changes:** kies twee akkoorden, 60 seconden, een grote tikknop (of de spatiebalk) per wissel. De score wordt opgeslagen, het record staat erbij.
- **Spider-ladder:** begin laag; na elke ronde die lukte (dat zeg je zelf) gaat het tempo omhoog. Het hoogste tempo wordt opgeslagen.
- **Wisselreeks:** drie of vier akkoorden in een vast tempo, zo lang mogelijk volhouden.

Meespelen en challenges hebben een schermvullende weergave met grote akkoordnamen, en houden het scherm wakker.

### Voortgang

Grafiekjes per challenge door de tijd, records, streak, minuten per week en een overzicht van je akkoordstatussen. Exporteer en importeer al je voortgang als JSON-bestand. "Alles wissen" vraagt eerst om bevestiging.

### Bij de eerste start

D en A staan op "oefenen", de rest op "nieuw".

## Hosting

Een statische site op GitHub Pages, gebouwd door een GitHub Action. `main` staat op de hoofd-URL; elke PR krijgt een eigen preview op `pr-<nummer>/`, met demodata in een eigen opslag. Zo bekijkt de eigenaar elke wijziging op zijn telefoon voordat hij merget, zonder dat zijn echte voortgang verandert.

## Ubiquitous language

De domeintaal is Nederlands, overal: in gesprekken, in de UI en in de code. Een begrip heeft één naam, en die naam is in de hele codebase hetzelfde. Gitaarjargon (capo, barré, bpm, spider) blijft zoals gitaristen het zeggen.

| Domeinterm | In de code |
|---|---|
| Akkoord: één vingerzetting, met frets per snaar (lage E naar hoge e, `x` = niet spelen, `0` = open), vingers (0 = geen, 1 t/m 4 = wijsvinger t/m pink) en moeilijkheid 1 t/m 5 | `Akkoord` (`frets`, `vingers`, `moeilijkheid`, `basisfret`), `Fret`; `src/data/akkoorden.json` |
| Variant: een andere zetting van hetzelfde akkoord; de standaard is wat je ziet tenzij je een andere kiest | `Akkoord.variant` (`eigen`, `barre`, `3-vingers`), `Akkoord.titel`, `Akkoord.standaard`; `variantenVan`, `standaardVariant`, `zoekAkkoord(naam, variantnaam?)` |
| Voorkeursvariant (gekozen variant): de variant die je zelf koos, anders de standaard | `Voortgang.voorkeurVariant`, `zetVoorkeurVariant`, `gekozenVariant(akkoorden, voortgang, naam)` |
| Akkoorddiagram: vakken, bolletjes met vingernummer, x en o, fretnummer, topkam, barré | `AkkoordDiagram` (`grootte`: `klein`, `middel`, `groot`); `diagramVan` → `Diagram` (`Bolletje`, `DiagramBarre`), `beschrijfAkkoord` |
| Akkoordenraster: elk akkoord één keer, met zijn status | `rasterVan(akkoorden, voortgang, filter?)` → `RasterItem`, `akkoordnamen` |
| Aanslaan (alle snaren snel van laag naar hoog) en tokkelen (per snaar met een pauze) | `slaAan`, `tokkel`, `stopGitaar` (`src/audio/gitaar.ts`); `Speelwijze`, `aanslagen`, `toonhoogtes`, `frequentie`, `karplusStrong` (`src/lib/gitaar.ts`) |
| Barré: één vinger over meerdere snaren | `Barre` (`fret`, `vanSnaar`, `totSnaar`), `Akkoord.barre` |
| Akkoordstatus | `AkkoordStatus` (`'nieuw' \| 'oefenen' \| 'kan ik'`), `STATUSSEN`, `statusVan`, `zetStatus`; `STATUSLABEL`, `StatusLabel` |
| Bekende akkoorden: op "oefenen" of "kan ik" | `bekendeAkkoorden(voortgang)` |
| Liedje: alleen schema, tempo en slagpatroon, nooit tekst | `Liedje`; `src/data/liedjes/<id>.json`, `zoekLiedje` |
| Sectie (couplet, refrein …), maat, volgorde van de secties | `Sectie`, `Maat`, `Liedje.volgorde`, `speelVolgorde` → `SpeelMaat` |
| Toonsoort, capo, bpm, maatsoort | `Liedje.toonsoort` (klinkend), `capo`, `bpm` (tellen van de noemer), `Maatsoort`, `leesMaatsoort` |
| Slagpatroon (`D - D U - U D U`) en een slag | `Liedje.slagpatroon` (tekst), `Slag`, `leesSlagpatroon`, `slagenPasInMaat`, `slagenPerTel` |
| Klinkend akkoord (wat je hoort) tegenover de vorm (wat je met capo grijpt) | `klinkendAkkoord(vorm, capo)`, `vormBijCapo(klinkend, capo)`, `transponeer`, `zelfdeAkkoord` |
| Speelbaarheid: welke akkoorden je mist, en het label daarvan | `ontbrekendeAkkoorden(liedje, bekend)`, `speelbaarheidsLabel(ontbrekend)` |
| Vereenvoudiging: een makkelijker akkoord dat hetzelfde werk doet (Fmaj7 voor F) | `vereenvoudigingen(naam)`, `vereenvoudig(akkoorden, bekend)`, `Liedje.origineleAkkoorden` |
| Capo-suggestie: een andere capo of vorm waarmee het wel lukt | `capoSuggestie(liedje, bekend)` → `CapoSuggestie` |
| Leeradvies: welk akkoord je nu moet leren | `leeradvies(liedjes, bekend)` → `Leeradvies` |
| AI-versie, gecontroleerd: door Claude gemaakt, en of de eigenaar hem nakeek | `Liedje.bron`, `Liedje.geverifieerd` (in de data), `Voortgang.gecontroleerd`, `zetGecontroleerd` |
| Favoriet liedje | `Voortgang.favorieten`, `wisselFavoriet` |
| Oefening, met doel, stappen, tabje en standaardtempo | `Oefening` (`doel`, `stappen`, `tab`, `standaardtempo`); `src/data/oefeningen.json`, `zoekOefening` |
| Challenge en zijn resultaat: wissels per minuut, hoogste bpm of volgehouden seconden | `ChallengeType`, `ChallengeResultaat` (`sleutel`, `waarde`, `bpm`) |
| Akkoordpaar (A-D is hetzelfde als D-A) | `ChallengeResultaat.sleutel` (`A-D`); `paarSleutel` volgt in stap 5 |
| Record |  |
| Oefensessie, streak, geoefende minuten | `Sessie`, `voegSessieToe`; streak en minuten volgen in stap 6 |
| Dagroutine |  |
| Voortgang: alles wat persoonlijk is, met een versie | `Voortgang` (`versie: 1`), `nieuweVoortgang`, `normaliseerVoortgang`, `exporteerVoortgang`, `importeerVoortgang`; `opslag`, `useVoortgang` |
| Mijn akkoorden kopiëren | `kopieerTekst(voortgang, akkoorden)`, knop "Kopieer mijn akkoorden" op Akkoorden |
| Demo-voortgang: een verzonnen gitarist die een maand bezig is, voor previews en screenshots | `demoVoortgang(nu)` in `src/lib/demo.ts` |
| Preview: de build van een PR op GitHub Pages, met eigen opslag | `VITE_PREVIEW`, `opslagSleutel(naam, preview)` |
| Route: welk scherm je ziet, als hash (`#/liedjes/wonderwall`) | `Route`, `leesRoute`, `naarHash`, `tabVan`, `useRoute`, `navigeer` |
| Tabblad: Vandaag, Akkoorden, Liedjes, Oefenen, Voortgang | `Tab`, `Tabbalk` |
| Schermvullend: meespelen en challenges over het hele scherm, scherm blijft wakker | `Schermvullend`, `useWakeLock` |
