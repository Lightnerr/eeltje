import { describe, expect, it } from 'vitest'
import { akkoorden, liedjes, oefeningen, standaardVariant, variantenVan, zoekAkkoord, zoekLiedje, zoekOefening } from '../src/data'
import { akkoordenVan } from '../src/lib/muziek'

describe('src/data', () => {
  it('heeft de akkoorden die een beginner nodig heeft', () => {
    const namen = new Set(akkoorden.map((a) => a.naam))
    for (const naam of ['A', 'Am', 'C', 'D', 'Dm', 'E', 'Em', 'G', 'Cadd9', 'Asus2', 'Dsus2', 'Fmaj7', 'F', 'Bm', 'E7', 'A7', 'D7', 'B7']) {
      expect(namen, naam).toContain(naam)
    }
    expect(zoekAkkoord('G', '3-vingers')?.vingers.filter((v) => v > 0)).toHaveLength(3)
    expect(zoekAkkoord('F', 'klein')).toBeDefined()
    expect(zoekAkkoord('F', 'barre')?.barre).toMatchObject({ vanSnaar: 0, totSnaar: 5 })
    expect(zoekAkkoord('Bm', 'klein')).toBeDefined()
    expect(akkoorden.some((a) => (a.basisfret ?? 1) > 1)).toBe(true)
  })

  it('de eigen A is de standaard', () => {
    expect(standaardVariant('A')).toMatchObject({ variant: 'eigen', frets: ['x', 0, 2, 2, 2, 0], vingers: [0, 0, 2, 1, 3, 0] })
  })

  it('zoekt akkoorden en varianten', () => {
    expect(zoekAkkoord('A')?.variant).toBe('eigen')
    expect(zoekAkkoord('A', 'klassiek')?.vingers).toEqual([0, 0, 1, 2, 3, 0])
    expect(zoekAkkoord('A', 'bestaat-niet')).toBeUndefined()
    expect(zoekAkkoord('H')).toBeUndefined()
    expect(variantenVan('A')[0].standaard).toBe(true)
    expect(variantenVan('A').length).toBeGreaterThan(1)
    expect(variantenVan('H')).toEqual([])
  })

  it('12 tot 15 liedjes van 3 of 4 akkoorden, AI-versie en niet geverifieerd', () => {
    expect(liedjes.length).toBeGreaterThanOrEqual(12)
    expect(liedjes.length).toBeLessThanOrEqual(15)
    for (const l of liedjes) {
      expect([3, 4], l.id).toContain(akkoordenVan(l).length)
      expect(l.bron).toBe('ai-gegenereerd')
      expect(l.geverifieerd).toBe(false)
    }
    expect(new Set(liedjes.map((l) => l.soort))).toEqual(new Set(['traditioneel', 'pop']))
    expect(zoekLiedje('wonderwall')?.titel).toBe('Wonderwall')
    expect(zoekLiedje('bestaat-niet')).toBeUndefined()
  })

  it('heeft de oefeningen', () => {
    for (const id of ['spider', 'chromatisch-loopje', 'akkoordwissels', 'basisaanslag']) expect(zoekOefening(id), id).toBeDefined()
    expect(oefeningen.some((o) => o.tab)).toBe(true)
  })
})
