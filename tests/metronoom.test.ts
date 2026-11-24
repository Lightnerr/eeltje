import { describe, expect, it } from 'vitest'
import {
  MAX_BPM,
  wisselMaatsoort,
  wisselOnderverdeling,
  MIN_BPM,
  begrensBpm,
  beginStand,
  isAccent,
  planStappen,
  tapTempo,
  telDuur,
  voegTikToe,
  type PlanStand,
} from '../src/lib/metronoom'

describe('begrensBpm', () => {
  it('houdt het tempo tussen 30 en 220', () => {
    expect(MIN_BPM).toBe(30)
    expect(MAX_BPM).toBe(220)
    expect(begrensBpm(29)).toBe(30)
    expect(begrensBpm(30)).toBe(30)
    expect(begrensBpm(220)).toBe(220)
    expect(begrensBpm(221)).toBe(220)
    expect(begrensBpm(-5)).toBe(30)
  })

  it('rondt af op hele bpm', () => {
    expect(begrensBpm(87.4)).toBe(87)
    expect(begrensBpm(87.5)).toBe(88)
  })

  it('maakt van onzin het laagste tempo', () => {
    expect(begrensBpm(Number.NaN)).toBe(30)
    expect(begrensBpm(Number.POSITIVE_INFINITY)).toBe(30)
  })
})

describe('isAccent', () => {
  it('legt het accent op de 1 van elke maat', () => {
    expect(isAccent(0, '4/4')).toBe(true)
    expect([1, 2, 3].map((t) => isAccent(t, '4/4'))).toEqual([false, false, false])
  })

  it('volgt de maatsoort', () => {
    expect([0, 1, 2, 3].map((t) => isAccent(t, '3/4'))).toEqual([true, false, false, true])
    expect([0, 1, 2, 3, 4, 5, 6].map((t) => isAccent(t, '6/8'))).toEqual([true, false, false, false, false, false, true])
    expect([0, 1, 2].map((t) => isAccent(t, '2/4'))).toEqual([true, false, true])
  })
})

describe('tapTempo', () => {
  it('heeft minstens twee tikken nodig', () => {
    expect(tapTempo([])).toBeNull()
    expect(tapTempo([1000])).toBeNull()
  })

  it('rekent het tempo uit de afstand tussen de tikken', () => {
    expect(tapTempo([0, 500])).toBe(120)
    expect(tapTempo([0, 1000, 2000])).toBe(60)
  })

  it('neemt het gemiddelde van de laatste vier afstanden', () => {
    // De eerste afstand (2000 ms) valt buiten de laatste vier.
    expect(tapTempo([0, 1500, 2000, 2600, 3100, 3700])).toBe(109)
  })

  it('negeert een tik die te snel op de vorige volgt', () => {
    expect(tapTempo([0, 500, 1000, 1500, 1510])).toBe(120)
    expect(tapTempo([0, 30, 60, 90, 120, 150])).toBeNull()
    let herhaald: number[] = []
    for (let t = 0; t < 2000; t += 30) herhaald = voegTikToe(herhaald, t)
    expect(tapTempo(herhaald)).toBeNull()
    expect(tapTempo(voegTikToe([0, 500, 1000], 1030))).toBe(120)
  })

  it('houdt een tik die wat te vroeg komt bij een hoog tempo', () => {
    expect(tapTempo([0, 286, 530, 858, 1100, 1430])).toBe(210)
  })

  it('vangt een dubbeltik die niet heel kort is op met de mediaan', () => {
    expect(tapTempo([0, 500, 1000, 1500, 1680])).toBe(120)
  })

  it('laat een gemiste tik niet het hele tempo bepalen', () => {
    expect(tapTempo([0, 500, 1000, 1500, 2500, 3000])).toBe(120)
  })

  it('begint opnieuw na een lange pauze', () => {
    expect(tapTempo([0, 1000, 2000, 5000, 5500])).toBe(120)
    expect(tapTempo([0, 1000, 2000, 5000])).toBeNull()
  })

  it('blijft binnen de grenzen', () => {
    expect(tapTempo([0, 260, 520])).toBe(220)
    expect(tapTempo([0, 1900, 3800])).toBe(32)
  })
})

describe('voegTikToe', () => {
  it('houdt de lijst kort', () => {
    let tikken: number[] = []
    for (let i = 0; i < 40; i++) tikken = voegTikToe(tikken, i * 500)
    expect(tikken).toHaveLength(16)
    expect(tikken.at(-1)).toBe(19500)
    expect(tapTempo(tikken)).toBe(120)
  })

  it('vergeet alles na een lange pauze', () => {
    expect(voegTikToe([0, 500, 1000], 4000)).toEqual([4000])
  })

  it('muteert de oude lijst niet', () => {
    const oud = [0, 500]
    voegTikToe(oud, 1000)
    expect(oud).toEqual([0, 500])
  })
})

describe('telDuur', () => {
  it('is een minuut gedeeld door het tempo, in seconden', () => {
    expect(telDuur(60)).toBe(1)
    expect(telDuur(120)).toBe(0.5)
  })
})

describe('planStappen', () => {
  const vierKwart = (stand: PlanStand) => ({ ...stand, bpm: 120, tellen: 4, onderverdeling: 1 })

  it('plant alleen wat binnen het venster valt', () => {
    const stand = vierKwart(beginStand(10))
    const { stappen, stand: na } = planStappen(stand, 10, 0.1)
    expect(stappen).toEqual([{ slag: 0, tel: 0, opTel: true, onderverdeling: 1, tellen: 4, tijd: 10 }])
    expect(na.volgende).toBe(10.5)
    expect(planStappen(na, 10.025, 0.1).stappen).toEqual([])
  })

  it('rekent de volgende tel uit de vorige geplande tijd, niet uit de klok', () => {
    let stand = vierKwart(beginStand(0))
    const tijden: number[] = []
    // De timer komt steeds wat te laat, maar binnen het venster.
    for (let nu = 0; nu < 59.8; nu += 0.0371) {
      const r = planStappen(stand, nu, 0.1)
      stand = r.stand
      tijden.push(...r.stappen.map((s) => s.tijd))
    }
    expect(tijden.length).toBe(120)
    tijden.forEach((t, i) => expect(t).toBeCloseTo(i * 0.5, 9))
  })

  it('telt rond binnen de maat', () => {
    const { stappen } = planStappen(vierKwart(beginStand(0)), 0, 2.4)
    expect(stappen.map((s) => s.tel)).toEqual([0, 1, 2, 3, 0])
  })

  it('verdeelt een tel in slagen', () => {
    const stand = { ...beginStand(0), bpm: 60, tellen: 4, onderverdeling: 2 }
    const { stappen } = planStappen(stand, 0, 2.1)
    expect(stappen).toEqual([
      { slag: 0, tel: 0, opTel: true, onderverdeling: 2, tellen: 4, tijd: 0 },
      { slag: 1, tel: 0, opTel: false, onderverdeling: 2, tellen: 4, tijd: 0.5 },
      { slag: 2, tel: 1, opTel: true, onderverdeling: 2, tellen: 4, tijd: 1 },
      { slag: 3, tel: 1, opTel: false, onderverdeling: 2, tellen: 4, tijd: 1.5 },
      { slag: 4, tel: 2, opTel: true, onderverdeling: 2, tellen: 4, tijd: 2 },
    ])
  })

  it('neemt een nieuw tempo mee vanaf de volgende stap', () => {
    const a = planStappen(vierKwart(beginStand(0)), 0, 0.1)
    const b = planStappen({ ...a.stand, bpm: 60 }, 0.45, 0.1)
    expect(b.stappen[0].tijd).toBe(0.5)
    expect(b.stand.volgende).toBe(1.5)
  })

  it('wisselt de onderverdeling pas op de volgende tel', () => {
    const start = { ...beginStand(0), bpm: 60, tellen: 4, onderverdeling: 2 }
    const a = planStappen(start, 0, 0.1)
    expect(a.stand.slag).toBe(1)
    const b = planStappen(wisselOnderverdeling(a.stand, 1), 0.45, 1.6)
    expect(b.stappen).toEqual([
      { slag: 1, tel: 0, opTel: false, onderverdeling: 2, tellen: 4, tijd: 0.5 },
      { slag: 1, tel: 1, opTel: true, onderverdeling: 1, tellen: 4, tijd: 1 },
      { slag: 2, tel: 2, opTel: true, onderverdeling: 1, tellen: 4, tijd: 2 },
    ])
  })

  it('terug naar de oude onderverdeling vóór de tel is geen wissel', () => {
    const start = { ...beginStand(0), bpm: 60, tellen: 4, onderverdeling: 2 }
    const a = planStappen(start, 0, 0.1).stand
    expect(wisselOnderverdeling(wisselOnderverdeling(a, 1), 2)).toEqual(a)
  })

  it('begint een nieuwe maatsoort op de volgende hele tel, niet op een tussenslag', () => {
    // 3/4 met achtsten, net na de 1; dan naar 6/8 (een slag per achtste).
    const start = { ...beginStand(0), bpm: 60, tellen: 3, onderverdeling: 2 }
    const a = planStappen(start, 0, 0.1)
    const b = planStappen(wisselOnderverdeling(wisselMaatsoort(a.stand, 6), 1), 0.45, 2.6)
    expect(b.stappen).toEqual([
      { slag: 1, tel: 0, opTel: false, onderverdeling: 2, tellen: 3, tijd: 0.5 },
      { slag: 0, tel: 0, opTel: true, onderverdeling: 1, tellen: 6, tijd: 1 },
      { slag: 1, tel: 1, opTel: true, onderverdeling: 1, tellen: 6, tijd: 2 },
      { slag: 2, tel: 2, opTel: true, onderverdeling: 1, tellen: 6, tijd: 3 },
    ])
    expect(b.stand.tellen).toBe(6)
  })

  it('begint een nieuwe maatsoort ook midden in de maat op de volgende tel met de 1', () => {
    const start = { ...beginStand(0), bpm: 60, tellen: 4, onderverdeling: 2 }
    const a = planStappen(start, 0, 2.1)
    expect(a.stand.slag).toBe(5)
    const b = planStappen(wisselMaatsoort(a.stand, 2), 2.45, 1.1)
    expect(b.stappen.map((s) => [s.slag, s.tel, s.opTel, s.tellen, s.tijd])).toEqual([
      [5, 2, false, 4, 2.5],
      [0, 0, true, 2, 3],
      [1, 0, false, 2, 3.5],
    ])
  })

  it('springt na een bevroren timer naar nu in plaats van alles in te halen', () => {
    const a = planStappen(vierKwart(beginStand(0)), 0, 0.1)
    const b = planStappen(a.stand, 30, 0.1)
    expect(b.stappen).toHaveLength(1)
    expect(b.stappen[0].tijd).toBeGreaterThanOrEqual(30)
    expect(b.stappen[0].tel).toBe(1)
  })
})
