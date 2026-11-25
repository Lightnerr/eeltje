import { describe, expect, it } from 'vitest'
import { beschrijfRiff, notenInTel, riffLengte, riffPositie, stappenPerMaat, tabVan } from '../src/lib/riffs'
import type { Riff } from '../src/lib/types'

const riff: Riff = {
  id: 'test',
  titel: 'Test',
  artiest: 'Niemand',
  bpm: 100,
  maatsoort: '4/4',
  onderverdeling: 2,
  maten: 2,
  noten: [
    { stap: 0, snaar: 'A', fret: 7 },
    { stap: 3, snaar: 'A', fret: 10 },
    { stap: 3, snaar: 'D', fret: 9 },
    { stap: 8, snaar: 'E', fret: 0 },
    { stap: 15, snaar: 'e', fret: 12 },
  ],
  uitleg: ['Speel hem.'],
  bron: 'ai-gegenereerd',
  geverifieerd: false,
}

const zesAchtste: Riff = { ...riff, maatsoort: '6/8', onderverdeling: 1, maten: 1, noten: [{ stap: 5, snaar: 'G', fret: 0 }] }

describe('lengte', () => {
  it('telt stappen per maat en in de hele riff', () => {
    expect(stappenPerMaat(riff)).toBe(8)
    expect(riffLengte(riff)).toBe(16)
    expect(stappenPerMaat(zesAchtste)).toBe(6)
  })
})

describe('tabVan', () => {
  it('geeft per maat een kolom per stap, hoge e bovenaan', () => {
    const tab = tabVan(riff)
    expect(tab).toHaveLength(2)
    expect(tab[0].kolommen).toHaveLength(8)
    expect(tab[0].kolommen[0]).toEqual({ stap: 0, opTel: true, frets: [null, null, null, null, 7, null] })
    expect(tab[0].kolommen[3]).toEqual({ stap: 3, opTel: false, frets: [null, null, null, 9, 10, null] })
    expect(tab[1].kolommen[0].frets).toEqual([null, null, null, null, null, 0])
    expect(tab[1].kolommen[7]).toEqual({ stap: 15, opTel: false, frets: [12, null, null, null, null, null] })
  })
})

describe('notenInTel', () => {
  it('speelt niets in de aftelmaat', () => {
    expect(notenInTel(riff, 0, 0)).toEqual([])
  })

  it('geeft de noten van een tel met hun plek in de tel, snaar 0 = lage E', () => {
    expect(notenInTel(riff, 1, 0)).toEqual([{ snaar: 1, fret: 7, deel: 0 }])
    expect(notenInTel(riff, 1, 1)).toEqual([
      { snaar: 1, fret: 10, deel: 0.5 },
      { snaar: 2, fret: 9, deel: 0.5 },
    ])
    expect(notenInTel(riff, 1, 2)).toEqual([])
    expect(notenInTel(riff, 2, 0)).toEqual([{ snaar: 0, fret: 0, deel: 0 }])
  })

  it('begint na de laatste maat weer vooraan', () => {
    expect(notenInTel(riff, 3, 0)).toEqual(notenInTel(riff, 1, 0))
    expect(notenInTel(riff, 4, 3)).toEqual([{ snaar: 5, fret: 12, deel: 0.5 }])
  })

  it('in 6/8 is elke achtste een tel', () => {
    expect(notenInTel(zesAchtste, 1, 5)).toEqual([{ snaar: 3, fret: 0, deel: 0 }])
  })
})

describe('riffPositie', () => {
  it('telt af in de eerste maat', () => {
    expect(riffPositie(riff, 0, 0)).toEqual({ fase: 'aftellen', nog: 4 })
    expect(riffPositie(riff, 0, 1)).toEqual({ fase: 'aftellen', nog: 4 })
    expect(riffPositie(riff, 0, 6)).toEqual({ fase: 'aftellen', nog: 1 })
  })

  it('geeft daarna de stap in de riff, steeds rond', () => {
    expect(riffPositie(riff, 1, 0)).toEqual({ fase: 'spelen', stap: 0 })
    expect(riffPositie(riff, 2, 3)).toEqual({ fase: 'spelen', stap: 11 })
    expect(riffPositie(riff, 3, 3)).toEqual({ fase: 'spelen', stap: 3 })
  })
})

describe('beschrijfRiff', () => {
  it('noemt de noten op volgorde, snaar en fret, tegelijk met een plus', () => {
    expect(beschrijfRiff(riff)).toBe('A-snaar 7, A-snaar 10 + D-snaar 9, E-snaar open, e-snaar 12')
  })
})
