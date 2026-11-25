import { describe, expect, it } from 'vitest'
import { AFTELLEN_MS, DUUR_MS, klokTekst, leesWissels, MAX_WISSELS, omcResterend, omcResultaat, omcVerloop, type OmcActie, type OmcStand } from '../src/lib/oneMinuteChanges'

const T0 = 10_000
const LOOPT_VANAF = T0 + AFTELLEN_MS
const EINDE = LOOPT_VANAF + DUUR_MS

function speel(acties: OmcActie[], stand: OmcStand = { fase: 'wacht' }): OmcStand {
  return acties.reduce(omcVerloop, stand)
}

const tik = (nu: number): OmcActie => ({ soort: 'tik', nu })
const tijd = (nu: number): OmcActie => ({ soort: 'tijd', nu })
const verborgen = (nu: number): OmcActie => ({ soort: 'verborgen', nu })
const start: OmcActie = { soort: 'start', nu: T0 }
const vulIn = (wissels: number): OmcActie => ({ soort: 'invullen', wissels })

describe('one minute changes', () => {
  it('telt eerst 3 seconden af en loopt dan precies 60 seconden', () => {
    expect(AFTELLEN_MS).toBe(3000)
    expect(DUUR_MS).toBe(60_000)
    expect(speel([start]).fase).toBe('aftellen')
    expect(speel([start, tijd(LOOPT_VANAF - 1)]).fase).toBe('aftellen')
    expect(speel([start, tijd(LOOPT_VANAF)]).fase).toBe('lopen')
    expect(speel([start, tijd(EINDE - 1)]).fase).toBe('lopen')
    expect(speel([start, tijd(EINDE)])).toEqual({ fase: 'invullen', wissels: 0 })
  })

  it('telt alleen tikken terwijl hij loopt', () => {
    const stand = speel([start, tik(T0 + 1000), tik(LOOPT_VANAF), tik(LOOPT_VANAF + 500), tik(EINDE - 1), tik(EINDE), tik(EINDE + 10)])
    expect(stand).toEqual({ fase: 'invullen', wissels: 3 })
  })

  it('rekent met de echte tijd: een tabblad dat even sliep, eindigt toch na 60 seconden', () => {
    const stand = speel([start, tijd(LOOPT_VANAF + 100), tik(LOOPT_VANAF + 200), tijd(EINDE + 30_000)])
    expect(stand).toEqual({ fase: 'invullen', wissels: 1 })
    expect(speel([start, tijd(EINDE + 5000)])).toEqual({ fase: 'invullen', wissels: 0 })
  })

  it('negeert tikken voor de start en na het einde', () => {
    expect(speel([tik(T0)])).toEqual({ fase: 'wacht' })
    const invullen = speel([start, tik(LOOPT_VANAF + 1), tijd(EINDE)])
    expect(omcVerloop(invullen, tik(EINDE + 1))).toBe(invullen)
  })

  it('verborgen tijdens aftellen of lopen breekt af, zonder resultaat', () => {
    expect(speel([start, verborgen(T0 + 1000)])).toEqual({ fase: 'onderbroken' })
    const onderbroken = speel([start, tik(LOOPT_VANAF + 1), verborgen(LOOPT_VANAF + 20_000)])
    expect(onderbroken).toEqual({ fase: 'onderbroken' })
    expect(omcVerloop(onderbroken, tijd(EINDE + 300_000))).toEqual({ fase: 'onderbroken' })
    expect(omcVerloop(onderbroken, tik(EINDE + 300_000))).toEqual({ fase: 'onderbroken' })
    expect(omcResultaat(onderbroken, 'A', 'D')).toBeNull()
    expect(omcVerloop(onderbroken, { soort: 'opnieuw' })).toEqual({ fase: 'wacht' })
  })

  it('verborgen in een andere fase verandert niets', () => {
    expect(speel([verborgen(T0)])).toEqual({ fase: 'wacht' })
    expect(speel([start, tik(LOOPT_VANAF + 1), tijd(EINDE), verborgen(EINDE + 1)])).toEqual({ fase: 'invullen', wissels: 1 })
  })

  it('een minuut die al om was toen je terugkwam, telt niet als onderbreking', () => {
    expect(speel([start, tik(LOOPT_VANAF + 1), verborgen(EINDE + 10)])).toEqual({ fase: 'invullen', wissels: 1 })
  })

  it('opnieuw gaat terug naar wachten', () => {
    expect(speel([start, tik(LOOPT_VANAF + 1), { soort: 'opnieuw' }])).toEqual({ fase: 'wacht' })
  })

  it('resterende tijd: tot de start tijdens het aftellen, tot het einde tijdens het lopen', () => {
    expect(omcResterend(speel([start]), T0 + 500)).toBe(2500)
    expect(omcResterend(speel([start, tijd(LOOPT_VANAF)]), LOOPT_VANAF + 15_000)).toBe(45_000)
    expect(omcResterend(speel([start, tijd(LOOPT_VANAF)]), EINDE + 50)).toBe(0)
    expect(omcResterend({ fase: 'wacht' }, T0)).toBe(0)
  })

  it('na de minuut vul je zelf je score in; de tikken staan er al in', () => {
    const invullen = speel([start, tik(LOOPT_VANAF + 1), tik(LOOPT_VANAF + 2), tijd(EINDE)])
    expect(invullen).toEqual({ fase: 'invullen', wissels: 2 })
    expect(omcVerloop(invullen, vulIn(34))).toEqual({ fase: 'klaar', wissels: 34 })
    expect(omcVerloop(invullen, vulIn(0))).toEqual({ fase: 'klaar', wissels: 0 })
  })

  it('een onmogelijke score of invullen buiten de beurt doet niets', () => {
    const invullen = speel([start, tijd(EINDE)])
    expect(omcVerloop(invullen, vulIn(-1))).toBe(invullen)
    expect(omcVerloop(invullen, vulIn(2.5))).toBe(invullen)
    expect(omcVerloop(invullen, vulIn(MAX_WISSELS + 1))).toBe(invullen)
    expect(omcVerloop(invullen, vulIn(MAX_WISSELS))).toEqual({ fase: 'klaar', wissels: MAX_WISSELS })
    const lopend = speel([start, tijd(LOOPT_VANAF)])
    expect(omcVerloop(lopend, vulIn(30))).toBe(lopend)
  })

  it('alleen een resultaat als hij echt klaar is en je iets telde', () => {
    const lopend = speel([start, tik(LOOPT_VANAF + 1)])
    expect(omcResultaat(lopend, 'D', 'A')).toBeNull()
    expect(omcResultaat(speel([start, tik(LOOPT_VANAF + 1), tijd(EINDE)]), 'D', 'A')).toBeNull()
    expect(omcResultaat(speel([start, tijd(EINDE), vulIn(0)]), 'D', 'A')).toBeNull()
    expect(omcResultaat(speel([start, tijd(EINDE), vulIn(31)]), 'D', 'A')).toEqual({ type: 'one-minute-changes', sleutel: 'A-D', waarde: 31 })
  })
})

describe('leesWissels', () => {
  it('leest een heel getal van 0 t/m MAX_WISSELS, met witruimte eromheen', () => {
    expect(leesWissels('31')).toBe(31)
    expect(leesWissels(' 7 ')).toBe(7)
    expect(leesWissels('0')).toBe(0)
    expect(leesWissels(String(MAX_WISSELS))).toBe(MAX_WISSELS)
  })

  it('al het andere is null', () => {
    for (const tekst of ['', ' ', 'abc', '-3', '2.5', '2,5', '1e2', String(MAX_WISSELS + 1)]) expect(leesWissels(tekst), tekst).toBeNull()
  })
})

describe('klokTekst', () => {
  it('minuten en seconden, naar boven afgerond zodat de klok op 1:00 begint en op 0:00 eindigt', () => {
    expect(klokTekst(60_000)).toBe('1:00')
    expect(klokTekst(59_001)).toBe('1:00')
    expect(klokTekst(59_000)).toBe('0:59')
    expect(klokTekst(9_500)).toBe('0:10')
    expect(klokTekst(1)).toBe('0:01')
    expect(klokTekst(0)).toBe('0:00')
  })
})
