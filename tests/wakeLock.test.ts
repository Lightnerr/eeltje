import { describe, expect, it } from 'vitest'
import { maakSchermWakker, type Slot } from '../src/lib/wakeLock'

function nepSlot(): Slot & { released: boolean; losgelaten: number } {
  const slot = {
    released: false,
    losgelaten: 0,
    release: async () => {
      slot.released = true
      slot.losgelaten++
    },
  }
  return slot
}

function aanvrager() {
  const wachtend: ((s: Slot) => void)[] = []
  const sloten: ReturnType<typeof nepSlot>[] = []
  return {
    sloten,
    aantal: () => sloten.length,
    vraagAan: () =>
      new Promise<Slot>((klaar) => {
        const s = nepSlot()
        sloten.push(s)
        wachtend.push(() => klaar(s))
      }),
    geefAlles: async () => {
      for (const w of wachtend.splice(0)) w(undefined as never)
      await Promise.resolve()
      await Promise.resolve()
    },
  }
}

describe('maakSchermWakker', () => {
  it('vraagt maar één keer zolang een aanvraag loopt', async () => {
    const a = aanvrager()
    const wakker = maakSchermWakker(a.vraagAan)
    void wakker.vraag()
    void wakker.vraag()
    await a.geefAlles()
    expect(a.aantal()).toBe(1)
    void wakker.vraag()
    expect(a.aantal()).toBe(1)
  })

  it('laat een slot los dat binnenkomt na het stoppen', async () => {
    const a = aanvrager()
    const wakker = maakSchermWakker(a.vraagAan)
    void wakker.vraag()
    wakker.stop()
    await a.geefAlles()
    expect(a.sloten[0].losgelaten).toBe(1)
    void wakker.vraag()
    expect(a.aantal()).toBe(1)
  })

  it('vraagt opnieuw als de browser het slot losliet', async () => {
    const a = aanvrager()
    const wakker = maakSchermWakker(a.vraagAan)
    void wakker.vraag()
    await a.geefAlles()
    a.sloten[0].released = true
    void wakker.vraag()
    expect(a.aantal()).toBe(2)
    await a.geefAlles()
    wakker.stop()
    expect(a.sloten[1].losgelaten).toBe(1)
  })

  it('blijft stil als de aanvraag mislukt', async () => {
    const wakker = maakSchermWakker(() => Promise.reject(new Error('nee')))
    await expect(wakker.vraag()).resolves.toBeUndefined()
  })
})
