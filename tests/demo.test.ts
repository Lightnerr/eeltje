import { describe, expect, it } from 'vitest'
import { liedjes, zoekAkkoord, zoekLiedje } from '../src/data'
import { demoVoortgang } from '../src/lib/demo'
import { capoSuggestie, ontbrekendeAkkoorden, speelbaarheidsLabel } from '../src/lib/muziek'
import { bekendeAkkoorden, normaliseerVoortgang } from '../src/lib/voortgang'

const nu = new Date('2026-11-24T12:00:00')
const demo = demoVoortgang(nu)
const DAG = 24 * 60 * 60 * 1000

function dagenGeleden(iso: string): number {
  const d = new Date(iso)
  const middernacht = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  return Math.round((middernacht(nu) - middernacht(d)) / DAG)
}

describe('demoVoortgang', () => {
  it('is geldig', () => {
    expect(normaliseerVoortgang(structuredClone(demo))).toEqual(demo)
  })

  it('hangt alleen van nu af', () => {
    expect(demoVoortgang(nu)).toEqual(demo)
  })

  it('A, D, E en Em op kan ik; G, C en Am op oefenen', () => {
    expect(demo.akkoordStatus).toEqual({ A: 'kan ik', D: 'kan ik', E: 'kan ik', Em: 'kan ik', G: 'oefenen', C: 'oefenen', Am: 'oefenen' })
  })

  it('verwijst alleen naar bestaande akkoorden, varianten en liedjes', () => {
    for (const naam of Object.keys(demo.akkoordStatus)) expect(zoekAkkoord(naam), naam).toBeDefined()
    expect(Object.keys(demo.voorkeurVariant).length).toBeGreaterThan(0)
    for (const [naam, variant] of Object.entries(demo.voorkeurVariant)) expect(zoekAkkoord(naam, variant), `${naam} ${variant}`).toBeDefined()
    expect(demo.favorieten).toHaveLength(2)
    expect(demo.gecontroleerd).toHaveLength(1)
    for (const id of [...demo.favorieten, ...demo.gecontroleerd]) expect(zoekLiedje(id), id).toBeDefined()
    for (const r of demo.challenges.filter((c) => c.type !== 'spider-ladder')) {
      for (const naam of r.sleutel.split('-')) expect(zoekAkkoord(naam), r.sleutel).toBeDefined()
    }
  })

  it('een maand sessies: elke dag van de afgelopen week, daarvoor om de dag', () => {
    const dagen = new Set(demo.sessies.map((s) => dagenGeleden(s.start)))
    for (let d = 0; d < 7; d++) expect(dagen, `dag ${d}`).toContain(d)
    expect(dagen).not.toContain(7)
    expect(dagen).toContain(8)
    expect(Math.max(...dagen)).toBeGreaterThanOrEqual(28)
    for (const s of demo.sessies) expect(new Date(s.start).getTime()).toBeLessThan(nu.getTime())
  })

  it('een stijgende geschiedenis voor alle drie de challenges', () => {
    const one = demo.challenges.filter((c) => c.type === 'one-minute-changes')
    const sleutels = new Set(one.map((c) => c.sleutel))
    expect(sleutels.size).toBeGreaterThanOrEqual(2)
    for (const sleutel of sleutels) {
      const [a, b] = sleutel.split('-')
      expect(a.localeCompare(b), sleutel).toBeLessThan(0)
    }
    for (const type of ['one-minute-changes', 'spider-ladder', 'wisselreeks'] as const) {
      const perSleutel = new Map<string, number[]>()
      const lijst = demo.challenges.filter((c) => c.type === type).sort((x, y) => x.datum.localeCompare(y.datum))
      expect(lijst.length, type).toBeGreaterThanOrEqual(3)
      for (const c of lijst) perSleutel.set(c.sleutel, [...(perSleutel.get(c.sleutel) ?? []), c.waarde])
      for (const [sleutel, waarden] of perSleutel) {
        expect(waarden[waarden.length - 1], `${type} ${sleutel}`).toBeGreaterThan(waarden[0])
      }
    }
    expect(demo.challenges.filter((c) => c.type === 'wisselreeks').every((c) => c.bpm !== undefined)).toBe(true)
  })

  it('geeft met de inhoud alle drie de speelbaarheidslabels en een capo-suggestie', () => {
    const bekend = bekendeAkkoorden(demo)
    const labels = liedjes.map((l) => speelbaarheidsLabel(ontbrekendeAkkoorden(l, bekend)))
    expect(labels).toContain('Kan je spelen')
    expect(labels.some((l) => l.startsWith('Mist 1 akkoord: '))).toBe(true)
    expect(labels.some((l) => /^Mist er \d+$/.test(l))).toBe(true)
    expect(liedjes.some((l) => capoSuggestie(l, bekend))).toBe(true)
  })
})
