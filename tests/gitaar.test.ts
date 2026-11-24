import { describe, expect, it } from 'vitest'
import { akkoorden } from '../src/data'
import { aanslagen, frequentie, karplusStrong, toonhoogtes } from '../src/lib/gitaar'
import type { Akkoord } from '../src/lib/types'

const zoek = (naam: string, variant?: string) =>
  akkoorden.find((a) => a.naam === naam && (variant === undefined ? a.standaard : a.variant === variant)) as Akkoord

describe('toonhoogtes', () => {
  it('geeft de MIDI-noot per snaar, null voor een niet gespeelde snaar', () => {
    expect(toonhoogtes(zoek('E'))).toEqual([40, 47, 52, 56, 59, 64])
    expect(toonhoogtes(zoek('D'))).toEqual([null, null, 50, 57, 62, 66])
    expect(toonhoogtes(zoek('A', 'barre'))).toEqual([45, 52, 57, 61, 64, 69])
  })
})

describe('frequentie', () => {
  it('is 440 Hz voor A4 en een octaaf hoger dubbel', () => {
    expect(frequentie(69)).toBe(440)
    expect(frequentie(81)).toBe(880)
    expect(frequentie(40)).toBeCloseTo(82.41, 2)
  })
})

describe('aanslagen', () => {
  it('slaat aan van laag naar hoog, snel achter elkaar, zonder de x-snaren', () => {
    const a = aanslagen(zoek('C'), 'aanslaan')
    expect(a.map((x) => x.snaar)).toEqual([1, 2, 3, 4, 5])
    expect(a[0].start).toBe(0)
    const tussen = a[1].start - a[0].start
    expect(tussen).toBeGreaterThan(0)
    expect(tussen).toBeLessThan(0.05)
    expect(a[4].start).toBeCloseTo(4 * tussen)
  })

  it('tokkelt per snaar met een merkbare pauze', () => {
    const a = aanslagen(zoek('D'), 'tokkelen')
    expect(a.map((x) => x.snaar)).toEqual([2, 3, 4, 5])
    expect(a[1].start - a[0].start).toBeGreaterThanOrEqual(0.25)
  })

  it('geeft de frequentie van de gegrepen noot mee', () => {
    const [laag] = aanslagen(zoek('E'), 'aanslaan')
    expect(laag.frequentie).toBeCloseTo(82.41, 2)
  })
})

describe('karplusStrong', () => {
  const sampleRate = 22050
  let zaad = 1
  const willekeurig = () => ((zaad = (zaad * 16807) % 2147483647) / 2147483647)

  // Autocorrelatie met een parabool door de top, voor een periode tot op een fractie van een sample.
  function periode(s: Float32Array, van: number, min: number, max: number): number {
    const r = (lag: number) => {
      let som = 0
      for (let i = van; i < van + 2048; i++) som += s[i] * s[i + lag]
      return som
    }
    let beste = min
    for (let lag = min; lag <= max; lag++) if (r(lag) > r(beste)) beste = lag
    const [a, b, c] = [r(beste - 1), r(beste), r(beste + 1)]
    return beste + (a - c) / (2 * (a - 2 * b + c))
  }

  it('maakt een snaar van de gevraagde duur', () => {
    expect(karplusStrong(110, sampleRate, 1.5, willekeurig).length).toBe(33075)
  })

  it('trilt op de gevraagde toonhoogte', () => {
    for (const f of [82.41, 196, 329.63]) {
      const s = karplusStrong(f, sampleRate, 1, willekeurig)
      const verwacht = sampleRate / f
      expect(Math.abs(periode(s, 4000, Math.floor(verwacht * 0.8), Math.ceil(verwacht * 1.2)) - verwacht)).toBeLessThan(0.2)
    }
  })

  it('sterft uit en blijft binnen -1 en 1', () => {
    const s = karplusStrong(196, sampleRate, 2, willekeurig)
    const rms = (van: number) => Math.sqrt(s.slice(van, van + 2000).reduce((t, x) => t + x * x, 0) / 2000)
    expect(rms(s.length - 2000)).toBeLessThan(rms(0) / 4)
    expect(s.every((x) => Math.abs(x) <= 1)).toBe(true)
  })
})
