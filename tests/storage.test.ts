import { describe, expect, it } from 'vitest'
import { demoVoortgang } from '../src/lib/demo'
import { maakOpslag, opslagSleutel } from '../src/lib/storage'
import { nieuweVoortgang, zetStatus } from '../src/lib/voortgang'

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

class KapotteOpslag extends GeheugenOpslag {
  getItem(): string | null {
    throw new Error('geen toegang')
  }
  setItem() {
    throw new Error('vol')
  }
}

const nu = new Date('2026-11-24T12:00:00')
const klok = () => nu

describe('opslagSleutel', () => {
  it('begint met eeltje.voortgang en krijgt het previewachtervoegsel', () => {
    expect(opslagSleutel('v1')).toBe('eeltje.voortgang.v1')
    expect(opslagSleutel('v1', 'pr-12')).toBe('eeltje.voortgang.v1.pr-12')
    expect(opslagSleutel('kapot', 'kijk')).toBe('eeltje.voortgang.kapot.kijk')
  })
})

describe('maakOpslag', () => {
  it('begint leeg met een nieuwe voortgang', () => {
    expect(maakOpslag({ storage: new GeheugenOpslag() }).laad()).toEqual(nieuweVoortgang())
  })

  it('een preview begint met de demo en slaat die nog niet op', () => {
    const storage = new GeheugenOpslag()
    expect(maakOpslag({ storage, preview: 'pr-12', klok }).laad()).toEqual(demoVoortgang(nu))
    expect(storage.length).toBe(0)
  })

  it('bewaart onder de vaste sleutel en laadt hem terug', () => {
    const storage = new GeheugenOpslag()
    const opslag = maakOpslag({ storage })
    const v = zetStatus(nieuweVoortgang(), 'G', 'kan ik')
    expect(opslag.bewaar(v)).toBe(true)
    expect(JSON.parse(storage.getItem('eeltje.voortgang.v1')!)).toEqual(v)
    expect(opslag.laad()).toEqual(v)
  })

  it('een preview raakt de echte voortgang niet', () => {
    const storage = new GeheugenOpslag()
    const echt = zetStatus(nieuweVoortgang(), 'G', 'kan ik')
    maakOpslag({ storage }).bewaar(echt)
    const preview = maakOpslag({ storage, preview: 'pr-12', klok })
    preview.bewaar(nieuweVoortgang())
    preview.wis()
    expect(storage.getItem('eeltje.voortgang.v1.pr-12')).toBeNull()
    expect(maakOpslag({ storage }).laad()).toEqual(echt)
  })

  it('{"versie":1} is een nieuwe gebruiker', () => {
    const storage = new GeheugenOpslag()
    storage.setItem('eeltje.voortgang.v1.kijk', '{"versie":1}')
    expect(maakOpslag({ storage, preview: 'kijk', klok }).laad()).toEqual(nieuweVoortgang())
  })

  it('bewaart een kapotte voortgang apart in plaats van hem weg te gooien', () => {
    const storage = new GeheugenOpslag()
    storage.setItem('eeltje.voortgang.v1', '{kapot')
    expect(maakOpslag({ storage }).laad()).toEqual(nieuweVoortgang())
    expect(storage.getItem('eeltje.voortgang.kapot')).toBe('{kapot')
    expect(storage.getItem('eeltje.voortgang.v1')).toBe('{kapot')
  })

  it('wis haalt de voortgang weg', () => {
    const storage = new GeheugenOpslag()
    const opslag = maakOpslag({ storage })
    opslag.bewaar(zetStatus(nieuweVoortgang(), 'G', 'kan ik'))
    opslag.wis()
    expect(storage.getItem('eeltje.voortgang.v1')).toBeNull()
    expect(opslag.laad()).toEqual(nieuweVoortgang())
  })

  it('werkt zonder of met een weigerende localStorage', () => {
    expect(maakOpslag({ storage: null }).laad()).toEqual(nieuweVoortgang())
    expect(maakOpslag({ storage: null }).bewaar(nieuweVoortgang())).toBe(false)
    const kapot = maakOpslag({ storage: new KapotteOpslag() })
    expect(kapot.laad()).toEqual(nieuweVoortgang())
    expect(kapot.bewaar(nieuweVoortgang())).toBe(false)
  })
})
