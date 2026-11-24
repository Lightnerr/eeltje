import { useEffect } from 'react'

/** Houdt het scherm aan zolang `actief` waar is. Stil als de browser het niet kan. */
export function useWakeLock(actief: boolean) {
  useEffect(() => {
    if (!actief || !('wakeLock' in navigator)) return
    let slot: WakeLockSentinel | null = null
    let gestopt = false

    async function vraag() {
      if (document.visibilityState !== 'visible') return
      try {
        const nieuw = await navigator.wakeLock.request('screen')
        if (gestopt) void nieuw.release()
        else slot = nieuw
      } catch {
        // Geweigerd (batterijbesparing, geen gebruikersactie): dan maar zonder.
      }
    }

    // De browser laat het slot los als de pagina verborgen raakt; daarna opnieuw aanvragen.
    const opZichtbaarheid = () => {
      if (document.visibilityState === 'visible' && (!slot || slot.released)) void vraag()
    }

    void vraag()
    document.addEventListener('visibilitychange', opZichtbaarheid)
    return () => {
      gestopt = true
      document.removeEventListener('visibilitychange', opZichtbaarheid)
      void slot?.release().catch(() => {})
    }
  }, [actief])
}
