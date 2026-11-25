import { geschiedenis } from './challenges'
import type { ChallengeType, Sessie, Voortgang } from './types'

// Alles in lokale dagen: een sessie hoort bij de dag waarop hij begon, ook als hij over middernacht loopt.
// Dagen tellen we met new Date(j, m, d ± n), nooit met ± 24 uur, want rond zomer- en wintertijd is een dag 23 of 25 uur.

function tweeCijfers(n: number): string {
  return String(n).padStart(2, '0')
}

/** De lokale datum als `2026-11-24`. */
export function dagSleutel(d: Date): string {
  return `${d.getFullYear()}-${tweeCijfers(d.getMonth() + 1)}-${tweeCijfers(d.getDate())}`
}

function dagenErbij(d: Date, dagen: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + dagen)
}

/** De maandag (00:00 lokaal) van de week waarin `d` valt. */
function maandagVan(d: Date): Date {
  return dagenErbij(d, -((d.getDay() + 6) % 7))
}

/** Sessies die meetellen: met een geldige start, niet na `nu` en langer dan 0 seconden. */
function geldigeSessies(v: Voortgang, nu?: Date): { start: Date; seconden: number }[] {
  return v.sessies
    .map((s: Sessie) => ({ start: new Date(s.start), seconden: s.seconden }))
    .filter((s) => !Number.isNaN(s.start.getTime()) && s.seconden > 0 && (!nu || s.start.getTime() <= nu.getTime()))
}

function naarMinuten(seconden: number): number {
  return Math.round(seconden / 60)
}

/**
 * Het aantal dagen waarop je oefende, terugtellend vanaf vandaag. De streak straft niet: één losse dag zonder oefenen
 * breekt hem niet (maar telt ook niet mee), pas twee gemiste dagen achter elkaar. Vandaag telt pas als gemist als de
 * dag om is.
 */
export function streak(v: Voortgang, nu = new Date()): number {
  const dagen = new Set(geldigeSessies(v, nu).map((s) => dagSleutel(s.start)))
  let dag = dagen.has(dagSleutel(nu)) ? nu : dagenErbij(nu, -1)
  let aantal = 0
  let gemistAchterElkaar = 0
  while (gemistAchterElkaar < 2) {
    if (dagen.has(dagSleutel(dag))) {
      aantal++
      gemistAchterElkaar = 0
    } else {
      gemistAchterElkaar++
    }
    dag = dagenErbij(dag, -1)
  }
  return aantal
}

export function totaalMinuten(v: Voortgang, nu = new Date()): number {
  return naarMinuten(geldigeSessies(v, nu).reduce((som, s) => som + s.seconden, 0))
}

export function minutenVandaag(v: Voortgang, nu = new Date()): number {
  const vandaag = dagSleutel(nu)
  return naarMinuten(geldigeSessies(v, nu).filter((s) => dagSleutel(s.start) === vandaag).reduce((som, s) => som + s.seconden, 0))
}

export interface WeekMinuten {
  /** De maandag van de week, als `2026-11-23`. */
  start: string
  minuten: number
}

/** Geoefende minuten in de laatste `aantalWeken` weken (maandag t/m zondag), oudste eerst; de laatste is deze week. */
export function minutenPerWeek(v: Voortgang, nu = new Date(), aantalWeken = 8): WeekMinuten[] {
  const dezeWeek = maandagVan(nu)
  const weken = Array.from({ length: aantalWeken }, (_, i) => dagSleutel(dagenErbij(dezeWeek, -7 * (aantalWeken - 1 - i))))
  const seconden = new Map(weken.map((w) => [w, 0]))
  for (const s of geldigeSessies(v, nu)) {
    const week = dagSleutel(maandagVan(s.start))
    if (seconden.has(week)) seconden.set(week, seconden.get(week)! + s.seconden)
  }
  return weken.map((start) => ({ start, minuten: naarMinuten(seconden.get(start)!) }))
}

/** De paren, reeksen of `spider` waarvan je resultaten hebt, het laatst geoefende eerst. */
export function challengeSleutels(v: Voortgang, type: ChallengeType): string[] {
  return [...new Set(geschiedenis(v, type).reverse().map((c) => c.sleutel))]
}
