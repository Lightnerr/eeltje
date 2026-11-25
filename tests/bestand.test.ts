import { describe, expect, it } from 'vitest'
import { bestandsnaam, leesBestand, MAX_BESTAND_TEKENS, samenvatting, samenvattingTekst } from '../src/lib/bestand'
import { demoVoortgang } from '../src/lib/demo'
import { maakOpslag } from '../src/lib/storage'
import type { Voortgang } from '../src/lib/types'
import { exporteerVoortgang, nieuweVoortgang, zetStatus } from '../src/lib/voortgang'

class GeheugenOpslag implements Storage {
  private data = new Map<string, string>()
  get length() {
    return this.data.size
  }
  clear() {
    this.data.clear()
  }
  getItem(k: string) {
    return this.data.get(k) ?? null
  }
  key(i: number) {
    return [...this.data.keys()][i] ?? null
  }
  removeItem(k: string) {
    this.data.delete(k)
  }
  setItem(k: string, v: string) {
    this.data.set(k, v)
  }
}

const nu = new Date('2026-11-24T12:00:00')
const demo = demoVoortgang(nu)

describe('bestandsnaam', () => {
  it('heeft de lokale datum erin', () => {
    expect(bestandsnaam(nu)).toBe('eeltje-voortgang-2026-11-24.json')
    expect(bestandsnaam(new Date('2026-01-05T00:10:00'))).toBe('eeltje-voortgang-2026-01-05.json')
  })
})

describe('leesBestand: wat goed is', () => {
  it('een export uit de ene browser geeft in de andere dezelfde voortgang', () => {
    const laptop = maakOpslag({ storage: new GeheugenOpslag() })
    laptop.bewaar(demo)
    const bestand = exporteerVoortgang(laptop.laad())

    const telefoon = maakOpslag({ storage: new GeheugenOpslag() })
    telefoon.bewaar(zetStatus(nieuweVoortgang(), 'F', 'oefenen'))
    telefoon.bewaar(leesBestand(bestand))
    expect(telefoon.laad()).toEqual(laptop.laad())
    expect(telefoon.laad()).toEqual(demo)
  })

  it('{"versie":1} is een nieuwe gebruiker', () => {
    expect(leesBestand('{"versie":1}')).toEqual(nieuweVoortgang())
  })

  it('een oud of minimaal bestand wordt aangevuld', () => {
    const v = leesBestand(JSON.stringify({ versie: 1, akkoordStatus: { G: 'kan ik' }, sessies: [{ start: nu.toISOString(), seconden: 600 }] }))
    expect(v).toEqual({ ...nieuweVoortgang(), akkoordStatus: { G: 'kan ik' }, sessies: [{ start: nu.toISOString(), seconden: 600 }] })
  })

  it('een BOM of witruimte rond de JSON (Kladblok) mag', () => {
    expect(leesBestand('\uFEFF  {"versie":1}\n')).toEqual(nieuweVoortgang())
  })
})

describe('leesBestand: wat fout is, met een duidelijke melding en de voortgang heel', () => {
  const gevallen: [naam: string, tekst: string, melding: RegExp][] = [
    ['leeg', '', /leeg/],
    ['alleen witruimte', '  \n ', /leeg/],
    ['geen JSON', 'hallo, dit is een boodschappenlijst', /geen JSON/],
    ['halve JSON', '{"versie":1,"sessies":[', /geen JSON/],
    ['JSON-lijst', '[1,2,3]', /geen voortgang van Eeltje/],
    ['ander JSON-object', '{"naam":"iets anders"}', /geen voortgang van Eeltje/],
    ['null', 'null', /geen voortgang van Eeltje/],
    ['getal', '42', /geen voortgang van Eeltje/],
    ['versie als tekst', '{"versie":"1"}', /geen voortgang van Eeltje/],
    ['versie uit de toekomst', '{"versie":2,"sessies":[]}', /nieuwere versie/],
    ['te groot', `{"versie":1,"x":"${'a'.repeat(MAX_BESTAND_TEKENS)}"}`, /te groot/],
  ]

  for (const [naam, tekst, melding] of gevallen) {
    it(naam, () => {
      const opslag = maakOpslag({ storage: new GeheugenOpslag() })
      opslag.bewaar(demo)
      let fout: unknown
      try {
        opslag.bewaar(leesBestand(tekst))
      } catch (e) {
        fout = e
      }
      expect(fout).toBeInstanceOf(Error)
      expect((fout as Error).message).toMatch(melding)
      expect((fout as Error).message).toMatch(/\.$/)
      expect(opslag.laad()).toEqual(demo)
    })
  }
})

describe('samenvatting', () => {
  it('telt sessies, records (per challenge en paar of reeks) en akkoorden die je kent of oefent', () => {
    expect(samenvatting(demo)).toEqual({ sessies: demo.sessies.length, records: 6, akkoorden: 7 })
    expect(samenvattingTekst(samenvatting(demo))).toBe(`${demo.sessies.length} sessies, 6 records en 7 akkoorden`)
  })

  it('enkelvoud en een nieuwe gebruiker', () => {
    const een: Voortgang = {
      ...nieuweVoortgang(),
      akkoordStatus: { G: 'kan ik' },
      sessies: [{ start: nu.toISOString(), seconden: 60 }],
      challenges: [{ type: 'spider-ladder', sleutel: 'spider', waarde: 60, datum: nu.toISOString() }],
    }
    expect(samenvattingTekst(samenvatting(een))).toBe('1 sessie, 1 record en 1 akkoord')
    expect(samenvattingTekst(samenvatting(nieuweVoortgang()))).toBe('0 sessies, 0 records en 2 akkoorden')
  })
})
