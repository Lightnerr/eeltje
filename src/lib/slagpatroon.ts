import { leesMaatsoort, leesSlagpatroon, slagenPasInMaat } from './muziek'
import type { Liedje, Maatsoort, Slag } from './types'

export interface SlagpatroonKeuze {
  naam: string
  maatsoort: Maatsoort
  slagen: Slag[]
  /** Titels van de liedjes met dit patroon. */
  liedjes: string[]
}

const vast = (naam: string, maatsoort: Maatsoort, tekst: string): SlagpatroonKeuze => ({
  naam,
  maatsoort,
  slagen: leesSlagpatroon(tekst)!,
  liedjes: [],
})

export const VASTE_SLAGPATRONEN: SlagpatroonKeuze[] = [
  vast('Eén per maat', '4/4', 'D - - - D - - -'),
  vast('Op de tel', '4/4', 'D D D D'),
  vast('Op en neer', '4/4', 'D U D U D U D U'),
  vast('Rustig begin', '4/4', 'D - D - D U D U'),
  vast('Het popritme', '4/4', 'D - D U - U D U'),
  vast('Wals', '3/4', 'D D D'),
  vast('Wals met tussenslagen', '3/4', 'D - D U D U'),
  vast('Mars', '2/4', 'D D'),
  vast('Mars met tussenslagen', '2/4', 'D - D U'),
  vast('Twee groepen van drie', '6/8', 'D - - D - -'),
  vast('Wiegend', '6/8', 'D - U D - U'),
]

/** De vaste patronen van deze maatsoort, plus die uit de liedjes; een liedje met een bekend patroon komt bij die keuze. */
export function slagpatroonKeuzes(maatsoort: Maatsoort, liedjes: readonly Liedje[]): SlagpatroonKeuze[] {
  const keuzes = VASTE_SLAGPATRONEN.filter((p) => p.maatsoort === maatsoort).map((p) => ({ ...p, liedjes: [] as string[] }))
  for (const liedje of liedjes) {
    if (liedje.maatsoort !== maatsoort) continue
    const slagen = leesSlagpatroon(liedje.slagpatroon)
    if (!slagen || !slagenPasInMaat(slagen.length, maatsoort)) continue
    const tekst = slagen.join(' ')
    const bestaand = keuzes.find((k) => k.slagen.join(' ') === tekst)
    if (bestaand) bestaand.liedjes.push(liedje.titel)
    else keuzes.push({ naam: `Uit ${liedje.titel}`, maatsoort, slagen, liedjes: [liedje.titel] })
  }
  return keuzes
}

/** Of een zelfgemaakt patroon van `aantal` slagen in de maat past, of er nog bij mag, en hoeveel er nog nodig zijn. */
export function ontwerpStatus(aantal: number, maatsoort: Maatsoort): { past: boolean; vol: boolean; nogNodig: number } {
  const { tellen, noemer } = leesMaatsoort(maatsoort)
  const max = noemer === 4 ? tellen * 2 : tellen
  const past = slagenPasInMaat(aantal, maatsoort)
  const doel = aantal <= tellen ? tellen : max
  return { past, vol: aantal >= max, nogNodig: past ? 0 : Math.max(0, doel - aantal) }
}

/** Hoe je de slagen telt: `1 & 2 &` bij twee slagen per tel, anders `1 2 3`. Leeg als het patroon niet past. */
export function telLabels(aantal: number, maatsoort: Maatsoort): string[] {
  if (!slagenPasInMaat(aantal, maatsoort)) return []
  const perTel = aantal / leesMaatsoort(maatsoort).tellen
  return Array.from({ length: aantal }, (_, i) => (i % perTel === 0 ? String(i / perTel + 1) : '&'))
}
