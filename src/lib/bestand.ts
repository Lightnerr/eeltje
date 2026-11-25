import { dagSleutel } from './statistiek'
import type { Voortgang } from './types'
import { importeerVoortgang, statusVan } from './voortgang'

// Exporteren naar en importeren uit een bestand. De vorm van het bestand is `exporteerVoortgang`.

/** Jaren dagelijks oefenen is nog geen megabyte; wat veel groter is, is iets anders. */
export const MAX_BESTAND_TEKENS = 5_000_000

export function bestandsnaam(nu = new Date()): string {
  return `eeltje-voortgang-${dagSleutel(nu)}.json`
}

/**
 * Een geïmporteerd bestand als Voortgang. Gooit een `Error` met een Nederlandse melding als het leeg, te groot, geen
 * JSON of geen voortgang van Eeltje is; de huidige voortgang blijft dan heel, want die wordt pas daarna vervangen.
 */
export function leesBestand(tekst: string): Voortgang {
  if (tekst.length > MAX_BESTAND_TEKENS) throw new Error('Dit bestand is te groot voor een voortgang van Eeltje.')
  // trim() haalt ook de BOM weg die Kladblok soms vooraan zet.
  const schoon = tekst.trim()
  if (!schoon) throw new Error('Dit bestand is leeg.')
  return importeerVoortgang(schoon)
}

export interface Samenvatting {
  sessies: number
  /** Challenges met een resultaat, per paar, reeks of spider. */
  records: number
  /** Op "oefenen" of "kan ik". */
  akkoorden: number
}

export function samenvatting(v: Voortgang): Samenvatting {
  return {
    sessies: v.sessies.length,
    records: new Set(v.challenges.map((c) => `${c.type}|${c.sleutel}`)).size,
    akkoorden: Object.keys(v.akkoordStatus).filter((n) => statusVan(v, n) !== 'nieuw').length,
  }
}

function aantal(n: number, een: string, meer: string): string {
  return `${n} ${n === 1 ? een : meer}`
}

/** "19 sessies, 6 records en 7 akkoorden". */
export function samenvattingTekst(s: Samenvatting): string {
  return `${aantal(s.sessies, 'sessie', 'sessies')}, ${aantal(s.records, 'record', 'records')} en ${aantal(s.akkoorden, 'akkoord', 'akkoorden')}`
}
