import { describe, expect, it } from 'vitest'
import * as data from '../src/data'
import { demoVoortgang } from '../src/lib/demo'
import { ontbrekendeAkkoorden } from '../src/lib/muziek'
import { maakRoutine, type Inhoud, type Routine } from '../src/lib/routine'
import type { Akkoord, AkkoordStatus, Liedje, Oefening, Voortgang } from '../src/lib/types'
import { bekendeAkkoorden, nieuweVoortgang } from '../src/lib/voortgang'

const nu = new Date('2026-11-24T12:00:00')
const echt: Inhoud = { akkoorden: data.akkoorden, liedjes: data.liedjes, oefeningen: data.oefeningen }

function akkoord(naam: string, moeilijkheid = 2): Akkoord {
  return { naam, variant: 'standaard', titel: 'Standaard', standaard: true, frets: [0, 0, 0, 0, 0, 0], vingers: [0, 0, 0, 0, 0, 0], moeilijkheid }
}

function liedje(id: string, maten: string[][]): Liedje {
  return {
    id,
    titel: id,
    artiest: 'Iemand',
    soort: 'pop',
    toonsoort: 'C',
    capo: 0,
    bpm: 90,
    maatsoort: '4/4',
    slagpatroon: 'D - D U - U D U',
    secties: [{ naam: 'couplet', maten }],
    volgorde: ['couplet'],
    bron: 'ai-gegenereerd',
    geverifieerd: false,
  }
}

function oefening(id: string): Oefening {
  return { id, titel: id === 'spider' ? 'Spider' : id, doel: `Doel van ${id}.`, stappen: ['Doe het.'], standaardtempo: 60 }
}

const eigen: Inhoud = {
  akkoorden: ['A', 'C', 'D', 'E', 'Em', 'G'].map((n) => akkoord(n)),
  liedjes: [
    liedje('een', [['D'], ['A'], ['D'], ['A']]),
    liedje('twee', [['G'], ['C'], ['D']]),
    liedje('drie', [['E'], ['A'], ['Em'], ['G'], ['C']]),
  ],
  oefeningen: [oefening('chromatisch'), oefening('spider')],
}

function met(status: Record<string, AkkoordStatus>, extra: Partial<Voortgang> = {}): Voortgang {
  return { ...nieuweVoortgang(), akkoordStatus: status, ...extra }
}

function dag(d: number, uur = 12): Date {
  return new Date(2026, 10, 24 + d, uur)
}

function onderdeel(r: Routine, soort: string) {
  const o = r.onderdelen.find((x) => x.soort === soort)
  if (!o) throw new Error(`geen ${soort}`)
  return o
}

function controleerVorm(r: Routine) {
  expect(r.onderdelen.map((o) => o.soort)).toEqual(['opwarmen', 'akkoordwissel', 'liedje'])
  expect(r.minuten).toBe(r.onderdelen.reduce((s, o) => s + o.minuten, 0))
  expect(r.minuten).toBeGreaterThanOrEqual(10)
  expect(r.minuten).toBeLessThanOrEqual(15)
  for (const o of r.onderdelen) {
    expect(o.titel.length, o.soort).toBeGreaterThan(0)
    expect(o.uitleg.length, o.soort).toBeGreaterThan(0)
    expect(o.minuten, o.soort).toBeGreaterThan(0)
  }
}

describe('maakRoutine', () => {
  it('opwarmen met de spider, een akkoordwissel en een liedje, samen 10 tot 15 minuten', () => {
    const r = maakRoutine(demoVoortgang(nu), echt, nu)
    controleerVorm(r)
    expect(r.datum).toBe('2026-11-24')
    expect(onderdeel(r, 'opwarmen').route).toEqual({ pagina: 'oefening', id: 'spider' })
    expect(onderdeel(r, 'akkoordwissel').route.pagina).toBe('one-minute-changes')
    expect(onderdeel(r, 'liedje').route.pagina).toBe('liedje')
  })

  it('is de hele dag hetzelfde', () => {
    const v = demoVoortgang(nu)
    const ochtend = maakRoutine(v, echt, new Date('2026-11-24T00:00:01'))
    expect(maakRoutine(v, echt, new Date('2026-11-24T23:59:59'))).toEqual(ochtend)
    expect(maakRoutine(v, echt, nu)).toEqual(ochtend)
  })

  it('verandert niet als je die dag een sessie of challenge toevoegt', () => {
    const v = demoVoortgang(nu)
    const meer = { ...v, sessies: [...v.sessies, { start: nu.toISOString(), seconden: 600 }], challenges: [] }
    expect(maakRoutine(meer, echt, nu)).toEqual(maakRoutine(v, echt, nu))
  })

  it('is op andere dagen anders', () => {
    const v = demoVoortgang(nu)
    const routines = Array.from({ length: 14 }, (_, d) => maakRoutine(v, echt, dag(d)))
    expect(new Set(routines.map((r) => naarTekst(onderdeel(r, 'liedje').route))).size).toBeGreaterThan(1)
    expect(new Set(routines.map((r) => naarTekst(onderdeel(r, 'akkoordwissel').route))).size).toBeGreaterThan(1)
  })

  it('nieuwe gebruiker: A en D wisselen, en het liedje dat het minst mist', () => {
    const r = maakRoutine(nieuweVoortgang(), eigen, nu)
    controleerVorm(r)
    expect(onderdeel(r, 'akkoordwissel').route).toEqual({ pagina: 'one-minute-changes', a: 'A', b: 'D' })
    expect(onderdeel(r, 'liedje').route).toEqual({ pagina: 'liedje', id: 'een' })
  })

  it('nieuwe gebruiker met de echte inhoud', () => {
    const r = maakRoutine(nieuweVoortgang(), echt, nu)
    controleerVorm(r)
    expect(onderdeel(r, 'akkoordwissel').route).toEqual({ pagina: 'one-minute-changes', a: 'A', b: 'D' })
    const id = (onderdeel(r, 'liedje').route as { id: string }).id
    const minst = Math.min(...data.liedjes.map((l) => ontbrekendeAkkoorden(l, ['A', 'D']).length))
    expect(ontbrekendeAkkoorden(data.zoekLiedje(id)!, ['A', 'D'])).toHaveLength(minst)
  })

  it('kiest een wissel met een akkoord op oefenen', () => {
    const v = met({ G: 'oefenen', A: 'kan ik', D: 'kan ik', C: 'kan ik' })
    for (let d = 0; d < 14; d++) {
      const route = onderdeel(maakRoutine(v, eigen, dag(d)), 'akkoordwissel').route as { a: string; b: string }
      expect([route.a, route.b], `dag ${d}`).toContain('G')
    }
  })

  it('kiest bij voorkeur een wissel die in een liedje voorkomt', () => {
    // G-C en C-D zitten in "twee"; A-G en D-G niet. Alleen G staat op oefenen, dus G-C is de enige.
    const v = met({ G: 'oefenen', A: 'kan ik', C: 'kan ik', D: 'kan ik' })
    for (let d = 0; d < 14; d++) {
      expect(onderdeel(maakRoutine(v, eigen, dag(d)), 'akkoordwissel').route, `dag ${d}`).toEqual({ pagina: 'one-minute-changes', a: 'C', b: 'G' })
    }
  })

  it('niemand op oefenen: een wissel tussen akkoorden die je kunt', () => {
    const v = met({ A: 'kan ik', D: 'kan ik', E: 'kan ik' })
    const r = maakRoutine(v, eigen, nu)
    controleerVorm(r)
    const route = onderdeel(r, 'akkoordwissel').route as { a: string; b: string }
    expect(['A', 'D', 'E']).toContain(route.a)
    expect(['A', 'D', 'E']).toContain(route.b)
    expect(route.a.localeCompare(route.b)).toBeLessThan(0)
  })

  it('één bekend akkoord: wisselen met het akkoord dat je nu het best kunt leren', () => {
    const r = maakRoutine(met({ D: 'oefenen' }), eigen, nu)
    controleerVorm(r)
    expect(onderdeel(r, 'akkoordwissel').route).toEqual({ pagina: 'one-minute-changes', a: 'A', b: 'D' })
  })

  it('niets bekend: toch een wissel van twee echte akkoorden', () => {
    const r = maakRoutine(met({}), eigen, nu)
    controleerVorm(r)
    const route = onderdeel(r, 'akkoordwissel').route as { a: string; b: string }
    expect(route.a).not.toBe(route.b)
    for (const naam of [route.a, route.b]) expect(eigen.akkoorden.map((a) => a.naam)).toContain(naam)
  })

  it('negeert statussen van akkoorden die niet (meer) bestaan', () => {
    const r = maakRoutine(met({ Xyz: 'oefenen', A: 'oefenen', D: 'oefenen' }), eigen, nu)
    expect(onderdeel(r, 'akkoordwissel').route).toEqual({ pagina: 'one-minute-changes', a: 'A', b: 'D' })
  })

  it('geen enkel speelbaar liedje: het liedje dat het minst mist', () => {
    const v = met({ G: 'oefenen', E: 'kan ik' })
    // een mist D en A, twee mist C en D, drie mist A, Em en C.
    for (let d = 0; d < 7; d++) {
      const id = (onderdeel(maakRoutine(v, eigen, dag(d)), 'liedje').route as { id: string }).id
      expect(['een', 'twee'], `dag ${d}`).toContain(id)
    }
    expect(onderdeel(maakRoutine(v, eigen, nu), 'liedje').uitleg).toMatch(/Mist/)
  })

  it('kiest bij speelbare liedjes eerst een met een akkoord op oefenen', () => {
    const v = met({ A: 'kan ik', D: 'kan ik', G: 'kan ik', C: 'oefenen' })
    for (let d = 0; d < 14; d++) {
      expect(onderdeel(maakRoutine(v, eigen, dag(d)), 'liedje').route, `dag ${d}`).toEqual({ pagina: 'liedje', id: 'twee' })
    }
  })

  it('alles al op kan ik: een wissel en een liedje die je kunt', () => {
    const alles = Object.fromEntries(eigen.akkoorden.map((a) => [a.naam, 'kan ik' as const]))
    const v = met(alles)
    for (let d = 0; d < 7; d++) {
      const r = maakRoutine(v, eigen, dag(d))
      controleerVorm(r)
      const id = (onderdeel(r, 'liedje').route as { id: string }).id
      expect(ontbrekendeAkkoorden(eigen.liedjes.find((l) => l.id === id)!, bekendeAkkoorden(v))).toEqual([])
    }
  })

  it('zonder spider warm je op met de eerste oefening', () => {
    const r = maakRoutine(nieuweVoortgang(), { ...eigen, oefeningen: [oefening('chromatisch')] }, nu)
    expect(onderdeel(r, 'opwarmen').route).toEqual({ pagina: 'oefening', id: 'chromatisch' })
  })
})

function naarTekst(x: unknown): string {
  return JSON.stringify(x)
}
