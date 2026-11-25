// Wat de service worker (src/sw.ts) met een verzoek doet en wat hij precachet. Puur, zodat het te testen is.

export type Aanpak = 'index' | 'cache' | 'netwerk'

export interface Verzoek {
  url: string
  method: string
  mode: string
}

// De service worker van main heeft de hele site als scope, dus ook de PR-previews in pr-<nummer>/. Die zijn van zichzelf.
const PREVIEW = /^pr-\d+(\/|$)/

const CACHE_VOORVOEGSEL = 'eeltje-'

/** Het pad binnen de scope zonder query, of `null` als de url erbuiten valt. */
function padInScope(url: string, scope: string): string | null {
  const u = new URL(url)
  const s = new URL(scope)
  if (u.origin !== s.origin || !u.pathname.startsWith(s.pathname)) return null
  return u.pathname.slice(s.pathname.length)
}

/**
 * `index`: een navigatie krijgt index.html uit de cache (hash-routes, dus er is maar één pagina).
 * `cache`: een bestand uit de precache. `netwerk`: niet aankomen, ook alles onder pr-<nummer>/.
 */
export function aanpak(verzoek: Verzoek, scope: string, precache: readonly string[]): Aanpak {
  if (verzoek.method !== 'GET') return 'netwerk'
  const pad = padInScope(verzoek.url, scope)
  if (pad === null || PREVIEW.test(pad)) return 'netwerk'
  if (verzoek.mode === 'navigate') return 'index'
  return precache.includes(pad) ? 'cache' : 'netwerk'
}

/** De bestanden uit de build die de service worker vooraf ophaalt, relatief aan zijn scope. */
export function precacheLijst(bestanden: readonly string[]): string[] {
  const lijst = bestanden
    .map((b) => b.replaceAll('\\', '/'))
    .filter((b) => b !== 'sw.js' && !b.endsWith('.map') && !PREVIEW.test(b))
  return [...new Set(lijst)].sort()
}

export function cacheNaam(versie: string): string {
  return CACHE_VOORVOEGSEL + versie
}

/** Caches van een vorige versie. Andere apps op hetzelfde domein (github.io) blijven staan. */
export function oudeCaches(namen: readonly string[], huidig: string): string[] {
  return namen.filter((n) => n.startsWith(CACHE_VOORVOEGSEL) && n !== huidig)
}
