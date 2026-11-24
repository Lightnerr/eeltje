import { describe, expect, it } from 'vitest'
import { akkoorden } from '../src/data'
import { beschrijfAkkoord, CIJFERBREEDTE, diagramVan, FRETNUMMER_AFSTAND } from '../src/lib/diagram'
import type { Akkoord } from '../src/lib/types'

function akkoord(naam: string, variant?: string): Akkoord {
  const a = akkoorden.find((x) => x.naam === naam && (variant === undefined ? x.standaard : x.variant === variant))
  if (!a) throw new Error(`${naam} ${variant} ontbreekt`)
  return a
}

describe('diagramVan', () => {
  it('zet x en o boven de snaren', () => {
    expect(diagramVan(akkoord('D')).boven).toEqual(['x', 'x', 'o', null, null, null])
    expect(diagramVan(akkoord('E')).boven).toEqual(['o', null, null, null, 'o', 'o'])
  })

  it('zet een bolletje per gegrepen snaar, met vinger en vak vanaf de bovenkant', () => {
    expect(diagramVan(akkoord('A')).bolletjes).toEqual([
      { snaar: 2, vak: 2, vinger: 2 },
      { snaar: 3, vak: 2, vinger: 1 },
      { snaar: 4, vak: 2, vinger: 3 },
    ])
  })

  it('toont bij een open akkoord de topkam en geen fretnummer', () => {
    const d = diagramVan(akkoord('G'))
    expect(d.basisfret).toBe(1)
    expect(d.fretnummer).toBeNull()
    expect(d.topkam).toBe(true)
  })

  it('toont bij een hogere positie het fretnummer en rekent de vakken vanaf daar', () => {
    const d = diagramVan(akkoord('A', 'barre'))
    expect(d.fretnummer).toBe(5)
    expect(d.topkam).toBe(false)
    expect(d.barres).toEqual([{ vak: 1, vanSnaar: 0, totSnaar: 5, vinger: 1 }])
    expect(d.bolletjes).toEqual([
      { snaar: 1, vak: 3, vinger: 3 },
      { snaar: 2, vak: 3, vinger: 4 },
      { snaar: 3, vak: 2, vinger: 2 },
    ])
  })

  it('tekent de volle barré van F over alle snaren, zonder losse bolletjes eronder', () => {
    const d = diagramVan(akkoord('F', 'barre'))
    expect(d.barres).toEqual([{ vak: 1, vanSnaar: 0, totSnaar: 5, vinger: 1 }])
    expect(d.bolletjes.map((b) => b.snaar)).toEqual([1, 2, 3])
    expect(d.boven).toEqual([null, null, null, null, null, null])
  })

  it('tekent de kleine barré van F over de twee hoge snaren', () => {
    const d = diagramVan(akkoord('F'))
    expect(d.barres).toEqual([{ vak: 1, vanSnaar: 4, totSnaar: 5, vinger: 1 }])
    expect(d.bolletjes).toEqual([
      { snaar: 2, vak: 3, vinger: 3 },
      { snaar: 3, vak: 2, vinger: 2 },
    ])
  })

  it('ziet een vinger die plat over meer snaren ligt ook zonder barré in de data', () => {
    const d = diagramVan(akkoord('C', 'barre'))
    expect(d.barres).toEqual([
      { vak: 1, vanSnaar: 1, totSnaar: 5, vinger: 1 },
      { vak: 3, vanSnaar: 2, totSnaar: 4, vinger: 3 },
    ])
    expect(d.bolletjes).toEqual([])
  })

  it('maakt links ruimte voor een fretnummer van twee cijfers', () => {
    const op = (basisfret: number): Akkoord => ({ ...akkoord('A', 'barre'), frets: [basisfret, 'x', 'x', 'x', 'x', 'x'], vingers: [1, 0, 0, 0, 0, 0], barre: undefined, basisfret })
    for (const basisfret of [5, 10, 12, 20]) {
      const d = diagramVan(op(basisfret))
      expect(d.ruimteLinks - FRETNUMMER_AFSTAND, `basisfret ${basisfret}`).toBeGreaterThanOrEqual(String(basisfret).length * CIJFERBREEDTE)
    }
    expect(diagramVan(op(12)).ruimteLinks).toBeGreaterThan(diagramVan(op(5)).ruimteLinks)
  })

  it('toont minstens vier vakken, en meer als het akkoord ver reikt', () => {
    expect(diagramVan(akkoord('E')).vakken).toBe(4)
    const ver: Akkoord = { ...akkoord('E'), frets: [1, 3, 5, 'x', 'x', 'x'], vingers: [1, 2, 4, 0, 0, 0] }
    expect(diagramVan(ver).vakken).toBe(5)
  })

  it('klopt voor elk akkoord met zijn frets en vingers', () => {
    for (const a of akkoorden) {
      const d = diagramVan(a)
      const basis = a.basisfret ?? 1
      a.frets.forEach((fret, snaar) => {
        const bolletje = d.bolletjes.find((b) => b.snaar === snaar)
        const barre = d.barres.find((b) => b.vanSnaar <= snaar && snaar <= b.totSnaar && b.vak === Number(fret) - basis + 1)
        if (fret === 'x') expect(d.boven[snaar], `${a.naam} ${a.variant}`).toBe('x')
        else if (fret === 0) expect(d.boven[snaar]).toBe('o')
        else {
          expect(d.boven[snaar]).toBeNull()
          const gevonden = bolletje ?? barre
          expect(gevonden, `${a.naam} ${a.variant} snaar ${snaar}`).toBeDefined()
          expect(gevonden!.vinger).toBe(a.vingers[snaar])
          expect(bolletje ? bolletje.vak : barre!.vak).toBe(fret - basis + 1)
        }
      })
    }
  })
})

describe('beschrijfAkkoord', () => {
  it('beschrijft per snaar wat je doet', () => {
    expect(beschrijfAkkoord(akkoord('A'))).toBe(
      'A, eigen: lage E niet spelen, A open, D 2e fret middelvinger, G 2e fret wijsvinger, B 2e fret ringvinger, hoge e open.',
    )
  })

  it('noemt de barré en de positie', () => {
    expect(beschrijfAkkoord(akkoord('F', 'barre'))).toBe(
      'F, barré: wijsvinger als barré op de 1e fret over lage E t/m hoge e, A 3e fret ringvinger, D 3e fret pink, G 2e fret middelvinger.',
    )
    expect(beschrijfAkkoord(akkoord('A', 'barre'))).toMatch(/^A, barré op 5: wijsvinger als barré op de 5e fret/)
  })
})
