import { describe, expect, it } from 'vitest'
import { liedjes } from '../src/data'
import { slagenPasInMaat } from '../src/lib/muziek'
import { ontwerpStatus, slagpatroonKeuzes, telLabels, VASTE_SLAGPATRONEN } from '../src/lib/slagpatroon'
import type { Liedje, Maatsoort } from '../src/lib/types'

const liedje = (id: string, titel: string, maatsoort: Maatsoort, slagpatroon: string) => ({ id, titel, maatsoort, slagpatroon }) as Liedje

describe('VASTE_SLAGPATRONEN', () => {
  it('passen allemaal in hun maatsoort', () => {
    for (const p of VASTE_SLAGPATRONEN) expect(slagenPasInMaat(p.slagen.length, p.maatsoort), p.naam).toBe(true)
  })

  it('heeft voor elke maatsoort minstens één patroon', () => {
    for (const m of ['2/4', '3/4', '4/4', '6/8'] as const) expect(VASTE_SLAGPATRONEN.some((p) => p.maatsoort === m)).toBe(true)
  })
})

describe('slagpatroonKeuzes', () => {
  it('geeft de vaste patronen en die uit de liedjes van deze maatsoort', () => {
    const keuzes = slagpatroonKeuzes('3/4', [
      liedje('a', 'Wals', '3/4', 'D U D U D U'),
      liedje('b', 'Mars', '4/4', 'D U D U D U D U'),
    ])
    expect(keuzes.every((k) => k.maatsoort === '3/4')).toBe(true)
    expect(keuzes.at(-1)).toMatchObject({ slagen: ['D', 'U', 'D', 'U', 'D', 'U'], liedjes: ['Wals'] })
    expect(keuzes.some((k) => k.liedjes.includes('Mars'))).toBe(false)
  })

  it('voegt een liedje met hetzelfde patroon samen met een bestaande keuze', () => {
    const tekst = VASTE_SLAGPATRONEN.find((p) => p.maatsoort === '4/4' && p.slagen.length === 8)!.slagen.join(' ')
    const keuzes = slagpatroonKeuzes('4/4', [liedje('a', 'Een', '4/4', tekst), liedje('b', 'Twee', '4/4', `  ${tekst} `)])
    expect(keuzes.filter((k) => k.slagen.join(' ') === tekst)).toHaveLength(1)
    expect(keuzes.find((k) => k.slagen.join(' ') === tekst)!.liedjes).toEqual(['Een', 'Twee'])
  })

  it('slaat een kapot of niet passend patroon over', () => {
    const vast = slagpatroonKeuzes('4/4', []).length
    expect(slagpatroonKeuzes('4/4', [liedje('a', 'Kapot', '4/4', 'D X'), liedje('b', 'Te kort', '4/4', 'D U D')])).toHaveLength(vast)
  })

  it('werkt met de echte liedjes', () => {
    const keuzes = slagpatroonKeuzes('4/4', liedjes)
    expect(keuzes.some((k) => k.liedjes.includes('Wonderwall'))).toBe(true)
  })
})

describe('ontwerpStatus', () => {
  it('zegt hoeveel slagen er nog nodig zijn', () => {
    expect(ontwerpStatus(0, '4/4')).toEqual({ past: false, vol: false, nogNodig: 4 })
    expect(ontwerpStatus(3, '4/4')).toEqual({ past: false, vol: false, nogNodig: 1 })
    expect(ontwerpStatus(5, '4/4')).toEqual({ past: false, vol: false, nogNodig: 3 })
  })

  it('past bij een slag per tel en bij twee per tel', () => {
    expect(ontwerpStatus(4, '4/4')).toEqual({ past: true, vol: false, nogNodig: 0 })
    expect(ontwerpStatus(8, '4/4')).toEqual({ past: true, vol: true, nogNodig: 0 })
    expect(ontwerpStatus(6, '3/4')).toEqual({ past: true, vol: true, nogNodig: 0 })
  })

  it('kent in 6/8 alleen een slag per achtste', () => {
    expect(ontwerpStatus(3, '6/8')).toEqual({ past: false, vol: false, nogNodig: 3 })
    expect(ontwerpStatus(6, '6/8')).toEqual({ past: true, vol: true, nogNodig: 0 })
  })
})

describe('telLabels', () => {
  it('telt achtsten als 1 & 2 &', () => {
    expect(telLabels(8, '4/4')).toEqual(['1', '&', '2', '&', '3', '&', '4', '&'])
  })

  it('telt een slag per tel gewoon door', () => {
    expect(telLabels(4, '4/4')).toEqual(['1', '2', '3', '4'])
    expect(telLabels(6, '6/8')).toEqual(['1', '2', '3', '4', '5', '6'])
  })

  it('geeft niets als het patroon niet past', () => {
    expect(telLabels(5, '4/4')).toEqual([])
  })
})
