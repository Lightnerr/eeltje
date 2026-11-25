import { describe, expect, it } from 'vitest'
import { demoVoortgang } from '../src/lib/demo'
import { maakOpslag, opslagSleutel } from '../src/lib/storage'
import { exporteerVoortgang, nieuweVoortgang, zetStatus } from '../src/lib/voortgang'
import type { BewaardeRoutine } from '../src/lib/routine'

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
  it('herkent een storage-event van een ander tabblad voor zijn eigen sleutel', () => {
    const storage = new GeheugenOpslag()
    const echt = maakOpslag({ storage })
    const preview = maakOpslag({ storage, preview: 'pr-12', klok })
    expect(echt.isEigenWijziging('eeltje.voortgang.v1', storage)).toBe(true)
    expect(echt.isEigenWijziging('eeltje.voortgang.v1.pr-12', storage)).toBe(false)
    expect(preview.isEigenWijziging('eeltje.voortgang.v1.pr-12', storage)).toBe(true)
    expect(echt.isEigenWijziging(null, storage)).toBe(true)
    expect(echt.isEigenWijziging('eeltje.voortgang.v1', new GeheugenOpslag())).toBe(false)
    expect(echt.isEigenWijziging('iets-anders', storage)).toBe(false)
  })

  describe('routine van vandaag', () => {
    const bewaard: BewaardeRoutine = {
      datum: '2026-11-24',
      routine: { datum: '2026-11-24', minuten: 6, onderdelen: [{ soort: 'liedje', titel: 'Speel Zombie', uitleg: 'Kan je spelen.', minuten: 6, route: { pagina: 'liedje', id: 'zombie' } }] },
    }

    it('bewaart hem onder een eigen sleutel, met het previewachtervoegsel', () => {
      const storage = new GeheugenOpslag()
      const echt = maakOpslag({ storage })
      const preview = maakOpslag({ storage, preview: 'pr-12', klok })
      expect(echt.laadRoutine()).toBeNull()
      expect(echt.bewaarRoutine(bewaard)).toBe(true)
      expect(JSON.parse(storage.getItem('eeltje.voortgang.routine')!)).toEqual(bewaard)
      expect(echt.laadRoutine()).toEqual(bewaard)
      expect(preview.laadRoutine()).toBeNull()
      preview.bewaarRoutine(bewaard)
      expect(storage.getItem('eeltje.voortgang.routine.pr-12')).not.toBeNull()
    })

    it('raakt de voortgang niet en zit niet in de export', () => {
      const storage = new GeheugenOpslag()
      const opslag = maakOpslag({ storage })
      opslag.bewaarRoutine(bewaard)
      expect(storage.getItem('eeltje.voortgang.v1')).toBeNull()
      expect(exporteerVoortgang(opslag.laad())).not.toContain('Zombie')
    })

    it('wis haalt ook de routine weg', () => {
      const storage = new GeheugenOpslag()
      const opslag = maakOpslag({ storage })
      opslag.bewaar(nieuweVoortgang())
      opslag.bewaarRoutine(bewaard)
      opslag.wis()
      expect(storage.getItem('eeltje.voortgang.routine')).toBeNull()
      expect(opslag.laadRoutine()).toBeNull()
    })

    it('kapotte JSON of een weigerende opslag geeft null', () => {
      const storage = new GeheugenOpslag()
      storage.setItem('eeltje.voortgang.routine', '{kapot')
      expect(maakOpslag({ storage }).laadRoutine()).toBeNull()
      expect(maakOpslag({ storage: new KapotteOpslag() }).laadRoutine()).toBeNull()
      expect(maakOpslag({ storage: null }).bewaarRoutine(bewaard)).toBe(false)
    })
  })

  describe('oefentimer', () => {
    const timer = { start: nu.toISOString(), opgeteld: 60_000, looptSinds: null }

    it('bewaart hem onder een eigen sleutel met het previewachtervoegsel, en null haalt hem weg', () => {
      const storage = new GeheugenOpslag()
      const preview = maakOpslag({ storage, preview: 'pr-12', klok })
      expect(preview.laadTimer()).toBeNull()
      expect(preview.bewaarTimer(timer)).toBe(true)
      expect(JSON.parse(storage.getItem('eeltje.voortgang.timer.pr-12')!)).toEqual(timer)
      expect(preview.laadTimer()).toEqual(timer)
      expect(maakOpslag({ storage }).laadTimer()).toBeNull()
      preview.bewaarTimer(null)
      expect(storage.getItem('eeltje.voortgang.timer.pr-12')).toBeNull()
    })

    it('wis haalt ook de timer weg', () => {
      const storage = new GeheugenOpslag()
      const opslag = maakOpslag({ storage })
      opslag.bewaarTimer(timer)
      opslag.wis()
      expect(opslag.laadTimer()).toBeNull()
    })

    it('kapotte JSON geeft null', () => {
      const storage = new GeheugenOpslag()
      storage.setItem('eeltje.voortgang.timer', '{kapot')
      expect(maakOpslag({ storage }).laadTimer()).toBeNull()
    })
  })

  it('isTimerWijziging: alleen de eigen timersleutel, of alles gewist', () => {
    const storage = new GeheugenOpslag()
    const echt = maakOpslag({ storage })
    const preview = maakOpslag({ storage, preview: 'pr-12', klok })
    expect(echt.isTimerWijziging('eeltje.voortgang.timer', storage)).toBe(true)
    expect(echt.isTimerWijziging(null, storage)).toBe(true)
    expect(echt.isTimerWijziging('eeltje.voortgang.timer.pr-12', storage)).toBe(false)
    expect(preview.isTimerWijziging('eeltje.voortgang.timer.pr-12', storage)).toBe(true)
    expect(echt.isTimerWijziging('eeltje.voortgang.v1', storage)).toBe(false)
    expect(echt.isTimerWijziging('eeltje.voortgang.timer', new GeheugenOpslag())).toBe(false)
  })

  it('wis haalt ook de opzijgezette kapotte voortgang weg, en alleen die van deze opslag', () => {
    const storage = new GeheugenOpslag()
    storage.setItem('eeltje.voortgang.v1', '{kapot')
    storage.setItem('eeltje.voortgang.kapot.pr-12', '{ook kapot')
    const opslag = maakOpslag({ storage })
    opslag.laad()
    expect(storage.getItem('eeltje.voortgang.kapot')).toBe('{kapot')
    opslag.wis()
    expect(storage.getItem('eeltje.voortgang.kapot')).toBeNull()
    expect(storage.getItem('eeltje.voortgang.kapot.pr-12')).toBe('{ook kapot')
  })
})
