import { reeksSleutel } from './challenges'
import type { ChallengeResultaat } from './types'

// De wisselreeks volgt de tellen van de metronoom zoals je ze hoort, niet de klok van de pagina: zo staat het
// nieuwe akkoord er precies op de 1, ook als de audio later begint of met vertraging klinkt (Bluetooth).
// Tijden (`nu`) zijn ms van een monotone klok (performance.now()) op het moment dat die tel klinkt of je tikt.

/** Elk akkoord een maat in 4/4. */
export const TELLEN_PER_AKKOORD = 4
export const WISSELREEKS_START_BPM = 60

export type WisselreeksStand =
  | { fase: 'wacht' }
  /** De eerste maat van de metronoom is aftellen; `tel` is de laatst gehoorde tel, `null` voor de eerste klik. */
  | { fase: 'aftellen'; bpm: number; tel: number | null }
  /** `start`: wanneer de eerste 1 na het aftellen klonk. `maat` telt vanaf 0, `tel` binnen de maat. */
  | { fase: 'lopen'; bpm: number; start: number; maat: number; tel: number }
  | { fase: 'klaar'; seconden: number; bpm: number }
  /** Het scherm ging uit of het tabblad naar de achtergrond: hoe lang je volhield, weet de app dan niet. */
  | { fase: 'onderbroken' }

export type WisselreeksActie =
  | { soort: 'start'; bpm: number }
  /** Een tel van de metronoom klinkt; `tel` is 0 op de 1. */
  | { soort: 'tel'; tel: number; nu: number }
  /** Je bent eruit (of je stopt): tijdens het aftellen is dat afbreken. */
  | { soort: 'gestopt'; nu: number }
  /** De pagina raakte verborgen: afbreken, zonder resultaat. */
  | { soort: 'verborgen'; nu: number }
  | { soort: 'opnieuw' }

export function wisselreeksVerloop(stand: WisselreeksStand, actie: WisselreeksActie): WisselreeksStand {
  switch (actie.soort) {
    case 'start':
      return stand.fase === 'wacht' ? { fase: 'aftellen', bpm: actie.bpm, tel: null } : stand
    case 'opnieuw':
      return { fase: 'wacht' }
    case 'verborgen':
      return stand.fase === 'aftellen' || stand.fase === 'lopen' ? { fase: 'onderbroken' } : stand
    case 'tel':
      if (stand.fase === 'aftellen') {
        const volgendeMaat = actie.tel === 0 && stand.tel !== null
        return volgendeMaat ? { fase: 'lopen', bpm: stand.bpm, start: actie.nu, maat: 0, tel: 0 } : { ...stand, tel: actie.tel }
      }
      if (stand.fase === 'lopen') return { ...stand, maat: actie.tel === 0 ? stand.maat + 1 : stand.maat, tel: actie.tel }
      return stand
    case 'gestopt':
      if (stand.fase === 'aftellen') return { fase: 'wacht' }
      if (stand.fase !== 'lopen') return stand
      return { fase: 'klaar', seconden: wisselreeksVolgehouden(stand, actie.nu), bpm: stand.bpm }
  }
}

/** Hele seconden sinds de eerste 1 na het aftellen. */
export function wisselreeksVolgehouden(stand: WisselreeksStand, nu: number): number {
  if (stand.fase === 'klaar') return stand.seconden
  if (stand.fase !== 'lopen') return 0
  return Math.max(0, Math.floor((nu - stand.start) / 1000))
}

export interface WisselreeksPositie {
  /** Index van het akkoord dat je nu speelt. */
  akkoord: number
  volgende: number
  /** Tel binnen de maat, vanaf 0. */
  tel: number
  /** Hoe vaak je de hele reeks al rond bent geweest. */
  ronde: number
}

/** Waar je bent in de reeks van `aantal` akkoorden. Vóór en tijdens het aftellen staat het eerste akkoord klaar. */
export function wisselreeksPositie(stand: WisselreeksStand, aantal: number): WisselreeksPositie {
  const maat = stand.fase === 'lopen' ? stand.maat : 0
  const tel = stand.fase === 'lopen' || stand.fase === 'aftellen' ? (stand.tel ?? 0) : 0
  return { akkoord: maat % aantal, volgende: (maat + 1) % aantal, tel, ronde: Math.floor(maat / aantal) }
}

/** Pas als je zei dat je eruit was, en alleen als je minstens een seconde volhield. */
export function wisselreeksResultaat(stand: WisselreeksStand, akkoorden: readonly string[]): Omit<ChallengeResultaat, 'datum'> | null {
  if (stand.fase !== 'klaar' || stand.seconden === 0) return null
  return { type: 'wisselreeks', sleutel: reeksSleutel(akkoorden), waarde: stand.seconden, bpm: stand.bpm }
}
