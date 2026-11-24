import { describe, expect, it } from 'vitest'
import {
  beoordeel,
  duurTekst,
  geldigPaar,
  geldigeReeks,
  geschiedenis,
  paarSleutel,
  record,
  reeksSleutel,
  resultaatTekst,
  SPIDER_SLEUTEL,
  standaardAkkoorden,
  voegResultaatToe,
} from '../src/lib/challenges'
import { demoVoortgang } from '../src/lib/demo'
import type { ChallengeResultaat, Voortgang } from '../src/lib/types'
import { nieuweVoortgang } from '../src/lib/voortgang'

function omc(sleutel: string, waarde: number, datum: string): ChallengeResultaat {
  return { type: 'one-minute-changes', sleutel, waarde, datum }
}

function metResultaten(...challenges: ChallengeResultaat[]): Voortgang {
  return { ...nieuweVoortgang(), challenges }
}

describe('paarSleutel', () => {
  it('zet de akkoorden alfabetisch, zodat A-D en D-A hetzelfde paar zijn', () => {
    expect(paarSleutel('A', 'D')).toBe('A-D')
    expect(paarSleutel('D', 'A')).toBe('A-D')
    expect(paarSleutel('G', 'Em')).toBe('Em-G')
    expect(paarSleutel('Am', 'A')).toBe('A-Am')
  })
})

describe('reeksSleutel', () => {
  it('houdt de volgorde van de reeks aan', () => {
    expect(reeksSleutel(['G', 'C', 'D'])).toBe('G-C-D')
    expect(reeksSleutel(['D', 'C', 'G'])).toBe('D-C-G')
  })
})

describe('voegResultaatToe', () => {
  it('voegt toe zonder de oude voortgang te veranderen', () => {
    const oud = metResultaten(omc('A-D', 10, '2026-11-20T18:00:00.000Z'))
    const nieuw = voegResultaatToe(oud, omc('A-D', 12, '2026-11-21T18:00:00.000Z'))
    expect(nieuw.challenges.map((c) => c.waarde)).toEqual([10, 12])
    expect(oud.challenges).toHaveLength(1)
  })
})

describe('record', () => {
  const v = metResultaten(
    omc('A-D', 20, '2026-11-20T18:00:00.000Z'),
    omc('A-D', 25, '2026-11-21T18:00:00.000Z'),
    omc('Em-G', 30, '2026-11-21T19:00:00.000Z'),
    omc('A-D', 22, '2026-11-22T18:00:00.000Z'),
    { type: 'spider-ladder', sleutel: SPIDER_SLEUTEL, waarde: 80, datum: '2026-11-22T18:00:00.000Z' },
  )

  it('geeft het resultaat met de hoogste waarde voor die sleutel', () => {
    expect(record(v, 'one-minute-changes', 'A-D')).toEqual(omc('A-D', 25, '2026-11-21T18:00:00.000Z'))
  })

  it('zonder sleutel het beste van het hele type', () => {
    expect(record(v, 'one-minute-changes')?.sleutel).toBe('Em-G')
    expect(record(v, 'spider-ladder')?.waarde).toBe(80)
  })

  it('null als er nog niets is', () => {
    expect(record(v, 'wisselreeks')).toBeNull()
    expect(record(v, 'one-minute-changes', 'C-G')).toBeNull()
  })

  it('bij een gelijke stand telt wie het eerst haalde', () => {
    const gelijk = metResultaten(omc('A-D', 25, '2026-11-22T18:00:00.000Z'), omc('A-D', 25, '2026-11-21T18:00:00.000Z'))
    expect(record(gelijk, 'one-minute-changes', 'A-D')?.datum).toBe('2026-11-21T18:00:00.000Z')
  })

  it('wisselreeks: bij evenveel seconden wint het hogere tempo', () => {
    const w = metResultaten(
      { type: 'wisselreeks', sleutel: 'G-C-D', waarde: 60, bpm: 60, datum: '2026-11-20T18:00:00.000Z' },
      { type: 'wisselreeks', sleutel: 'G-C-D', waarde: 60, bpm: 80, datum: '2026-11-21T18:00:00.000Z' },
    )
    expect(record(w, 'wisselreeks', 'G-C-D')?.bpm).toBe(80)
  })

  it('een nieuw resultaat dat het record verbetert, wordt het record', () => {
    const daarna = voegResultaatToe(v, omc('A-D', 26, '2026-11-23T18:00:00.000Z'))
    expect(record(daarna, 'one-minute-changes', 'A-D')?.waarde).toBe(26)
  })
})

describe('geschiedenis', () => {
  const v = metResultaten(
    omc('A-D', 22, '2026-11-22T18:00:00.000Z'),
    omc('Em-G', 30, '2026-11-21T19:00:00.000Z'),
    omc('A-D', 20, '2026-11-20T18:00:00.000Z'),
  )

  it('van oud naar nieuw, alleen die sleutel', () => {
    expect(geschiedenis(v, 'one-minute-changes', 'A-D').map((c) => c.waarde)).toEqual([20, 22])
  })

  it('zonder sleutel alles van het type, ook van oud naar nieuw', () => {
    expect(geschiedenis(v, 'one-minute-changes').map((c) => c.waarde)).toEqual([20, 30, 22])
    expect(geschiedenis(v, 'spider-ladder')).toEqual([])
  })
})

describe('demo-voortgang', () => {
  const demo = demoVoortgang(new Date('2026-11-24T12:00:00'))

  it('heeft een record en een stijgende geschiedenis voor elke challenge', () => {
    expect(record(demo, 'one-minute-changes', paarSleutel('D', 'A'))?.waarde).toBe(31)
    expect(record(demo, 'spider-ladder')?.waarde).toBe(70)
    expect(record(demo, 'wisselreeks', 'G-C-D')).toMatchObject({ waarde: 70, bpm: 70 })
    const spider = geschiedenis(demo, 'spider-ladder', SPIDER_SLEUTEL)
    expect(spider.length).toBeGreaterThanOrEqual(3)
    expect(spider[spider.length - 1].datum > spider[0].datum).toBe(true)
  })
})

describe('beoordeel', () => {
  const vorig = omc('A-D', 25, '2026-11-21T18:00:00.000Z')

  it('nieuw record alleen als het oude echt verbeterd is', () => {
    expect(beoordeel(26, vorig)).toBe('nieuw-record')
    expect(beoordeel(25, vorig)).toBe('evenaard')
    expect(beoordeel(24, vorig)).toBe('onder-record')
  })

  it('zonder vorig record is het je eerste', () => {
    expect(beoordeel(3, null)).toBe('eerste')
  })
})

describe('teksten', () => {
  it('duurTekst', () => {
    expect(duurTekst(45)).toBe('45 s')
    expect(duurTekst(60)).toBe('1 min')
    expect(duurTekst(90)).toBe('1 min 30 s')
  })

  it('resultaatTekst per challenge', () => {
    expect(resultaatTekst(omc('A-D', 1, 'x'))).toBe('1 wissel')
    expect(resultaatTekst(omc('A-D', 31, 'x'))).toBe('31 wissels')
    expect(resultaatTekst({ type: 'spider-ladder', sleutel: 'spider', waarde: 70, datum: 'x' })).toBe('70 bpm')
    expect(resultaatTekst({ type: 'wisselreeks', sleutel: 'G-C-D', waarde: 90, bpm: 80, datum: 'x' })).toBe('1 min 30 s op 80 bpm')
  })
})

describe('akkoorden kiezen', () => {
  const namen = ['A', 'Am', 'C', 'D', 'E', 'Em', 'G']

  it('standaard eerst je akkoorden op oefenen, dan die je kunt, dan de rest', () => {
    const v: Voortgang = { ...nieuweVoortgang(), akkoordStatus: { E: 'kan ik', G: 'oefenen', C: 'oefenen' } }
    expect(standaardAkkoorden(v, namen, 2)).toEqual(['C', 'G'])
    expect(standaardAkkoorden(v, namen, 4)).toEqual(['C', 'G', 'E', 'A'])
    expect(standaardAkkoorden(nieuweVoortgang(), namen, 2)).toEqual(['A', 'D'])
  })

  it('geldigPaar: twee verschillende akkoorden die bestaan', () => {
    expect(geldigPaar('D', 'A', namen)).toEqual(['D', 'A'])
    expect(geldigPaar('A', 'A', namen)).toBeNull()
    expect(geldigPaar('A', 'X', namen)).toBeNull()
    expect(geldigPaar(undefined, 'A', namen)).toBeNull()
  })

  it('geldigeReeks: drie of vier bestaande akkoorden', () => {
    expect(geldigeReeks(['G', 'C', 'D'], namen)).toEqual(['G', 'C', 'D'])
    expect(geldigeReeks(['G', 'C', 'D', 'Em'], namen)).toEqual(['G', 'C', 'D', 'Em'])
    expect(geldigeReeks(['G', 'C'], namen)).toBeNull()
    expect(geldigeReeks(['G', 'C', 'D', 'Em', 'A'], namen)).toBeNull()
    expect(geldigeReeks(['G', 'C', 'X'], namen)).toBeNull()
    expect(geldigeReeks(undefined, namen)).toBeNull()
  })

  it('geldigeReeks: geen twee dezelfde achter elkaar, ook niet van het eind naar het begin', () => {
    expect(geldigeReeks(['G', 'G', 'D'], namen)).toBeNull()
    expect(geldigeReeks(['G', 'C', 'G'], namen)).toBeNull()
    expect(geldigeReeks(['G', 'C', 'G', 'D'], namen)).toEqual(['G', 'C', 'G', 'D'])
  })
})
