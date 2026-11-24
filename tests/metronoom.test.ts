import { describe, expect, it } from 'vitest'
import {
  MAX_BPM,
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

  it('begint opnieuw na een lange pauze', () => {
    expect(tapTempo([0, 1000, 2000, 5000, 5500])).toBe(120)
    expect(tapTempo([0, 1000, 2000, 5000])).toBeNull()
  })

  it('blijft binnen de grenzen', () => {
    expect(tapTempo([0, 100, 200])).toBe(220)
    expect(tapTempo([0, 1900, 3800])).toBe(32)
  })
})

describe('voegTikToe', () => {
  it('bewaart alleen wat tapTempo nodig heeft', () => {
    let tikken: number[] = []
    for (let i = 0; i < 10; i++) tikken = voegTikToe(tikken, i * 500)
    expect(tikken).toEqual([2500, 3000, 3500, 4000, 4500])
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
    expect(stappen).toEqual([{ slag: 0, tel: 0, opTel: true, tijd: 10 }])
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
      { slag: 0, tel: 0, opTel: true, tijd: 0 },
      { slag: 1, tel: 0, opTel: false, tijd: 0.5 },
      { slag: 2, tel: 1, opTel: true, tijd: 1 },
      { slag: 3, tel: 1, opTel: false, tijd: 1.5 },
      { slag: 4, tel: 2, opTel: true, tijd: 2 },
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
    const b = planStappen({ ...a.stand, onderverdeling: 1, wasOnderverdeling: 2 }, 0.45, 1.6)
    expect(b.stappen).toEqual([
      { slag: 1, tel: 0, opTel: false, tijd: 0.5 },
      { slag: 1, tel: 1, opTel: true, tijd: 1 },
      { slag: 2, tel: 2, opTel: true, tijd: 2 },
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
