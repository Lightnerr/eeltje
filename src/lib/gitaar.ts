import type { Akkoord } from './types'

// Toonhoogtes en timing voor het gitaargeluid. src/audio/gitaar.ts speelt het af; hier zit alles wat te testen is.

/** MIDI-noten van de losse snaren in standaardstemming: E2 A2 D3 G3 B3 E4. */
const OPEN_SNAREN = [40, 45, 50, 55, 59, 64]

export type Speelwijze = 'aanslaan' | 'tokkelen'

const TUSSENTIJD: Record<Speelwijze, number> = { aanslaan: 0.025, tokkelen: 0.4 }

/** De MIDI-noot per snaar, `null` als de snaar niet klinkt. */
export function toonhoogtes(akkoord: Akkoord): (number | null)[] {
  return akkoord.frets.map((fret, snaar) => (fret === 'x' ? null : OPEN_SNAREN[snaar] + fret))
}

export function frequentie(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12)
}

export interface Aanslag {
  snaar: number
  frequentie: number
  /** Seconden na het begin. */
  start: number
}

/** Van laag naar hoog; aanslaan snel achter elkaar, tokkelen met een pauze per snaar. */
export function aanslagen(akkoord: Akkoord, wijze: Speelwijze): Aanslag[] {
  return toonhoogtes(akkoord)
    .flatMap((midi, snaar) => (midi === null ? [] : [{ snaar, frequentie: frequentie(midi) }]))
    .map((a, i) => ({ ...a, start: i * TUSSENTIJD[wijze] }))
}

/**
 * Karplus-Strong: een vertraging vol ruis die steeds gemiddeld wordt, klinkt als een getokkelde snaar.
 * `willekeurig` geeft getallen in [0, 1), zodat de tests een vast zaad kunnen meegeven.
 */
export function karplusStrong(frequentie: number, sampleRate: number, duur: number, willekeurig: () => number = Math.random): Float32Array {
  const uit = new Float32Array(Math.round(sampleRate * duur))
  // Het middelen vertraagt een halve sample; zonder die correctie klinkt alles iets te laag.
  const periode = sampleRate / frequentie - 0.5
  const lengte = Math.floor(periode)
  // Een allpass vult het stukje na de komma, zodat ook de hoge snaren zuiver klinken.
  const fractie = periode - lengte
  const c = (1 - fractie) / (1 + fractie)
  const lijn = new Float32Array(lengte)
  let vorige = 0
  for (let i = 0; i < lengte; i++) {
    // Licht gefilterde ruis: minder scherp dan witte ruis, meer als een vinger dan een plectrum.
    const ruis = willekeurig() * 2 - 1
    lijn[i] = (ruis + vorige) / 2
    vorige = ruis
  }
  const verlies = 0.996
  let ap = 0
  let apIn = 0
  let vorigeUit = 0
  for (let n = 0, i = 0; n < uit.length; n++) {
    const huidig = lijn[i]
    uit[n] = huidig
    const gemiddeld = verlies * 0.5 * (huidig + vorigeUit)
    vorigeUit = huidig
    const y = c * gemiddeld + apIn - c * ap
    apIn = gemiddeld
    ap = y
    lijn[i] = y
    i = (i + 1) % lengte
  }
  return uit
}
