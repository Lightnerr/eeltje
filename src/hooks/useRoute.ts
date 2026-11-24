import { useMemo, useSyncExternalStore } from 'react'
import { leesRoute, naarHash, type Route } from '../lib/route'

function abonneer(luisteraar: () => void) {
  window.addEventListener('hashchange', luisteraar)
  return () => window.removeEventListener('hashchange', luisteraar)
}

const hash = () => window.location.hash

export function useRoute(): Route {
  const h = useSyncExternalStore(abonneer, hash)
  return useMemo(() => leesRoute(h), [h])
}

export function navigeer(route: Route) {
  window.location.hash = naarHash(route)
}
