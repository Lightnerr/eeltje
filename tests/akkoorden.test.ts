import { describe, expect, it } from 'vitest'
import { akkoorden } from '../src/data'
import { akkoordnamen, gekozenVariant, kopieerTekst, rasterVan } from '../src/lib/akkoorden'
import { nieuweVoortgang } from '../src/lib/voortgang'
import type { Akkoord, Voortgang } from '../src/lib/types'

const basis = (naam: string, variant: string, standaard: boolean): Akkoord => ({
  naam,
  variant,
  titel: variant,
  standaard,
  frets: [0, 0, 0, 0, 0, 0],
  vingers: [0, 0, 0, 0, 0, 0],
  moeilijkheid: 1,
})

const lijst = [basis('G', 'standaard', true), basis('G', '3-vingers', false), basis('Em', 'standaard', true), basis('A', 'eigen', true)]

const voortgang = (v: Partial<Voortgang>): Voortgang => ({ ...nieuweVoortgang(), akkoordStatus: {}, ...v })

describe('akkoordnamen', () => {
  it('geeft elke naam één keer, in de volgorde van de lijst', () => {
    expect(akkoordnamen(lijst)).toEqual(['G', 'Em', 'A'])
  })
})

describe('gekozenVariant', () => {
  it('neemt de voorkeursvariant, anders de standaard', () => {
    expect(gekozenVariant(lijst, voortgang({}), 'G')?.variant).toBe('standaard')
    expect(gekozenVariant(lijst, voortgang({ voorkeurVariant: { G: '3-vingers' } }), 'G')?.variant).toBe('3-vingers')
  })

  it('valt terug op de standaard als de voorkeur niet meer bestaat', () => {
    expect(gekozenVariant(lijst, voortgang({ voorkeurVariant: { G: 'weg' } }), 'G')?.variant).toBe('standaard')
  })

  it('geeft undefined voor een onbekend akkoord', () => {
    expect(gekozenVariant(lijst, voortgang({}), 'X')).toBeUndefined()
  })
})

describe('rasterVan', () => {
  const v = voortgang({ akkoordStatus: { G: 'oefenen', A: 'kan ik' }, voorkeurVariant: { G: '3-vingers' } })

  it('geeft elk akkoord met de gekozen variant en de status', () => {
    expect(rasterVan(lijst, v).map((r) => [r.akkoord.naam, r.akkoord.variant, r.status])).toEqual([
      ['G', '3-vingers', 'oefenen'],
      ['Em', 'standaard', 'nieuw'],
      ['A', 'eigen', 'kan ik'],
    ])
  })

  it('filtert op status', () => {
    expect(rasterVan(lijst, v, 'nieuw').map((r) => r.akkoord.naam)).toEqual(['Em'])
    expect(rasterVan(lijst, v, 'kan ik').map((r) => r.akkoord.naam)).toEqual(['A'])
  })

  it('zet elk akkoord uit akkoorden.json in het raster', () => {
    const namen = rasterVan(akkoorden, nieuweVoortgang()).map((r) => r.akkoord.naam)
    expect(new Set(namen)).toEqual(new Set(akkoorden.map((a) => a.naam)))
    expect(namen.length).toBe(new Set(namen).size)
  })
})

describe('kopieerTekst', () => {
  it('noemt wat je kunt en wat je oefent, in de volgorde van de akkoorden', () => {
    const v = voortgang({ akkoordStatus: { A: 'kan ik', G: 'oefenen', Em: 'oefenen' } })
    expect(kopieerTekst(v, lijst)).toBe('Akkoorden die ik kan: A. Aan het oefenen: G, Em.')
  })

  it('laat een lege groep weg', () => {
    expect(kopieerTekst(voortgang({ akkoordStatus: { G: 'oefenen' } }), lijst)).toBe('Aan het oefenen: G.')
    expect(kopieerTekst(voortgang({ akkoordStatus: { A: 'kan ik' } }), lijst)).toBe('Akkoorden die ik kan: A.')
  })

  it('zegt het als je nog niets kent', () => {
    expect(kopieerTekst(voortgang({}), lijst)).toBe('Ik ken nog geen akkoorden.')
  })

  it('negeert statussen van akkoorden die niet (meer) bestaan', () => {
    expect(kopieerTekst(voortgang({ akkoordStatus: { Xm: 'kan ik', A: 'kan ik' } }), lijst)).toBe('Akkoorden die ik kan: A.')
  })
})
