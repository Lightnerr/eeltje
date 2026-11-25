import { useSyncExternalStore } from 'react'
import { opslag } from '../lib/storage'
import type { Voortgang } from '../lib/types'
import { nieuweVoortgang } from '../lib/voortgang'

// Eén gedeelde voortgang voor alle schermen. Elke wijziging gaat meteen naar de opslag.

let huidige: Voortgang | null = null
const luisteraars = new Set<() => void>()

function lees(): Voortgang {
  huidige ??= opslag.laad()
  return huidige
}

function zet(v: Voortgang) {
  huidige = v
  for (const l of luisteraars) l()
}

function abonneer(luisteraar: () => void) {
  luisteraars.add(luisteraar)
  // Een ander tabblad wijzigde de opslag: opnieuw inlezen.
  const opStorage = (e: StorageEvent) => {
    if (!opslag.isEigenWijziging(e.key, e.storageArea)) return
    huidige = null
    luisteraar()
  }
  window.addEventListener('storage', opStorage)
  return () => {
    luisteraars.delete(luisteraar)
    window.removeEventListener('storage', opStorage)
  }
}

/**
 * Geeft `false` als de browser niet wilde opslaan (vol, privémodus). De wijziging geldt dan wel in het geheugen,
 * anders werkt de app helemaal niet zonder opslag.
 */
function wijzig(f: (v: Voortgang) => Voortgang): boolean {
  const v = f(lees())
  const bewaard = opslag.bewaar(v)
  zet(v)
  return bewaard
}

/** Alles in één keer vervangen (importeren): lukt het opslaan niet, dan blijft de oude voortgang staan. Geeft of het lukte. */
function vervang(v: Voortgang): boolean {
  if (!opslag.bewaar(v)) return false
  zet(v)
  return true
}

function wis() {
  opslag.wis()
  // Ook in een preview opslaan, anders begint hij na herladen weer met de demo.
  const v = nieuweVoortgang()
  opslag.bewaar(v)
  zet(v)
}

export function useVoortgang() {
  const voortgang = useSyncExternalStore(abonneer, lees)
  return { voortgang, wijzig, vervang, wis }
}
