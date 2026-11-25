import { SPIDER_SLEUTEL } from './challenges'
import { MAX_BPM, begrensBpm } from './metronoom'
import type { ChallengeResultaat } from './types'

export const SPIDER_START_BPM = 50
export const SPIDER_STAP = 5

export type SpiderStand =
  | { fase: 'wacht'; bpm: number }
  /** `hoogste`: het hoogste tempo dat lukte, `null` zolang er nog niets lukte. */
  | { fase: 'lopen'; startBpm: number; bpm: number; hoogste: number | null; rondes: number }
  | { fase: 'klaar'; startBpm: number; bpm: number; hoogste: number | null; rondes: number }

export type SpiderActie =
  | { soort: 'zetBpm'; bpm: number }
  | { soort: 'start' }
  | { soort: 'gelukt' }
  /** Lukte niet: dan stop je, en het hoogste tempo dat lukte telt. */
  | { soort: 'mislukt' }
  | { soort: 'opnieuw' }

export function spiderBegin(bpm = SPIDER_START_BPM): SpiderStand {
  return { fase: 'wacht', bpm: begrensBpm(bpm) }
}

export function spiderVerloop(stand: SpiderStand, actie: SpiderActie): SpiderStand {
  switch (actie.soort) {
    case 'zetBpm':
      return stand.fase === 'wacht' ? { fase: 'wacht', bpm: begrensBpm(actie.bpm) } : stand
    case 'start':
      return stand.fase === 'wacht' ? { fase: 'lopen', startBpm: stand.bpm, bpm: stand.bpm, hoogste: null, rondes: 0 } : stand
    case 'opnieuw':
      return stand.fase === 'wacht' ? stand : spiderBegin(stand.startBpm)
  }
  if (stand.fase !== 'lopen') return stand
  switch (actie.soort) {
    case 'gelukt': {
      const verder = { ...stand, hoogste: stand.bpm, rondes: stand.rondes + 1 }
      return stand.bpm >= MAX_BPM ? { ...verder, fase: 'klaar' } : { ...verder, bpm: begrensBpm(stand.bpm + SPIDER_STAP) }
    }
    case 'mislukt':
      return { ...stand, fase: 'klaar', rondes: stand.rondes + 1 }
  }
}

/** Het hoogste tempo dat lukte, als hij klaar is. Lukte er geen ronde, dan is er niets om op te slaan. */
export function spiderResultaat(stand: SpiderStand): Omit<ChallengeResultaat, 'datum'> | null {
  if (stand.fase !== 'klaar' || stand.hoogste === null) return null
  return { type: 'spider-ladder', sleutel: SPIDER_SLEUTEL, waarde: stand.hoogste }
}
