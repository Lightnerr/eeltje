import { describe, expect, it } from 'vitest'
import { leesRoute, naarHash, tabVan, type Route } from '../src/lib/route'

describe('leesRoute', () => {
  it('leeg of #/ is vandaag', () => {
    expect(leesRoute('')).toEqual({ pagina: 'vandaag' })
    expect(leesRoute('#')).toEqual({ pagina: 'vandaag' })
    expect(leesRoute('#/')).toEqual({ pagina: 'vandaag' })
    expect(leesRoute('#/vandaag')).toEqual({ pagina: 'vandaag' })
  })

  it('leest alle pagina’s', () => {
    expect(leesRoute('#/akkoorden')).toEqual({ pagina: 'akkoorden' })
    expect(leesRoute('#/akkoorden/A')).toEqual({ pagina: 'akkoord', naam: 'A' })
    expect(leesRoute('#/akkoorden/F?variant=barre')).toEqual({ pagina: 'akkoord', naam: 'F', variant: 'barre' })
    expect(leesRoute('#/liedjes')).toEqual({ pagina: 'liedjes' })
    expect(leesRoute('#/liedjes/wonderwall')).toEqual({ pagina: 'liedje', id: 'wonderwall' })
    expect(leesRoute('#/liedjes/wonderwall/meespelen')).toEqual({ pagina: 'meespelen', id: 'wonderwall' })
    expect(leesRoute('#/oefenen')).toEqual({ pagina: 'oefenen' })
    expect(leesRoute('#/oefenen/metronoom')).toEqual({ pagina: 'metronoom' })
    expect(leesRoute('#/oefenen/slagpatroon')).toEqual({ pagina: 'slagpatroon' })
    expect(leesRoute('#/oefenen/oefeningen/spider')).toEqual({ pagina: 'oefening', id: 'spider' })
    expect(leesRoute('#/oefenen/riffs/billie-jean')).toEqual({ pagina: 'riff', id: 'billie-jean' })
    expect(leesRoute('#/oefenen/one-minute-changes?a=A&b=D')).toEqual({ pagina: 'one-minute-changes', a: 'A', b: 'D' })
    expect(leesRoute('#/oefenen/one-minute-changes')).toEqual({ pagina: 'one-minute-changes' })
    expect(leesRoute('#/oefenen/spider-ladder?bpm=60')).toEqual({ pagina: 'spider-ladder', bpm: 60 })
    expect(leesRoute('#/oefenen/wisselreeks?akkoorden=G,C,D&bpm=70')).toEqual({ pagina: 'wisselreeks', akkoorden: ['G', 'C', 'D'], bpm: 70 })
    expect(leesRoute('#/voortgang')).toEqual({ pagina: 'voortgang' })
  })

  it('verdraagt een slash aan het eind en een ontbrekende slash aan het begin', () => {
    expect(leesRoute('#/liedjes/')).toEqual({ pagina: 'liedjes' })
    expect(leesRoute('#akkoorden')).toEqual({ pagina: 'akkoorden' })
  })

  it('decodeert namen', () => {
    expect(leesRoute('#/akkoorden/C%23m')).toEqual({ pagina: 'akkoord', naam: 'C#m' })
    expect(leesRoute('#/akkoorden/Cadd9%2FG')).toEqual({ pagina: 'akkoord', naam: 'Cadd9/G' })
  })

  it('negeert ongeldige parameters', () => {
    expect(leesRoute('#/oefenen/spider-ladder?bpm=snel')).toEqual({ pagina: 'spider-ladder' })
    expect(leesRoute('#/oefenen/spider-ladder?bpm=-5')).toEqual({ pagina: 'spider-ladder' })
    expect(leesRoute('#/oefenen/spider-ladder?bpm=0')).toEqual({ pagina: 'spider-ladder' })
    expect(leesRoute('#/oefenen/wisselreeks?akkoorden=')).toEqual({ pagina: 'wisselreeks' })
    expect(leesRoute('#/akkoorden/A?variant=')).toEqual({ pagina: 'akkoord', naam: 'A' })
    expect(leesRoute('#/akkoorden/%E0%A4%A')).toEqual({ pagina: 'niet-gevonden' })
  })

  it('onbekend is niet-gevonden', () => {
    expect(leesRoute('#/bestaat-niet')).toEqual({ pagina: 'niet-gevonden' })
    expect(leesRoute('#/liedjes/a/b/c')).toEqual({ pagina: 'niet-gevonden' })
    expect(leesRoute('#/oefenen/oefeningen')).toEqual({ pagina: 'niet-gevonden' })
    expect(leesRoute('#/oefenen/riffs')).toEqual({ pagina: 'niet-gevonden' })
  })
})

describe('naarHash', () => {
  it('maakt de vaste vormen', () => {
    expect(naarHash({ pagina: 'vandaag' })).toBe('#/vandaag')
    expect(naarHash({ pagina: 'akkoord', naam: 'F', variant: 'barre' })).toBe('#/akkoorden/F?variant=barre')
    expect(naarHash({ pagina: 'akkoord', naam: 'C#m' })).toBe('#/akkoorden/C%23m')
    expect(naarHash({ pagina: 'wisselreeks', akkoorden: ['G', 'C', 'D'], bpm: 70 })).toBe('#/oefenen/wisselreeks?akkoorden=G,C,D&bpm=70')
    expect(naarHash({ pagina: 'wisselreeks', akkoorden: ['D/F#', 'G'] })).toBe('#/oefenen/wisselreeks?akkoorden=D%2FF%23,G')
    expect(naarHash({ pagina: 'one-minute-changes', a: 'A', b: 'D' })).toBe('#/oefenen/one-minute-changes?a=A&b=D')
    expect(naarHash({ pagina: 'niet-gevonden' })).toBe('#/niet-gevonden')
  })

  it('gaat heen en terug', () => {
    const routes: Route[] = [
      { pagina: 'vandaag' },
      { pagina: 'akkoorden' },
      { pagina: 'akkoord', naam: 'Cadd9/G' },
      { pagina: 'akkoord', naam: 'Bb', variant: 'barre' },
      { pagina: 'liedjes' },
      { pagina: 'liedje', id: 'knockin-on-heavens-door' },
      { pagina: 'meespelen', id: 'wonderwall' },
      { pagina: 'oefenen' },
      { pagina: 'metronoom' },
      { pagina: 'slagpatroon' },
      { pagina: 'oefening', id: 'spider' },
      { pagina: 'riff', id: 'seven-nation-army' },
      { pagina: 'one-minute-changes' },
      { pagina: 'one-minute-changes', a: 'F#m', b: 'D' },
      { pagina: 'spider-ladder' },
      { pagina: 'spider-ladder', bpm: 60 },
      { pagina: 'wisselreeks' },
      { pagina: 'wisselreeks', akkoorden: ['G', 'Cadd9', 'D/F#'], bpm: 70 },
      { pagina: 'voortgang' },
    ]
    for (const route of routes) expect(leesRoute(naarHash(route))).toEqual(route)
  })
})

describe('tabVan', () => {
  it('het actieve tabblad volgt uit de route', () => {
    expect(tabVan({ pagina: 'vandaag' })).toBe('vandaag')
    expect(tabVan({ pagina: 'akkoord', naam: 'A' })).toBe('akkoorden')
    expect(tabVan({ pagina: 'meespelen', id: 'x' })).toBe('liedjes')
    expect(tabVan({ pagina: 'spider-ladder' })).toBe('oefenen')
    expect(tabVan({ pagina: 'oefening', id: 'spider' })).toBe('oefenen')
    expect(tabVan({ pagina: 'riff', id: 'billie-jean' })).toBe('oefenen')
    expect(tabVan({ pagina: 'voortgang' })).toBe('voortgang')
    expect(tabVan({ pagina: 'niet-gevonden' })).toBeNull()
  })
})
