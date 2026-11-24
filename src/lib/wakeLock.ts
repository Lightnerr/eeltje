/** Het deel van een `WakeLockSentinel` dat we gebruiken. */
export interface Slot {
  readonly released: boolean
  release(): Promise<void>
}

/**
 * Houdt het scherm wakker via `vraagAan` (in de browser `navigator.wakeLock.request('screen')`). Er loopt nooit meer
 * dan één aanvraag tegelijk, en een slot dat pas binnenkomt na `stop()` gaat meteen weer los.
 */
export function maakSchermWakker(vraagAan: () => Promise<Slot>) {
  let slot: Slot | null = null
  let bezig = false
  let gestopt = false

  return {
    async vraag(): Promise<void> {
      if (gestopt || bezig || (slot && !slot.released)) return
      bezig = true
      try {
        const nieuw = await vraagAan()
        if (gestopt) void nieuw.release().catch(() => {})
        else slot = nieuw
      } catch {
        // Geweigerd (batterijbesparing, geen gebruikersactie): dan maar zonder.
      } finally {
        bezig = false
      }
    },
    stop() {
      gestopt = true
      if (slot && !slot.released) void slot.release().catch(() => {})
      slot = null
    },
  }
}
