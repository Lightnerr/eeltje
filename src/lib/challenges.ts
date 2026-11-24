import type { ChallengeResultaat, ChallengeType, Voortgang } from './types'
import { statusVan } from './voortgang'

export const SPIDER_SLEUTEL = 'spider'

/** Alfabetisch, zodat A-D en D-A hetzelfde paar (en hetzelfde record) zijn. */
export function paarSleutel(a: string, b: string): string {
  return [a, b].sort().join('-')
}

/** In de volgorde van de reeks: G-C-D is een andere reeks dan D-C-G. */
export function reeksSleutel(akkoorden: readonly string[]): string {
  return akkoorden.join('-')
}

export function voegResultaatToe(v: Voortgang, resultaat: ChallengeResultaat): Voortgang {
  return { ...v, challenges: [...v.challenges, resultaat] }
}

function vanType(v: Voortgang, type: ChallengeType, sleutel?: string): ChallengeResultaat[] {
  return v.challenges.filter((c) => c.type === type && (sleutel === undefined || c.sleutel === sleutel))
}

/** Van oud naar nieuw. Zonder sleutel alle resultaten van het type. */
export function geschiedenis(v: Voortgang, type: ChallengeType, sleutel?: string): ChallengeResultaat[] {
  return vanType(v, type, sleutel).sort((x, y) => Date.parse(x.datum) - Date.parse(y.datum))
}

function beter(x: ChallengeResultaat, y: ChallengeResultaat): boolean {
  if (x.waarde !== y.waarde) return x.waarde > y.waarde
  if ((x.bpm ?? 0) !== (y.bpm ?? 0)) return (x.bpm ?? 0) > (y.bpm ?? 0)
  return Date.parse(x.datum) < Date.parse(y.datum)
}

/**
 * Het beste resultaat: de hoogste waarde, bij gelijke stand het hogere tempo en dan wie het eerst haalde.
 * Zonder sleutel het beste van het hele type. `null` als er nog niets is.
 */
export function record(v: Voortgang, type: ChallengeType, sleutel?: string): ChallengeResultaat | null {
  return vanType(v, type, sleutel).reduce<ChallengeResultaat | null>((best, c) => (best === null || beter(c, best) ? c : best), null)
}

export type Beoordeling = 'eerste' | 'nieuw-record' | 'evenaard' | 'onder-record'

export function beoordeel(waarde: number, vorig: ChallengeResultaat | null): Beoordeling {
  if (vorig === null) return 'eerste'
  if (waarde > vorig.waarde) return 'nieuw-record'
  return waarde === vorig.waarde ? 'evenaard' : 'onder-record'
}

export function duurTekst(seconden: number): string {
  const min = Math.floor(seconden / 60)
  const s = seconden % 60
  if (min === 0) return `${s} s`
  return s === 0 ? `${min} min` : `${min} min ${s} s`
}

export function resultaatTekst(r: Omit<ChallengeResultaat, 'datum'>): string {
  switch (r.type) {
    case 'one-minute-changes':
      return r.waarde === 1 ? '1 wissel' : `${r.waarde} wissels`
    case 'spider-ladder':
      return `${r.waarde} bpm`
    case 'wisselreeks':
      return r.bpm === undefined ? duurTekst(r.waarde) : `${duurTekst(r.waarde)} op ${r.bpm} bpm`
  }
}

/** Eerst wat je aan het oefenen bent, dan wat je kunt, dan de rest; binnen elke groep de volgorde van `namen`. */
export function standaardAkkoorden(v: Voortgang, namen: readonly string[], aantal: number): string[] {
  const met = (status: string) => namen.filter((n) => statusVan(v, n) === status)
  return [...met('oefenen'), ...met('kan ik'), ...met('nieuw')].slice(0, aantal)
}

/** Twee verschillende akkoorden die bestaan, anders `null`. */
export function geldigPaar(a: string | undefined, b: string | undefined, namen: readonly string[]): [string, string] | null {
  if (a === undefined || b === undefined || a === b || !namen.includes(a) || !namen.includes(b)) return null
  return [a, b]
}

/** Drie of vier bestaande akkoorden, zonder twee dezelfde na elkaar (ook niet van het laatste naar het eerste). */
export function geldigeReeks(akkoorden: readonly string[] | undefined, namen: readonly string[]): string[] | null {
  if (!akkoorden || akkoorden.length < 3 || akkoorden.length > 4) return null
  if (!akkoorden.every((a) => namen.includes(a))) return null
  if (akkoorden.some((a, i) => a === akkoorden[(i + 1) % akkoorden.length])) return null
  return [...akkoorden]
}
