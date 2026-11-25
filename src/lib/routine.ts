import { paarSleutel } from './challenges'
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
  return paarSleutel(a, b).split('-') as [string, string]
}

/** Elke wissel tussen twee verschillende akkoorden die in een liedje voorkomt, als `paarSleutel`. */
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
    titel: oefening.titel,
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
    uitleg: wisselUitleg(voortgang, a, b),
    minuten: MINUTEN.akkoordwissel,
    route: { pagina: 'one-minute-changes', a, b },
  }
}

function wisselUitleg(voortgang: Voortgang, a: string, b: string): string {
  const nieuw = [a, b].filter((n) => statusVan(voortgang, n) === 'nieuw')
  if (nieuw.length) {
    return `${nieuw.join(' en ')} ${nieuw.length === 1 ? 'is' : 'zijn'} nieuw voor je. Leer eerst de greep, wissel dan een minuut lang en tel hoe vaak het lukt.`
  }
  if (statusVan(voortgang, a) === 'kan ik' && statusVan(voortgang, b) === 'kan ik') {
    return 'Deze ken je al. Houd de wissel snel: een minuut lang, drie keer.'
  }
  return 'One minute changes: wissel een minuut lang en tel hoe vaak het lukt. Doe dat drie keer.'
}

function makkelijkste(akkoorden: readonly Akkoord[], behalve: readonly string[]): string | undefined {
  const kandidaten = akkoorden.filter((a) => a.standaard && !behalve.includes(a.naam))
  return [...kandidaten].sort((x, y) => x.moeilijkheid - y.moeilijkheid)[0]?.naam
}

/** Zoals `speelbaarheidsLabel`, maar met de namen erbij: in de routine is er ruimte, en "Mist er 2" zegt je niets. */
function ontbrekendLabel(ontbrekend: readonly string[]): string {
  if (ontbrekend.length === 1) return speelbaarheidsLabel(ontbrekend)
  return `Mist nog ${ontbrekend.slice(0, -1).join(', ')} en ${ontbrekend[ontbrekend.length - 1]}`
}

/**
 * Een liedje dat je (bijna) kunt: zo min mogelijk ontbrekende akkoorden, en dan liefst met een akkoord op "oefenen".
 * `erbij` zijn nieuwe akkoorden uit de wissel van vandaag: die tellen mee alsof je ze aan het oefenen bent, zodat het
 * liedje aansluit op wat je net leerde. Capo-suggesties tellen niet mee.
 */
function liedje(voortgang: Voortgang, inhoud: Inhoud, datum: string, erbij: readonly string[]): RoutineOnderdeel | null {
  const bekend = [...bekendeAkkoorden(voortgang), ...erbij]
  const oefenen = [...bekend.filter((n) => statusVan(voortgang, n) === 'oefenen'), ...erbij]
  const metOntbrekend = [...inhoud.liedjes]
    .sort((x, y) => x.id.localeCompare(y.id))
    .map((l) => ({ liedje: l, ontbrekend: ontbrekendeAkkoorden(l, bekend) }))
  if (!metOntbrekend.length) return null
  const minst = Math.min(...metOntbrekend.map((x) => x.ontbrekend.length))
  const bijna = metOntbrekend.filter((x) => x.ontbrekend.length === minst)
  const metOefenen = bijna.filter((x) => akkoordenVan(x.liedje).some((a) => oefenen.some((o) => zelfdeAkkoord(a, o))))
  const gekozen = kies(metOefenen.length ? metOefenen : bijna, datum, 'liedje')!
  const uitDeWissel = erbij.filter((n) => akkoordenVan(gekozen.liedje).some((a) => zelfdeAkkoord(a, n)))
  const metWissel = uitDeWissel.length ? `, met ${uitDeWissel.join(' en ')} uit de wissel erbij` : ''
  return {
    soort: 'liedje',
    titel: `Speel ${gekozen.liedje.titel}`,
    uitleg: gekozen.ontbrekend.length
      ? `${ontbrekendLabel(gekozen.ontbrekend)}${metWissel}. Speel mee wat je kunt, in een rustig tempo.`
      : `Kan je spelen${metWissel}. Speel hem mee in een rustig tempo.`,
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
  const wissel = akkoordwissel(voortgang, inhoud, datum)
  const erbij = wissel?.route.pagina === 'one-minute-changes' ? [wissel.route.a, wissel.route.b].filter((n): n is string => !!n && statusVan(voortgang, n) === 'nieuw') : []
  const onderdelen = [opwarmen(inhoud), wissel, liedje(voortgang, inhoud, datum, erbij)].filter((o): o is RoutineOnderdeel => o !== null)
  return { datum, onderdelen, minuten: onderdelen.reduce((s, o) => s + o.minuten, 0) }
}

/** Zoals de routine van vandaag in de opslag staat (`opslag.bewaarRoutine`), apart van de voortgang. */
export interface BewaardeRoutine {
  datum: string
  routine: Routine
}

const SOORTEN: readonly string[] = ['opwarmen', 'akkoordwissel', 'liedje']

function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x)
}

function verwijstNaarInhoud(route: unknown, inhoud: Inhoud): boolean {
  if (!isObject(route)) return false
  switch (route.pagina) {
    case 'oefening':
      return inhoud.oefeningen.some((o) => o.id === route.id)
    case 'liedje':
      return inhoud.liedjes.some((l) => l.id === route.id)
    case 'one-minute-changes':
      return [route.a, route.b].every((n) => inhoud.akkoorden.some((a) => a.naam === n))
    default:
      return false
  }
}

function isGeldigeRoutine(x: unknown, datum: string, inhoud: Inhoud): x is Routine {
  if (!isObject(x) || x.datum !== datum || typeof x.minuten !== 'number' || !Array.isArray(x.onderdelen)) return false
  return x.onderdelen.every(
    (o: unknown) =>
      isObject(o) &&
      SOORTEN.includes(o.soort as string) &&
      typeof o.titel === 'string' &&
      typeof o.uitleg === 'string' &&
      typeof o.minuten === 'number' &&
      verwijstNaarInhoud(o.route, inhoud),
  )
}

/**
 * De routine van vandaag ligt vast zodra hij gemaakt is, ook als je daarna een status wijzigt. `bewaard` komt rauw uit
 * de opslag: is hij van vandaag en verwijst hij nog naar bestaande inhoud, dan blijft hij; anders een nieuwe.
 */
export function routineVoorVandaag(bewaard: unknown, voortgang: Voortgang, inhoud: Inhoud, nu = new Date()): Routine {
  const datum = dagSleutel(nu)
  if (isObject(bewaard) && isGeldigeRoutine(bewaard.routine, datum, inhoud)) return bewaard.routine
  return maakRoutine(voortgang, inhoud, nu)
}
