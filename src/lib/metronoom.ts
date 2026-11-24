import { leesMaatsoort } from './muziek'
import type { Maatsoort } from './types'

export const MIN_BPM = 30
export const MAX_BPM = 220

/** Langer dan dit tussen twee tikken (ms) en tap tempo begint opnieuw. Ruim boven 2000 ms, zodat 30 bpm nog lukt. */
const TAP_PAUZE = 2500
const TAP_AFSTANDEN = 4
/**
 * Een tik zo kort na de vorige (ms) is een stuiter of toetsherhaling. Ruim onder de kortste tel (220 bpm = 273 ms), zodat
 * een wat vroege tik bij een hoog tempo blijft staan; een langzamere dubbeltik vangt de mediaan op.
 */
const TAP_MIN_AFSTAND = 150
const TAP_BEWAARD = 16

export function begrensBpm(bpm: number): number {
  if (!Number.isFinite(bpm)) return MIN_BPM
  return Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(bpm)))
}

/** `tel` telt vanaf 0; ook een doorlopende teller werkt. */
export function isAccent(tel: number, maatsoort: Maatsoort): boolean {
  return tel % leesMaatsoort(maatsoort).tellen === 0
}

/**
 * Tempo uit de tijden (ms) van de tikken, sinds de laatste lange pauze. De mediaan van de laatste afstanden, zodat
 * één gemiste of dubbele tik het tempo niet verpest.
 */
export function tapTempo(tikken: number[]): number | null {
  const reeks = bruikbareTikken(tikken)
  if (reeks.length < 2) return null
  const afstanden = reeks
    .slice(1)
    .map((t, i) => t - reeks[i])
    .sort((a, b) => a - b)
  const midden = afstanden.length / 2
  const mediaan = afstanden.length % 2 ? afstanden[Math.floor(midden)] : (afstanden[midden - 1] + afstanden[midden]) / 2
  return begrensBpm(60000 / mediaan)
}

/** Voegt een tik toe en houdt de lijst kort. Ook weggevallen tikken blijven staan: `tapTempo` vergelijkt met de vorige tik. */
export function voegTikToe(tikken: number[], tijd: number): number[] {
  return sindsPauze([...tikken, tijd]).slice(-TAP_BEWAARD)
}

function sindsPauze(tikken: number[]): number[] {
  let begin = 0
  for (let i = 1; i < tikken.length; i++) if (tikken[i] - tikken[i - 1] > TAP_PAUZE) begin = i
  return tikken.slice(begin)
}

/** Zonder stuiters en toetsherhaling: elke tik vergeleken met de tik ervoor, ook als die zelf wegviel. */
function bruikbareTikken(tikken: number[]): number[] {
  const reeks = sindsPauze(tikken)
  return reeks.filter((tik, i) => i === 0 || tik - reeks[i - 1] >= TAP_MIN_AFSTAND).slice(-(TAP_AFSTANDEN + 1))
}

/** Duur van één tel in seconden. In 6/8 is een tel een achtste. */
export function telDuur(bpm: number): number {
  return 60 / bpm
}

/**
 * Stand van de planner. Een slag is een onderverdeling van een tel (`onderverdeling` slagen per tel) en telt
 * vanaf 0 binnen de maat. Tijden zijn in seconden op de audioklok.
 */
export interface PlanStand {
  /** Tijd van de volgende slag die nog gepland moet worden. */
  volgende: number
  /** Die volgende slag. */
  slag: number
  bpm: number
  tellen: number
  onderverdeling: number
  /** Na een wissel van onderverdeling loopt de oude door tot de volgende tel. */
  wasOnderverdeling?: number
  /** Een nieuwe maatsoort begint op de volgende tel een nieuwe maat. */
  nieuweTellen?: number
}

export interface GeplandeStap {
  slag: number
  tel: number
  /** Valt deze slag op een tel (en klikt de metronoom)? */
  opTel: boolean
  /** De onderverdeling waarin `slag` geteld is. */
  onderverdeling: number
  /** Tellen van de maat waarin deze slag valt. */
  tellen: number
  tijd: number
}

/** Nieuwe onderverdeling, vanaf de volgende tel. */
export function wisselOnderverdeling(stand: PlanStand, onderverdeling: number): PlanStand {
  if (onderverdeling === stand.onderverdeling) return stand
  const was = stand.wasOnderverdeling ?? stand.onderverdeling
  const { wasOnderverdeling: _, ...rest } = stand
  return was === onderverdeling ? { ...rest, onderverdeling } : { ...rest, onderverdeling, wasOnderverdeling: was }
}

/** Nieuwe maatsoort: op de volgende tel begint een nieuwe maat, zodat de 1 nooit op een tussenslag valt. */
export function wisselMaatsoort(stand: PlanStand, tellen: number): PlanStand {
  return { ...stand, nieuweTellen: tellen }
}

export function beginStand(tijd: number, bpm = 120, tellen = 4, onderverdeling = 1): PlanStand {
  return { volgende: tijd, slag: 0, bpm, tellen, onderverdeling }
}

/**
 * Plant alle slagen vóór `nu + vooruit`. Elke volgende tijd komt uit de vorige geplande tijd, nooit uit `nu`, zodat
 * een timer die wat te laat komt geen drift geeft.
 */
export function planStappen(stand: PlanStand, nu: number, vooruit: number): { stappen: GeplandeStap[]; stand: PlanStand } {
  let s = stand
  // Bevroren timer (tabblad op de achtergrond, telefoon op slot): niet alles tegelijk inhalen.
  if (s.volgende < nu) s = { ...s, volgende: nu }
  const stappen: GeplandeStap[] = []
  while (s.volgende < nu + vooruit) {
    if (s.wasOnderverdeling !== undefined && s.slag % s.wasOnderverdeling === 0) {
      const { wasOnderverdeling, ...rest } = s
      s = { ...rest, slag: (s.slag / wasOnderverdeling) * s.onderverdeling }
    }
    const per = s.wasOnderverdeling ?? s.onderverdeling
    if (s.nieuweTellen !== undefined && s.slag % per === 0) {
      const { nieuweTellen, ...rest } = s
      s = { ...rest, tellen: nieuweTellen, slag: 0 }
    }
    stappen.push({ slag: s.slag, tel: Math.floor(s.slag / per), opTel: s.slag % per === 0, onderverdeling: per, tellen: s.tellen, tijd: s.volgende })
    s = { ...s, volgende: s.volgende + telDuur(s.bpm) / per, slag: (s.slag + 1) % (s.tellen * per) }
  }
  return { stappen, stand: s }
}
