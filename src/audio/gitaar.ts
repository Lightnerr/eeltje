import { aanslagen, karplusStrong, type Speelwijze } from '../lib/gitaar'
import type { Akkoord } from '../lib/types'
import { geefAudioContext } from './context'

const NAKLANK = 2.5
const buffers = new Map<string, AudioBuffer>()
// Alles wat klinkt of al vooruit gepland is (meespelen plant op de audioklok).
const klinkend = new Set<GainNode>()

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
  for (const gain of klinkend) {
    gain.gain.cancelScheduledValues(vanaf)
    gain.gain.setValueAtTime(gain.gain.value, vanaf)
    gain.gain.linearRampToValueAtTime(0, vanaf + 0.05)
  }
  klinkend.clear()
}

/** Laat wat nog klinkt (en wat al gepland was) kort uitsterven, zodat twee keer tikken niet door elkaar klinkt. */
export function stopGitaar() {
  if (klinkend.size === 0) return
  laatUitsterven(geefAudioContext().currentTime)
}

export interface SpeelOpties {
  /** Audiotijd om te beginnen (bv. de tel van de metronoom); zonder: meteen. Wat ervoor klinkt, stopt pas dan. */
  tijd?: number
}

// Moet direct in een tik-handler worden aangeroepen: iOS start de AudioContext alleen binnen een gebruikersactie.
function speel(akkoord: Akkoord, wijze: Speelwijze, opties: SpeelOpties = {}) {
  const context = geefAudioContext()
  const begin = opties.tijd === undefined ? context.currentTime + 0.05 : Math.max(opties.tijd, context.currentTime)
  laatUitsterven(opties.tijd === undefined ? context.currentTime : begin)
  const uit = context.createGain()
  uit.gain.value = wijze === 'aanslaan' ? 0.3 : 0.5
  uit.connect(context.destination)
  let laatste: AudioBufferSourceNode | null = null
  for (const a of aanslagen(akkoord, wijze)) {
    const bron = context.createBufferSource()
    bron.buffer = snaarBuffer(context, a.frequentie)
    bron.connect(uit)
    bron.start(begin + a.start)
    laatste = bron
  }
  if (laatste) laatste.onended = () => klinkend.delete(uit)
  klinkend.add(uit)
}

/** Alle snaren snel achter elkaar, van laag naar hoog. */
export function slaAan(akkoord: Akkoord, opties?: SpeelOpties) {
  speel(akkoord, 'aanslaan', opties)
}

/** Elke snaar apart, met een pauze ertussen. */
export function tokkel(akkoord: Akkoord) {
  speel(akkoord, 'tokkelen')
}
