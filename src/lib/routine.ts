import type { Liedje, Voortgang } from './types';
import { besteCapoOptie, maakBekend } from './muziek';
import { record, dagSleutel } from './statistiek';
import { speelbareAkkoorden, statusVan } from './storage';

export interface Routine {
  spiderBpm: number;
  wissel: [string, string];
  liedje?: { id: string; ontbrekend: string[]; capo: number };
}

/** Deterministische pseudo-random op basis van de datum: dezelfde routine de hele dag. */
function dagZaad(datum: Date): number {
  let h = 2166136261;
  for (const c of dagSleutel(datum)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return Math.abs(h);
}

export function maakRoutine(
  v: Voortgang,
  liedjes: Liedje[],
  akkoorden: { naam: string; moeilijkheid: number }[],
  datum = new Date(),
): Routine {
  const zaad = dagZaad(datum);
  const spiderRecord = record(v.challenges, 'spider-ladder')?.waarde;
  const spiderBpm = spiderRecord ? Math.max(40, Math.round(spiderRecord * 0.8)) : 60;

  const uniek = [...new Map(akkoorden.map((a) => [a.naam, a])).values()];
  const oefenen = uniek.filter((a) => statusVan(v, a.naam) === 'oefenen').map((a) => a.naam);
  const kan = uniek.filter((a) => statusVan(v, a.naam) === 'kan ik').map((a) => a.naam);
  const nieuw = uniek
    .filter((a) => statusVan(v, a.naam) === 'nieuw')
    .sort((a, b) => a.moeilijkheid - b.moeilijkheid)
    .map((a) => a.naam);

  const pool = [...oefenen, ...kan, ...nieuw];
  let wissel: [string, string];
  if (oefenen.length >= 2) {
    const i = zaad % oefenen.length;
    const j = (i + 1 + (Math.floor(zaad / 7) % (oefenen.length - 1))) % oefenen.length;
    wissel = [oefenen[i], oefenen[j]];
  } else {
    const [a, b] = pool.filter((x, i, arr) => arr.indexOf(x) === i);
    wissel = [a ?? 'A', b ?? 'D'];
  }

  const bekend = maakBekend(speelbareAkkoorden(v));
  const kandidaten = liedjes
    .map((l) => {
      const o = besteCapoOptie(l, bekend);
      return { id: l.id, ontbrekend: o.ontbrekend, capo: o.capo };
    })
    .sort((a, b) => a.ontbrekend.length - b.ontbrekend.length);
  const minimaal = kandidaten[0]?.ontbrekend.length ?? 0;
  const besten = kandidaten.filter((k) => k.ontbrekend.length === minimaal && minimaal <= 1);
  const gekozen = besten.length ? besten[zaad % besten.length] : kandidaten[0];

  return { spiderBpm, wissel, liedje: gekozen };
}
