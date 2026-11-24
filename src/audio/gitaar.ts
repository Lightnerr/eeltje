import { aanslagen, karplusStrong, type Speelwijze } from '../lib/gitaar'
import type { Akkoord } from '../lib/types'
import { geefAudioContext } from './context'

const NAKLANK = 2.5
const buffers = new Map<string, AudioBuffer>()
let huidig: GainNode | null = null

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

/** Laat wat nog klinkt kort uitsterven, zodat twee keer tikken niet door elkaar klinkt. */
export function stopGitaar() {
  if (!huidig) return
  const { context, gain } = huidig
  gain.cancelScheduledValues(context.currentTime)
  gain.setValueAtTime(gain.value, context.currentTime)
  gain.linearRampToValueAtTime(0, context.currentTime + 0.05)
  huidig = null
}

// Moet direct in een tik-handler worden aangeroepen: iOS start de AudioContext alleen binnen een gebruikersactie.
function speel(akkoord: Akkoord, wijze: Speelwijze) {
  const context = geefAudioContext()
  stopGitaar()
  const uit = context.createGain()
  uit.gain.value = wijze === 'aanslaan' ? 0.3 : 0.5
  uit.connect(context.destination)
  const begin = context.currentTime + 0.05
  for (const a of aanslagen(akkoord, wijze)) {
    const bron = context.createBufferSource()
    bron.buffer = snaarBuffer(context, a.frequentie)
    bron.connect(uit)
    bron.start(begin + a.start)
  }
  huidig = uit
}

/** Alle snaren snel achter elkaar, van laag naar hoog. */
export function slaAan(akkoord: Akkoord) {
  speel(akkoord, 'aanslaan')
}

/** Elke snaar apart, met een pauze ertussen. */
export function tokkel(akkoord: Akkoord) {
  speel(akkoord, 'tokkelen')
}
