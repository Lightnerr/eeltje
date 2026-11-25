import { describe, expect, it } from 'vitest'
import akkoordenJson from '../src/data/akkoorden.json'
import oefeningenJson from '../src/data/oefeningen.json'
import { valideerInhoud } from '../src/lib/validatie'

// `bun run valideer` draait alleen dit bestand: alle inhoud in src/data tegen het schema.

const liedjeBestanden = import.meta.glob<unknown>('../src/data/liedjes/*.json', { eager: true, import: 'default' })
const riffBestanden = import.meta.glob<unknown>('../src/data/riffs/*.json', { eager: true, import: 'default' })

describe('inhoud', () => {
  it('voldoet aan het schema', () => {
    expect(valideerInhoud({ akkoorden: akkoordenJson, liedjes: Object.values(liedjeBestanden), oefeningen: oefeningenJson, riffs: Object.values(riffBestanden) })).toEqual([])
  })

  it('bestandsnaam van een liedje of riff is zijn id', () => {
    for (const [pad, liedje] of Object.entries({ ...liedjeBestanden, ...riffBestanden })) {
      expect(pad.replace(/^.*\//, '').replace(/\.json$/, '')).toBe((liedje as { id: string }).id)
    }
  })
})
