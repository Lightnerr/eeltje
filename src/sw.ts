// De service worker. tools/serviceworker.ts bouwt hem als dist/sw.js en vult de precache en de versie in.
// Elke versie heeft een eigen cache; een nieuwe versie wacht tot je herlaadt (of de app opnieuw start), zodat je nooit
// een half-oude app ziet.
import { aanpak, cacheNaam, oudeCaches } from './lib/pwa'

declare const __PRECACHE__: string[]
declare const __VERSIE__: string

// De DOM-types kennen de service worker-scope niet; dit is wat we ervan gebruiken.
interface WachtEvent extends Event {
  waitUntil(werk: Promise<unknown>): void
}
interface FetchEvent extends WachtEvent {
  request: Request
  respondWith(antwoord: Promise<Response>): void
}
interface ServiceWorkerScope {
  registration: ServiceWorkerRegistration
  clients: { claim(): Promise<void> }
  skipWaiting(): Promise<void>
  addEventListener(type: 'install' | 'activate', luisteraar: (e: WachtEvent) => void): void
  addEventListener(type: 'fetch', luisteraar: (e: FetchEvent) => void): void
  addEventListener(type: 'message', luisteraar: (e: MessageEvent) => void): void
}

const sw = self as unknown as ServiceWorkerScope
const CACHE = cacheNaam(__VERSIE__)

sw.addEventListener('install', (e) => {
  // `reload`: niet uit de HTTP-cache van de browser, anders kan een oude index.html bij nieuwe assets belanden.
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(__PRECACHE__.map((pad) => new Request(pad, { cache: 'reload' })))))
})

sw.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((namen) => Promise.all(oudeCaches(namen, CACHE).map((n) => caches.delete(n))))
      .then(() => sw.clients.claim()),
  )
})

sw.addEventListener('message', (e) => {
  if (e.data === 'activeer') void sw.skipWaiting()
})

sw.addEventListener('fetch', (e) => {
  const soort = aanpak(e.request, sw.registration.scope, __PRECACHE__)
  if (soort === 'netwerk') return
  const pad = soort === 'index' ? 'index.html' : e.request
  e.respondWith(
    caches
      .open(CACHE)
      .then((c) => c.match(pad))
      .then((antwoord) => antwoord ?? fetch(e.request)),
  )
})
