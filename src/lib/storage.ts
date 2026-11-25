import { demoVoortgang } from './demo'
import type { Oefentimer } from './oefentimer'
import type { BewaardeRoutine } from './routine'
import type { Voortgang } from './types'
import { nieuweVoortgang, normaliseerVoortgang } from './voortgang'

// De enige plek die localStorage aanraakt. De rest van de app gebruikt `opslag` of `useVoortgang`.

/**
 * Elke sleutel begint met `eeltje.voortgang`. Een preview (`VITE_PREVIEW=pr-12`) deelt het domein met de echte app
 * en krijgt daarom zijn naam als achtervoegsel, zodat hij de echte voortgang nooit raakt.
 */
export function opslagSleutel(naam: string, preview?: string): string {
  return `eeltje.voortgang.${naam}${preview ? '.' + preview : ''}`
}

export interface Opslag {
  laad(): Voortgang
  /** `false` als de browser niet wilde opslaan (privémodus, vol). */
  bewaar(v: Voortgang): boolean
  /** Wist de voortgang, de routine van vandaag, de oefentimer en een opzijgezette kapotte voortgang. */
  wis(): void
  /** De bewaarde routine zoals hij in de opslag staat (nog niet gecontroleerd: zie `routineVoorVandaag`), of `null`. */
  laadRoutine(): unknown
  bewaarRoutine(bewaard: BewaardeRoutine): boolean
  /** De lopende of gepauzeerde oefentimer, rauw (zie `leesTimer`), of `null`. */
  laadTimer(): unknown
  /** `null` haalt hem weg. */
  bewaarTimer(timer: Oefentimer | null): boolean
  /** Hoort een `storage`-event (een ander tabblad schreef) bij deze voortgang? `sleutel` null = alles gewist. */
  isEigenWijziging(sleutel: string | null, gebied: Storage | null): boolean
  /** Hetzelfde voor de oefentimer: een ander tabblad startte, stopte of wiste hem. */
  isTimerWijziging(sleutel: string | null, gebied: Storage | null): boolean
}

export function maakOpslag({ storage, preview, klok = () => new Date() }: { storage: Storage | null; preview?: string; klok?: () => Date }): Opslag {
  const sleutel = opslagSleutel('v1', preview)
  // Apart van de voortgang: die blijft op versie 1, en een export neemt de routine niet mee.
  const routineSleutel = opslagSleutel('routine', preview)
  const timerSleutel = opslagSleutel('timer', preview)
  const kapotSleutel = opslagSleutel('kapot', preview)
  const begin = () => (preview ? demoVoortgang(klok()) : nieuweVoortgang())

  function lees(k: string): string | null {
    try {
      return storage?.getItem(k) ?? null
    } catch {
      return null
    }
  }

  function leesJson(k: string): unknown {
    const tekst = lees(k)
    if (tekst === null) return null
    try {
      return JSON.parse(tekst) as unknown
    } catch {
      return null
    }
  }

  function schrijf(k: string, waarde: string): boolean {
    try {
      if (!storage) return false
      storage.setItem(k, waarde)
      return true
    } catch {
      return false
    }
  }

  return {
    laad() {
      const tekst = lees(sleutel)
      if (tekst === null) return begin()
      try {
        return normaliseerVoortgang(JSON.parse(tekst))
      } catch {
        // Nooit de voortgang van de eigenaar weggooien: wat we niet snappen, gaat apart opzij.
        schrijf(kapotSleutel, tekst)
        return nieuweVoortgang()
      }
    },
    bewaar(v) {
      return schrijf(sleutel, JSON.stringify(v))
    },
    wis() {
      try {
        storage?.removeItem(sleutel)
        storage?.removeItem(routineSleutel)
        storage?.removeItem(timerSleutel)
        storage?.removeItem(kapotSleutel)
      } catch {
        // Niets te wissen als de browser geen opslag geeft.
      }
    },
    laadRoutine() {
      return leesJson(routineSleutel)
    },
    bewaarRoutine(bewaard) {
      return schrijf(routineSleutel, JSON.stringify(bewaard))
    },
    laadTimer() {
      return leesJson(timerSleutel)
    },
    bewaarTimer(timer) {
      if (timer) return schrijf(timerSleutel, JSON.stringify(timer))
      try {
        storage?.removeItem(timerSleutel)
        return storage !== null
      } catch {
        return false
      }
    },
    isEigenWijziging(gewijzigd, gebied) {
      return storage !== null && gebied === storage && (gewijzigd === null || gewijzigd === sleutel)
    },
    isTimerWijziging(gewijzigd, gebied) {
      return storage !== null && gebied === storage && (gewijzigd === null || gewijzigd === timerSleutel)
    },
  }
}

function localStorageAlsHetKan(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

export const opslag = maakOpslag({ storage: localStorageAlsHetKan(), preview: import.meta.env.VITE_PREVIEW || undefined })
