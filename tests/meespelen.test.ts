import { describe, expect, it } from 'vitest'
import {
  akkoordOpTel,
  begrensTempo,
  beginMeespelen,
  meespeelBpm,
  meespeelStap,
  meespeelWeergave,
  geplandAkkoord,
  type Meespeelactie,
  type Meespeelstand,
} from '../src/lib/meespelen'
import { leesMaatsoort, speelVolgorde } from '../src/lib/muziek'
import type { Liedje, Maatsoort } from '../src/lib/types'

function liedje(maatsoort: Maatsoort, secties: Liedje['secties'], volgorde: string[]): Liedje {
  return {
    id: 'x',
    titel: 'x',
    artiest: 'x',
    soort: 'traditioneel',
    toonsoort: 'C',
    capo: 0,
    bpm: 80,
    maatsoort,
    slagpatroon: 'D D D D',
    secties,
    volgorde,
    bron: 'ai-gegenereerd',
    geverifieerd: false,
  }
}

const lied = liedje(
  '4/4',
  [
    { naam: 'couplet', maten: [['C'], ['G', 'Am']] },
    { naam: 'refrein', maten: [['F'], ['C', 'G']] },
  ],
  ['couplet', 'refrein', 'couplet'],
)
const volgorde = speelVolgorde(lied)

/** Speelt `aantal` metronoomtellen af, doorlopend vanaf `vanaf` binnen de maat. */
function tik(stand: Meespeelstand, aantal: number, maatsoort: Maatsoort = '4/4', v = volgorde, vanaf = 0): Meespeelstand {
  const tellen = leesMaatsoort(maatsoort).tellen
  for (let i = 0; i < aantal; i++) stand = meespeelStap(stand, { type: 'tel', tel: (vanaf + i) % tellen }, v)
  return stand
}

function doe(stand: Meespeelstand, ...acties: Meespeelactie[]): Meespeelstand {
  return acties.reduce((s, a) => meespeelStap(s, a, volgorde), stand)
}

/** Na het aftellen per tel welk akkoord klinkt, tot het einde of `max` tellen. */
function akkoordenPerTel(stand: Meespeelstand, maatsoort: Maatsoort, v: typeof volgorde, max = 200): string[] {
  const tellen = leesMaatsoort(maatsoort).tellen
  const uit: string[] = []
  stand = tik(stand, tellen, maatsoort, v)
  for (let i = 0; i < max; i++) {
    stand = meespeelStap(stand, { type: 'tel', tel: i % tellen }, v)
    if (stand.fase !== 'spelen') break
    uit.push(meespeelWeergave(stand, v, maatsoort).akkoord!)
  }
  return uit
}

describe('akkoordOpTel', () => {
  it('één akkoord krijgt de hele maat', () => {
    for (let tel = 0; tel < 4; tel++) expect(akkoordOpTel(['G'], tel, '4/4')).toEqual({ index: 0, akkoord: 'G', begint: tel === 0 })
  })

  it('twee akkoorden in 4/4 verdelen de tellen gelijk', () => {
    expect([0, 1, 2, 3].map((t) => akkoordOpTel(['G', 'C'], t, '4/4'))).toEqual([
      { index: 0, akkoord: 'G', begint: true },
      { index: 0, akkoord: 'G', begint: false },
      { index: 1, akkoord: 'C', begint: true },
      { index: 1, akkoord: 'C', begint: false },
    ])
  })

  it('drie akkoorden in 3/4: elk één tel', () => {
    expect([0, 1, 2].map((t) => akkoordOpTel(['G', 'C', 'D'], t, '3/4').akkoord)).toEqual(['G', 'C', 'D'])
    expect([0, 1, 2].every((t) => akkoordOpTel(['G', 'C', 'D'], t, '3/4').begint)).toBe(true)
  })

  it('twee akkoorden in 6/8: elk drie achtsten', () => {
    expect([0, 1, 2, 3, 4, 5].map((t) => akkoordOpTel(['Am', 'E'], t, '6/8').akkoord)).toEqual(['Am', 'Am', 'Am', 'E', 'E', 'E'])
    expect([0, 1, 2, 3, 4, 5].map((t) => akkoordOpTel(['Am', 'E'], t, '6/8').begint)).toEqual([true, false, false, true, false, false])
  })

  it('vier akkoorden in 4/4 en twee in 2/4', () => {
    expect([0, 1, 2, 3].map((t) => akkoordOpTel(['A', 'B', 'C', 'D'], t, '4/4').akkoord)).toEqual(['A', 'B', 'C', 'D'])
    expect([0, 1].map((t) => akkoordOpTel(['A', 'D'], t, '2/4').akkoord)).toEqual(['A', 'D'])
  })
})

describe('tempo', () => {
  it('begrenst het percentage op 40 t/m 120', () => {
    expect(begrensTempo(30)).toBe(40)
    expect(begrensTempo(40)).toBe(40)
    expect(begrensTempo(100)).toBe(100)
    expect(begrensTempo(120)).toBe(120)
    expect(begrensTempo(130)).toBe(120)
    expect(begrensTempo(Number.NaN)).toBe(100)
  })

  it('rekent het bpm uit als percentage van het liedje', () => {
    expect(meespeelBpm(80, 100)).toBe(80)
    expect(meespeelBpm(80, 50)).toBe(40)
    expect(meespeelBpm(87, 70)).toBe(61)
    expect(meespeelBpm(100, 200)).toBe(120)
    expect(meespeelBpm(100, 10)).toBe(40)
  })

  it('blijft binnen de grenzen van de metronoom', () => {
    expect(meespeelBpm(60, 40)).toBe(30)
    expect(meespeelBpm(200, 120)).toBe(220)
  })
})

describe('aftellen', () => {
  it('begint stil op de eerste maat', () => {
    const w = meespeelWeergave(beginMeespelen(), volgorde, '4/4')
    expect(w).toMatchObject({ fase: 'stil', aftellen: null, akkoord: 'C', volgend: 'G', sectie: 'couplet', actieveMaat: 0 })
  })

  it('telt een hele maat af, dan begint de eerste maat op de 1', () => {
    let s = doe(beginMeespelen(), { type: 'start' })
    expect(meespeelWeergave(s, volgorde, '4/4').aftellen).toBeNull()
    const getallen: (number | null)[] = []
    for (let tel = 0; tel < 4; tel++) {
      s = meespeelStap(s, { type: 'tel', tel }, volgorde)
      getallen.push(meespeelWeergave(s, volgorde, '4/4').aftellen)
      expect(s.fase).toBe('aftellen')
    }
    expect(getallen).toEqual([4, 3, 2, 1])
    s = meespeelStap(s, { type: 'tel', tel: 0 }, volgorde)
    expect(s).toMatchObject({ fase: 'spelen', maat: 0, tel: 0 })
    expect(meespeelWeergave(s, volgorde, '4/4')).toMatchObject({ aftellen: null, akkoord: 'C', aanslaan: true })
  })

  it('in 6/8 tel je zes achtsten af', () => {
    const v = speelVolgorde(liedje('6/8', [{ naam: 'a', maten: [['Am']] }], ['a']))
    let s = meespeelStap(beginMeespelen(), { type: 'start' }, v)
    const getallen: (number | null)[] = []
    for (let tel = 0; tel < 6; tel++) {
      s = meespeelStap(s, { type: 'tel', tel }, v)
      getallen.push(meespeelWeergave(s, v, '6/8').aftellen)
    }
    expect(getallen).toEqual([6, 5, 4, 3, 2, 1])
  })

  it('na een pauze tel je opnieuw af en ga je verder in dezelfde maat', () => {
    let s = tik(doe(beginMeespelen(), { type: 'start' }), 4 + 4 + 2)
    expect(s).toMatchObject({ fase: 'spelen', maat: 1, tel: 1 })
    s = doe(s, { type: 'pauze' })
    expect(s).toMatchObject({ fase: 'stil', maat: 1 })
    s = tik(doe(s, { type: 'start' }), 4)
    expect(s.fase).toBe('aftellen')
    s = tik(s, 1)
    expect(s).toMatchObject({ fase: 'spelen', maat: 1, tel: 0 })
  })
})

describe('meespelen volgt speelVolgorde', () => {
  it('elke maat in de volgorde van de secties, met het einde erachter', () => {
    const verwacht = volgorde.flatMap((m) => [0, 1, 2, 3].map((t) => akkoordOpTel(m.akkoorden, t, '4/4').akkoord))
    expect(akkoordenPerTel(doe(beginMeespelen(), { type: 'start' }), '4/4', volgorde)).toEqual(verwacht)
    expect(verwacht.slice(0, 8)).toEqual(['C', 'C', 'C', 'C', 'G', 'G', 'Am', 'Am'])
  })

  it('stopt na de laatste maat', () => {
    const s = tik(doe(beginMeespelen(), { type: 'start' }), 4 + volgorde.length * 4 + 1)
    expect(s.fase).toBe('einde')
    expect(meespeelWeergave(s, volgorde, '4/4')).toMatchObject({ akkoord: null, volgend: null, aanslaan: false })
  })

  it('opnieuw na het einde wist het herhalen, zodat het niet op de laatste sectie blijft hangen', () => {
    let s = tik(doe(beginMeespelen(), { type: 'start' }), 4 + volgorde.length * 4 + 1)
    s = doe(s, { type: 'herhaal', aan: true }, { type: 'start' })
    expect(s).toMatchObject({ fase: 'aftellen', maat: 0, herhaal: null })
    expect(meespeelWeergave(s, volgorde, '4/4').herhaalt).toBe(false)
  })

  it('start na het einde opnieuw vooraan', () => {
    const s = doe(tik(doe(beginMeespelen(), { type: 'start' }), 4 + volgorde.length * 4 + 1), { type: 'start' })
    expect(s).toMatchObject({ fase: 'aftellen', maat: 0 })
  })

  it('in 3/4 en 6/8', () => {
    const wals = speelVolgorde(liedje('3/4', [{ naam: 'a', maten: [['G'], ['C', 'D', 'G']] }], ['a', 'a']))
    expect(akkoordenPerTel(meespeelStap(beginMeespelen(), { type: 'start' }, wals), '3/4', wals)).toEqual(
      ['G', 'G', 'G', 'C', 'D', 'G'].concat(['G', 'G', 'G', 'C', 'D', 'G']),
    )
    const zes = speelVolgorde(liedje('6/8', [{ naam: 'a', maten: [['Am', 'E'], ['Am']] }], ['a']))
    expect(akkoordenPerTel(meespeelStap(beginMeespelen(), { type: 'start' }, zes), '6/8', zes)).toEqual([
      ...['Am', 'Am', 'Am', 'E', 'E', 'E'],
      ...['Am', 'Am', 'Am', 'Am', 'Am', 'Am'],
    ])
  })

  it('negeert tellen als hij stilstaat', () => {
    const s = beginMeespelen()
    expect(meespeelStap(s, { type: 'tel', tel: 0 }, volgorde)).toEqual(s)
  })
})

describe('volgend akkoord', () => {
  function op(maat: number, tel: number) {
    return meespeelWeergave({ ...beginMeespelen(), fase: 'spelen', maat, tel }, volgorde, '4/4')
  }

  it('het tweede akkoord in de maat, anders het eerste van de volgende maat', () => {
    expect(op(0, 0)).toMatchObject({ akkoord: 'C', volgend: 'G' })
    expect(op(1, 0)).toMatchObject({ akkoord: 'G', volgend: 'Am' })
    expect(op(1, 2)).toMatchObject({ akkoord: 'Am', volgend: 'F' })
    expect(op(3, 3)).toMatchObject({ akkoord: 'G', volgend: 'C' })
  })

  it('niets na de laatste maat', () => {
    expect(op(5, 3)).toMatchObject({ akkoord: 'Am', volgend: null })
  })

  it('met herhalen: het begin van de sectie', () => {
    const s: Meespeelstand = { fase: 'spelen', maat: 3, tel: 2, herhaal: 1 }
    expect(meespeelWeergave(s, volgorde, '4/4')).toMatchObject({ akkoord: 'G', volgend: 'F', herhaalt: true })
  })

  it('slaat aan op de 1 en bij elke akkoordwissel', () => {
    expect([0, 1, 2, 3].map((t) => op(1, t).aanslaan)).toEqual([true, false, true, false])
    expect([0, 1, 2, 3].map((t) => op(0, t).aanslaan)).toEqual([true, false, false, false])
  })
})

describe('sectie herhalen', () => {
  it('blijft dezelfde sectie spelen tot je het uitzet', () => {
    // Herhalen aanzetten in de tweede maat van het refrein.
    let s = tik(doe(beginMeespelen(), { type: 'start' }), 4 + 3 * 4 + 1)
    expect(s).toMatchObject({ maat: 3, tel: 0 })
    s = doe(s, { type: 'herhaal', aan: true })
    expect(s.herhaal).toBe(1)
    const maten: number[] = []
    for (let i = 0; i < 6 * 4; i++) {
      s = tik(s, 1, '4/4', volgorde, (1 + i) % 4)
      if (s.tel === 0) maten.push(s.maat)
    }
    expect(maten).toEqual([2, 3, 2, 3, 2, 3])
    expect(maten.map((m) => volgorde[m].sectie)).toEqual(Array(6).fill('refrein'))

    s = doe(s, { type: 'herhaal', aan: false })
    expect(s.herhaal).toBeNull()
    s = tik(s, 4, '4/4', volgorde, 1)
    expect(s).toMatchObject({ maat: 4, tel: 0 })
    expect(volgorde[s.maat]).toMatchObject({ sectie: 'couplet', volgordeIndex: 2 })
  })

  it('herhaalt de sectie op zijn plek in de volgorde, ook als hij vaker voorkomt', () => {
    let s = doe(beginMeespelen(), { type: 'naarSectie', volgordeIndex: 2 }, { type: 'herhaal', aan: true }, { type: 'start' })
    expect(s).toMatchObject({ maat: 4, herhaal: 2 })
    s = tik(s, 4)
    const maten: number[] = []
    for (let i = 0; i < 4 * 4; i++) {
      s = tik(s, 1, '4/4', volgorde, i % 4)
      if (s.tel === 0) maten.push(s.maat)
    }
    expect(maten).toEqual([4, 5, 4, 5])
  })

  it('een sectie van één maat', () => {
    const v = speelVolgorde(liedje('4/4', [{ naam: 'a', maten: [['G']] }, { naam: 'b', maten: [['C']] }], ['a', 'b']))
    let s = meespeelStap(meespeelStap(beginMeespelen(), { type: 'herhaal', aan: true }, v), { type: 'start' }, v)
    s = tik(s, 4 + 4 * 3, '4/4', v)
    expect(s).toMatchObject({ fase: 'spelen', maat: 0 })
    expect(meespeelWeergave(s, v, '4/4').volgend).toBe('G')
  })

  it('de weergave toont de maten van de huidige sectie', () => {
    const s: Meespeelstand = { fase: 'spelen', maat: 3, tel: 0, herhaal: null }
    expect(meespeelWeergave(s, volgorde, '4/4')).toMatchObject({
      sectie: 'refrein',
      volgordeIndex: 1,
      maten: [['F'], ['C', 'G']],
      actieveMaat: 1,
    })
  })
})

describe('naar een sectie', () => {
  it('stil: zet de plek op de eerste maat van die sectie', () => {
    expect(doe(beginMeespelen(), { type: 'naarSectie', volgordeIndex: 1 })).toMatchObject({ fase: 'stil', maat: 2 })
  })

  it('tijdens het spelen: telt af tot de volgende 1 en begint daar', () => {
    let s = tik(doe(beginMeespelen(), { type: 'start' }), 4 + 2)
    expect(s).toMatchObject({ fase: 'spelen', maat: 0, tel: 1 })
    s = doe(s, { type: 'naarSectie', volgordeIndex: 1 })
    expect(s).toMatchObject({ fase: 'aftellen', maat: 2 })
    s = meespeelStap(s, { type: 'tel', tel: 2 }, volgorde)
    expect(meespeelWeergave(s, volgorde, '4/4').aftellen).toBe(2)
    s = meespeelStap(s, { type: 'tel', tel: 3 }, volgorde)
    expect(meespeelWeergave(s, volgorde, '4/4').aftellen).toBe(1)
    s = meespeelStap(s, { type: 'tel', tel: 0 }, volgorde)
    expect(s).toMatchObject({ fase: 'spelen', maat: 2, tel: 0 })
  })

  it('met herhalen aan gaat het herhalen mee naar de nieuwe sectie', () => {
    const s = doe(beginMeespelen(), { type: 'herhaal', aan: true }, { type: 'naarSectie', volgordeIndex: 1 })
    expect(s.herhaal).toBe(1)
  })

  it('een onbekende sectie verandert niets', () => {
    const s = beginMeespelen()
    expect(doe(s, { type: 'naarSectie', volgordeIndex: 9 })).toEqual(s)
  })
})

describe('geplandAkkoord', () => {
  it('kiest bij het plannen van een tel het akkoord dat dan begint, ook met tellen die nog moeten klinken', () => {
    // Speel het hele liedje en plan steeds twee tellen vooruit; dat moet dezelfde aanslagen geven als direct stappen.
    const tellen = [...Array(4 + volgorde.length * 4).keys()].map((i) => i % 4)
    let stand = doe(beginMeespelen(), { type: 'start' })
    const wachtend: number[] = []
    const gepland: (string | null)[] = []
    const direct: (string | null)[] = []
    let controle = stand
    for (const tel of tellen) {
      gepland.push(geplandAkkoord(stand, wachtend, tel, volgorde, '4/4'))
      wachtend.push(tel)
      if (wachtend.length > 2) stand = meespeelStap(stand, { type: 'tel', tel: wachtend.shift()! }, volgorde)
      controle = meespeelStap(controle, { type: 'tel', tel }, volgorde)
      const w = meespeelWeergave(controle, volgorde, '4/4')
      direct.push(w.aanslaan ? w.akkoord : null)
    }
    expect(gepland).toEqual(direct)
    expect(gepland.slice(0, 12)).toEqual([null, null, null, null, 'C', null, null, null, 'G', null, 'Am', null])
  })

  it('met herhalen: na de laatste tel van de sectie weer het begin', () => {
    const s: Meespeelstand = { fase: 'spelen', maat: 3, tel: 2, herhaal: 1 }
    expect(geplandAkkoord(s, [3], 0, volgorde, '4/4')).toBe('F')
    expect(geplandAkkoord(s, [], 3, volgorde, '4/4')).toBeNull()
  })

  it('niets als hij stilstaat of na het einde', () => {
    expect(geplandAkkoord(beginMeespelen(), [], 0, volgorde, '4/4')).toBeNull()
    expect(geplandAkkoord({ fase: 'spelen', maat: 5, tel: 2 , herhaal: null }, [3], 0, volgorde, '4/4')).toBeNull()
  })
})
