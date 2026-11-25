import { afterAll, describe, expect, it } from 'vitest'
import { demoVoortgang } from '../src/lib/demo'
import { challengeSleutels, dagenTekst, dagSleutel, minutenTekst, streakZin, minutenPerWeek, minutenVandaag, streak, totaalMinuten } from '../src/lib/statistiek'
import type { Sessie, Voortgang } from '../src/lib/types'
import { nieuweVoortgang } from '../src/lib/voortgang'

// Dagen zijn lokale dagen. Met een vaste tijdzone zijn zomer- en wintertijd ook te testen.
// Bovenaan en niet in beforeAll, want de describe-blokken maken al datums bij het verzamelen.
const oudeTz = process.env.TZ
process.env.TZ = 'Europe/Amsterdam'
afterAll(() => {
  if (oudeTz === undefined) delete process.env.TZ
  else process.env.TZ = oudeTz
})

function sessie(lokaal: string, minuten = 10): Sessie {
  return { start: new Date(lokaal).toISOString(), seconden: minuten * 60 }
}

function met(...sessies: Sessie[]): Voortgang {
  return { ...nieuweVoortgang(), sessies }
}

const nu = () => new Date('2026-11-24T12:00:00')

describe('dagSleutel', () => {
  it('is de lokale datum', () => {
    expect(dagSleutel(new Date('2026-11-24T00:30:00'))).toBe('2026-11-24')
    expect(dagSleutel(new Date('2026-11-23T23:59:59'))).toBe('2026-11-23')
    expect(dagSleutel(new Date('2026-03-05T12:00:00'))).toBe('2026-03-05')
  })
})

describe('streak', () => {
  it('is 0 zonder sessies', () => {
    expect(streak(met(), nu())).toBe(0)
  })

  it('telt de dagen waarop je oefende, tot en met vandaag', () => {
    const v = met(sessie('2026-11-24T08:00:00'), sessie('2026-11-23T20:00:00'), sessie('2026-11-22T20:00:00'))
    expect(streak(v, nu())).toBe(3)
  })

  it('één losse dag niet oefenen breekt hem niet, maar telt ook niet mee', () => {
    // 21 november overgeslagen: 24, 23, 22 en 20 tellen.
    const v = met(sessie('2026-11-24T08:00:00'), sessie('2026-11-23T20:00:00'), sessie('2026-11-22T20:00:00'), sessie('2026-11-20T20:00:00'))
    expect(streak(v, nu())).toBe(4)
    // Om de dag oefenen houdt hem in leven.
    expect(streak(met(sessie('2026-11-24T08:00:00'), sessie('2026-11-22T08:00:00'), sessie('2026-11-20T08:00:00')), nu())).toBe(3)
  })

  it('twee dagen achter elkaar niet oefenen breekt hem wel', () => {
    const v = met(sessie('2026-11-24T08:00:00'), sessie('2026-11-23T20:00:00'), sessie('2026-11-20T20:00:00'), sessie('2026-11-19T20:00:00'))
    expect(streak(v, nu())).toBe(2)
  })

  it('straft niet: vandaag nog niet geoefend, gisteren wel, dan loopt hij door', () => {
    const v = met(sessie('2026-11-23T20:00:00'), sessie('2026-11-22T20:00:00'))
    expect(streak(v, nu())).toBe(2)
  })

  it('vandaag telt pas als gemist als de dag om is', () => {
    // Gisteren gemist, vandaag nog niet geoefend: nog maar één gemiste dag.
    expect(streak(met(sessie('2026-11-22T20:00:00'), sessie('2026-11-21T20:00:00')), nu())).toBe(2)
    // Gisteren en eergisteren gemist: voorbij.
    expect(streak(met(sessie('2026-11-21T20:00:00')), nu())).toBe(0)
    // Vandaag geoefend, maar de twee dagen ervoor niet.
    expect(streak(met(sessie('2026-11-24T08:00:00'), sessie('2026-11-21T20:00:00')), nu())).toBe(1)
  })

  it('telt een dag met meer sessies één keer', () => {
    expect(streak(met(sessie('2026-11-24T08:00:00'), sessie('2026-11-24T10:00:00')), nu())).toBe(1)
  })

  it('kijkt naar de lokale dag rond middernacht', () => {
    const v = met(sessie('2026-11-23T23:55:00'), sessie('2026-11-23T00:05:00'))
    expect(streak(v, new Date('2026-11-24T00:01:00'))).toBe(1)
    expect(streak(met(sessie('2026-11-24T00:00:00'), sessie('2026-11-23T23:59:00')), new Date('2026-11-24T00:00:30'))).toBe(2)
  })

  it('loopt door over de overgang naar zomer- en wintertijd', () => {
    // 29 maart 2026 heeft 23 uur, 25 oktober 2026 heeft 25 uur.
    const zomer = met(sessie('2026-03-28T23:30:00'), sessie('2026-03-29T23:30:00'), sessie('2026-03-30T00:30:00'))
    expect(streak(zomer, new Date('2026-03-30T12:00:00'))).toBe(3)
    const winter = met(sessie('2026-10-24T00:30:00'), sessie('2026-10-25T00:30:00'), sessie('2026-10-25T23:30:00'), sessie('2026-10-26T00:10:00'))
    expect(streak(winter, new Date('2026-10-26T12:00:00'))).toBe(3)
    // Vlak na middernacht: 24 uur terug zou hier 29 maart overslaan.
    expect(streak(met(sessie('2026-03-28T20:00:00'), sessie('2026-03-29T20:00:00')), new Date('2026-03-30T00:30:00'))).toBe(2)
  })

  it('negeert sessies van 0 seconden, in de toekomst of met een kapotte datum', () => {
    const v = met({ start: new Date('2026-11-24T08:00:00').toISOString(), seconden: 0 }, sessie('2026-11-25T08:00:00'), { start: 'gisteren', seconden: 600 })
    expect(streak(v, nu())).toBe(0)
  })
})

describe('minuten', () => {
  const v = met(sessie('2026-11-24T08:00:00', 12), sessie('2026-11-24T00:10:00', 3.5), sessie('2026-11-23T23:50:00', 20), sessie('2026-11-10T20:00:00', 15))

  it('totaalMinuten telt alles tot nu op en rondt af', () => {
    expect(totaalMinuten(v, nu())).toBe(51)
    expect(totaalMinuten(met(), nu())).toBe(0)
  })

  it('totaalMinuten telt geen sessies in de toekomst, net als de weken', () => {
    const metToekomst = met(...v.sessies, sessie('2026-11-25T08:00:00', 30))
    expect(totaalMinuten(metToekomst, nu())).toBe(51)
    const weken = minutenPerWeek(metToekomst, nu(), 3)
    expect(weken.reduce((s, w) => s + w.minuten, 0)).toBe(totaalMinuten(metToekomst, nu()))
  })

  it('minutenVandaag telt alleen de sessies die vandaag begonnen', () => {
    expect(minutenVandaag(v, nu())).toBe(16)
    expect(minutenVandaag(v, new Date('2026-11-25T09:00:00'))).toBe(0)
  })
})

describe('minutenPerWeek', () => {
  it('geeft de laatste weken, oudste eerst, beginnend op maandag', () => {
    // 24 november 2026 is een dinsdag.
    const v = met(sessie('2026-11-23T08:00:00', 10), sessie('2026-11-22T21:00:00', 5), sessie('2026-11-16T00:01:00', 7), sessie('2026-11-02T08:00:00', 30))
    expect(minutenPerWeek(v, nu(), 4)).toEqual([
      { start: '2026-11-02', minuten: 30 },
      { start: '2026-11-09', minuten: 0 },
      { start: '2026-11-16', minuten: 12 },
      { start: '2026-11-23', minuten: 10 },
    ])
  })

  it('op zondagavond hoort zondag nog bij de week', () => {
    const v = met(sessie('2026-11-29T23:30:00', 10))
    expect(minutenPerWeek(v, new Date('2026-11-29T23:45:00'), 1)).toEqual([{ start: '2026-11-23', minuten: 10 }])
  })

  it('weken over zomer- en wintertijd blijven op maandag beginnen', () => {
    const weken = minutenPerWeek(met(sessie('2026-03-29T12:00:00', 20), sessie('2026-10-25T12:00:00', 25)), new Date('2026-11-24T12:00:00'), 40)
    expect(weken).toHaveLength(40)
    for (const w of weken) expect(new Date(`${w.start}T12:00:00`).getDay(), w.start).toBe(1)
    expect(weken.find((w) => w.start === '2026-03-23')?.minuten).toBe(20)
    expect(weken.find((w) => w.start === '2026-10-19')?.minuten).toBe(25)
  })

  it('0 weken is een lege lijst', () => {
    expect(minutenPerWeek(met(), nu(), 0)).toEqual([])
  })
})

describe('met de demo-voortgang', () => {
  it('elke dag van de week plus om de dag daarvoor telt mee, vandaag geoefend en minuten in elke week', () => {
    const demo = demoVoortgang(nu())
    expect(streak(demo, nu())).toBe(demo.sessies.length)
    expect(minutenVandaag(demo, nu())).toBeGreaterThan(0)
    expect(minutenPerWeek(demo, nu(), 4).every((w) => w.minuten > 0)).toBe(true)
  })
})

describe('challengeSleutels', () => {
  const r = (sleutel: string, datum: string) => ({ type: 'one-minute-changes' as const, sleutel, waarde: 10, datum: new Date(datum).toISOString() })

  it('de paren of reeksen met resultaten, het laatst geoefende eerst', () => {
    const v = { ...met(), challenges: [r('A-D', '2026-11-01T19:00:00'), r('C-G', '2026-11-20T19:00:00'), r('A-D', '2026-11-10T19:00:00'), { ...r('spider', '2026-11-23T19:00:00'), type: 'spider-ladder' as const }] }
    expect(challengeSleutels(v, 'one-minute-changes')).toEqual(['C-G', 'A-D'])
    expect(challengeSleutels(v, 'spider-ladder')).toEqual(['spider'])
    expect(challengeSleutels(v, 'wisselreeks')).toEqual([])
  })

  it('met de demo: A-D het laatst', () => {
    expect(challengeSleutels(demoVoortgang(nu()), 'one-minute-changes')[0]).toMatch(/^(A-D|C-G)$/)
    expect(challengeSleutels(demoVoortgang(nu()), 'wisselreeks')).toEqual(['G-C-D', 'A-D-E'])
  })
})

describe('teksten', () => {
  it('minutenTekst', () => {
    expect(minutenTekst(0)).toBe('0 min')
    expect(minutenTekst(45)).toBe('45 min')
    expect(minutenTekst(60)).toBe('1 u')
    expect(minutenTekst(125)).toBe('2 u 5 min')
  })

  it('dagenTekst', () => {
    expect(dagenTekst(0)).toBe('0 dagen')
    expect(dagenTekst(1)).toBe('1 dag')
    expect(dagenTekst(19)).toBe('19 dagen')
  })

  it('streakZin moedigt aan en straft niet', () => {
    expect(streakZin(met(), nu())).toBe('Oefen vandaag en je streak begint.')
    expect(streakZin(met(sessie('2026-11-24T08:00:00'), sessie('2026-11-23T08:00:00')), nu())).toBe('Goed bezig. Een dag overslaan mag, twee achter elkaar niet.')
    expect(streakZin(met(sessie('2026-11-23T08:00:00')), nu())).toBe('Oefen vandaag of morgen en je streak loopt door.')
    // Gisteren al overgeslagen: vandaag moet het.
    expect(streakZin(met(sessie('2026-11-22T08:00:00')), nu())).toBe('Oefen vandaag en je streak loopt door.')
    expect(streakZin(met(sessie('2026-11-21T08:00:00')), nu())).toBe('Oefen vandaag en je streak begint.')
  })
})
