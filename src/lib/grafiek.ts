// Schaal, ticks en posities voor de SVG-grafiek (src/components/Grafiek.tsx). De as begint altijd bij 0: minuten,
// wissels, bpm en seconden zijn hoeveelheden, en een as die halverwege begint laat een kleine stap groot lijken.

export type GrafiekSoort = 'lijn' | 'staaf'

export interface GrafiekPunt {
  x: string | number
  y: number
  /** Wat onder de as staat; anders `x`. */
  label?: string
}

/** De kleinste stap van 1, 2 of 5 maal een macht van 10 die minstens `ruw` is; nooit kleiner dan 1. */
export function netteStap(ruw: number): number {
  if (ruw <= 1) return 1
  const macht = 10 ** Math.floor(Math.log10(ruw))
  for (const factor of [1, 2, 5, 10]) if (factor * macht >= ruw) return factor * macht
  return 10 * macht
}

const STAPPEN = 4

export function schaal(waarden: readonly number[]): { max: number; ticks: number[] } {
  const hoogste = Math.max(0, ...waarden)
  const stap = hoogste > 0 ? netteStap(hoogste / STAPPEN) : 1
  const max = hoogste > 0 ? Math.ceil(hoogste / stap) * stap : STAPPEN
  return { max, ticks: Array.from({ length: max / stap + 1 }, (_, i) => i * stap) }
}

/** Welke punten een label onder de as krijgen: hooguit `max`, gelijk verdeeld, en altijd het laatste (het nieuwste). */
export function labelIndices(aantal: number, max: number): number[] {
  if (aantal === 0) return []
  const stap = Math.ceil(aantal / Math.max(1, max))
  const indices: number[] = []
  for (let i = aantal - 1; i >= 0; i -= stap) indices.unshift(i)
  return indices
}

export interface Maten {
  breedte: number
  hoogte: number
  links: number
  rechts: number
  boven: number
  onder: number
}

const MAX_STAAFBREEDTE = 48

export function indeling(waarden: readonly number[], soort: GrafiekSoort, maten: Maten) {
  const { max, ticks } = schaal(waarden)
  const vlakBreedte = maten.breedte - maten.links - maten.rechts
  const onderkant = maten.hoogte - maten.onder
  const yVan = (w: number) => onderkant - ((onderkant - maten.boven) * Math.max(0, w)) / max
  const vak = vlakBreedte / Math.max(1, waarden.length)
  const xVan = (i: number) => {
    if (soort === 'staaf') return maten.links + vak * (i + 0.5)
    if (waarden.length === 1) return maten.links + vlakBreedte / 2
    return maten.links + (vlakBreedte * i) / (waarden.length - 1)
  }
  return {
    ticks: ticks.map((waarde) => ({ waarde, y: yVan(waarde) })),
    punten: waarden.map((w, i) => ({ x: xVan(i), y: yVan(w) })),
    staafBreedte: Math.min(MAX_STAAFBREEDTE, vak * 0.6),
    onderkant,
  }
}

export function puntLabel(p: GrafiekPunt): string {
  return p.label ?? String(p.x)
}

/** Een zin voor `aria-label`: hoeveel waarden, van waar naar waar, en de hoogste. */
export function beschrijfGrafiek(titel: string, punten: readonly GrafiekPunt[], eenheid?: string): string {
  const waarde = (p: GrafiekPunt) => `${p.y}${eenheid ? ` ${eenheid}` : ''} (${puntLabel(p)})`
  if (punten.length === 0) return `${titel}: nog geen gegevens.`
  if (punten.length === 1) return `${titel}: 1 waarde, ${waarde(punten[0])}.`
  const hoogste = punten.reduce((h, p) => (p.y > h.y ? p : h))
  return `${titel}: ${punten.length} waarden, van ${waarde(punten[0])} naar ${waarde(punten[punten.length - 1])}. Hoogste: ${waarde(hoogste)}.`
}
