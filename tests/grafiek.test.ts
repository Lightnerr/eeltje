import { describe, expect, it } from 'vitest'
import { beschrijfGrafiek, indeling, labelIndices, netteStap, schaal, type Maten } from '../src/lib/grafiek'

describe('netteStap', () => {
  it('rondt op naar 1, 2 of 5 maal een macht van 10, minstens 1', () => {
    expect(netteStap(0.3)).toBe(1)
    expect(netteStap(1)).toBe(1)
    expect(netteStap(1.2)).toBe(2)
    expect(netteStap(3)).toBe(5)
    expect(netteStap(7.75)).toBe(10)
    expect(netteStap(37.5)).toBe(50)
    expect(netteStap(120)).toBe(200)
    expect(netteStap(2000)).toBe(2000)
  })
})

describe('schaal', () => {
  it('begint bij 0 en eindigt op een nette stap boven het hoogste punt', () => {
    expect(schaal([120, 85, 150])).toEqual({ max: 150, ticks: [0, 50, 100, 150] })
    expect(schaal([31, 14])).toEqual({ max: 40, ticks: [0, 10, 20, 30, 40] })
    expect(schaal([70, 50, 65])).toEqual({ max: 80, ticks: [0, 20, 40, 60, 80] })
  })

  it('geen halve stappen bij kleine getallen', () => {
    expect(schaal([1])).toEqual({ max: 1, ticks: [0, 1] })
    expect(schaal([3])).toEqual({ max: 3, ticks: [0, 1, 2, 3] })
  })

  it('zonder punten of met alleen nullen een as van 0 tot 4', () => {
    expect(schaal([])).toEqual({ max: 4, ticks: [0, 1, 2, 3, 4] })
    expect(schaal([0, 0])).toEqual({ max: 4, ticks: [0, 1, 2, 3, 4] })
  })

  it('heeft nooit meer dan 6 ticks', () => {
    for (const max of [1, 7, 11, 49, 99, 101, 999, 1234, 87654]) expect(schaal([max]).ticks.length, String(max)).toBeLessThanOrEqual(6)
  })
})

describe('labelIndices', () => {
  it('alle punten als er plek is', () => {
    expect(labelIndices(4, 6)).toEqual([0, 1, 2, 3])
  })

  it('anders om de zoveel, en altijd het laatste punt', () => {
    expect(labelIndices(8, 6)).toEqual([1, 3, 5, 7])
    expect(labelIndices(30, 5)).toEqual([5, 11, 17, 23, 29])
  })

  it('leeg bij 0 punten, en minstens het laatste punt', () => {
    expect(labelIndices(0, 6)).toEqual([])
    expect(labelIndices(5, 0)).toEqual([4])
  })
})

const maten: Maten = { breedte: 320, hoogte: 180, links: 40, rechts: 10, boven: 10, onder: 30 }
const onderkant = maten.hoogte - maten.onder

describe('indeling', () => {
  it('staven: verdeeld over de breedte, de hoogste raakt de bovenste tick, 0 staat op de as', () => {
    const { punten, staafBreedte, ticks } = indeling([0, 50, 100], 'staaf', maten)
    expect(ticks.map((t) => t.waarde)).toEqual([0, 50, 100])
    expect(ticks[0].y).toBe(onderkant)
    expect(ticks[ticks.length - 1].y).toBe(maten.boven)
    expect(punten.map((p) => p.y)).toEqual([onderkant, (onderkant + maten.boven) / 2, maten.boven])
    for (const p of punten) {
      expect(p.x - staafBreedte / 2).toBeGreaterThanOrEqual(maten.links)
      expect(p.x + staafBreedte / 2).toBeLessThanOrEqual(maten.breedte - maten.rechts)
    }
    expect(punten[1].x - punten[0].x).toBeCloseTo(punten[2].x - punten[1].x)
  })

  it('lijn: eerste en laatste punt op de randen, één punt in het midden', () => {
    const { punten } = indeling([1, 2, 3], 'lijn', maten)
    expect(punten[0].x).toBe(maten.links)
    expect(punten[2].x).toBe(maten.breedte - maten.rechts)
    expect(indeling([5], 'lijn', maten).punten[0].x).toBe((maten.links + maten.breedte - maten.rechts) / 2)
  })

  it('staven worden niet absurd breed', () => {
    expect(indeling([3], 'staaf', { ...maten, breedte: 1280 }).staafBreedte).toBeLessThanOrEqual(48)
  })

  it('geen punten', () => {
    expect(indeling([], 'staaf', maten).punten).toEqual([])
  })
})

describe('beschrijfGrafiek', () => {
  const punt = (y: number, label: string) => ({ x: label, y, label })

  it('vat de trend samen', () => {
    expect(beschrijfGrafiek('Minuten per week', [punt(120, '9 nov'), punt(150, '16 nov'), punt(85, '23 nov')], 'minuten')).toBe(
      'Minuten per week: 3 waarden, van 120 minuten (9 nov) naar 85 minuten (23 nov). Hoogste: 150 minuten (16 nov).',
    )
  })

  it('zonder eenheid en met x als label', () => {
    expect(beschrijfGrafiek('A-D', [{ x: 1, y: 14 }, { x: 2, y: 31 }])).toBe('A-D: 2 waarden, van 14 (1) naar 31 (2). Hoogste: 31 (2).')
  })

  it('één punt of geen punten', () => {
    expect(beschrijfGrafiek('Spider', [punt(60, '3 nov')], 'bpm')).toBe('Spider: 1 waarde, 60 bpm (3 nov).')
    expect(beschrijfGrafiek('Spider', [])).toBe('Spider: nog geen gegevens.')
  })
})
