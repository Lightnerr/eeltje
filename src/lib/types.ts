// Inhoud (src/data) en persoonlijke voortgang. Dit is het schema; validatie.ts bewaakt het.

/** Fret per snaar: `'x'` = niet spelen, `0` = open. */
export type Fret = number | 'x'

/** Eén vinger over meerdere snaren. Snaren tellen van 0 (lage E) tot 5 (hoge e). */
export interface Barre {
  fret: number
  vanSnaar: number
  totSnaar: number
}

/** Eén vingerzetting. `frets` en `vingers` gaan van lage E naar hoge e. */
export interface Akkoord {
  naam: string
  /** Korte, url-veilige naam van de variant, uniek per akkoordnaam: `standaard`, `eigen`, `barre`, `3-vingers`. */
  variant: string
  /** Zoals de variant in de app heet: "Eigen", "Barré", "3 vingers". */
  titel: string
  /** Per naam heeft precies één variant `standaard: true`. */
  standaard: boolean
  frets: Fret[]
  /** 0 = geen vinger, 1 t/m 4 = wijsvinger t/m pink. */
  vingers: number[]
  barre?: Barre
  /** Bovenste fret van het diagram; ontbreekt = 1. */
  basisfret?: number
  /** 1 (makkelijk) t/m 5 (moeilijk). */
  moeilijkheid: number
  omschrijving?: string
}

export type Maatsoort = '2/4' | '3/4' | '4/4' | '6/8'

/** Omlaag, omhoog of rust. */
export type Slag = 'D' | 'U' | '-'

/** Een maat bevat 1 t/m 4 akkoorden die de tellen gelijk verdelen. */
export type Maat = string[]

export interface Sectie {
  naam: string
  maten: Maat[]
}

export type Bron = 'ai-gegenereerd' | 'eigenaar'

/** Alleen schema, tempo en slagpatroon, nooit tekst. De akkoorden zijn de vormen die je grijpt bij `capo`. */
export interface Liedje {
  id: string
  titel: string
  artiest: string
  soort: 'traditioneel' | 'pop'
  /** De klinkende toonsoort, bijvoorbeeld `G` of `F#m`. */
  toonsoort: string
  capo: number
  /** Tellen per minuut van de noemer: in 6/8 tel je achtsten. */
  bpm: number
  maatsoort: Maatsoort
  /** Slagen gescheiden door spaties, bijvoorbeeld `D - D U - U D U`. */
  slagpatroon: string
  secties: Sectie[]
  /** Sectienamen in speelvolgorde; een sectie mag vaker voorkomen. */
  volgorde: string[]
  /** Alleen bij een vereenvoudigde versie: de vormen die het origineel bij dezelfde capo gebruikt. */
  origineleAkkoorden?: string[]
  bron: Bron
  geverifieerd: boolean
  opmerking?: string
}

export interface Oefening {
  id: string
  titel: string
  doel: string
  stappen: string[]
  /** Regels van een tabje, hoge e bovenaan. */
  tab?: string[]
  standaardtempo: number
  maatsoort?: Maatsoort
  slagpatroon?: string
}

export type AkkoordStatus = 'nieuw' | 'oefenen' | 'kan ik'

export type ChallengeType = 'one-minute-changes' | 'spider-ladder' | 'wisselreeks'

export interface ChallengeResultaat {
  type: ChallengeType
  /** one-minute-changes: `paarSleutel(a, b)`, bv. `A-D`; spider-ladder: `spider`; wisselreeks: de akkoorden met `-`, bv. `G-C-D`. */
  sleutel: string
  /** Wissels in 60 s / hoogste bpm die lukte / volgehouden seconden. */
  waarde: number
  /** Wisselreeks: het tempo. */
  bpm?: number
  /** ISO-tijdstip. */
  datum: string
}

export interface Sessie {
  /** ISO-tijdstip. */
  start: string
  seconden: number
}

export interface Voortgang {
  versie: 1
  /** Per akkoordnaam; ontbreekt = 'nieuw'. */
  akkoordStatus: Record<string, AkkoordStatus>
  /** Akkoordnaam -> variantnaam. */
  voorkeurVariant: Record<string, string>
  challenges: ChallengeResultaat[]
  sessies: Sessie[]
  /** Liedje-id's. */
  favorieten: string[]
  /** Liedje-id's die de eigenaar nakeek. */
  gecontroleerd: string[]
}
