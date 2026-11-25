import { describe, expect, it } from 'vitest'
import { valideerAkkoorden, valideerInhoud, valideerLiedje, valideerOefening, valideerRiff } from '../src/lib/validatie'

const A = {
  naam: 'A',
  variant: 'eigen',
  titel: 'Eigen',
  standaard: true,
  frets: ['x', 0, 2, 2, 2, 0],
  vingers: [0, 0, 2, 1, 3, 0],
  moeilijkheid: 1,
}
const D = { naam: 'D', variant: 'standaard', titel: 'Standaard', standaard: true, frets: ['x', 'x', 0, 2, 3, 2], vingers: [0, 0, 0, 1, 3, 2], moeilijkheid: 1 }
const F = {
  naam: 'F',
  variant: 'barre',
  titel: 'Barré',
  standaard: true,
  frets: [1, 3, 3, 2, 1, 1],
  vingers: [1, 3, 4, 2, 1, 1],
  barre: { fret: 1, vanSnaar: 0, totSnaar: 5 },
  moeilijkheid: 4,
}
const hoogA = {
  naam: 'A',
  variant: 'barre',
  titel: 'Barré',
  standaard: false,
  frets: [5, 7, 7, 6, 5, 5],
  vingers: [1, 3, 4, 2, 1, 1],
  barre: { fret: 5, vanSnaar: 0, totSnaar: 5 },
  basisfret: 5,
  moeilijkheid: 4,
}

function met<T extends object>(basis: T, wijziging: Record<string, unknown>): Record<string, unknown> {
  return { ...basis, ...wijziging }
}

describe('valideerAkkoorden', () => {
  it('keurt goede akkoorden goed', () => {
    expect(valideerAkkoorden([A, D, F, hoogA])).toEqual([])
  })

  it('vindt fouten in de vorm', () => {
    const fouten = (x: unknown) => valideerAkkoorden([x])
    expect(fouten(met(A, { naam: 'H' }))).toEqual(['Akkoord H (eigen): onbekende akkoordnaam'])
    expect(fouten(met(A, { variant: 'Eigen A' }))[0]).toMatch(/variant/)
    expect(fouten(met(A, { titel: '' }))[0]).toMatch(/titel/)
    expect(fouten(met(A, { frets: ['x', 0, 2, 2, 2] }))[0]).toMatch(/6 frets/)
    expect(fouten(met(A, { frets: ['x', 0, 2, 2, 2, 'o'] })).join()).toMatch(/fret/)
    expect(fouten(met(A, { vingers: [0, 0, 2, 1, 5, 0] })).join()).toMatch(/vinger/)
    expect(fouten(met(A, { moeilijkheid: 6 }))[0]).toMatch(/moeilijkheid/)
    expect(fouten(met(A, { tekst: 'la la' }))).toEqual(['Akkoord A (eigen): onbekend veld "tekst"'])
  })

  it('vingers passen bij de frets', () => {
    expect(valideerAkkoorden([met(A, { vingers: [0, 1, 2, 1, 3, 0] })]).join()).toMatch(/open of niet gespeelde snaar/)
    expect(valideerAkkoorden([met(A, { vingers: [0, 0, 0, 1, 3, 0] })]).join()).toMatch(/zonder vinger/)
    expect(valideerAkkoorden([met(D, { vingers: [0, 0, 0, 1, 1, 2] })]).join()).toMatch(/vinger 1 op twee frets/)
  })

  it('controleert de tonen tegen de naam', () => {
    expect(valideerAkkoorden([met(A, { naam: 'Am' })])).toEqual(['Akkoord Am (eigen): klinkt niet als Am (C# hoort er niet in, C ontbreekt)'])
    expect(valideerAkkoorden([met(D, { naam: 'D7' })])).toEqual(['Akkoord D7 (standaard): klinkt niet als D7 (C ontbreekt)'])
  })

  it('controleert positie en barré', () => {
    expect(valideerAkkoorden([met(hoogA, { basisfret: undefined })]).join()).toMatch(/basisfret/)
    expect(valideerAkkoorden([met(F, { barre: { fret: 2, vanSnaar: 0, totSnaar: 5 } })]).join()).toMatch(/barré/)
    expect(valideerAkkoorden([met(F, { barre: { fret: 1, vanSnaar: 5, totSnaar: 0 } })]).join()).toMatch(/barré/)
  })

  it('precies één standaard per naam, en unieke varianten', () => {
    expect(valideerAkkoorden([A, met(A, { variant: 'klassiek' })])).toEqual(['Akkoord A: 2 standaardvarianten, er mag er één zijn'])
    expect(valideerAkkoorden([hoogA])).toEqual(['Akkoord A: geen standaardvariant'])
    expect(valideerAkkoorden([A, met(A, { standaard: false })])).toEqual(['Akkoord A: variant eigen staat er twee keer in'])
    expect(valideerAkkoorden({})).toEqual(['akkoorden.json: moet een lijst zijn'])
  })
})

const wonderwall = {
  id: 'wonderwall',
  titel: 'Wonderwall',
  artiest: 'Oasis',
  soort: 'pop',
  toonsoort: 'F#m',
  capo: 2,
  bpm: 87,
  maatsoort: '4/4',
  slagpatroon: 'D - D U - U D U',
  secties: [
    { naam: 'couplet', maten: [['A', 'D'], ['A']] },
    { naam: 'refrein', maten: [['D']] },
  ],
  volgorde: ['couplet', 'refrein', 'couplet'],
  origineleAkkoorden: ['Asus2'],
  bron: 'ai-gegenereerd',
  geverifieerd: false,
}
const bekend = ['A', 'D']

describe('valideerLiedje', () => {
  it('keurt een goed liedje goed', () => {
    expect(valideerLiedje(wonderwall, bekend)).toEqual([])
  })

  it('vindt fouten', () => {
    const fout = (w: Record<string, unknown>) => valideerLiedje(met(wonderwall, w), bekend).join(' | ')
    expect(fout({ id: 'Wonder Wall' })).toMatch(/id/)
    expect(fout({ toonsoort: 'F#7' })).toMatch(/toonsoort/)
    expect(fout({ capo: 13 })).toMatch(/capo/)
    expect(fout({ bpm: 10 })).toMatch(/bpm/)
    expect(fout({ maatsoort: '5/4' })).toMatch(/maatsoort/)
    expect(fout({ slagpatroon: 'D D U' })).toMatch(/slagpatroon heeft 3 slagen/)
    expect(fout({ slagpatroon: 'D X U' })).toMatch(/slagpatroon/)
    expect(fout({ secties: [{ naam: 'couplet', maten: [['A', 'D', 'A']] }, { naam: 'refrein', maten: [['D']] }] })).toMatch(/3 akkoorden/)
    expect(fout({ secties: [{ naam: 'couplet', maten: [['A', 'G']] }, { naam: 'refrein', maten: [['D']] }] })).toMatch(/G staat niet in akkoorden.json/)
    expect(fout({ volgorde: ['couplet', 'brug'] })).toMatch(/brug/)
    expect(fout({ volgorde: ['couplet'] })).toMatch(/refrein wordt nooit gespeeld/)
    expect(fout({ bron: 'internet' })).toMatch(/bron/)
    expect(fout({ geverifieerd: 'nee' })).toMatch(/geverifieerd/)
    expect(fout({ origineleAkkoorden: ['Q'] })).toMatch(/origineleAkkoorden/)
    expect(fout({ tekst: 'Today is gonna be the day' })).toMatch(/onbekend veld "tekst"/)
  })
})

const spider = {
  id: 'spider',
  titel: 'Spider',
  doel: 'Vingers los',
  stappen: ['Zet je wijsvinger op fret 1'],
  tab: ['e|-1-2-3-4-|'],
  standaardtempo: 60,
}

describe('valideerOefening', () => {
  it('keurt een goede oefening goed', () => {
    expect(valideerOefening(spider)).toEqual([])
    expect(valideerOefening(met(spider, { maatsoort: '4/4', slagpatroon: 'D D D D' }))).toEqual([])
  })

  it('vindt fouten', () => {
    expect(valideerOefening(met(spider, { stappen: [] })).join()).toMatch(/stappen/)
    expect(valideerOefening(met(spider, { standaardtempo: 300 })).join()).toMatch(/standaardtempo/)
    expect(valideerOefening(met(spider, { tab: 'e|--|' })).join()).toMatch(/tab/)
    expect(valideerOefening(met(spider, { maatsoort: '3/4', slagpatroon: 'D D D D' })).join()).toMatch(/slagpatroon/)
  })
})

const riff = {
  id: 'seven-nation-army',
  titel: 'Seven Nation Army',
  artiest: 'The White Stripes',
  bpm: 124,
  maatsoort: '4/4',
  onderverdeling: 4,
  maten: 2,
  noten: [
    { stap: 0, snaar: 'A', fret: 7 },
    { stap: 31, snaar: 'e', fret: 0 },
  ],
  uitleg: ['Alles op de A-snaar.'],
  bron: 'ai-gegenereerd',
  geverifieerd: false,
}

describe('valideerRiff', () => {
  it('keurt een goede riff goed', () => {
    expect(valideerRiff(riff)).toEqual([])
    expect(valideerRiff(met(riff, { maatsoort: '6/8', onderverdeling: 1, maten: 6 }))).toEqual([])
  })

  it('vindt fouten', () => {
    const fout = (wijziging: Record<string, unknown>) => valideerRiff(met(riff, wijziging)).join()
    expect(fout({ id: 'Seven Nation' })).toMatch(/id/)
    expect(fout({ bpm: 10 })).toMatch(/bpm/)
    expect(fout({ onderverdeling: 3 })).toMatch(/onderverdeling/)
    expect(fout({ maten: 0 })).toMatch(/maten/)
    expect(fout({ noten: [] })).toMatch(/noten/)
    expect(fout({ noten: [{ stap: 32, snaar: 'A', fret: 7 }] })).toMatch(/stap 32 valt buiten/)
    expect(fout({ noten: [{ stap: 0, snaar: 'H', fret: 7 }] })).toMatch(/snaar/)
    expect(fout({ noten: [{ stap: 0, snaar: 'A', fret: 25 }] })).toMatch(/fret/)
    expect(fout({ noten: [{ stap: 0, snaar: 'A', fret: 7 }, { stap: 0, snaar: 'A', fret: 5 }] })).toMatch(/twee noten/)
    expect(fout({ uitleg: [] })).toMatch(/uitleg/)
    expect(fout({ bron: 'internet' })).toMatch(/bron/)
    expect(fout({ tab: ['e|---|'] })).toMatch(/onbekend veld "tab"/)
  })
})

describe('valideerInhoud', () => {
  it('ids zijn uniek', () => {
    expect(valideerInhoud({ akkoorden: [A, D], liedjes: [wonderwall, wonderwall], oefeningen: [spider, spider], riffs: [riff, riff] })).toEqual([
      'Liedje wonderwall: id staat er twee keer in',
      'Oefening spider: id staat er twee keer in',
      'Riff seven-nation-army: id staat er twee keer in',
    ])
  })
})
