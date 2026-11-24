import type { Akkoord, Liedje, Oefening } from './types';
import { gebruikteAkkoorden, normaliseer, parseMaatsoort, parseSlagpatroon } from './muziek';

const isInt = (n: unknown, min: number, max: number) =>
  typeof n === 'number' && Number.isInteger(n) && n >= min && n <= max;
const isTekst = (s: unknown) => typeof s === 'string' && s.trim().length > 0;

export function valideerAkkoord(a: Akkoord): string[] {
  const f: string[] = [];
  const p = `akkoord ${a.id ?? '?'}`;
  if (!isTekst(a.id)) f.push(`${p}: id ontbreekt`);
  if (!isTekst(a.naam)) f.push(`${p}: naam ontbreekt`);
  else {
    try {
      normaliseer(a.naam);
    } catch {
      f.push(`${p}: naam "${a.naam}" is geen geldige akkoordnaam`);
    }
  }
  if (!isTekst(a.variantnaam)) f.push(`${p}: variantnaam ontbreekt`);
  if (!Array.isArray(a.frets) || a.frets.length !== 6) f.push(`${p}: frets moet 6 waarden hebben`);
  else if (!a.frets.every((x) => x === 'x' || isInt(x, 0, 24))) f.push(`${p}: frets bevat ongeldige waarde`);
  if (!Array.isArray(a.vingers) || a.vingers.length !== 6) f.push(`${p}: vingers moet 6 waarden hebben`);
  else if (!a.vingers.every((x) => isInt(x, 0, 4))) f.push(`${p}: vingers moeten 0-4 zijn`);
  if (Array.isArray(a.frets) && Array.isArray(a.vingers) && a.frets.length === 6) {
    a.frets.forEach((fret, i) => {
      const v = a.vingers[i];
      if ((fret === 'x' || fret === 0) && v !== 0) f.push(`${p}: snaar ${i + 1} is open/niet gespeeld maar heeft vinger ${v}`);
      if (typeof fret === 'number' && fret > 0 && v === 0) f.push(`${p}: snaar ${i + 1} heeft fret ${fret} maar geen vinger`);
    });
  }
  if (!isInt(a.basisfret, 1, 20)) f.push(`${p}: basisfret moet 1-20 zijn`);
  if (!isInt(a.moeilijkheid, 1, 5)) f.push(`${p}: moeilijkheid moet 1-5 zijn`);
  if (a.barre) {
    const b = a.barre;
    if (!isInt(b.fret, 1, 24) || !isInt(b.vanSnaar, 0, 5) || !isInt(b.totSnaar, 0, 5) || b.vanSnaar > b.totSnaar || !isInt(b.vinger, 1, 4)) {
      f.push(`${p}: barre is ongeldig`);
    }
  }
  return f;
}

export function valideerLiedje(l: Liedje, bekendeAkkoorden: Set<string>, bestandsnaam?: string): string[] {
  const f: string[] = [];
  const p = `liedje ${l.id ?? bestandsnaam ?? '?'}`;
  if (!isTekst(l.id) || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(l.id)) f.push(`${p}: id moet kebab-case zijn`);
  if (bestandsnaam && bestandsnaam !== `${l.id}.json`) f.push(`${p}: bestandsnaam moet ${l.id}.json zijn`);
  for (const veld of ['titel', 'artiest', 'toonsoort', 'slagpatroon'] as const) {
    if (!isTekst(l[veld])) f.push(`${p}: ${veld} ontbreekt`);
  }
  if (!isInt(l.capo, 0, 12)) f.push(`${p}: capo moet 0-12 zijn`);
  if (!isInt(l.bpm, 30, 260)) f.push(`${p}: bpm moet 30-260 zijn`);
  try {
    parseMaatsoort(l.maatsoort);
  } catch {
    f.push(`${p}: maatsoort "${l.maatsoort}" is ongeldig`);
  }
  try {
    const slagen = parseSlagpatroon(l.slagpatroon);
    const { tellen } = parseMaatsoort(l.maatsoort);
    if (slagen.length % tellen !== 0 && tellen % slagen.length !== 0) {
      f.push(`${p}: slagpatroon (${slagen.length} slagen) past niet in ${l.maatsoort}`);
    }
  } catch {
    f.push(`${p}: slagpatroon "${l.slagpatroon}" is ongeldig (gebruik D, U en -)`);
  }
  if (!['ai-gegenereerd', 'handmatig'].includes(l.bron)) f.push(`${p}: bron moet "ai-gegenereerd" of "handmatig" zijn`);
  if (typeof l.geverifieerd !== 'boolean') f.push(`${p}: geverifieerd moet true/false zijn`);
  if (!Array.isArray(l.notities)) f.push(`${p}: notities moet een lijst zijn`);
  if (!Array.isArray(l.secties) || l.secties.length === 0) f.push(`${p}: secties ontbreken`);
  else {
    const namen = new Set<string>();
    for (const s of l.secties) {
      if (!isTekst(s.naam)) f.push(`${p}: sectie zonder naam`);
      if (namen.has(s.naam)) f.push(`${p}: sectie "${s.naam}" staat er dubbel in`);
      namen.add(s.naam);
      if (!isInt(s.herhalingen, 1, 32)) f.push(`${p}: sectie "${s.naam}" herhalingen moet 1-32 zijn`);
      if (!Array.isArray(s.maten) || s.maten.length === 0) f.push(`${p}: sectie "${s.naam}" heeft geen maten`);
      else
        s.maten.forEach((m, i) => {
          if (!Array.isArray(m.akkoorden) || m.akkoorden.length < 1 || m.akkoorden.length > 4) {
            f.push(`${p}: sectie "${s.naam}" maat ${i + 1} moet 1-4 akkoorden hebben`);
          }
        });
    }
    if (!Array.isArray(l.volgorde) || l.volgorde.length === 0) f.push(`${p}: volgorde ontbreekt`);
    else for (const n of l.volgorde) if (!namen.has(n)) f.push(`${p}: volgorde noemt onbekende sectie "${n}"`);
    for (const a of gebruikteAkkoorden(l)) {
      let ok = true;
      try {
        ok = bekendeAkkoorden.has(normaliseer(a));
      } catch {
        ok = false;
      }
      if (!ok) f.push(`${p}: akkoord "${a}" staat niet in akkoorden.json`);
    }
  }
  if (l.origineleAkkoorden !== undefined && !Array.isArray(l.origineleAkkoorden)) {
    f.push(`${p}: origineleAkkoorden moet een lijst zijn`);
  }
  return f;
}

export function valideerOefening(o: Oefening): string[] {
  const f: string[] = [];
  const p = `oefening ${o.id ?? '?'}`;
  if (!isTekst(o.id)) f.push(`${p}: id ontbreekt`);
  if (!isTekst(o.naam)) f.push(`${p}: naam ontbreekt`);
  if (!isTekst(o.doel)) f.push(`${p}: doel ontbreekt`);
  if (!Array.isArray(o.stappen) || o.stappen.length === 0) f.push(`${p}: stappen ontbreken`);
  if (!isInt(o.standaardTempo, 30, 220)) f.push(`${p}: standaardTempo moet 30-220 zijn`);
  if (o.challenge && !['spider-ladder', 'one-minute-changes', 'wisselreeks'].includes(o.challenge)) {
    f.push(`${p}: onbekende challenge "${o.challenge}"`);
  }
  return f;
}

export function valideerAlles(akkoorden: Akkoord[], liedjes: { bestand: string; liedje: Liedje }[], oefeningen: Oefening[]): string[] {
  const fouten: string[] = [];
  const ids = new Set<string>();
  for (const a of akkoorden) {
    if (ids.has(a.id)) fouten.push(`akkoord-id "${a.id}" staat er dubbel in`);
    ids.add(a.id);
    fouten.push(...valideerAkkoord(a));
  }
  const namen = new Set<string>();
  for (const a of akkoorden) {
    try {
      namen.add(normaliseer(a.naam));
    } catch {
      /* al gemeld */
    }
  }
  for (const naam of new Set(akkoorden.map((a) => a.naam))) {
    const standaard = akkoorden.filter((a) => a.naam === naam && a.standaard).length;
    if (standaard > 1) fouten.push(`akkoord "${naam}" heeft meer dan één standaardvariant`);
  }
  const liedjeIds = new Set<string>();
  for (const { bestand, liedje } of liedjes) {
    if (liedjeIds.has(liedje.id)) fouten.push(`liedje-id "${liedje.id}" staat er dubbel in`);
    liedjeIds.add(liedje.id);
    fouten.push(...valideerLiedje(liedje, namen, bestand));
  }
  const oefIds = new Set<string>();
  for (const o of oefeningen) {
    if (oefIds.has(o.id)) fouten.push(`oefening-id "${o.id}" staat er dubbel in`);
    oefIds.add(o.id);
    fouten.push(...valideerOefening(o));
  }
  return fouten;
}
