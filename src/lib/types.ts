export type Fret = number | 'x';

export interface Barre {
  fret: number;
  /** snaarindex 0 = lage E, 5 = hoge e */
  vanSnaar: number;
  totSnaar: number;
  vinger: number;
}

export interface Akkoord {
  id: string;
  naam: string;
  variantnaam: string;
  /** van lage E naar hoge e, absolute fretnummers */
  frets: Fret[];
  /** 0 = geen, 1-4 = wijsvinger t/m pink */
  vingers: number[];
  barre?: Barre;
  basisfret: number;
  moeilijkheid: number;
  standaard?: boolean;
  tip?: string;
}

export interface Maat {
  akkoorden: string[];
}

export interface Sectie {
  naam: string;
  maten: Maat[];
  herhalingen: number;
}

export interface Liedje {
  id: string;
  titel: string;
  artiest: string;
  genre?: string;
  toonsoort: string;
  capo: number;
  bpm: number;
  maatsoort: string;
  slagpatroon: string;
  secties: Sectie[];
  volgorde: string[];
  notities: string[];
  bron: 'ai-gegenereerd' | 'handmatig';
  geverifieerd: boolean;
  origineleAkkoorden?: string[];
}

export interface Oefening {
  id: string;
  naam: string;
  doel: string;
  stappen: string[];
  tab?: string;
  standaardTempo: number;
  challenge?: 'spider-ladder' | 'one-minute-changes' | 'wisselreeks';
}

export type AkkoordStatus = 'nieuw' | 'oefenen' | 'kan ik';

export type ChallengeType = 'one-minute-changes' | 'spider-ladder' | 'wisselreeks';

export interface ChallengeResultaat {
  type: ChallengeType;
  /** ISO datum-tijd */
  datum: string;
  /** wissels per minuut, hoogste BPM, of aantal volgehouden seconden */
  waarde: number;
  /** bijv. "A-D" voor een akkoordpaar of "G-C-D" voor een reeks */
  sleutel?: string;
  bpm?: number;
}

export interface Sessie {
  /** ISO datum-tijd van het einde */
  datum: string;
  duurSec: number;
}

export interface Voortgang {
  versie: 1;
  akkoordStatus: Record<string, AkkoordStatus>;
  voorkeurVariant: Record<string, string>;
  challenges: ChallengeResultaat[];
  sessies: Sessie[];
  favorieten: string[];
  /** liedje-ids die ik zelf als gecontroleerd heb gemarkeerd */
  gecontroleerd: string[];
}
