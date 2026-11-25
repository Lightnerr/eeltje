import { useEffect, useState } from 'react'

// Een preview registreert nooit een service worker: hij deelt de scope met main en mag die niet overnemen.
const MET_SERVICE_WORKER = import.meta.env.PROD && !import.meta.env.VITE_PREVIEW

/**
 * Registreert de service worker en zegt of er een nieuwe versie klaarstaat. `herlaad` activeert hem en laadt de app
 * opnieuw. Zonder klik neemt de nieuwe versie het over bij de volgende start.
 */
export function useNieuweVersie(): { nieuw: boolean; herlaad: () => void } {
  const [wachtend, zetWachtend] = useState<ServiceWorker | null>(null)

  useEffect(() => {
    if (!MET_SERVICE_WORKER || !('serviceWorker' in navigator)) return
    const container = navigator.serviceWorker
    let gestopt = false
    let vorige = container.controller
    let registratie: ServiceWorkerRegistration | undefined

    // Een andere versie neemt deze pagina over (via de knop, of in een ander tabblad): herladen, nooit half-oud.
    const opWissel = () => {
      if (vorige) location.reload()
      vorige = container.controller
    }
    const zoekUpdate = () => {
      if (document.visibilityState === 'visible') registratie?.update().catch(() => {})
    }
    const volg = (sw: ServiceWorker | null) => {
      const kijk = () => {
        if (!gestopt && sw?.state === 'installed' && container.controller) zetWachtend(sw)
      }
      kijk()
      sw?.addEventListener('statechange', kijk)
    }

    container.addEventListener('controllerchange', opWissel)
    document.addEventListener('visibilitychange', zoekUpdate)
    container
      .register('./sw.js', { scope: './' })
      .then((r) => {
        registratie = r
        volg(r.waiting)
        r.addEventListener('updatefound', () => volg(r.installing))
      })
      .catch(() => {})
    return () => {
      gestopt = true
      container.removeEventListener('controllerchange', opWissel)
      document.removeEventListener('visibilitychange', zoekUpdate)
    }
  }, [])

  return { nieuw: wachtend !== null, herlaad: () => wachtend?.postMessage('activeer') }
}
