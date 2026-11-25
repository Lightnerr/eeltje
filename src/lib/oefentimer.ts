import type { Sessie } from './types'

// De oefentimer rekent met de klok van het apparaat (epoch-ms), niet met tikken: zo klopt hij ook als het scherm uit
// was, als je naar een andere pagina ging of als de app herlaadde. Hij wordt apart bewaard (zie storage.ts).

export interface Oefentimer {
  /** ISO-tijdstip van de eerste start: de start van de sessie. */
  start: string
  /** Geoefende ms van eerdere stukken, tot de laatste pauze. */
  opgeteld: number
  /** Epoch-ms sinds wanneer hij loopt; `null` = gepauzeerd. */
  looptSinds: number | null
}

/** Een timer die blijft lopen terwijl je wegloopt, telt niet door tot morgen. */
export const MAX_SESSIE_MS = 3 * 60 * 60 * 1000

export function verstrekenMs(t: Oefentimer | null, nu: Date): number {
  if (!t) return 0
  const lopend = t.looptSinds === null ? 0 : Math.max(0, nu.getTime() - t.looptSinds)
  return Math.min(MAX_SESSIE_MS, t.opgeteld + lopend)
}

/** Start of gaat door na een pauze. Loopt hij al, dan verandert er niets. */
export function startTimer(t: Oefentimer | null, nu: Date): Oefentimer {
  if (!t) return { start: nu.toISOString(), opgeteld: 0, looptSinds: nu.getTime() }
  return t.looptSinds === null ? { ...t, looptSinds: nu.getTime() } : t
}

export function pauzeerTimer(t: Oefentimer, nu: Date): Oefentimer {
  return t.looptSinds === null ? t : { ...t, opgeteld: verstrekenMs(t, nu), looptSinds: null }
}

/** De sessie die erbij komt, of `null` als er (afgerond) geen seconde geoefend is. */
export function stopTimer(t: Oefentimer | null, nu: Date): Sessie | null {
  const seconden = Math.round(verstrekenMs(t, nu) / 1000)
  return t && seconden > 0 ? { start: t.start, seconden } : null
}

/** Een timer uit de opslag, of `null` als hij er niet (geldig) is. */
export function leesTimer(x: unknown): Oefentimer | null {
  if (typeof x !== 'object' || x === null) return null
  const { start, opgeteld, looptSinds } = x as Record<string, unknown>
  const geldig =
    typeof start === 'string' &&
    !Number.isNaN(Date.parse(start)) &&
    typeof opgeteld === 'number' &&
    Number.isFinite(opgeteld) &&
    opgeteld >= 0 &&
    (looptSinds === null || (typeof looptSinds === 'number' && Number.isFinite(looptSinds)))
  return geldig ? { start, opgeteld, looptSinds } : null
}

function tweeCijfers(n: number): string {
  return String(n).padStart(2, '0')
}

/** "0:00", "12:05", "1:02:03". */
export function timerTekst(ms: number): string {
  const totaal = Math.floor(ms / 1000)
  const uren = Math.floor(totaal / 3600)
  const minuten = Math.floor((totaal % 3600) / 60)
  const seconden = totaal % 60
  return uren > 0 ? `${uren}:${tweeCijfers(minuten)}:${tweeCijfers(seconden)}` : `${minuten}:${tweeCijfers(seconden)}`
}
