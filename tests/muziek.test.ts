import { describe, expect, it } from 'vitest'
import {
  akkoordenPassenInMaat,
  akkoordenVan,
  capoSuggestie,
  klinkendAkkoord,
  klinkendeTonen,
  leeradvies,
  leesMaatsoort,
  leesSlagpatroon,
  ontbrekendeAkkoorden,
  ontleedAkkoord,
  slagenPasInMaat,
  slagenPerTel,
  speelVolgorde,
  speelbaarheidsLabel,
  tonenVan,
  transponeer,
  vereenvoudig,
  vereenvoudigingen,
  vormBijCapo,
  zelfdeAkkoord,
} from '../src/lib/muziek'
import type { Liedje } from '../src/lib/types'

function liedje(id: string, akkoorden: string[], extra: Partial<Liedje> = {}): Liedje {
  return {
    id,
    titel: id,
    artiest: 'Iemand',
    soort: 'pop',
    toonsoort: 'C',
    capo: 0,
    bpm: 90,
    maatsoort: '4/4',
    slagpatroon: 'D - D U - U D U',
    secties: [{ naam: 'couplet', maten: akkoorden.map((a) => [a]) }],
    volgorde: ['couplet'],
    bron: 'ai-gegenereerd',
    geverifieerd: false,
    ...extra,
  }
}

describe('ontleedAkkoord', () => {
  it('leest grondtoon, suffix en bas', () => {
    expect(ontleedAkkoord('F#m')).toMatchObject({ grondtoon: 6, grondnaam: 'F#', suffix: 'm' })
    expect(ontleedAkkoord('Bbmaj7')).toMatchObject({ grondtoon: 10, grondnaam: 'Bb', suffix: 'maj7' })
    expect(ontleedAkkoord('Cadd9/G')).toMatchObject({ grondtoon: 0, suffix: 'add9', bas: { toon: 7, naam: 'G' } })
    expect(ontleedAkkoord('B')).toMatchObject({ grondtoon: 11, suffix: '' })
  })

  it('weigert onzin', () => {
    expect(ontleedAkkoord('H')).toBeNull()
    expect(ontleedAkkoord('Cmajor')).toBeNull()
    expect(ontleedAkkoord('C/X')).toBeNull()
    expect(ontleedAkkoord('')).toBeNull()
  })
})

describe('zelfdeAkkoord', () => {
  it('ziet enharmonische namen als hetzelfde', () => {
    expect(zelfdeAkkoord('A#m', 'Bbm')).toBe(true)
    expect(zelfdeAkkoord('Gb/Db', 'F#/C#')).toBe(true)
    expect(zelfdeAkkoord('A', 'Am')).toBe(false)
    expect(zelfdeAkkoord('C', 'C/G')).toBe(false)
  })
})

describe('transponeren', () => {
  it('schuift grondtoon en bas en houdt de suffix', () => {
    expect(transponeer('C', 2)).toBe('D')
    expect(transponeer('Am', 3)).toBe('Cm')
    expect(transponeer('Cadd9/G', 2)).toBe('Dadd9/A')
    expect(transponeer('E7', -5)).toBe('B7')
    expect(transponeer('G', 12)).toBe('G')
  })

  it('kiest de gebruikelijke spelling bij een natuurlijke toon', () => {
    expect(transponeer('A', 1)).toBe('Bb')
    expect(transponeer('Am', 1)).toBe('Bbm')
    expect(transponeer('E', -1)).toBe('Eb')
    expect(transponeer('Em', -1)).toBe('Ebm')
    expect(transponeer('E', 2)).toBe('F#')
    expect(transponeer('Em', 2)).toBe('F#m')
    expect(transponeer('C', 1)).toBe('C#')
  })

  it('houdt kruisen of mollen aan zoals het origineel', () => {
    expect(transponeer('F#', 2)).toBe('G#')
    expect(transponeer('Gb', 2)).toBe('Ab')
    expect(transponeer('C#m', -1)).toBe('Cm')
    expect(transponeer('A', 1, 'kruis')).toBe('A#')
  })

  it('gooit bij een onbekende naam', () => {
    expect(() => transponeer('X', 1)).toThrow()
  })
})

describe('capo', () => {
  it('een vorm met capo klinkt hoger', () => {
    expect(klinkendAkkoord('Em', 2)).toBe('F#m')
    expect(klinkendAkkoord('G', 0)).toBe('G')
    expect(vormBijCapo('F#m', 2)).toBe('Em')
    expect(vormBijCapo('Bb', 3)).toBe('G')
  })
})

describe('tonen', () => {
  it('klinkendeTonen leest de toonklassen van de snaren', () => {
    expect(klinkendeTonen(['x', 0, 2, 2, 2, 0]).sort((a, b) => a - b)).toEqual([1, 4, 9])
    expect(klinkendeTonen(['x', 'x', 'x', 'x', 'x', 'x'])).toEqual([])
  })

  it('tonenVan geeft verplichte en toegestane tonen', () => {
    expect(tonenVan('A')).toEqual({ verplicht: [9, 1], toegestaan: [9, 1, 4] })
    expect(tonenVan('Cadd9/G')?.verplicht).toEqual(expect.arrayContaining([0, 2, 4, 7]))
    expect(tonenVan('Q')).toBeNull()
  })
})

describe('akkoordenVan en speelVolgorde', () => {
  const l = liedje('x', [], {
    secties: [
      { naam: 'couplet', maten: [['G'], ['C', 'D']] },
      { naam: 'refrein', maten: [['Em'], ['G']] },
    ],
    volgorde: ['couplet', 'refrein', 'couplet'],
  })

  it('akkoordenVan geeft elk akkoord één keer, in volgorde van voorkomen', () => {
    expect(akkoordenVan(l)).toEqual(['G', 'C', 'D', 'Em'])
  })

  it('speelVolgorde rolt de volgorde uit tot maten', () => {
    const maten = speelVolgorde(l)
    expect(maten.map((m) => m.akkoorden.join('+'))).toEqual(['G', 'C+D', 'Em', 'G', 'G', 'C+D'])
    expect(maten[4]).toEqual({ sectie: 'couplet', volgordeIndex: 2, maatIndex: 0, akkoorden: ['G'] })
  })
})

describe('speelbaarheid', () => {
  it('ontbrekendeAkkoorden telt alleen wat je niet kent', () => {
    expect(ontbrekendeAkkoorden(liedje('x', ['G', 'C', 'D', 'G']), ['G', 'D'])).toEqual(['C'])
    expect(ontbrekendeAkkoorden(liedje('x', ['A#m']), ['Bbm'])).toEqual([])
  })

  it('label', () => {
    expect(speelbaarheidsLabel([])).toBe('Kan je spelen')
    expect(speelbaarheidsLabel(['G'])).toBe('Mist 1 akkoord: G')
    expect(speelbaarheidsLabel(['G', 'C', 'F'])).toBe('Mist er 3')
  })
})

describe('vereenvoudigingen', () => {
  it('kent de vaste vervangers en laat extensies weg', () => {
    expect(vereenvoudigingen('F')).toEqual(['Fmaj7'])
    expect(vereenvoudigingen('E7')).toEqual(['E'])
    expect(vereenvoudigingen('Am7')).toEqual(['Am'])
    expect(vereenvoudigingen('Cadd9/G')).toEqual(['Cadd9', 'C'])
    expect(vereenvoudigingen('Asus2')).toEqual(['A'])
    expect(vereenvoudigingen('E#')).toEqual(['E#maj7'])
    expect(vereenvoudigingen('G')).toEqual([])
  })

  it('vereenvoudig kiest per ontbrekend akkoord een bekend alternatief', () => {
    expect(vereenvoudig(['C', 'F', 'G7', 'Bb'], ['C', 'Fmaj7', 'G'])).toEqual({ F: 'Fmaj7', G7: 'G' })
  })
})

describe('capoSuggestie', () => {
  it('vindt een capo waarbij alle vormen bekend zijn', () => {
    const kumbaya = liedje('k', ['C', 'F', 'G'])
    expect(capoSuggestie(kumbaya, ['G', 'C', 'D'])).toEqual({ capo: 5, vormen: { C: 'G', F: 'C', G: 'D' }, vereenvoudigd: [] })
  })

  it('rekent vanaf de capo van het liedje', () => {
    const l = liedje('x', ['Em', 'G', 'D', 'A'], { capo: 2 })
    expect(capoSuggestie(l, ['F#m', 'A', 'E', 'B'])).toMatchObject({ capo: 0, vormen: { Em: 'F#m', G: 'A', D: 'E', A: 'B' } })
  })

  it('gebruikt een vereenvoudiging als het niet anders kan', () => {
    const l = liedje('x', ['Dm', 'C', 'A7'])
    expect(capoSuggestie(l, ['Am', 'G', 'E'])).toEqual({ capo: 5, vormen: { Dm: 'Am', C: 'G', A7: 'E' }, vereenvoudigd: ['A7'] })
  })

  it('geeft de bekende spelling terug', () => {
    const l = liedje('x', ['Ab'], { capo: 0 })
    expect(capoSuggestie(l, ['G#'])).toBeNull()
    expect(capoSuggestie(liedje('x', ['Bb']), ['A#'])).toBeNull()
    expect(capoSuggestie(liedje('x', ['C']), ['A#'])?.vormen).toEqual({ C: 'A#' })
  })

  it('geeft niets als het al lukt of als geen capo helpt', () => {
    expect(capoSuggestie(liedje('x', ['G', 'C']), ['G', 'C'])).toBeNull()
    expect(capoSuggestie(liedje('x', ['G', 'C']), ['B7'])).toBeNull()
  })

  it('kiest liever zonder vereenvoudiging, dan dicht bij de oude capo', () => {
    const l = liedje('x', ['C', 'G'])
    expect(capoSuggestie(l, ['A', 'E', 'G', 'D', 'Bb', 'Fmaj7'])?.capo).toBe(3)
  })
})

describe('leeradvies', () => {
  const liedjes = [
    liedje('a', ['G', 'C', 'D']),
    liedje('b', ['G', 'C', 'Em']),
    liedje('c', ['G', 'D', 'Em']),
    liedje('d', ['F', 'Bb']),
  ]

  it('kiest het akkoord dat de meeste liedjes speelbaar maakt', () => {
    expect(leeradvies(liedjes, ['G', 'D', 'Em'])).toEqual({ akkoord: 'C', nieuwSpeelbaar: ['a', 'b'], inLiedjes: 2 })
  })

  it('valt terug op het akkoord dat in de meeste liedjes zit', () => {
    expect(leeradvies(liedjes, [])).toMatchObject({ akkoord: 'G', nieuwSpeelbaar: [], inLiedjes: 3 })
  })

  it('geeft niets als je alles kunt', () => {
    expect(leeradvies(liedjes.slice(0, 1), ['G', 'C', 'D'])).toBeNull()
  })
})

describe('slagpatroon en maatsoort', () => {
  it('leest een slagpatroon', () => {
    expect(leesSlagpatroon('D - D U - U D U')).toEqual(['D', '-', 'D', 'U', '-', 'U', 'D', 'U'])
    expect(leesSlagpatroon('  D  U ')).toEqual(['D', 'U'])
    expect(leesSlagpatroon('D x U')).toBeNull()
    expect(leesSlagpatroon('DU')).toBeNull()
    expect(leesSlagpatroon('')).toBeNull()
  })

  it('leest een maatsoort', () => {
    expect(leesMaatsoort('6/8')).toEqual({ tellen: 6, noemer: 8 })
    expect(leesMaatsoort('3/4')).toEqual({ tellen: 3, noemer: 4 })
  })

  it('aantal slagen past bij de maatsoort', () => {
    expect(slagenPasInMaat(8, '4/4')).toBe(true)
    expect(slagenPasInMaat(4, '4/4')).toBe(true)
    expect(slagenPasInMaat(6, '4/4')).toBe(false)
    expect(slagenPasInMaat(6, '3/4')).toBe(true)
    expect(slagenPasInMaat(6, '6/8')).toBe(true)
    expect(slagenPasInMaat(12, '6/8')).toBe(false)
    expect(slagenPerTel(8, '4/4')).toBe(2)
    expect(slagenPerTel(6, '6/8')).toBe(1)
  })

  it('akkoorden in een maat verdelen de tellen gelijk', () => {
    expect(akkoordenPassenInMaat(2, '4/4')).toBe(true)
    expect(akkoordenPassenInMaat(3, '4/4')).toBe(false)
    expect(akkoordenPassenInMaat(3, '3/4')).toBe(true)
    expect(akkoordenPassenInMaat(2, '6/8')).toBe(true)
    expect(akkoordenPassenInMaat(0, '4/4')).toBe(false)
    expect(akkoordenPassenInMaat(6, '6/8')).toBe(false)
  })
})
