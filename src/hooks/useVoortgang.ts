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
  opslag.bewaar(v)
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

function wijzig(f: (v: Voortgang) => Voortgang) {
  zet(f(lees()))
}

function wis() {
  opslag.wis()
  zet(nieuweVoortgang())
}

export function useVoortgang() {
  const voortgang = useSyncExternalStore(abonneer, lees)
  return { voortgang, wijzig, vervang: zet, wis }
}
