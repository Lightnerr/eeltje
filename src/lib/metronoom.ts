import { leesMaatsoort } from './muziek'
import type { Maatsoort } from './types'

export const MIN_BPM = 30
export const MAX_BPM = 220

/** Langer dan dit tussen twee tikken (ms) en tap tempo begint opnieuw. Ruim boven 2000 ms, zodat 30 bpm nog lukt. */
const TAP_PAUZE = 2500
const TAP_AFSTANDEN = 4

export function begrensBpm(bpm: number): number {
  if (!Number.isFinite(bpm)) return MIN_BPM
  return Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(bpm)))
}

/** `tel` telt vanaf 0; ook een doorlopende teller werkt. */
export function isAccent(tel: number, maatsoort: Maatsoort): boolean {
  return tel % leesMaatsoort(maatsoort).tellen === 0
}

/** Tempo uit de tijden (ms) van de tikken: het gemiddelde van de laatste afstanden sinds de laatste lange pauze. */
export function tapTempo(tikken: number[]): number | null {
  const reeks = sindsPauze(tikken).slice(-(TAP_AFSTANDEN + 1))
  if (reeks.length < 2) return null
  const gemiddeld = (reeks[reeks.length - 1] - reeks[0]) / (reeks.length - 1)
  return begrensBpm(60000 / gemiddeld)
}

/** Voegt een tik toe en houdt alleen wat `tapTempo` nodig heeft. */
export function voegTikToe(tikken: number[], tijd: number): number[] {
  return sindsPauze([...tikken, tijd]).slice(-(TAP_AFSTANDEN + 1))
}

function sindsPauze(tikken: number[]): number[] {
  let begin = 0
  for (let i = 1; i < tikken.length; i++) if (tikken[i] - tikken[i - 1] > TAP_PAUZE) begin = i
  return tikken.slice(begin)
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
}

export interface GeplandeStap {
  slag: number
  tel: number
  /** Valt deze slag op een tel (en klikt de metronoom)? */
  opTel: boolean
  tijd: number
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
      s = { ...s, slag: (s.slag / s.wasOnderverdeling) * s.onderverdeling, wasOnderverdeling: undefined }
    }
    const per = s.wasOnderverdeling ?? s.onderverdeling
    stappen.push({ slag: s.slag, tel: Math.floor(s.slag / per), opTel: s.slag % per === 0, tijd: s.volgende })
    s = { ...s, volgende: s.volgende + telDuur(s.bpm) / per, slag: (s.slag + 1) % (s.tellen * per) }
  }
  return { stappen, stand: s }
}
