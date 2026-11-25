import { useState, useSyncExternalStore } from 'react'
import { leesTimer, pauzeerTimer, startTimer, stopTimer, verstrekenMs, type Oefentimer } from '../lib/oefentimer'
import { opslag } from '../lib/storage'
import type { Sessie } from '../lib/types'
import { voegSessieToe } from '../lib/voortgang'
import { useKlok } from './useKlok'
import { useVoortgang } from './useVoortgang'

// Eén timer voor de hele app, buiten de pagina's: hij loopt door als je naar een challenge of liedje gaat, en staat
// in de opslag, zodat hij ook een herlaad overleeft.

let huidige: Oefentimer | null | undefined
const luisteraars = new Set<() => void>()

function lees(): Oefentimer | null {
  if (huidige === undefined) huidige = leesTimer(opslag.laadTimer())
  return huidige
}

function zet(t: Oefentimer | null) {
  huidige = t
  opslag.bewaarTimer(t)
  for (const l of luisteraars) l()
}

function abonneer(luisteraar: () => void) {
  luisteraars.add(luisteraar)
  // Een ander tabblad startte, stopte of wiste de timer: opnieuw inlezen, anders bewaart "Stop" hier dezelfde sessie nog eens.
  const opStorage = (e: StorageEvent) => {
    if (!opslag.isTimerWijziging(e.key, e.storageArea)) return
    huidige = undefined
    luisteraar()
  }
  window.addEventListener('storage', opStorage)
  return () => {
    luisteraars.delete(luisteraar)
    window.removeEventListener('storage', opStorage)
  }
}

/** Na "Alles wissen": de opslag is al leeg, dit vergeet ook wat in het geheugen staat. */
export function vergeetTimer() {
  huidige = null
  for (const l of luisteraars) l()
}

export function useOefentimer() {
  const timer = useSyncExternalStore(abonneer, lees)
  const { wijzig } = useVoortgang()
  const loopt = timer?.looptSinds != null
  const [nu, zetNu] = useState(() => Date.now())
  useKlok(loopt, 1000, () => zetNu(Date.now()))

  return {
    timer,
    loopt,
    verstreken: verstrekenMs(timer, new Date(nu)),
    start: () => zet(startTimer(lees(), new Date())),
    pauze: () => {
      const t = lees()
      if (t) zet(pauzeerTimer(t, new Date()))
    },
    /** Bewaart de sessie (als er geoefend is) en zet de timer op nul. */
    stop: (): Sessie | null => {
      const sessie = stopTimer(lees(), new Date())
      if (sessie) wijzig((v) => voegSessieToe(v, sessie))
      zet(null)
      return sessie
    },
  }
}
