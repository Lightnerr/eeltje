import { describe, expect, it } from 'vitest'
import {
  TELLEN_PER_AKKOORD,
  WISSELREEKS_START_BPM,
  aftelDuur,
  wisselreeksPositie,
  wisselreeksResultaat,
  wisselreeksVerloop,
  wisselreeksVolgehouden,
  type WisselreeksActie,
  type WisselreeksStand,
} from '../src/lib/wisselreeks'

const T0 = 5000
const BPM = 60
// Eén maat aftellen in 4/4 op 60 bpm.
const LOOPT_VANAF = T0 + 4000

function speel(acties: WisselreeksActie[]): WisselreeksStand {
  return acties.reduce(wisselreeksVerloop, { fase: 'wacht' } as WisselreeksStand)
}

const start: WisselreeksActie = { soort: 'start', nu: T0, bpm: BPM }
const tijd = (nu: number): WisselreeksActie => ({ soort: 'tijd', nu })
const gestopt = (nu: number): WisselreeksActie => ({ soort: 'gestopt', nu })

describe('wisselreeks', () => {
  it('elk akkoord een maat van 4 tellen; je telt één maat af', () => {
    expect(TELLEN_PER_AKKOORD).toBe(4)
    expect(WISSELREEKS_START_BPM).toBe(60)
    expect(aftelDuur(60)).toBe(4000)
    expect(aftelDuur(120)).toBe(2000)
  })

  it('telt af en loopt dan tot je zegt dat je eruit bent', () => {
    expect(speel([start])).toEqual({ fase: 'aftellen', begin: T0, bpm: BPM })
    expect(speel([start, tijd(LOOPT_VANAF - 1)]).fase).toBe('aftellen')
    expect(speel([start, tijd(LOOPT_VANAF)]).fase).toBe('lopen')
    expect(speel([start, tijd(LOOPT_VANAF + 600_000)]).fase).toBe('lopen')
  })

  it('volgehouden seconden tellen vanaf het einde van het aftellen, naar beneden afgerond', () => {
    expect(speel([start, gestopt(LOOPT_VANAF + 45_900)])).toEqual({ fase: 'klaar', seconden: 45, bpm: BPM })
    expect(wisselreeksVolgehouden(speel([start, tijd(LOOPT_VANAF)]), LOOPT_VANAF + 12_300)).toBe(12)
    expect(wisselreeksVolgehouden(speel([start]), T0 + 1000)).toBe(0)
  })

  it('stoppen tijdens het aftellen breekt af', () => {
    expect(speel([start, gestopt(T0 + 1000)])).toEqual({ fase: 'wacht' })
  })

  it('verborgen tijdens aftellen of lopen breekt af, zonder resultaat', () => {
    const verborgen = (nu: number): WisselreeksActie => ({ soort: 'verborgen', nu })
    expect(speel([start, verborgen(T0 + 100)])).toEqual({ fase: 'onderbroken' })
    const onderbroken = speel([start, tijd(LOOPT_VANAF + 20_000), verborgen(LOOPT_VANAF + 20_000)])
    expect(onderbroken).toEqual({ fase: 'onderbroken' })
    expect(wisselreeksVerloop(onderbroken, gestopt(LOOPT_VANAF + 300_000))).toEqual({ fase: 'onderbroken' })
    expect(wisselreeksResultaat(onderbroken, ['G', 'C', 'D'])).toBeNull()
    expect(wisselreeksVerloop(onderbroken, { soort: 'opnieuw' })).toEqual({ fase: 'wacht' })
    expect(speel([start, gestopt(LOOPT_VANAF + 5000), verborgen(LOOPT_VANAF + 6000)])).toEqual({ fase: 'klaar', seconden: 5, bpm: BPM })
  })

  it('opnieuw gaat terug naar wachten', () => {
    expect(speel([start, gestopt(LOOPT_VANAF + 5000), { soort: 'opnieuw' }])).toEqual({ fase: 'wacht' })
  })

  it('de ronde: elke maat het volgende akkoord, en na het laatste weer het eerste', () => {
    expect(wisselreeksPositie(3, 60, 0)).toEqual({ akkoord: 0, volgende: 1, tel: 0, ronde: 0 })
    expect(wisselreeksPositie(3, 60, 3999)).toEqual({ akkoord: 0, volgende: 1, tel: 3, ronde: 0 })
    expect(wisselreeksPositie(3, 60, 4000)).toEqual({ akkoord: 1, volgende: 2, tel: 0, ronde: 0 })
    expect(wisselreeksPositie(3, 60, 8000)).toEqual({ akkoord: 2, volgende: 0, tel: 0, ronde: 0 })
    expect(wisselreeksPositie(3, 60, 12_000)).toEqual({ akkoord: 0, volgende: 1, tel: 0, ronde: 1 })
    expect(wisselreeksPositie(4, 120, 2500)).toEqual({ akkoord: 1, volgende: 2, tel: 1, ronde: 0 })
  })

  it('tijdens het aftellen staat het eerste akkoord klaar', () => {
    expect(wisselreeksPositie(3, 60, -1500)).toEqual({ akkoord: 0, volgende: 1, tel: 0, ronde: 0 })
  })

  it('alleen een resultaat als hij klaar is en je minstens een seconde volhield', () => {
    expect(wisselreeksResultaat(speel([start, tijd(LOOPT_VANAF + 5000)]), ['G', 'C', 'D'])).toBeNull()
    expect(wisselreeksResultaat(speel([start, gestopt(LOOPT_VANAF + 900)]), ['G', 'C', 'D'])).toBeNull()
    expect(wisselreeksResultaat(speel([start, gestopt(LOOPT_VANAF + 30_000)]), ['G', 'C', 'D'])).toEqual({
      type: 'wisselreeks',
      sleutel: 'G-C-D',
      waarde: 30,
      bpm: 60,
    })
  })
})
