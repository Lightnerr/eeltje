import type { Liedje } from './types';

const SPELLING = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

const NOOT_NAAR_INDEX: Record<string, number> = {
  C: 0, 'B#': 0,
  'C#': 1, Db: 1,
  D: 2,
  'D#': 3, Eb: 3,
  E: 4, Fb: 4,
  F: 5, 'E#': 5,
  'F#': 6, Gb: 6,
  G: 7,
  'G#': 8, Ab: 8,
  A: 9,
  'A#': 10, Bb: 10,
  B: 11, Cb: 11,
};

export interface GeparsedAkkoord {
  grondtoon: number;
  suffix: string;
  bas?: number;
}

const NOOT_RE = /^([A-G](?:#|b)?)/;

export function parseAkkoord(naam: string): GeparsedAkkoord {
  const [hoofd, basDeel] = naam.trim().split('/');
  const m = NOOT_RE.exec(hoofd);
  if (!m || NOOT_NAAR_INDEX[m[1]] === undefined) {
    throw new Error(`Onbekend akkoord: "${naam}"`);
  }
  const resultaat: GeparsedAkkoord = {
    grondtoon: NOOT_NAAR_INDEX[m[1]],
    suffix: hoofd.slice(m[1].length),
  };
  if (basDeel) {
    const b = NOOT_RE.exec(basDeel);
    if (!b || NOOT_NAAR_INDEX[b[1]] === undefined) throw new Error(`Onbekende basnoot: "${naam}"`);
    resultaat.bas = NOOT_NAAR_INDEX[b[1]];
  }
  return resultaat;
}

const mod12 = (n: number) => ((n % 12) + 12) % 12;

function schrijf(a: GeparsedAkkoord): string {
  const basis = SPELLING[a.grondtoon] + a.suffix;
  return a.bas === undefined ? basis : `${basis}/${SPELLING[a.bas]}`;
}

/** Zet een akkoordnaam in de vaste spelling van de app (A# wordt Bb, Gb wordt F#). */
export function normaliseer(naam: string): string {
  return schrijf(parseAkkoord(naam));
}

export function transponeer(naam: string, halveTonen: number): string {
  const a = parseAkkoord(naam);
  return schrijf({
    grondtoon: mod12(a.grondtoon + halveTonen),
    suffix: a.suffix,
    bas: a.bas === undefined ? undefined : mod12(a.bas + halveTonen),
  });
}

/** Wat je hoort als je de vorm `vorm` speelt met capo op fret `capo`. */
export function klinkendAkkoord(vorm: string, capo: number): string {
  return transponeer(vorm, capo);
}

/** Welke vorm je moet pakken om `klinkend` te laten horen met capo op `capo`. */
export function vormMetCapo(klinkend: string, capo: number): string {
  return transponeer(klinkend, -capo);
}

export function gebruikteAkkoorden(liedje: Pick<Liedje, 'secties'>): string[] {
  const gezien = new Set<string>();
  for (const sectie of liedje.secties) {
    for (const maat of sectie.maten) {
      for (const a of maat.akkoorden) gezien.add(a);
    }
  }
  return [...gezien];
}

/** Bekende akkoorden genormaliseerd zodat A# en Bb als hetzelfde tellen. */
export function maakBekend(namen: Iterable<string>): Set<string> {
  return new Set([...namen].map(normaliseer));
}

export function ontbrekendeAkkoorden(akkoorden: string[], bekend: Set<string>): string[] {
  return akkoorden.filter((a) => !bekend.has(normaliseer(a)));
}

export function speelbaarheidsLabel(ontbrekend: string[]): string {
  if (ontbrekend.length === 0) return 'Kan je spelen';
  if (ontbrekend.length === 1) return `Mist 1 akkoord: ${ontbrekend[0]}`;
  return `Mist er ${ontbrekend.length}`;
}

const EXPLICIETE_VEREENVOUDIGING: Record<string, string[]> = {
  F: ['Fmaj7'],
  C: ['Cadd9'],
  B: ['B7'],
  Bm: ['Bm7'],
  'F#m': ['F#m7'],
};

/**
 * Makkelijkere akkoorden die in een beginnersversie hetzelfde werk doen.
 * Volgorde = voorkeur. Het akkoord zelf zit er niet in.
 */
export function vereenvoudigingen(naam: string): string[] {
  const a = parseAkkoord(naam);
  const root = SPELLING[a.grondtoon];
  const opties: string[] = [];
  const voeg = (n: string) => {
    if (n !== naam && !opties.includes(n)) opties.push(n);
  };

  const zonderBas = SPELLING[a.grondtoon] + a.suffix;
  if (a.bas !== undefined) voeg(zonderBas);

  for (const alt of EXPLICIETE_VEREENVOUDIGING[zonderBas] ?? []) voeg(alt);

  const s = a.suffix;
  const mineur = /^m(?!aj)/.test(s);
  if (s === '5') {
    voeg(root);
    voeg(root + 'm');
  } else if (mineur && s !== 'm') {
    voeg(root + 'm');
  } else if (!mineur && s !== '') {
    voeg(root);
  }
  return opties;
}

/** Het akkoord dat je daadwerkelijk speelt: zelf, of een vereenvoudiging die je kent. */
export function speelbareVorm(naam: string, bekend: Set<string>): string | null {
  if (bekend.has(normaliseer(naam))) return naam;
  for (const alt of vereenvoudigingen(naam)) {
    if (bekend.has(normaliseer(alt))) return alt;
  }
  return null;
}

export interface CapoOptie {
  capo: number;
  /** origineel akkoord in het liedje (vorm bij de capo van het liedje) → wat je speelt */
  vormen: { origineel: string; speel: string | null }[];
  ontbrekend: string[];
  vervangingen: number;
}

function beoordeelCapo(liedje: Liedje, capo: number, bekend: Set<string>): CapoOptie {
  const vormen = gebruikteAkkoorden(liedje).map((origineel) => {
    const nodig = vormMetCapo(klinkendAkkoord(origineel, liedje.capo), capo);
    const speel = speelbareVorm(nodig, bekend);
    return { origineel, nodig, speel };
  });
  const ontbrekend = [...new Set(vormen.filter((v) => !v.speel).map((v) => v.nodig))];
  const vervangingen = vormen.filter((v) => v.speel && normaliseer(v.speel) !== normaliseer(v.nodig)).length;
  return {
    capo,
    vormen: vormen.map((v) => ({ origineel: v.origineel, speel: v.speel ?? v.nodig })),
    ontbrekend,
    vervangingen,
  };
}

function isBeter(a: CapoOptie, b: CapoOptie, origineleCapo: number): boolean {
  if (a.ontbrekend.length !== b.ontbrekend.length) return a.ontbrekend.length < b.ontbrekend.length;
  if (a.vervangingen !== b.vervangingen) return a.vervangingen < b.vervangingen;
  const afstandA = Math.abs(a.capo - origineleCapo);
  const afstandB = Math.abs(b.capo - origineleCapo);
  if (afstandA !== afstandB) return afstandA < afstandB;
  return a.capo < b.capo;
}

/** Beste manier om dit liedje te spelen met wat je kent: capo 0 t/m maxCapo, met vereenvoudigingen. */
export function besteCapoOptie(liedje: Liedje, bekend: Set<string>, maxCapo = 7): CapoOptie {
  let beste = beoordeelCapo(liedje, liedje.capo, bekend);
  for (let capo = 0; capo <= maxCapo; capo++) {
    const optie = beoordeelCapo(liedje, capo, bekend);
    if (isBeter(optie, beste, liedje.capo)) beste = optie;
  }
  return beste;
}

export interface CapoSuggestie extends CapoOptie {
  /** true als de suggestie iets anders is dan het liedje zoals het in het schema staat */
  anders: boolean;
}

/**
 * Alleen een suggestie als het schema zoals het er staat niet speelbaar is
 * en een andere capo/vereenvoudiging minder ontbrekende akkoorden oplevert.
 */
export function capoSuggestie(liedje: Liedje, bekend: Set<string>, maxCapo = 7): CapoSuggestie | null {
  const zoalsHetStaat = ontbrekendeAkkoorden(gebruikteAkkoorden(liedje), bekend);
  if (zoalsHetStaat.length === 0) return null;
  const beste = besteCapoOptie(liedje, bekend, maxCapo);
  if (beste.ontbrekend.length >= zoalsHetStaat.length) return null;
  return { ...beste, anders: true };
}

export interface LeerAdvies {
  akkoord: string;
  /** liedjes die met dit akkoord erbij speelbaar worden */
  nieuweLiedjes: string[];
  /** liedjes waarbij je dan minder akkoorden mist */
  dichterbij: string[];
}

function aantalOntbrekend(liedje: Liedje, bekend: Set<string>): number {
  return besteCapoOptie(liedje, bekend).ontbrekend.length;
}

/** Welk akkoord moet ik nu leren? Het akkoord dat de meeste liedjes speelbaar maakt. */
export function leerAdvies(
  liedjes: Liedje[],
  bekend: Set<string>,
  kandidaten: { naam: string; moeilijkheid: number }[],
): LeerAdvies[] {
  const nu = new Map(liedjes.map((l) => [l.id, aantalOntbrekend(l, bekend)]));
  const advies: (LeerAdvies & { moeilijkheid: number })[] = [];
  const gehad = new Set<string>();
  for (const k of kandidaten) {
    const naam = normaliseer(k.naam);
    if (bekend.has(naam) || gehad.has(naam)) continue;
    gehad.add(naam);
    const metK = new Set(bekend).add(naam);
    const nieuweLiedjes: string[] = [];
    const dichterbij: string[] = [];
    for (const l of liedjes) {
      const voor = nu.get(l.id)!;
      if (voor === 0) continue;
      const na = aantalOntbrekend(l, metK);
      if (na === 0) nieuweLiedjes.push(l.id);
      else if (na < voor) dichterbij.push(l.id);
    }
    if (nieuweLiedjes.length || dichterbij.length) {
      advies.push({ akkoord: k.naam, nieuweLiedjes, dichterbij, moeilijkheid: k.moeilijkheid });
    }
  }
  advies.sort(
    (a, b) =>
      b.nieuweLiedjes.length - a.nieuweLiedjes.length ||
      b.dichterbij.length - a.dichterbij.length ||
      a.moeilijkheid - b.moeilijkheid ||
      a.akkoord.localeCompare(b.akkoord),
  );
  return advies.map(({ moeilijkheid: _m, ...rest }) => rest);
}

export type Slag = 'D' | 'U' | '-';

export function parseSlagpatroon(patroon: string): Slag[] {
  const tokens = patroon.trim().split(/\s+/).filter(Boolean);
  return tokens.map((t) => {
    const u = t.toUpperCase();
    if (u === 'D' || u === 'U' || u === '-') return u;
    throw new Error(`Onbekende slag "${t}" in patroon "${patroon}"`);
  });
}

export interface Maatsoort {
  tellen: number;
  eenheid: number;
}

export function parseMaatsoort(maatsoort: string): Maatsoort {
  const m = /^(\d+)\/(\d+)$/.exec(maatsoort.trim());
  if (!m) throw new Error(`Onbekende maatsoort "${maatsoort}"`);
  const tellen = Number(m[1]);
  const eenheid = Number(m[2]);
  if (tellen < 1 || tellen > 16 || ![2, 4, 8, 16].includes(eenheid)) {
    throw new Error(`Onbekende maatsoort "${maatsoort}"`);
  }
  return { tellen, eenheid };
}

/** 0 = geen, 1 = licht accent, 2 = hoofdaccent. In 6/8, 9/8 en 12/8 krijgt elke groep van 3 een licht accent. */
export function accentOpTel(tel: number, maatsoort: Maatsoort): 0 | 1 | 2 {
  if (tel === 0) return 2;
  if (maatsoort.eenheid === 8 && maatsoort.tellen % 3 === 0 && maatsoort.tellen > 3 && tel % 3 === 0) return 1;
  return 0;
}

export interface GespeeldeMaat {
  sectieNaam: string;
  sectieIndex: number;
  herhaling: number;
  maatIndex: number;
  akkoorden: string[];
}

/** Het hele liedje uitgerold in de volgorde waarin je het speelt. */
export function speelVolgorde(liedje: Liedje, alleenSectie?: string): GespeeldeMaat[] {
  const volgorde = alleenSectie ? [alleenSectie] : liedje.volgorde;
  const uit: GespeeldeMaat[] = [];
  volgorde.forEach((naam, sectieIndex) => {
    const sectie = liedje.secties.find((s) => s.naam === naam);
    if (!sectie) throw new Error(`Sectie "${naam}" bestaat niet in ${liedje.id}`);
    const herhalingen = alleenSectie ? 1 : sectie.herhalingen;
    for (let h = 0; h < herhalingen; h++) {
      sectie.maten.forEach((maat, maatIndex) => {
        uit.push({ sectieNaam: naam, sectieIndex, herhaling: h, maatIndex, akkoorden: maat.akkoorden });
      });
    }
  });
  return uit;
}
