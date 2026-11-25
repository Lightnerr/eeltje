import { describe, expect, it } from 'vitest'
import { MAX_BPM, MIN_BPM } from '../src/lib/metronoom'
import { SPIDER_START_BPM, SPIDER_STAP, spiderBegin, spiderResultaat, spiderVerloop, type SpiderActie, type SpiderStand } from '../src/lib/spiderLadder'

function speel(acties: SpiderActie[], stand: SpiderStand = spiderBegin()): SpiderStand {
  return acties.reduce(spiderVerloop, stand)
}

const start: SpiderActie = { soort: 'start' }
const gelukt: SpiderActie = { soort: 'gelukt' }

describe('spider-ladder', () => {
  it('begint laag, of op het tempo uit de route, binnen de grenzen van de metronoom', () => {
    expect(SPIDER_START_BPM).toBe(50)
    expect(spiderBegin()).toEqual({ fase: 'wacht', bpm: 50 })
    expect(spiderBegin(64)).toEqual({ fase: 'wacht', bpm: 64 })
    expect(spiderBegin(5)).toEqual({ fase: 'wacht', bpm: MIN_BPM })
    expect(spiderBegin(500)).toEqual({ fase: 'wacht', bpm: MAX_BPM })
  })

  it('het starttempo stel je in voor je begint, ook begrensd', () => {
    expect(speel([{ soort: 'zetBpm', bpm: 70 }])).toEqual({ fase: 'wacht', bpm: 70 })
    expect(speel([{ soort: 'zetBpm', bpm: 10 }]).bpm).toBe(MIN_BPM)
    expect(speel([start, { soort: 'zetBpm', bpm: 90 }]).bpm).toBe(50)
  })

  it('na elke ronde die lukte gaat het tempo 5 bpm omhoog', () => {
    expect(SPIDER_STAP).toBe(5)
    expect(speel([start])).toEqual({ fase: 'lopen', startBpm: 50, bpm: 50, hoogste: null, rondes: 0 })
    expect(speel([start, gelukt, gelukt])).toEqual({ fase: 'lopen', startBpm: 50, bpm: 60, hoogste: 55, rondes: 2 })
  })

  it('een ronde die niet lukte maakt hem af; het hoogste tempo dat lukte blijft staan', () => {
    expect(speel([start, gelukt, gelukt, { soort: 'mislukt' }])).toEqual({ fase: 'klaar', startBpm: 50, bpm: 60, hoogste: 55, rondes: 3 })
  })

  it('bovenaan de metronoom is hij af', () => {
    const stand = speel([start, gelukt], spiderBegin(MAX_BPM - SPIDER_STAP))
    expect(stand).toMatchObject({ fase: 'lopen', bpm: MAX_BPM, hoogste: MAX_BPM - SPIDER_STAP })
    expect(spiderVerloop(stand, gelukt)).toMatchObject({ fase: 'klaar', bpm: MAX_BPM, hoogste: MAX_BPM })
  })

  it('opnieuw begint weer op het starttempo', () => {
    expect(speel([start, gelukt, gelukt, { soort: 'mislukt' }, { soort: 'opnieuw' }])).toEqual({ fase: 'wacht', bpm: 50 })
  })

  it('alleen een resultaat als hij klaar is en er een ronde lukte', () => {
    expect(spiderResultaat(speel([start, gelukt]))).toBeNull()
    expect(spiderResultaat(speel([start, { soort: 'mislukt' }]))).toBeNull()
    expect(spiderResultaat(speel([start, gelukt, gelukt, { soort: 'mislukt' }]))).toEqual({ type: 'spider-ladder', sleutel: 'spider', waarde: 55 })
  })
})
