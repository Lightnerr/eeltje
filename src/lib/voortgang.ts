import type { AkkoordStatus, ChallengeResultaat, ChallengeType, Sessie, Voortgang } from './types'

export const STATUSSEN: readonly AkkoordStatus[] = ['nieuw', 'oefenen', 'kan ik']
const CHALLENGES: readonly ChallengeType[] = ['one-minute-changes', 'spider-ladder', 'wisselreeks']
const GEEN_VOORTGANG = 'Dit is geen voortgang van Eeltje.'

export function nieuweVoortgang(): Voortgang {
  return {
    versie: 1,
    akkoordStatus: { A: 'oefenen', D: 'oefenen' },
    voorkeurVariant: {},
    challenges: [],
    sessies: [],
    favorieten: [],
    gecontroleerd: [],
  }
}

type Los = Record<string, unknown>

function isObject(x: unknown): x is Los {
  return typeof x === 'object' && x !== null && !Array.isArray(x)
}

function isTijdstip(x: unknown): x is string {
  return typeof x === 'string' && !Number.isNaN(Date.parse(x))
}

function isGetal(x: unknown): x is number {
  return typeof x === 'number' && Number.isFinite(x) && x >= 0
}

function filterRecord<T>(x: unknown, geldig: (w: unknown) => w is T): Record<string, T> {
  const resultaat: Record<string, T> = {}
  if (isObject(x)) for (const [k, w] of Object.entries(x)) if (geldig(w)) resultaat[k] = w
  return resultaat
}

function filterLijst<T>(x: unknown, geldig: (w: unknown) => w is T): T[] {
  return Array.isArray(x) ? x.filter(geldig) : []
}

function isStatus(x: unknown): x is AkkoordStatus {
  return STATUSSEN.includes(x as AkkoordStatus)
}

function isTekst(x: unknown): x is string {
  return typeof x === 'string'
}

function isResultaat(x: unknown): x is ChallengeResultaat {
  return (
    isObject(x) &&
    CHALLENGES.includes(x.type as ChallengeType) &&
    typeof x.sleutel === 'string' &&
    isGetal(x.waarde) &&
    (x.bpm === undefined || isGetal(x.bpm)) &&
    isTijdstip(x.datum)
  )
}

function isSessie(x: unknown): x is Sessie {
  return isObject(x) && isTijdstip(x.start) && isGetal(x.seconden)
}

/** Twee tabbladen konden dezelfde sessie twee keer bewaren; een sessie is uniek door zijn start. De eerste blijft. */
function zonderDubbeleSessies(sessies: Sessie[]): Sessie[] {
  const gezien = new Set<string>()
  return sessies.filter((s) => !gezien.has(s.start) && gezien.add(s.start))
}

function alsResultaat(r: ChallengeResultaat): ChallengeResultaat {
  const { type, sleutel, waarde, bpm, datum } = r
  return bpm === undefined ? { type, sleutel, waarde, datum } : { type, sleutel, waarde, bpm, datum }
}

/**
 * Maakt van wat er in de opslag of een exportbestand staat een geldige Voortgang. Ontbrekende velden worden
 * aangevuld en ongeldige items weggegooid. Gooit als het geen voortgang van Eeltje is.
 */
export function normaliseerVoortgang(data: unknown): Voortgang {
  if (!isObject(data) || typeof data.versie !== 'number') throw new Error(GEEN_VOORTGANG)
  if (data.versie > 1) {
    throw new Error(`Deze voortgang komt uit een nieuwere versie van Eeltje (versie ${data.versie}). Werk de app bij en probeer het opnieuw.`)
  }
  if (data.versie !== 1) throw new Error(GEEN_VOORTGANG)
  const nieuw = nieuweVoortgang()
  return {
    versie: 1,
    akkoordStatus: data.akkoordStatus === undefined ? nieuw.akkoordStatus : filterRecord(data.akkoordStatus, isStatus),
    voorkeurVariant: filterRecord(data.voorkeurVariant, isTekst),
    challenges: filterLijst(data.challenges, isResultaat).map(alsResultaat),
    sessies: zonderDubbeleSessies(filterLijst(data.sessies, isSessie).map(({ start, seconden }) => ({ start, seconden }))),
    favorieten: [...new Set(filterLijst(data.favorieten, isTekst))],
    gecontroleerd: [...new Set(filterLijst(data.gecontroleerd, isTekst))],
  }
}

export function exporteerVoortgang(v: Voortgang): string {
  return JSON.stringify(v, null, 2)
}

export function importeerVoortgang(tekst: string): Voortgang {
  let data: unknown
  try {
    data = JSON.parse(tekst)
  } catch {
    throw new Error('Dit bestand kan ik niet lezen: het is geen JSON.')
  }
  return normaliseerVoortgang(data)
}

export function statusVan(v: Voortgang, naam: string): AkkoordStatus {
  return v.akkoordStatus[naam] ?? 'nieuw'
}

/** Op "oefenen" of "kan ik". */
export function bekendeAkkoorden(v: Voortgang): string[] {
  return Object.keys(v.akkoordStatus).filter((naam) => statusVan(v, naam) !== 'nieuw')
}

export function zetStatus(v: Voortgang, naam: string, status: AkkoordStatus): Voortgang {
  const akkoordStatus = { ...v.akkoordStatus }
  if (status === 'nieuw') delete akkoordStatus[naam]
  else akkoordStatus[naam] = status
  return { ...v, akkoordStatus }
}

export function zetVoorkeurVariant(v: Voortgang, naam: string, variantnaam: string): Voortgang {
  return { ...v, voorkeurVariant: { ...v.voorkeurVariant, [naam]: variantnaam } }
}

export function wisselFavoriet(v: Voortgang, id: string): Voortgang {
  const favorieten = v.favorieten.includes(id) ? v.favorieten.filter((f) => f !== id) : [...v.favorieten, id]
  return { ...v, favorieten }
}

export function zetGecontroleerd(v: Voortgang, id: string, gecontroleerd = true): Voortgang {
  const zonder = v.gecontroleerd.filter((g) => g !== id)
  return { ...v, gecontroleerd: gecontroleerd ? [...zonder, id] : zonder }
}

export function voegSessieToe(v: Voortgang, sessie: Sessie): Voortgang {
  if (v.sessies.some((s) => s.start === sessie.start)) return v
  return { ...v, sessies: [...v.sessies, sessie] }
}
