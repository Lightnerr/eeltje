import { leesMaatsoort } from './muziek'
import type { Riff, Snaar } from './types'

/** Van lage E naar hoge e; de index is het snaarnummer elders in de app (`Akkoord.frets`). */
export const SNAREN: readonly Snaar[] = ['E', 'A', 'D', 'G', 'B', 'e']

/** Waar de riff begint als je hem opent: rustig, je verhoogt het zelf. */
export const RIFF_START_TEMPO = 60

export function stappenPerMaat(riff: Riff): number {
  return leesMaatsoort(riff.maatsoort).tellen * riff.onderverdeling
}

export function riffLengte(riff: Riff): number {
  return riff.maten * stappenPerMaat(riff)
}

export interface TabKolom {
  stap: number
  /** Valt op een tel (niet ertussen). */
  opTel: boolean
  /** Fret per snaar, hoge e bovenaan zoals in een tab; `null` = niet spelen. */
  frets: (number | null)[]
}

export interface TabMaat {
  kolommen: TabKolom[]
}

export function tabVan(riff: Riff): TabMaat[] {
  const perMaat = stappenPerMaat(riff)
  return Array.from({ length: riff.maten }, (_, maat) => ({
    kolommen: Array.from({ length: perMaat }, (_, i) => {
      const stap = maat * perMaat + i
      const frets: (number | null)[] = Array(SNAREN.length).fill(null)
      for (const n of riff.noten) if (n.stap === stap) frets[SNAREN.length - 1 - SNAREN.indexOf(n.snaar)] = n.fret
      return { stap, opTel: i % riff.onderverdeling === 0, frets }
    }),
  }))
}

export interface GeplandeNoot {
  /** 0 = lage E. */
  snaar: number
  fret: number
  /** Waar in de tel hij begint: 0 = op de tel, 0.5 = de "&". */
  deel: number
}

/**
 * De noten die op `tel` van `maat` beginnen. Maat 0 is aftellen; vanaf maat 1 loopt de riff, en na zijn laatste
 * maat begint hij weer vooraan.
 */
export function notenInTel(riff: Riff, maat: number, tel: number): GeplandeNoot[] {
  if (maat < 1) return []
  const eerste = ((maat - 1) % riff.maten) * stappenPerMaat(riff) + tel * riff.onderverdeling
  return riff.noten
    .filter((n) => n.stap >= eerste && n.stap < eerste + riff.onderverdeling)
    .map((n) => ({ snaar: SNAREN.indexOf(n.snaar), fret: n.fret, deel: (n.stap - eerste) / riff.onderverdeling }))
}

export type RiffPositie = { fase: 'aftellen'; nog: number } | { fase: 'spelen'; stap: number }

/** Wat het scherm toont bij `slag` (vanaf 0 binnen de maat, zoals `opSlag` van de metronoom) van `maat`. */
export function riffPositie(riff: Riff, maat: number, slag: number): RiffPositie {
  if (maat < 1) return { fase: 'aftellen', nog: leesMaatsoort(riff.maatsoort).tellen - Math.floor(slag / riff.onderverdeling) }
  return { fase: 'spelen', stap: ((maat - 1) % riff.maten) * stappenPerMaat(riff) + slag }
}
