export type Route =
  | { pagina: 'vandaag' }
  | { pagina: 'akkoorden' }
  | { pagina: 'akkoord'; naam: string; variant?: string }
  | { pagina: 'liedjes' }
  | { pagina: 'liedje'; id: string }
  | { pagina: 'meespelen'; id: string }
  | { pagina: 'oefenen' }
  | { pagina: 'metronoom' }
  | { pagina: 'slagpatroon' }
  | { pagina: 'oefening'; id: string }
  | { pagina: 'riff'; id: string }
  | { pagina: 'one-minute-changes'; a?: string; b?: string }
  | { pagina: 'spider-ladder'; bpm?: number }
  | { pagina: 'wisselreeks'; akkoorden?: string[]; bpm?: number }
  | { pagina: 'voortgang' }
  | { pagina: 'niet-gevonden' }

export type Pagina = Route['pagina']

/** De gegevens van een route zonder `pagina`; de props van de bijbehorende pagina. */
export type RouteGegevens<P extends Pagina> = Omit<Extract<Route, { pagina: P }>, 'pagina'>

export type Tab = 'vandaag' | 'akkoorden' | 'liedjes' | 'oefenen' | 'voortgang'

const NIET_GEVONDEN: Route = { pagina: 'niet-gevonden' }

function leesBpm(tekst: string | undefined): number | undefined {
  if (!tekst || !/^\d+$/.test(tekst)) return undefined
  const bpm = Number(tekst)
  return bpm > 0 ? bpm : undefined
}

function leesQuery(query: string): Record<string, string> {
  const resultaat: Record<string, string> = {}
  for (const deel of query.split('&')) {
    if (!deel) continue
    const [sleutel, ...rest] = deel.split('=')
    resultaat[decodeURIComponent(sleutel)] = rest.join('=')
  }
  return resultaat
}

function metAlleenGezet<T extends object>(route: T): T {
  return Object.fromEntries(Object.entries(route).filter(([, w]) => w !== undefined && w !== '')) as T
}

/** Leest `#/liedjes/wonderwall` en dergelijke. Leeg of `#/` is Vandaag; iets onbekends is niet-gevonden. */
export function leesRoute(hash: string): Route {
  try {
    return leesRouteOnveilig(hash)
  } catch {
    return NIET_GEVONDEN
  }
}

function leesRouteOnveilig(hash: string): Route {
  const [pad, query = ''] = hash.replace(/^#/, '').split('?')
  const delen = pad.split('/').filter(Boolean).map(decodeURIComponent)
  const q = leesQuery(query)
  const waarde = (sleutel: string) => (q[sleutel] === undefined ? undefined : decodeURIComponent(q[sleutel]))
  const [eerste, tweede, derde] = delen

  if (delen.length === 0) return { pagina: 'vandaag' }
  if (delen.length === 1) {
    if (eerste === 'vandaag' || eerste === 'akkoorden' || eerste === 'liedjes' || eerste === 'oefenen' || eerste === 'voortgang') {
      return { pagina: eerste }
    }
    return NIET_GEVONDEN
  }
  if (eerste === 'akkoorden' && delen.length === 2) return metAlleenGezet({ pagina: 'akkoord', naam: tweede, variant: waarde('variant') })
  if (eerste === 'liedjes' && delen.length === 2) return { pagina: 'liedje', id: tweede }
  if (eerste === 'liedjes' && delen.length === 3 && derde === 'meespelen') return { pagina: 'meespelen', id: tweede }
  if (eerste !== 'oefenen') return NIET_GEVONDEN
  if (delen.length === 3) {
    if (tweede === 'oefeningen') return { pagina: 'oefening', id: derde }
    if (tweede === 'riffs') return { pagina: 'riff', id: derde }
    return NIET_GEVONDEN
  }
  switch (tweede) {
    case 'metronoom':
    case 'slagpatroon':
      return { pagina: tweede }
    case 'one-minute-changes':
      return metAlleenGezet({ pagina: tweede, a: waarde('a'), b: waarde('b') })
    case 'spider-ladder':
      return metAlleenGezet({ pagina: tweede, bpm: leesBpm(q.bpm) })
    case 'wisselreeks': {
      const akkoorden = q.akkoorden ? q.akkoorden.split(',').filter(Boolean).map(decodeURIComponent) : []
      return metAlleenGezet({ pagina: tweede, akkoorden: akkoorden.length ? akkoorden : undefined, bpm: leesBpm(q.bpm) })
    }
    default:
      return NIET_GEVONDEN
  }
}

function query(waarden: Record<string, string | number | undefined>): string {
  const delen = Object.entries(waarden)
    .filter(([, w]) => w !== undefined && w !== '')
    .map(([k, w]) => `${k}=${typeof w === 'number' ? w : encodeURIComponent(w as string)}`)
  return delen.length ? '?' + delen.join('&') : ''
}

const e = encodeURIComponent

export function naarHash(route: Route): string {
  switch (route.pagina) {
    case 'akkoord':
      return `#/akkoorden/${e(route.naam)}${query({ variant: route.variant })}`
    case 'liedje':
      return `#/liedjes/${e(route.id)}`
    case 'meespelen':
      return `#/liedjes/${e(route.id)}/meespelen`
    case 'metronoom':
    case 'slagpatroon':
      return `#/oefenen/${route.pagina}`
    case 'oefening':
      return `#/oefenen/oefeningen/${e(route.id)}`
    case 'riff':
      return `#/oefenen/riffs/${e(route.id)}`
    case 'one-minute-changes':
      return `#/oefenen/one-minute-changes${query({ a: route.a, b: route.b })}`
    case 'spider-ladder':
      return `#/oefenen/spider-ladder${query({ bpm: route.bpm })}`
    case 'wisselreeks': {
      const akkoorden = route.akkoorden?.length ? route.akkoorden.map(e).join(',') : undefined
      const bpm = route.bpm === undefined ? '' : `bpm=${route.bpm}`
      const delen = [akkoorden && `akkoorden=${akkoorden}`, bpm].filter(Boolean)
      return `#/oefenen/wisselreeks${delen.length ? '?' + delen.join('&') : ''}`
    }
    default:
      return `#/${route.pagina}`
  }
}

/** Het tabblad dat bij een route oplicht; `null` als geen enkel tabblad past. */
export function tabVan(route: Route): Tab | null {
  switch (route.pagina) {
    case 'vandaag':
    case 'akkoorden':
    case 'liedjes':
    case 'oefenen':
    case 'voortgang':
      return route.pagina
    case 'akkoord':
      return 'akkoorden'
    case 'liedje':
    case 'meespelen':
      return 'liedjes'
    case 'metronoom':
    case 'slagpatroon':
    case 'oefening':
    case 'riff':
    case 'one-minute-changes':
    case 'spider-ladder':
    case 'wisselreeks':
      return 'oefenen'
    case 'niet-gevonden':
      return null
  }
}
