import { paarSleutel } from './challenges'
import type { ChallengeResultaat } from './types'

// Tijden in ms van een monotone klok (performance.now()). De fase volgt uit de echte tijd, niet uit het aantal
// keren dat een timer afging: een tabblad op de achtergrond krijgt zijn timer veel minder vaak.

export const AFTELLEN_MS = 3000
export const DUUR_MS = 60_000

export type OmcStand =
  | { fase: 'wacht' }
  /** `begin` is het moment van starten; het lopen begint `AFTELLEN_MS` later. */
  | { fase: 'aftellen'; begin: number }
  | { fase: 'lopen'; begin: number; wissels: number }
  | { fase: 'klaar'; wissels: number }
  /** Het scherm ging uit of het tabblad naar de achtergrond: wat je in die tijd deed, kan de app niet tellen. */
  | { fase: 'onderbroken' }

export type OmcActie =
  | { soort: 'start'; nu: number }
  | { soort: 'tik'; nu: number }
  | { soort: 'tijd'; nu: number }
  /** De pagina raakte verborgen: afbreken, zonder resultaat. */
  | { soort: 'verborgen'; nu: number }
  | { soort: 'opnieuw' }

function bijTijd(stand: OmcStand, nu: number): OmcStand {
  if (stand.fase === 'aftellen' && nu >= stand.begin + AFTELLEN_MS) return bijTijd({ fase: 'lopen', begin: stand.begin, wissels: 0 }, nu)
  if (stand.fase === 'lopen' && nu >= stand.begin + AFTELLEN_MS + DUUR_MS) return { fase: 'klaar', wissels: stand.wissels }
  return stand
}

export function omcVerloop(stand: OmcStand, actie: OmcActie): OmcStand {
  switch (actie.soort) {
    case 'start':
      return stand.fase === 'wacht' ? { fase: 'aftellen', begin: actie.nu } : stand
    case 'opnieuw':
      return { fase: 'wacht' }
    case 'tijd':
      return bijTijd(stand, actie.nu)
    case 'verborgen': {
      const nu = bijTijd(stand, actie.nu)
      return nu.fase === 'aftellen' || nu.fase === 'lopen' ? { fase: 'onderbroken' } : nu
    }
    case 'tik': {
      const nu = bijTijd(stand, actie.nu)
      return nu.fase === 'lopen' ? { ...nu, wissels: nu.wissels + 1 } : nu
    }
  }
}

/** Ms tot het einde van het aftellen of van de minuut; 0 in de andere fasen. */
export function omcResterend(stand: OmcStand, nu: number): number {
  if (stand.fase === 'aftellen') return Math.max(0, stand.begin + AFTELLEN_MS - nu)
  if (stand.fase === 'lopen') return Math.max(0, stand.begin + AFTELLEN_MS + DUUR_MS - nu)
  return 0
}

/** Pas als de minuut om is, en niet als je niets telde. */
export function omcResultaat(stand: OmcStand, a: string, b: string): Omit<ChallengeResultaat, 'datum'> | null {
  if (stand.fase !== 'klaar' || stand.wissels === 0) return null
  return { type: 'one-minute-changes', sleutel: paarSleutel(a, b), waarde: stand.wissels }
}

/** "1:00", "0:39": resterende ms als klok, naar boven afgerond op hele seconden. */
export function klokTekst(ms: number): string {
  const seconden = Math.ceil(Math.max(0, ms) / 1000)
  return `${Math.floor(seconden / 60)}:${String(seconden % 60).padStart(2, '0')}`
}
