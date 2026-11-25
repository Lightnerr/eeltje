import { describe, expect, it } from 'vitest'
import { leesTimer, MAX_SESSIE_MS, pauzeerTimer, startTimer, stopTimer, timerTekst, verstrekenMs } from '../src/lib/oefentimer'

const t0 = new Date('2026-11-24T19:00:00')
const na = (seconden: number) => new Date(t0.getTime() + seconden * 1000)

describe('oefentimer', () => {
  it('telt de echte verstreken tijd, ook als er lang niets gebeurde', () => {
    const t = startTimer(null, t0)
    expect(verstrekenMs(t, na(0))).toBe(0)
    expect(verstrekenMs(t, na(90))).toBe(90_000)
    expect(verstrekenMs(t, na(1200))).toBe(1_200_000)
  })

  it('pauze houdt de tijd vast, doorgaan telt verder', () => {
    let t = startTimer(null, t0)
    t = pauzeerTimer(t, na(60))
    expect(verstrekenMs(t, na(600))).toBe(60_000)
    t = startTimer(t, na(600))
    expect(verstrekenMs(t, na(630))).toBe(90_000)
  })

  it('nog eens starten of pauzeren verandert niets', () => {
    const t = startTimer(null, t0)
    expect(startTimer(t, na(30))).toEqual(t)
    const p = pauzeerTimer(t, na(30))
    expect(pauzeerTimer(p, na(50))).toEqual(p)
  })

  it('stop geeft een sessie vanaf de eerste start met de geoefende seconden', () => {
    let t = startTimer(null, t0)
    t = pauzeerTimer(t, na(300))
    t = startTimer(t, na(900))
    expect(stopTimer(t, na(1000.4))).toEqual({ start: t0.toISOString(), seconden: 400 })
  })

  it('stop zonder geoefende tijd geeft geen sessie', () => {
    expect(stopTimer(null, t0)).toBeNull()
    expect(stopTimer(startTimer(null, t0), na(0.4))).toBeNull()
  })

  it('een vergeten timer telt hooguit drie uur', () => {
    const t = startTimer(null, t0)
    expect(MAX_SESSIE_MS).toBe(3 * 60 * 60 * 1000)
    expect(verstrekenMs(t, na(10 * 3600))).toBe(MAX_SESSIE_MS)
    expect(stopTimer(t, na(10 * 3600))?.seconden).toBe(3 * 3600)
  })

  it('een klok die terugspringt geeft geen negatieve tijd', () => {
    const t = startTimer(null, t0)
    expect(verstrekenMs(t, na(-60))).toBe(0)
    expect(verstrekenMs(pauzeerTimer(t, na(-60)), na(0))).toBe(0)
  })

  it('leesTimer neemt alleen een geldige timer uit de opslag', () => {
    const t = pauzeerTimer(startTimer(null, t0), na(42))
    expect(leesTimer(JSON.parse(JSON.stringify(t)))).toEqual(t)
    const ongeldig: unknown[] = [null, 'x', 3, {}, { start: 'gisteren', opgeteld: 0, looptSinds: null }, { start: t0.toISOString(), opgeteld: -5, looptSinds: null }, { start: t0.toISOString(), opgeteld: 0, looptSinds: 'nu' }]
    for (const x of ongeldig) expect(leesTimer(x), JSON.stringify(x)).toBeNull()
  })

  it('timerTekst: minuten en seconden, met uren als het moet', () => {
    expect(timerTekst(0)).toBe('0:00')
    expect(timerTekst(65_999)).toBe('1:05')
    expect(timerTekst(12 * 60_000)).toBe('12:00')
    expect(timerTekst(3_723_000)).toBe('1:02:03')
  })
})
