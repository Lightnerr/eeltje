import { describe, expect, it } from 'vitest'
import {
  bekendeAkkoorden,
  exporteerVoortgang,
  importeerVoortgang,
  normaliseerVoortgang,
  nieuweVoortgang,
  statusVan,
  voegSessieToe,
  wisselFavoriet,
  zetGecontroleerd,
  zetStatus,
  zetVoorkeurVariant,
} from '../src/lib/voortgang'
import type { Voortgang } from '../src/lib/types'

const voorbeeld: Voortgang = {
  versie: 1,
  akkoordStatus: { A: 'kan ik', G: 'oefenen' },
  voorkeurVariant: { G: '3-vingers' },
  challenges: [{ type: 'one-minute-changes', sleutel: 'A-D', waarde: 20, datum: '2026-11-20T18:00:00.000Z' }],
  sessies: [{ start: '2026-11-20T18:00:00.000Z', seconden: 600 }],
  favorieten: ['wonderwall'],
  gecontroleerd: [],
}

describe('nieuweVoortgang', () => {
  it('zet D en A op oefenen', () => {
    const v = nieuweVoortgang()
    expect(v.akkoordStatus).toEqual({ A: 'oefenen', D: 'oefenen' })
    expect(v).toMatchObject({ versie: 1, challenges: [], sessies: [], favorieten: [], gecontroleerd: [], voorkeurVariant: {} })
  })
})

describe('normaliseerVoortgang', () => {
  it('{"versie":1} is een nieuwe gebruiker', () => {
    expect(normaliseerVoortgang({ versie: 1 })).toEqual(nieuweVoortgang())
  })

  it('laat een geldige voortgang heel', () => {
    expect(normaliseerVoortgang(structuredClone(voorbeeld))).toEqual(voorbeeld)
  })

  it('een lege akkoordStatus blijft leeg', () => {
    expect(normaliseerVoortgang({ versie: 1, akkoordStatus: {} }).akkoordStatus).toEqual({})
  })

  it('gooit ongeldige items weg', () => {
    const v = normaliseerVoortgang({
      versie: 1,
      akkoordStatus: { A: 'kan ik', B: 'misschien', C: 3 },
      voorkeurVariant: { A: 'eigen', B: 4 },
      challenges: [
        voorbeeld.challenges[0],
        { type: 'raden', sleutel: 'x', waarde: 1, datum: '2026-11-20T18:00:00.000Z' },
        { type: 'spider-ladder', sleutel: 'spider', waarde: -1, datum: '2026-11-20T18:00:00.000Z' },
        { type: 'spider-ladder', sleutel: 'spider', waarde: 60, datum: 'gisteren' },
        { type: 'wisselreeks', sleutel: 'G-C-D', waarde: 30, bpm: 'snel', datum: '2026-11-20T18:00:00.000Z' },
        { type: 'wisselreeks', sleutel: 'G-C-D', waarde: 30, bpm: 70, datum: '2026-11-20T18:00:00.000Z' },
        null,
      ],
      sessies: [voorbeeld.sessies[0], { start: 'nooit', seconden: 5 }, { start: '2026-11-20T18:00:00.000Z', seconden: Number.NaN }],
      favorieten: ['a', 'a', 3, 'b'],
      gecontroleerd: 'alles',
    })
    expect(v.akkoordStatus).toEqual({ A: 'kan ik' })
    expect(v.voorkeurVariant).toEqual({ A: 'eigen' })
    expect(v.challenges).toEqual([
      voorbeeld.challenges[0],
      { type: 'wisselreeks', sleutel: 'G-C-D', waarde: 30, bpm: 70, datum: '2026-11-20T18:00:00.000Z' },
    ])
    expect(v.sessies).toEqual(voorbeeld.sessies)
    expect(v.favorieten).toEqual(['a', 'b'])
    expect(v.gecontroleerd).toEqual([])
  })

  it('gooit dubbele sessies (zelfde start) weg, de eerste blijft', () => {
    const start = '2026-11-24T18:00:00.000Z'
    const v = normaliseerVoortgang({
      versie: 1,
      sessies: [
        { start, seconden: 600 },
        { start: '2026-11-23T18:00:00.000Z', seconden: 300 },
        { start, seconden: 600 },
        { start, seconden: 900 },
      ],
    })
    expect(v.sessies).toEqual([
      { start, seconden: 600 },
      { start: '2026-11-23T18:00:00.000Z', seconden: 300 },
    ])
  })

  it('gooit bij iets dat geen Eeltje-voortgang is', () => {
    expect(() => normaliseerVoortgang(null)).toThrow('Dit is geen voortgang van Eeltje.')
    expect(() => normaliseerVoortgang([1, 2])).toThrow('Dit is geen voortgang van Eeltje.')
    expect(() => normaliseerVoortgang({ naam: 'iets' })).toThrow('Dit is geen voortgang van Eeltje.')
    expect(() => normaliseerVoortgang({ versie: 'een' })).toThrow('Dit is geen voortgang van Eeltje.')
  })

  it('gooit bij een onbekende hogere versie', () => {
    expect(() => normaliseerVoortgang({ versie: 2 })).toThrow(/nieuwere versie van Eeltje/)
  })
})

describe('export en import', () => {
  it('gaat heen en terug', () => {
    expect(importeerVoortgang(exporteerVoortgang(voorbeeld))).toEqual(voorbeeld)
  })

  it('geeft een duidelijke melding bij een kapot bestand', () => {
    expect(() => importeerVoortgang('{kapot')).toThrow('Dit bestand kan ik niet lezen: het is geen JSON.')
    expect(() => importeerVoortgang('"tekst"')).toThrow('Dit is geen voortgang van Eeltje.')
  })
})

describe('wijzigers', () => {
  it('statusVan geeft nieuw als er niets staat', () => {
    expect(statusVan(voorbeeld, 'A')).toBe('kan ik')
    expect(statusVan(voorbeeld, 'Bm')).toBe('nieuw')
  })

  it('zetStatus muteert niet en haalt nieuw weg', () => {
    const v = zetStatus(voorbeeld, 'Em', 'oefenen')
    expect(v.akkoordStatus).toEqual({ A: 'kan ik', G: 'oefenen', Em: 'oefenen' })
    expect(voorbeeld.akkoordStatus).toEqual({ A: 'kan ik', G: 'oefenen' })
    expect(zetStatus(voorbeeld, 'A', 'nieuw').akkoordStatus).toEqual({ G: 'oefenen' })
  })

  it('zetVoorkeurVariant', () => {
    expect(zetVoorkeurVariant(voorbeeld, 'A', 'klassiek').voorkeurVariant).toEqual({ G: '3-vingers', A: 'klassiek' })
    expect(voorbeeld.voorkeurVariant).toEqual({ G: '3-vingers' })
  })

  it('wisselFavoriet zet aan en uit', () => {
    expect(wisselFavoriet(voorbeeld, 'zombie').favorieten).toEqual(['wonderwall', 'zombie'])
    expect(wisselFavoriet(voorbeeld, 'wonderwall').favorieten).toEqual([])
    expect(voorbeeld.favorieten).toEqual(['wonderwall'])
  })

  it('zetGecontroleerd is idempotent en kan terug', () => {
    const v = zetGecontroleerd(zetGecontroleerd(voorbeeld, 'zombie'), 'zombie')
    expect(v.gecontroleerd).toEqual(['zombie'])
    expect(zetGecontroleerd(v, 'zombie', false).gecontroleerd).toEqual([])
    expect(voorbeeld.gecontroleerd).toEqual([])
  })

  it('voegSessieToe', () => {
    const sessie = { start: '2026-11-21T18:00:00.000Z', seconden: 300 }
    expect(voegSessieToe(voorbeeld, sessie).sessies).toEqual([...voorbeeld.sessies, sessie])
    // Dezelfde sessie nog eens (een tweede tabblad) komt er niet dubbel in.
    const een = voegSessieToe(voorbeeld, sessie)
    expect(voegSessieToe(een, { ...sessie })).toBe(een)
    expect(voorbeeld.sessies).toHaveLength(1)
  })

  it('bekendeAkkoorden zijn op oefenen of kan ik', () => {
    expect(bekendeAkkoorden(zetStatus(voorbeeld, 'Em', 'nieuw')).sort()).toEqual(['A', 'G'])
  })
})
