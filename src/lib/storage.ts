import type { AkkoordStatus, ChallengeResultaat, Voortgang } from './types';
import { demoVoortgang } from './demo';

/**
 * Enige plek die weet waar de voortgang staat. Wil je later naar IndexedDB of
 * een sync-dienst: vervang de backend, de rest van de app merkt er niets van.
 */
export interface Backend {
  lees(): string | null;
  schrijf(waarde: string): void;
  wis(): void;
}

// Een PR-preview draait op hetzelfde domein; met een eigen sleutel raakt hij je echte voortgang niet.
const SLEUTEL = 'eeltje.voortgang.v1' + (import.meta.env.VITE_PREVIEW ? `.${import.meta.env.VITE_PREVIEW}` : '');

export function localStorageBackend(): Backend {
  return {
    lees: () => localStorage.getItem(SLEUTEL),
    schrijf: (w) => localStorage.setItem(SLEUTEL, w),
    wis: () => localStorage.removeItem(SLEUTEL),
  };
}

export function geheugenBackend(begin: string | null = null): Backend {
  let waarde = begin;
  return {
    lees: () => waarde,
    schrijf: (w) => {
      waarde = w;
    },
    wis: () => {
      waarde = null;
    },
  };
}

export function beginVoortgang(): Voortgang {
  return {
    versie: 1,
    akkoordStatus: { D: 'oefenen', A: 'oefenen' },
    voorkeurVariant: {},
    challenges: [],
    sessies: [],
    favorieten: [],
    gecontroleerd: [],
  };
}

const STATUSSEN: AkkoordStatus[] = ['nieuw', 'oefenen', 'kan ik'];

/** Maakt van willekeurige (geïmporteerde) JSON een geldige Voortgang, of gooit een fout. */
export function normaliseerVoortgang(ruw: unknown): Voortgang {
  if (!ruw || typeof ruw !== 'object') throw new Error('Dit is geen Eeltje-voortgangsbestand.');
  const r = ruw as Record<string, unknown>;
  if (r.versie !== 1) throw new Error('Onbekende versie van het voortgangsbestand.');
  const basis = beginVoortgang();
  const obj = (v: unknown) => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
  const lijst = (v: unknown) => (Array.isArray(v) ? v : []);

  const akkoordStatus: Record<string, AkkoordStatus> = {};
  for (const [k, v] of Object.entries(obj(r.akkoordStatus))) {
    if (STATUSSEN.includes(v as AkkoordStatus)) akkoordStatus[k] = v as AkkoordStatus;
  }
  const voorkeurVariant: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj(r.voorkeurVariant))) if (typeof v === 'string') voorkeurVariant[k] = v;

  return {
    versie: 1,
    akkoordStatus: r.akkoordStatus ? akkoordStatus : basis.akkoordStatus,
    voorkeurVariant,
    challenges: lijst(r.challenges).filter(
      (c): c is ChallengeResultaat =>
        !!c && typeof c.type === 'string' && typeof c.datum === 'string' && typeof c.waarde === 'number',
    ),
    sessies: lijst(r.sessies).filter((s) => !!s && typeof s.datum === 'string' && typeof s.duurSec === 'number'),
    favorieten: lijst(r.favorieten).filter((x): x is string => typeof x === 'string'),
    gecontroleerd: lijst(r.gecontroleerd).filter((x): x is string => typeof x === 'string'),
  };
}

type Luisteraar = () => void;

export class VoortgangOpslag {
  private huidig: Voortgang;
  private luisteraars = new Set<Luisteraar>();

  constructor(
    private backend: Backend,
    private begin: () => Voortgang = beginVoortgang,
  ) {
    this.huidig = this.laad();
  }

  private laad(): Voortgang {
    try {
      const tekst = this.backend.lees();
      return tekst ? normaliseerVoortgang(JSON.parse(tekst)) : this.begin();
    } catch {
      return this.begin();
    }
  }

  get = (): Voortgang => this.huidig;

  abonneer = (l: Luisteraar): (() => void) => {
    this.luisteraars.add(l);
    return () => this.luisteraars.delete(l);
  };

  wijzig(fn: (v: Voortgang) => Voortgang): void {
    this.huidig = fn(this.huidig);
    try {
      this.backend.schrijf(JSON.stringify(this.huidig));
    } catch {
      /* opslag vol of geblokkeerd: in het geheugen houden we het wel */
    }
    this.luisteraars.forEach((l) => l());
  }

  zetStatus(akkoord: string, status: AkkoordStatus): void {
    this.wijzig((v) => ({ ...v, akkoordStatus: { ...v.akkoordStatus, [akkoord]: status } }));
  }

  zetVoorkeurVariant(akkoord: string, variantId: string): void {
    this.wijzig((v) => ({ ...v, voorkeurVariant: { ...v.voorkeurVariant, [akkoord]: variantId } }));
  }

  voegChallengeToe(r: ChallengeResultaat): void {
    this.wijzig((v) => ({ ...v, challenges: [...v.challenges, r] }));
  }

  voegSessieToe(duurSec: number, datum = new Date()): void {
    if (duurSec < 1) return;
    this.wijzig((v) => ({ ...v, sessies: [...v.sessies, { datum: datum.toISOString(), duurSec: Math.round(duurSec) }] }));
  }

  wisselFavoriet(id: string): void {
    this.wijzig((v) => ({
      ...v,
      favorieten: v.favorieten.includes(id) ? v.favorieten.filter((x) => x !== id) : [...v.favorieten, id],
    }));
  }

  markeerGecontroleerd(id: string, aan = true): void {
    this.wijzig((v) => ({
      ...v,
      gecontroleerd: aan ? [...new Set([...v.gecontroleerd, id])] : v.gecontroleerd.filter((x) => x !== id),
    }));
  }

  exporteer(): string {
    return JSON.stringify(this.huidig, null, 2);
  }

  importeer(tekst: string): void {
    const nieuw = normaliseerVoortgang(JSON.parse(tekst));
    this.wijzig(() => nieuw);
  }

  wisAlles(): void {
    this.backend.wis();
    this.huidig = this.begin();
    this.luisteraars.forEach((l) => l());
  }
}

export function statusVan(v: Voortgang, akkoord: string): AkkoordStatus {
  return v.akkoordStatus[akkoord] ?? 'nieuw';
}

/** Akkoorden op "oefenen" of "kan ik" tellen als speelbaar. */
export function speelbareAkkoorden(v: Voortgang): string[] {
  return Object.entries(v.akkoordStatus)
    .filter(([, s]) => s === 'oefenen' || s === 'kan ik')
    .map(([n]) => n);
}

function maakStandaardOpslag(): VoortgangOpslag {
  const heeftLocalStorage = (() => {
    try {
      return typeof localStorage !== 'undefined';
    } catch {
      return false;
    }
  })();
  const backend = heeftLocalStorage ? localStorageBackend() : geheugenBackend();
  return new VoortgangOpslag(backend, import.meta.env.VITE_PREVIEW ? demoVoortgang : beginVoortgang);
}

export const opslag = maakStandaardOpslag();
