import akkoordenJson from './akkoorden.json'
import oefeningenJson from './oefeningen.json'
import type { Akkoord, Liedje, Oefening, Riff } from '../lib/types'

// De enige plek die de inhoud inleest. tests/data.test.ts bewaakt dat de JSON aan het schema voldoet.

export const akkoorden = akkoordenJson as unknown as readonly Akkoord[]

const liedjeBestanden = import.meta.glob<Liedje>('./liedjes/*.json', { eager: true, import: 'default' })

export const liedjes: readonly Liedje[] = Object.values(liedjeBestanden).sort((a, b) => a.titel.localeCompare(b.titel, 'nl'))

export const oefeningen = oefeningenJson as unknown as readonly Oefening[]

const riffBestanden = import.meta.glob<Riff>('./riffs/*.json', { eager: true, import: 'default' })

export const riffs: readonly Riff[] = Object.values(riffBestanden).sort((a, b) => a.titel.localeCompare(b.titel, 'nl'))

/** De standaardvariant eerst, daarna de rest in de volgorde van akkoorden.json. */
export function variantenVan(naam: string): Akkoord[] {
  return akkoorden.filter((a) => a.naam === naam).sort((a, b) => Number(b.standaard) - Number(a.standaard))
}

export function standaardVariant(naam: string): Akkoord | undefined {
  return akkoorden.find((a) => a.naam === naam && a.standaard)
}

/** Zonder variantnaam de standaardvariant. */
export function zoekAkkoord(naam: string, variantnaam?: string): Akkoord | undefined {
  return variantnaam === undefined ? standaardVariant(naam) : akkoorden.find((a) => a.naam === naam && a.variant === variantnaam)
}

export function zoekLiedje(id: string): Liedje | undefined {
  return liedjes.find((l) => l.id === id)
}

export function zoekOefening(id: string): Oefening | undefined {
  return oefeningen.find((o) => o.id === id)
}

export function zoekRiff(id: string): Riff | undefined {
  return riffs.find((r) => r.id === id)
}
