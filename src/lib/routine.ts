import { akkoordenVan, leeradvies, ontbrekendeAkkoorden, speelbaarheidsLabel, speelVolgorde, zelfdeAkkoord } from './muziek'
import type { Route } from './route'
import { dagSleutel } from './statistiek'
import type { Akkoord, Liedje, Oefening, Voortgang } from './types'
import { bekendeAkkoorden, statusVan } from './voortgang'

export interface Inhoud {
  akkoorden: readonly Akkoord[]
  liedjes: readonly Liedje[]
  oefeningen: readonly Oefening[]
}

export type RoutineSoort = 'opwarmen' | 'akkoordwissel' | 'liedje'

export interface RoutineOnderdeel {
  soort: RoutineSoort
  titel: string
  uitleg: string
  minuten: number
  route: Route
}

export interface Routine {
  /** De dag waarvoor de routine geldt, als `2026-11-24`. */
  datum: string
  onderdelen: RoutineOnderdeel[]
  minuten: number
}

const MINUTEN: Record<RoutineSoort, number> = { opwarmen: 3, akkoordwissel: 3, liedje: 6 }

/** FNV-1a: een vast getal per tekst, zodat dezelfde dag dezelfde keuze geeft zonder `Math.random`. */
function hash(tekst: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < tekst.length; i++) {
    h ^= tekst.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

function kies<T>(lijst: readonly T[], datum: string, onderdeel: RoutineSoort): T | undefined {
  return lijst.length ? lijst[hash(`${datum}:${onderdeel}`) % lijst.length] : undefined
}

function paar(a: string, b: string): [string, string] {
  return a.localeCompare(b) <= 0 ? [a, b] : [b, a]
}

/** Elke wissel tussen twee verschillende akkoorden die in een liedje voorkomt, als `A-D` (alfabetisch). */
function wisselsInLiedjes(liedjes: readonly Liedje[]): Set<string> {
  const wissels = new Set<string>()
  for (const liedje of liedjes) {
    const reeks = speelVolgorde(liedje).flatMap((m) => m.akkoorden)
    for (let i = 1; i < reeks.length; i++) if (reeks[i] !== reeks[i - 1]) wissels.add(paar(reeks[i - 1], reeks[i]).join('-'))
  }
  return wissels
}

function opwarmen(inhoud: Inhoud): RoutineOnderdeel | null {
  const oefening = inhoud.oefeningen.find((o) => o.id === 'spider') ?? inhoud.oefeningen[0]
  if (!oefening) return null
  return {
    soort: 'opwarmen',
    titel: `Opwarmen: ${oefening.titel.toLowerCase()}`,
    uitleg: oefening.doel,
    minuten: MINUTEN.opwarmen,
    route: { pagina: 'oefening', id: oefening.id },
  }
}

/**
 * Twee akkoorden om te wisselen. Minstens één staat op "oefenen" (of, als niets op oefenen staat, op "kan ik"); bij
 * voorkeur een wissel die echt in een liedje zit. Ken je er minder dan twee, dan komt het leeradvies erbij.
 */
function akkoordwissel(voortgang: Voortgang, inhoud: Inhoud, datum: string): RoutineOnderdeel | null {
  const namen = [...new Set(inhoud.akkoorden.map((a) => a.naam))]
  const oefenen = namen.filter((n) => statusVan(voortgang, n) === 'oefenen')
  const kanIk = namen.filter((n) => statusVan(voortgang, n) === 'kan ik')
  const bekend = [...oefenen, ...kanIk]
  while (bekend.length < 2) {
    const volgende = leeradvies(inhoud.liedjes, bekend)?.akkoord ?? makkelijkste(inhoud.akkoorden, bekend)
    if (!volgende) return null
    bekend.push(volgende)
  }
  const basis = oefenen.length ? oefenen : bekend
  const paren = new Map<string, [string, string]>()
  for (const a of basis) for (const b of bekend) if (a !== b) paren.set(paar(a, b).join('-'), paar(a, b))
  const wissels = wisselsInLiedjes(inhoud.liedjes)
  const inLiedje = [...paren.keys()].filter((k) => wissels.has(k))
  const sleutels = (inLiedje.length ? inLiedje : [...paren.keys()]).sort()
  const [a, b] = paren.get(kies(sleutels, datum, 'akkoordwissel')!)!
  return {
    soort: 'akkoordwissel',
    titel: `Wissel ${a} en ${b}`,
    uitleg: oefenen.length
      ? 'One minute changes: wissel een minuut lang en tel hoe vaak het lukt. Doe dat drie keer.'
      : 'Deze ken je al. Houd de wissel snel: een minuut lang, drie keer.',
    minuten: MINUTEN.akkoordwissel,
    route: { pagina: 'one-minute-changes', a, b },
  }
}

function makkelijkste(akkoorden: readonly Akkoord[], behalve: readonly string[]): string | undefined {
  const kandidaten = akkoorden.filter((a) => a.standaard && !behalve.includes(a.naam))
  return [...kandidaten].sort((x, y) => x.moeilijkheid - y.moeilijkheid)[0]?.naam
}

/** Een liedje dat je (bijna) kunt: zo min mogelijk ontbrekende akkoorden, en dan liefst met een akkoord op "oefenen". */
function liedje(voortgang: Voortgang, inhoud: Inhoud, datum: string): RoutineOnderdeel | null {
  const bekend = bekendeAkkoorden(voortgang)
  const oefenen = bekend.filter((n) => statusVan(voortgang, n) === 'oefenen')
  const metOntbrekend = [...inhoud.liedjes]
    .sort((x, y) => x.id.localeCompare(y.id))
    .map((l) => ({ liedje: l, ontbrekend: ontbrekendeAkkoorden(l, bekend) }))
  if (!metOntbrekend.length) return null
  const minst = Math.min(...metOntbrekend.map((x) => x.ontbrekend.length))
  const bijna = metOntbrekend.filter((x) => x.ontbrekend.length === minst)
  const metOefenen = bijna.filter((x) => akkoordenVan(x.liedje).some((a) => oefenen.some((o) => zelfdeAkkoord(a, o))))
  const gekozen = kies(metOefenen.length ? metOefenen : bijna, datum, 'liedje')!
  return {
    soort: 'liedje',
    titel: `Speel ${gekozen.liedje.titel}`,
    uitleg: gekozen.ontbrekend.length
      ? `${speelbaarheidsLabel(gekozen.ontbrekend)}. Speel mee wat je kunt, in een rustig tempo.`
      : 'Kan je spelen. Speel hem mee in een rustig tempo.',
    minuten: MINUTEN.liedje,
    route: { pagina: 'liedje', id: gekozen.liedje.id },
  }
}

/**
 * De dagroutine: opwarmen, een akkoordwissel en een liedje, samen 10 tot 15 minuten. Hangt alleen af van de
 * akkoordstatussen, de inhoud en de datum, zodat hij de hele dag hetzelfde blijft (sessies en challenges tellen niet mee).
 */
export function maakRoutine(voortgang: Voortgang, inhoud: Inhoud, nu = new Date()): Routine {
  const datum = dagSleutel(nu)
  const onderdelen = [opwarmen(inhoud), akkoordwissel(voortgang, inhoud, datum), liedje(voortgang, inhoud, datum)].filter(
    (o): o is RoutineOnderdeel => o !== null,
  )
  return { datum, onderdelen, minuten: onderdelen.reduce((s, o) => s + o.minuten, 0) }
}
