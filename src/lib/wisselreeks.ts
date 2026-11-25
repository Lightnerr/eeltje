import { reeksSleutel } from './challenges'
import type { ChallengeResultaat } from './types'

// Tijden in ms van een monotone klok (performance.now()), net als bij one minute changes.

/** Elk akkoord een maat in 4/4. */
export const TELLEN_PER_AKKOORD = 4
export const WISSELREEKS_START_BPM = 60

export type WisselreeksStand =
  | { fase: 'wacht' }
  /** `begin` is het moment van starten; na één maat aftellen begint het lopen. */
  | { fase: 'aftellen'; begin: number; bpm: number }
  | { fase: 'lopen'; begin: number; bpm: number }
  | { fase: 'klaar'; seconden: number; bpm: number }
  /** Het scherm ging uit of het tabblad naar de achtergrond: hoe lang je volhield, weet de app dan niet. */
  | { fase: 'onderbroken' }

export type WisselreeksActie =
  | { soort: 'start'; nu: number; bpm: number }
  | { soort: 'tijd'; nu: number }
  /** Je bent eruit (of je stopt): tijdens het aftellen is dat afbreken. */
  | { soort: 'gestopt'; nu: number }
  /** De pagina raakte verborgen: afbreken, zonder resultaat. */
  | { soort: 'verborgen'; nu: number }
  | { soort: 'opnieuw' }

/** Eén maat, in ms. */
export function aftelDuur(bpm: number): number {
  return (TELLEN_PER_AKKOORD * 60_000) / bpm
}

function looptVanaf(stand: { begin: number; bpm: number }): number {
  return stand.begin + aftelDuur(stand.bpm)
}

function bijTijd(stand: WisselreeksStand, nu: number): WisselreeksStand {
  return stand.fase === 'aftellen' && nu >= looptVanaf(stand) ? { ...stand, fase: 'lopen' } : stand
}

export function wisselreeksVerloop(stand: WisselreeksStand, actie: WisselreeksActie): WisselreeksStand {
  switch (actie.soort) {
    case 'start':
      return stand.fase === 'wacht' ? { fase: 'aftellen', begin: actie.nu, bpm: actie.bpm } : stand
    case 'opnieuw':
      return { fase: 'wacht' }
    case 'tijd':
      return bijTijd(stand, actie.nu)
    case 'verborgen':
      return stand.fase === 'aftellen' || stand.fase === 'lopen' ? { fase: 'onderbroken' } : stand
    case 'gestopt': {
      const nu = bijTijd(stand, actie.nu)
      if (nu.fase === 'aftellen') return { fase: 'wacht' }
      if (nu.fase !== 'lopen') return nu
      return { fase: 'klaar', seconden: wisselreeksVolgehouden(nu, actie.nu), bpm: nu.bpm }
    }
  }
}

/** Hele seconden sinds het aftellen voorbij is. */
export function wisselreeksVolgehouden(stand: WisselreeksStand, nu: number): number {
  if (stand.fase === 'klaar') return stand.seconden
  if (stand.fase === 'wacht' || stand.fase === 'onderbroken') return 0
  return Math.max(0, Math.floor((nu - looptVanaf(stand)) / 1000))
}

/** Ms sinds het lopen begon; negatief tijdens het aftellen. */
export function wisselreeksVerstreken(stand: WisselreeksStand, nu: number): number {
  return stand.fase === 'aftellen' || stand.fase === 'lopen' ? nu - looptVanaf(stand) : 0
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

/** Waar je bent na `verstreken` ms. Tijdens het aftellen (negatief) staat het eerste akkoord klaar. */
export function wisselreeksPositie(aantal: number, bpm: number, verstreken: number): WisselreeksPositie {
  const tellen = Math.max(0, Math.floor((verstreken * bpm) / 60_000))
  const maat = Math.floor(tellen / TELLEN_PER_AKKOORD)
  return {
    akkoord: maat % aantal,
    volgende: (maat + 1) % aantal,
    tel: tellen % TELLEN_PER_AKKOORD,
    ronde: Math.floor(maat / aantal),
  }
}

/** Pas als je zei dat je eruit was, en alleen als je minstens een seconde volhield. */
export function wisselreeksResultaat(stand: WisselreeksStand, akkoorden: readonly string[]): Omit<ChallengeResultaat, 'datum'> | null {
  if (stand.fase !== 'klaar' || stand.seconden === 0) return null
  return { type: 'wisselreeks', sleutel: reeksSleutel(akkoorden), waarde: stand.seconden, bpm: stand.bpm }
}
