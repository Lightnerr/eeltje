import { describe, expect, it } from 'vitest'
import { aanpak, cacheNaam, oudeCaches, precacheLijst } from '../src/lib/pwa'

const SCOPE = 'https://lightnerr.github.io/eeltje/'
const LIJST = ['index.html', 'assets/index-abc123.js', 'assets/index-def456.css', 'manifest.webmanifest']

function verzoek(pad: string, extra: Partial<{ method: string; mode: string }> = {}) {
  return { url: new URL(pad, SCOPE).href, method: 'GET', mode: 'no-cors', ...extra }
}

describe('aanpak', () => {
  it('geeft bij een navigatie index.html uit de cache', () => {
    expect(aanpak(verzoek('./', { mode: 'navigate' }), SCOPE, LIJST)).toBe('index')
    expect(aanpak(verzoek('./index.html', { mode: 'navigate' }), SCOPE, LIJST)).toBe('index')
    expect(aanpak(verzoek('./?x=1', { mode: 'navigate' }), SCOPE, LIJST)).toBe('index')
  })

  it('haalt een bestand uit de precache uit de cache', () => {
    expect(aanpak(verzoek('./assets/index-abc123.js'), SCOPE, LIJST)).toBe('cache')
    expect(aanpak(verzoek('./manifest.webmanifest'), SCOPE, LIJST)).toBe('cache')
  })

  it('blijft van een PR-preview af', () => {
    expect(aanpak(verzoek('./pr-12/', { mode: 'navigate' }), SCOPE, LIJST)).toBe('netwerk')
    expect(aanpak(verzoek('./pr-12', { mode: 'navigate' }), SCOPE, LIJST)).toBe('netwerk')
    expect(aanpak(verzoek('./pr-12/index.html', { mode: 'navigate' }), SCOPE, LIJST)).toBe('netwerk')
    expect(aanpak(verzoek('./pr-12/assets/index-abc123.js'), SCOPE, LIJST)).toBe('netwerk')
    expect(aanpak(verzoek('./pr-12/sw.js'), SCOPE, LIJST)).toBe('netwerk')
  })

  it('laat de rest aan het netwerk over', () => {
    expect(aanpak(verzoek('./sw.js'), SCOPE, LIJST)).toBe('netwerk')
    expect(aanpak(verzoek('./assets/ander-bestand.js'), SCOPE, LIJST)).toBe('netwerk')
    expect(aanpak(verzoek('./assets/index-abc123.js', { method: 'POST' }), SCOPE, LIJST)).toBe('netwerk')
    expect(aanpak(verzoek('https://lightnerr.github.io/derde-helft/', { mode: 'navigate' }), SCOPE, LIJST)).toBe('netwerk')
    expect(aanpak(verzoek('https://elders.example/eeltje/', { mode: 'navigate' }), SCOPE, LIJST)).toBe('netwerk')
  })

  it('een map die toevallig met pr begint is geen preview', () => {
    expect(aanpak(verzoek('./prachtig/', { mode: 'navigate' }), SCOPE, LIJST)).toBe('index')
  })
})

describe('precacheLijst', () => {
  it('neemt alles uit de build behalve de service worker, sourcemaps en previews, gesorteerd en zonder dubbelen', () => {
    expect(precacheLijst(['sw.js', 'assets/b.js', 'index.html', 'assets/b.js.map', 'pr-3/index.html', 'assets/a.css', 'index.html'])).toEqual([
      'assets/a.css',
      'assets/b.js',
      'index.html',
    ])
  })

  it('zet Windows-paden om', () => {
    expect(precacheLijst(['iconen\\icoon-192.png'])).toEqual(['iconen/icoon-192.png'])
  })
})

describe('caches', () => {
  it('ruimt alleen oude caches van Eeltje op', () => {
    const huidig = cacheNaam('abc')
    expect(oudeCaches([huidig, cacheNaam('oud'), 'derde-helft-v3', 'eeltjeachtig'], huidig)).toEqual([cacheNaam('oud')])
  })
})
