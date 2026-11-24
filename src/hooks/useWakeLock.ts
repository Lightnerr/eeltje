import { useEffect } from 'react'
import { maakSchermWakker } from '../lib/wakeLock'

/** Houdt het scherm aan zolang `actief` waar is. Stil als de browser het niet kan. */
export function useWakeLock(actief: boolean) {
  useEffect(() => {
    if (!actief || !('wakeLock' in navigator)) return
    const wakker = maakSchermWakker(() => navigator.wakeLock.request('screen'))

    // De browser laat het slot los als de pagina verborgen raakt; daarna opnieuw aanvragen.
    const opZichtbaarheid = () => {
      if (document.visibilityState === 'visible') void wakker.vraag()
    }

    opZichtbaarheid()
    document.addEventListener('visibilitychange', opZichtbaarheid)
    return () => {
      document.removeEventListener('visibilitychange', opZichtbaarheid)
      wakker.stop()
    }
  }, [actief])
}
