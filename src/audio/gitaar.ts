import { aanslagen, frequentie, karplusStrong, moetUitsterven, toonhoogte, type Aanslag, type Speelwijze } from '../lib/gitaar'
import type { Akkoord } from '../lib/types'
import { geefAudioContext } from './context'

const NAKLANK = 2.5
const UITSTERVEN = 0.05
const VOLUME: Record<Speelwijze, number> = { aanslaan: 0.3, tokkelen: 0.5 }
const buffers = new Map<string, AudioBuffer>()
interface Klank {
  begin: number
  volume: number
  /** Audiotijd waarop hij uitsterft, of `null`. */
  stilVanaf: number | null
}
// Alles wat klinkt of al vooruit gepland is (meespelen plant op de audioklok), tot het uitgeklonken is.
const klinkend = new Map<GainNode, Klank>()

function snaarBuffer(context: AudioContext, frequentie: number): AudioBuffer {
  const sleutel = `${frequentie.toFixed(2)}@${context.sampleRate}`
  let buffer = buffers.get(sleutel)
  if (!buffer) {
    buffer = context.createBuffer(1, Math.round(context.sampleRate * NAKLANK), context.sampleRate)
    buffer.copyToChannel(karplusStrong(frequentie, context.sampleRate, NAKLANK) as Float32Array<ArrayBuffer>, 0)
    buffers.set(sleutel, buffer)
  }
  return buffer
}

function laatUitsterven(vanaf: number) {
  for (const [gain, klank] of klinkend) {
    if (!moetUitsterven(klank.stilVanaf, vanaf)) continue
    gain.gain.cancelScheduledValues(vanaf)
    gain.gain.setValueAtTime(klank.volume, vanaf)
    gain.gain.linearRampToValueAtTime(0, vanaf + UITSTERVEN)
    klank.stilVanaf = vanaf
  }
}

/** Laat alles wat klinkt of al gepland is kort uitsterven, zodat twee keer tikken niet door elkaar klinkt. */
export function stopGitaar() {
  if (klinkend.size === 0) return
  laatUitsterven(geefAudioContext().currentTime)
}

/** Haalt aanslagen weg die nog moeten beginnen; wat nu klinkt, klinkt gewoon door. */
export function annuleerGeplandeGitaar() {
  if (klinkend.size === 0) return
  const nu = geefAudioContext().currentTime
  for (const [gain, klank] of klinkend) {
    if (klank.begin > nu) {
      gain.disconnect()
      klinkend.delete(gain)
    } else if (klank.stilVanaf !== null && klank.stilVanaf > nu) {
      // Het uitsterven was voor een aanslag die nu niet meer komt.
      gain.gain.cancelScheduledValues(nu)
      gain.gain.setValueAtTime(klank.volume, nu)
      klank.stilVanaf = null
    }
  }
}

export interface SpeelOpties {
  /** Audiotijd om te beginnen (bv. de tel van de metronoom); zonder: meteen. Wat ervoor klinkt, stopt pas dan. */
  tijd?: number
}

// Moet direct in een tik-handler worden aangeroepen: iOS start de AudioContext alleen binnen een gebruikersactie.
function speel(lijst: readonly Omit<Aanslag, 'snaar'>[], volume: number, opties: SpeelOpties = {}) {
  const context = geefAudioContext()
  const begin = opties.tijd === undefined ? context.currentTime + 0.05 : Math.max(opties.tijd, context.currentTime)
  laatUitsterven(opties.tijd === undefined ? context.currentTime : begin)
  const uit = context.createGain()
  uit.gain.value = volume
  uit.connect(context.destination)
  let laatste: AudioBufferSourceNode | null = null
  for (const a of lijst) {
    const bron = context.createBufferSource()
    bron.buffer = snaarBuffer(context, a.frequentie)
    bron.connect(uit)
    bron.start(begin + a.start)
    laatste = bron
  }
  if (laatste) laatste.onended = () => klinkend.delete(uit)
  klinkend.set(uit, { begin, volume, stilVanaf: null })
}

/** Alle snaren snel achter elkaar, van laag naar hoog. */
export function slaAan(akkoord: Akkoord, opties?: SpeelOpties) {
  speel(aanslagen(akkoord, 'aanslaan'), VOLUME.aanslaan, opties)
}

/** Elke snaar apart, met een pauze ertussen. */
export function tokkel(akkoord: Akkoord) {
  speel(aanslagen(akkoord, 'tokkelen'), VOLUME.tokkelen)
}

/** Losse noten tegelijk (`snaar` 0 = lage E), bv. van een riff; wat ervoor klonk, stopt dan. */
export function speelNoten(noten: readonly { snaar: number; fret: number }[], opties?: SpeelOpties) {
  speel(
    noten.map((n) => ({ frequentie: frequentie(toonhoogte(n.snaar, n.fret)), start: 0 })),
    VOLUME.tokkelen,
    opties,
  )
}
