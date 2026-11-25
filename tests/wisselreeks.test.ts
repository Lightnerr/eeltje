import { describe, expect, it } from 'vitest'
import {
  TELLEN_PER_AKKOORD,
  WISSELREEKS_START_BPM,
  wisselreeksPositie,
  wisselreeksResultaat,
  wisselreeksVerloop,
  wisselreeksVolgehouden,
  type WisselreeksActie,
  type WisselreeksStand,
} from '../src/lib/wisselreeks'

const BPM = 60
const start: WisselreeksActie = { soort: 'start', bpm: BPM }
const tel = (t: number, nu = 0): WisselreeksActie => ({ soort: 'tel', tel: t, nu })
const gestopt = (nu: number): WisselreeksActie => ({ soort: 'gestopt', nu })
const verborgen = (nu: number): WisselreeksActie => ({ soort: 'verborgen', nu })

/** Eén maat aftellen; de eerste 1 daarna klinkt op `T1`. */
const T1 = 10_000
const AFTELLEN = [tel(0, 6000), tel(1, 7000), tel(2, 8000), tel(3, 9000)]
const EERSTE_EEN = tel(0, T1)

function speel(acties: WisselreeksActie[]): WisselreeksStand {
  return acties.reduce(wisselreeksVerloop, { fase: 'wacht' } as WisselreeksStand)
}

/** Na het aftellen nog `maten` hele maten en dan `tellen` tellen, één per seconde. */
function gespeeld(maten: number, tellen = 0): WisselreeksActie[] {
  const n = maten * TELLEN_PER_AKKOORD + tellen
  return Array.from({ length: n }, (_, i) => tel(i % TELLEN_PER_AKKOORD, T1 + i * 1000))
}

describe('wisselreeks', () => {
  it('elk akkoord een maat van 4 tellen, standaard op 60 bpm', () => {
    expect(TELLEN_PER_AKKOORD).toBe(4)
    expect(WISSELREEKS_START_BPM).toBe(60)
  })

  it('telt één maat af op de metronoom en loopt vanaf de volgende 1 die klinkt', () => {
    expect(speel([start])).toEqual({ fase: 'aftellen', bpm: BPM, tel: null })
    expect(speel([start, ...AFTELLEN])).toEqual({ fase: 'aftellen', bpm: BPM, tel: 3 })
    expect(speel([start, ...AFTELLEN, EERSTE_EEN])).toEqual({ fase: 'lopen', bpm: BPM, start: T1, maat: 0, tel: 0 })
  })

  it('volgt de tellen: na elke 1 de volgende maat', () => {
    expect(speel([start, ...AFTELLEN, ...gespeeld(2, 3)])).toMatchObject({ fase: 'lopen', maat: 2, tel: 2 })
  })

  it('de ronde: elke maat het volgende akkoord, en na het laatste weer het eerste', () => {
    const op = (maten: number, tellen = 1) => wisselreeksPositie(speel([start, ...AFTELLEN, ...gespeeld(maten, tellen)]), 3)
    expect(op(0)).toEqual({ akkoord: 0, volgende: 1, tel: 0, ronde: 0 })
    expect(op(0, 4)).toEqual({ akkoord: 0, volgende: 1, tel: 3, ronde: 0 })
    expect(op(1)).toEqual({ akkoord: 1, volgende: 2, tel: 0, ronde: 0 })
    expect(op(2)).toEqual({ akkoord: 2, volgende: 0, tel: 0, ronde: 0 })
    expect(op(3)).toEqual({ akkoord: 0, volgende: 1, tel: 0, ronde: 1 })
  })

  it('tijdens het aftellen staat het eerste akkoord klaar', () => {
    expect(wisselreeksPositie(speel([start, tel(0), tel(1)]), 4)).toEqual({ akkoord: 0, volgende: 1, tel: 1, ronde: 0 })
    expect(wisselreeksPositie({ fase: 'wacht' }, 4)).toEqual({ akkoord: 0, volgende: 1, tel: 0, ronde: 0 })
  })

  it('volgehouden seconden tellen vanaf de eerste 1 na het aftellen, naar beneden afgerond', () => {
    const lopend = speel([start, ...AFTELLEN, EERSTE_EEN])
    expect(wisselreeksVolgehouden(lopend, T1 + 12_300)).toBe(12)
    expect(wisselreeksVolgehouden(speel([start, ...AFTELLEN]), T1 + 5000)).toBe(0)
    expect(speel([start, ...AFTELLEN, ...gespeeld(11), gestopt(T1 + 45_900)])).toEqual({ fase: 'klaar', seconden: 45, bpm: BPM })
  })

  it('stoppen tijdens het aftellen breekt af', () => {
    expect(speel([start, tel(0), gestopt(7000)])).toEqual({ fase: 'wacht' })
  })

  it('verborgen tijdens aftellen of lopen breekt af, zonder resultaat', () => {
    expect(speel([start, tel(0), verborgen(6500)])).toEqual({ fase: 'onderbroken' })
    const onderbroken = speel([start, ...AFTELLEN, ...gespeeld(5), verborgen(T1 + 20_500)])
    expect(onderbroken).toEqual({ fase: 'onderbroken' })
    expect(wisselreeksVerloop(onderbroken, tel(0, T1 + 300_000))).toEqual({ fase: 'onderbroken' })
    expect(wisselreeksVerloop(onderbroken, gestopt(T1 + 300_000))).toEqual({ fase: 'onderbroken' })
    expect(wisselreeksResultaat(onderbroken, ['G', 'C', 'D'])).toBeNull()
    expect(wisselreeksVerloop(onderbroken, { soort: 'opnieuw' })).toEqual({ fase: 'wacht' })
    expect(speel([start, ...AFTELLEN, EERSTE_EEN, gestopt(T1 + 5000), verborgen(T1 + 6000)])).toEqual({ fase: 'klaar', seconden: 5, bpm: BPM })
  })

  it('opnieuw gaat terug naar wachten', () => {
    expect(speel([start, ...AFTELLEN, EERSTE_EEN, gestopt(T1 + 5000), { soort: 'opnieuw' }])).toEqual({ fase: 'wacht' })
  })

  it('alleen een resultaat als hij klaar is en je minstens een seconde volhield', () => {
    const lopend = [start, ...AFTELLEN, EERSTE_EEN]
    expect(wisselreeksResultaat(speel(lopend), ['G', 'C', 'D'])).toBeNull()
    expect(wisselreeksResultaat(speel([...lopend, gestopt(T1 + 900)]), ['G', 'C', 'D'])).toBeNull()
    expect(wisselreeksResultaat(speel([...lopend, gestopt(T1 + 30_000)]), ['G', 'C', 'D'])).toEqual({
      type: 'wisselreeks',
      sleutel: 'G-C-D',
      waarde: 30,
      bpm: 60,
    })
  })
})
