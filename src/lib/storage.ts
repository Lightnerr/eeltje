import { demoVoortgang } from './demo'
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
  /** Wist de voortgang en de routine van vandaag. */
  wis(): void
  /** De bewaarde routine zoals hij in de opslag staat (nog niet gecontroleerd: zie `routineVoorVandaag`), of `null`. */
  laadRoutine(): unknown
  bewaarRoutine(bewaard: BewaardeRoutine): boolean
  /** Hoort een `storage`-event (een ander tabblad schreef) bij deze voortgang? `sleutel` null = alles gewist. */
  isEigenWijziging(sleutel: string | null, gebied: Storage | null): boolean
}

export function maakOpslag({ storage, preview, klok = () => new Date() }: { storage: Storage | null; preview?: string; klok?: () => Date }): Opslag {
  const sleutel = opslagSleutel('v1', preview)
  // Apart van de voortgang: die blijft op versie 1, en een export neemt de routine niet mee.
  const routineSleutel = opslagSleutel('routine', preview)
  const begin = () => (preview ? demoVoortgang(klok()) : nieuweVoortgang())

  function lees(k: string): string | null {
    try {
      return storage?.getItem(k) ?? null
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
        schrijf(opslagSleutel('kapot', preview), tekst)
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
      } catch {
        // Niets te wissen als de browser geen opslag geeft.
      }
    },
    laadRoutine() {
      const tekst = lees(routineSleutel)
      if (tekst === null) return null
      try {
        return JSON.parse(tekst) as unknown
      } catch {
        return null
      }
    },
    bewaarRoutine(bewaard) {
      return schrijf(routineSleutel, JSON.stringify(bewaard))
    },
    isEigenWijziging(gewijzigd, gebied) {
      return storage !== null && gebied === storage && (gewijzigd === null || gewijzigd === sleutel)
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
