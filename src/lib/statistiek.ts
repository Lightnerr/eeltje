import type { AkkoordStatus, ChallengeResultaat, ChallengeType, Sessie } from './types';

/** Lokale kalenderdag als "YYYY-MM-DD". */
export function dagSleutel(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function vorigeDag(d: Date): Date {
  const n = new Date(d);
  n.setDate(n.getDate() - 1);
  return n;
}

/** Aantal dagen op rij geoefend. Telt door als je vandaag nog niet hebt geoefend maar gisteren wel. */
export function streak(sessies: Sessie[], nu = new Date()): number {
  const dagen = new Set(sessies.map((s) => dagSleutel(new Date(s.datum))));
  let dag = new Date(nu);
  if (!dagen.has(dagSleutel(dag))) dag = vorigeDag(dag);
  let teller = 0;
  while (dagen.has(dagSleutel(dag))) {
    teller++;
    dag = vorigeDag(dag);
  }
  return teller;
}

export function totaalMinuten(sessies: Sessie[]): number {
  return Math.round(sessies.reduce((t, s) => t + s.duurSec, 0) / 60);
}

export function minutenVandaag(sessies: Sessie[], nu = new Date()): number {
  const vandaag = dagSleutel(nu);
  return Math.round(sessies.filter((s) => dagSleutel(new Date(s.datum)) === vandaag).reduce((t, s) => t + s.duurSec, 0) / 60);
}

/** Maandag van de week waar `d` in valt. */
export function weekStart(d: Date): Date {
  const n = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dagVanWeek = (n.getDay() + 6) % 7;
  n.setDate(n.getDate() - dagVanWeek);
  return n;
}

/** Minuten per week voor de laatste `aantal` weken, oudste eerst. */
export function minutenPerWeek(sessies: Sessie[], aantal = 8, nu = new Date()): { week: Date; minuten: number }[] {
  const deze = weekStart(nu);
  const weken = Array.from({ length: aantal }, (_, i) => {
    const w = new Date(deze);
    w.setDate(w.getDate() - 7 * (aantal - 1 - i));
    return { week: w, sec: 0 };
  });
  for (const s of sessies) {
    const ws = weekStart(new Date(s.datum)).getTime();
    const w = weken.find((x) => x.week.getTime() === ws);
    if (w) w.sec += s.duurSec;
  }
  return weken.map((w) => ({ week: w.week, minuten: Math.round(w.sec / 60) }));
}

export function resultatenVan(challenges: ChallengeResultaat[], type: ChallengeType, sleutel?: string): ChallengeResultaat[] {
  return challenges
    .filter((c) => c.type === type && (sleutel === undefined || c.sleutel === sleutel))
    .sort((a, b) => a.datum.localeCompare(b.datum));
}

export function record(challenges: ChallengeResultaat[], type: ChallengeType, sleutel?: string): ChallengeResultaat | undefined {
  let beste: ChallengeResultaat | undefined;
  for (const c of resultatenVan(challenges, type, sleutel)) if (!beste || c.waarde > beste.waarde) beste = c;
  return beste;
}

/** Sleutel voor een akkoordpaar die niet afhangt van de volgorde: A-D is hetzelfde als D-A. */
export function paarSleutel(a: string, b: string): string {
  return [a, b].sort((x, y) => x.localeCompare(y)).join('-');
}

export function statusTelling(namen: string[], status: (n: string) => AkkoordStatus): Record<AkkoordStatus, number> {
  const t: Record<AkkoordStatus, number> = { nieuw: 0, oefenen: 0, 'kan ik': 0 };
  for (const n of namen) t[status(n)]++;
  return t;
}

export function kopieerTekst(namen: string[], status: (n: string) => AkkoordStatus): string {
  const kan = namen.filter((n) => status(n) === 'kan ik');
  const oefen = namen.filter((n) => status(n) === 'oefenen');
  const lijst = (l: string[]) => (l.length ? l.join(', ') : 'nog geen');
  return `Akkoorden die ik kan: ${lijst(kan)}. Aan het oefenen: ${lijst(oefen)}.`;
}
