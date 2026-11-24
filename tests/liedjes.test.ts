import { describe, expect, it } from 'vitest'
import { liedjes as alleLiedjes } from '../src/data'
import { demoVoortgang } from '../src/lib/demo'
import { capoTekst, capoSuggestieTekst, isGecontroleerd, leeradviesTekst, liedjesOverzicht, toonAiLabel } from '../src/lib/liedjes'
import type { Liedje } from '../src/lib/types'
import { nieuweVoortgang, zetGecontroleerd, zetStatus, wisselFavoriet } from '../src/lib/voortgang'

function liedje(id: string, akkoorden: string[], extra: Partial<Liedje> = {}): Liedje {
  return {
    id,
    titel: id,
    artiest: 'Iemand',
    soort: 'traditioneel',
    toonsoort: 'C',
    capo: 0,
    bpm: 80,
    maatsoort: '4/4',
    slagpatroon: 'D D D D',
    secties: [{ naam: 'couplet', maten: akkoorden.map((a) => [a]) }],
    volgorde: ['couplet'],
    bron: 'ai-gegenereerd',
    geverifieerd: false,
    ...extra,
  }
}

describe('AI-label', () => {
  const ai = liedje('ai', ['A'])
  it('staat bij een AI-versie die niemand nakeek', () => {
    expect(toonAiLabel(ai, nieuweVoortgang())).toBe(true)
    expect(isGecontroleerd(ai, nieuweVoortgang())).toBe(false)
  })

  it('verdwijnt als je hem als gecontroleerd markeert, en komt terug als je dat terugdraait', () => {
    const v = zetGecontroleerd(nieuweVoortgang(), 'ai')
    expect(toonAiLabel(ai, v)).toBe(false)
    expect(isGecontroleerd(ai, v)).toBe(true)
    expect(toonAiLabel(ai, zetGecontroleerd(v, 'ai', false))).toBe(true)
  })

  it('nooit bij geverifieerd in de data, of bij een liedje van de eigenaar', () => {
    const geverifieerd = liedje('g', ['A'], { geverifieerd: true })
    expect(toonAiLabel(geverifieerd, nieuweVoortgang())).toBe(false)
    expect(isGecontroleerd(geverifieerd, nieuweVoortgang())).toBe(true)
    expect(toonAiLabel(liedje('e', ['A'], { bron: 'eigenaar' }), nieuweVoortgang())).toBe(false)
  })
})

describe('capo', () => {
  it('capoTekst', () => {
    expect(capoTekst(0)).toBe('Geen capo')
    expect(capoTekst(2)).toBe('Capo 2')
  })

  it('een suggestie als korte zin met de vormen', () => {
    const l = liedje('x', ['F', 'Bb', 'C', 'F'])
    expect(capoSuggestieTekst(l, { capo: 5, vormen: { F: 'C', Bb: 'F', C: 'G' }, vereenvoudigd: [] })).toBe(
      'Met capo 5 en de vormen C, F, G kan je dit spelen.',
    )
  })

  it('noemt elke vorm één keer', () => {
    const l = liedje('x', ['Am', 'A'])
    expect(capoSuggestieTekst(l, { capo: 2, vormen: { Am: 'Em', A: 'Em' }, vereenvoudigd: [] })).toBe('Met capo 2 en de vormen Em kan je dit spelen.')
  })

  it('zegt welke vereenvoudiging je speelt', () => {
    const l = liedje('x', ['C', 'G7'])
    // Bij capo 5: C wordt G, G7 wordt D7, en daarvoor speel je D.
    expect(capoSuggestieTekst(l, { capo: 5, vormen: { C: 'G', G7: 'D' }, vereenvoudigd: ['G7'] })).toBe(
      'Met capo 5 en de vormen G, D kan je dit spelen. Speel D voor D7.',
    )
  })

  it('zonder capo', () => {
    const l = liedje('x', ['A#'], { capo: 1 })
    expect(capoSuggestieTekst(l, { capo: 0, vormen: { 'A#': 'B' }, vereenvoudigd: [] })).toBe('Zonder capo en met de vormen B kan je dit spelen.')
  })
})

describe('leeradviesTekst', () => {
  it('telt de liedjes die erbij komen', () => {
    expect(leeradviesTekst({ akkoord: 'G', nieuwSpeelbaar: ['a', 'b', 'c'], inLiedjes: 5 })).toBe('Daarmee kan je 3 liedjes meer spelen.')
    expect(leeradviesTekst({ akkoord: 'G', nieuwSpeelbaar: ['a'], inLiedjes: 5 })).toBe('Daarmee kan je 1 liedje meer spelen.')
  })

  it('zonder nieuw speelbaar liedje: in hoeveel liedjes het zit', () => {
    expect(leeradviesTekst({ akkoord: 'F', nieuwSpeelbaar: [], inLiedjes: 4 })).toBe('Het zit in 4 liedjes die je nog niet kunt spelen.')
    expect(leeradviesTekst({ akkoord: 'F', nieuwSpeelbaar: [], inLiedjes: 1 })).toBe('Het zit in 1 liedje dat je nog niet kunt spelen.')
  })
})

describe('liedjesOverzicht', () => {
  const lijst = [liedje('drie', ['A', 'F', 'Bb', 'Eb']), liedje('alles', ['A', 'D']), liedje('een', ['A', 'G']), liedje('ook', ['D', 'A'])]
  const v = zetStatus(nieuweVoortgang(), 'A', 'kan ik')

  it('geeft per liedje het label en de soort speelbaarheid', () => {
    const o = liedjesOverzicht(lijst, v)
    const per = Object.fromEntries(o.map((r) => [r.liedje.id, r]))
    expect(per.alles).toMatchObject({ label: 'Kan je spelen', speelbaarheid: 'kan', ontbrekend: [] })
    expect(per.een).toMatchObject({ label: 'Mist 1 akkoord: G', speelbaarheid: 'bijna', ontbrekend: ['G'] })
    expect(per.drie).toMatchObject({ label: 'Mist er 3', speelbaarheid: 'mist' })
  })

  it('favorieten bovenaan, dan wat je het makkelijkst speelt, dan op titel', () => {
    expect(liedjesOverzicht(lijst, v).map((r) => r.liedje.id)).toEqual(['alles', 'ook', 'een', 'drie'])
    const fav = wisselFavoriet(v, 'drie')
    const o = liedjesOverzicht(lijst, fav)
    expect(o.map((r) => r.liedje.id)).toEqual(['drie', 'alles', 'ook', 'een'])
    expect(o[0].favoriet).toBe(true)
    expect(o[1].favoriet).toBe(false)
  })

  it('geeft een capo-suggestie en het AI-label mee', () => {
    const l = liedje('capo', ['C', 'F', 'G'])
    const r = liedjesOverzicht([l], zetStatus(zetStatus(zetStatus(nieuweVoortgang(), 'A', 'kan ik'), 'D', 'kan ik'), 'E', 'kan ik'))[0]
    expect(r.capoSuggestie).toEqual({ capo: 3, vormen: { C: 'A', F: 'D', G: 'E' }, vereenvoudigd: [] })
    expect(r.aiVersie).toBe(true)
  })

  it('met de demo-voortgang alle drie de labels en minstens één capo-suggestie', () => {
    const o = liedjesOverzicht(alleLiedjes, demoVoortgang(new Date('2026-11-24T12:00:00')))
    expect(new Set(o.map((r) => r.speelbaarheid))).toEqual(new Set(['kan', 'bijna', 'mist']))
    expect(o.some((r) => r.capoSuggestie)).toBe(true)
    expect(o.some((r) => r.aiVersie)).toBe(true)
    expect(o.some((r) => !r.aiVersie)).toBe(true)
  })
})
