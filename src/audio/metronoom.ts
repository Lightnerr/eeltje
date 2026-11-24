import { beginStand, begrensBpm, isAccent, planStappen, wisselMaatsoort, wisselOnderverdeling, type PlanStand } from '../lib/metronoom'
import { leesMaatsoort } from '../lib/muziek'
import type { Maatsoort } from '../lib/types'
import { geefAudioContext } from './context'

export interface MetronoomOpties {
  bpm: number
  maatsoort: Maatsoort
  /** Hogere, hardere klik op de 1. Standaard aan. */
  accent?: boolean
  /** Slagen per tel, voor `opSlag`: 2 bij achtsten in 4/4. Standaard 1. Klikken doet hij alleen op de tel. */
  onderverdeling?: number
  /** Per tel, 0 = de 1. Komt binnen op het moment dat de tel klinkt; `tijd` is de audiotijd van de tel. */
  opTel?: (tel: number, tijd: number) => void
  /**
   * Per slag, geteld vanaf 0 binnen de maat (`tel * onderverdeling + n`). Ook op het moment dat hij klinkt. Slagen die
   * nog in een oude onderverdeling of maatsoort geteld zijn (na een wissel, tot de volgende tel) komen niet door.
   */
  opSlag?: (slag: number, tijd: number) => void
  /** Per tel op het moment dat hij gepland wordt (ruim vóór hij klinkt), met de audiotijd: om er geluid op te plannen. */
  opPlan?: (tel: number, tijd: number) => void
}

export interface Metronoom {
  start(): void
  stop(): void
  zetBpm(bpm: number): void
  /** Begint een nieuwe maat op de volgende tel. */
  zetMaatsoort(maatsoort: Maatsoort): void
  zetAccent(accent: boolean): void
  /** Gaat in op de volgende tel. */
  zetOnderverdeling(onderverdeling: number): void
  readonly loopt: boolean
}

const TIMER_MS = 25
const VOORUIT = 0.1
// Een verborgen tabblad krijgt zijn timer hooguit eens per seconde.
const VOORUIT_VERBORGEN = 1.5
const KLIK_DUUR = 0.05

function klik(context: AudioContext, uitgang: AudioNode, tijd: number, sterk: boolean) {
  const oscillator = context.createOscillator()
  const volume = context.createGain()
  oscillator.type = 'triangle'
  oscillator.frequency.value = sterk ? 1760 : 1175
  volume.gain.setValueAtTime(0.0001, tijd)
  volume.gain.exponentialRampToValueAtTime(sterk ? 0.9 : 0.5, tijd + 0.002)
  volume.gain.exponentialRampToValueAtTime(0.0001, tijd + KLIK_DUUR)
  oscillator.connect(volume).connect(uitgang)
  oscillator.start(tijd)
  oscillator.stop(tijd + KLIK_DUUR + 0.01)
}

/** Metronoom op de audioklok. Raakt de AudioContext pas bij `start()`, dus maken mag altijd. */
export function maakMetronoom(opties: MetronoomOpties): Metronoom {
  let bpm = begrensBpm(opties.bpm)
  let maatsoort = opties.maatsoort
  let accent = opties.accent ?? true
  let onderverdeling = opties.onderverdeling ?? 1

  let loopt = false
  let ronde = 0
  let stand: PlanStand | null = null
  let timer: ReturnType<typeof setInterval> | undefined
  let uitgang: GainNode | null = null
  const meldingen = new Set<ReturnType<typeof setTimeout>>()

  function plan() {
    if (!stand || !uitgang) return
    const context = geefAudioContext()
    const vooruit = typeof document !== 'undefined' && document.hidden ? VOORUIT_VERBORGEN : VOORUIT
    const r = planStappen(stand, context.currentTime, vooruit)
    stand = r.stand
    const vertraging = context.outputLatency || context.baseLatency || 0
    for (const stap of r.stappen) {
      if (stap.opTel) klik(context, uitgang, stap.tijd, accent && isAccent(stap.tel, maatsoort))
      if (stap.opTel) opties.opPlan?.(stap.tel, stap.tijd)
      if (!opties.opTel && !opties.opSlag) continue
      const wacht = Math.max(0, (stap.tijd + vertraging - context.currentTime) * 1000)
      const melding = setTimeout(() => {
        meldingen.delete(melding)
        if (stap.opTel) opties.opTel?.(stap.tel, stap.tijd)
        if (stap.onderverdeling === onderverdeling && stap.tellen === leesMaatsoort(maatsoort).tellen) opties.opSlag?.(stap.slag, stap.tijd)
      }, wacht)
      meldingen.add(melding)
    }
  }

  // Bij verbergen meteen verder vooruit plannen, vóór de browser de timer afknijpt.
  const opZichtbaarheid = () => plan()

  function start() {
    if (loopt) return
    loopt = true
    const deze = ++ronde
    // geefAudioContext roept resume() binnen de tik aan (nodig voor iOS); plannen kan pas als de klok loopt.
    const context = geefAudioContext()
    void context.resume().then(() => {
      if (deze !== ronde) return
      uitgang = context.createGain()
      uitgang.connect(context.destination)
      stand = beginStand(context.currentTime + 0.05, bpm, leesMaatsoort(maatsoort).tellen, onderverdeling)
      plan()
      timer = setInterval(plan, TIMER_MS)
      document.addEventListener('visibilitychange', opZichtbaarheid)
    })
  }

  function stop() {
    if (!loopt) return
    loopt = false
    ronde++
    clearInterval(timer)
    for (const m of meldingen) clearTimeout(m)
    meldingen.clear()
    // Wat al vooruit gepland was, valt zo stil.
    uitgang?.disconnect()
    uitgang = null
    stand = null
    document.removeEventListener('visibilitychange', opZichtbaarheid)
  }

  return {
    start,
    stop,
    zetBpm(nieuw) {
      bpm = begrensBpm(nieuw)
      if (stand) stand = { ...stand, bpm }
    },
    zetMaatsoort(nieuw) {
      if (nieuw === maatsoort) return
      maatsoort = nieuw
      if (stand) stand = wisselMaatsoort(stand, leesMaatsoort(nieuw).tellen)
    },
    zetAccent(nieuw) {
      accent = nieuw
    },
    zetOnderverdeling(nieuw) {
      if (nieuw === onderverdeling) return
      if (stand) stand = wisselOnderverdeling(stand, nieuw)
      onderverdeling = nieuw
    },
    get loopt() {
      return loopt
    },
  }
}
