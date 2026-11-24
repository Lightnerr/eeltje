import type { Fret, Liedje, Maatsoort, Slag } from './types'

export type Spelling = 'kruis' | 'mol'

export interface Akkoordnaam {
  /** Toonklasse 0 (C) t/m 11 (B). */
  grondtoon: number
  grondnaam: string
  suffix: string
  bas?: { toon: number; naam: string }
}

const NATUURLIJK: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
const KRUISEN = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const MOLLEN = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
// Zo schrijven gitaristen een toon als het origineel geen kruis of mol had: Bb en Eb, maar F#m en C#m.
const GEWOON_GROOT = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']
const GEWOON_KLEIN = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B']

/** Intervallen per suffix; `verplicht` moet klinken, de rest mag. */
const SUFFIXEN: Record<string, { intervallen: number[]; verplicht: number[] }> = {
  '': { intervallen: [0, 4, 7], verplicht: [0, 4] },
  m: { intervallen: [0, 3, 7], verplicht: [0, 3] },
  '5': { intervallen: [0, 7], verplicht: [0, 7] },
  '7': { intervallen: [0, 4, 7, 10], verplicht: [0, 4, 10] },
  m7: { intervallen: [0, 3, 7, 10], verplicht: [0, 3, 10] },
  maj7: { intervallen: [0, 4, 7, 11], verplicht: [0, 4, 11] },
  '6': { intervallen: [0, 4, 7, 9], verplicht: [0, 4, 9] },
  m6: { intervallen: [0, 3, 7, 9], verplicht: [0, 3, 9] },
  '9': { intervallen: [0, 4, 7, 10, 2], verplicht: [0, 4, 10, 2] },
  add9: { intervallen: [0, 4, 7, 2], verplicht: [0, 4, 2] },
  sus2: { intervallen: [0, 2, 7], verplicht: [0, 2] },
  sus4: { intervallen: [0, 5, 7], verplicht: [0, 5] },
  '7sus4': { intervallen: [0, 5, 7, 10], verplicht: [0, 5, 10] },
  dim: { intervallen: [0, 3, 6], verplicht: [0, 3, 6] },
  dim7: { intervallen: [0, 3, 6, 9], verplicht: [0, 3, 6, 9] },
  m7b5: { intervallen: [0, 3, 6, 10], verplicht: [0, 3, 6, 10] },
  aug: { intervallen: [0, 4, 8], verplicht: [0, 4, 8] },
}

/** Wat je in plaats van een akkoord kunt spelen, van extensie naar het kale akkoord. */
const ZONDER_EXTENSIE: Record<string, string[]> = {
  '7': [''],
  maj7: [''],
  '6': [''],
  '9': ['7', ''],
  add9: [''],
  sus2: [''],
  sus4: [''],
  '7sus4': ['sus4', '7', ''],
  m7: ['m'],
  m6: ['m'],
}

/** Vaste vervangers die makkelijker grijpen: geen barré. Per grondtoon en suffix. */
const VASTE_VERVANGERS: { grondtoon: number; suffix: string; vervanger: string }[] = [
  { grondtoon: 5, suffix: '', vervanger: 'maj7' },
  { grondtoon: 11, suffix: 'm', vervanger: 'm7' },
  { grondtoon: 11, suffix: '', vervanger: '7' },
]

const TOON = /^([A-G])([#b]?)$/

function leesToon(tekst: string): number | null {
  const m = TOON.exec(tekst)
  if (!m) return null
  const wijziging = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0
  return (NATUURLIJK[m[1]] + wijziging + 12) % 12
}

export function ontleedAkkoord(naam: string): Akkoordnaam | null {
  const m = /^([A-G][#b]?)(.*?)(?:\/([A-G][#b]?))?$/.exec(naam)
  if (!m) return null
  const grondtoon = leesToon(m[1])
  if (grondtoon === null || !(m[2] in SUFFIXEN)) return null
  const resultaat: Akkoordnaam = { grondtoon, grondnaam: m[1], suffix: m[2] }
  if (m[3]) {
    const bas = leesToon(m[3])
    if (bas === null) return null
    resultaat.bas = { toon: bas, naam: m[3] }
  }
  return resultaat
}

function moetOntleden(naam: string): Akkoordnaam {
  const a = ontleedAkkoord(naam)
  if (!a) throw new Error(`Onbekend akkoord: ${naam}`)
  return a
}

/** Klinken twee namen hetzelfde (A#m en Bbm)? */
export function zelfdeAkkoord(a: string, b: string): boolean {
  if (a === b) return true
  const x = ontleedAkkoord(a)
  const y = ontleedAkkoord(b)
  if (!x || !y) return false
  return x.grondtoon === y.grondtoon && x.suffix === y.suffix && x.bas?.toon === y.bas?.toon
}

function spellingVan(a: Akkoordnaam): Spelling | null {
  if (a.grondnaam.endsWith('#')) return 'kruis'
  if (a.grondnaam.length === 2) return 'mol'
  return null
}

function noemToon(toon: number, spelling: Spelling | null, klein: boolean): string {
  const tabel = spelling === 'kruis' ? KRUISEN : spelling === 'mol' ? MOLLEN : klein ? GEWOON_KLEIN : GEWOON_GROOT
  return tabel[((toon % 12) + 12) % 12]
}

/** Schuift een akkoord `halveTonen` op. Zonder `spelling` volgt hij het origineel (kruis of mol), of de gewone spelling. */
export function transponeer(naam: string, halveTonen: number, spelling?: Spelling): string {
  const a = moetOntleden(naam)
  const kies = spelling ?? spellingVan(a)
  const klein = a.suffix.startsWith('m') && !a.suffix.startsWith('maj')
  let resultaat = noemToon(a.grondtoon + halveTonen, kies, klein) + a.suffix
  if (a.bas) resultaat += '/' + noemToon(a.bas.toon + halveTonen, kies, false)
  return resultaat
}

/** Wat je hoort als je deze vorm grijpt met de capo op `capo`. */
export function klinkendAkkoord(vorm: string, capo: number): string {
  return transponeer(vorm, capo)
}

/** Welke vorm je grijpt om met de capo op `capo` dit akkoord te laten klinken. */
export function vormBijCapo(klinkend: string, capo: number): string {
  return transponeer(klinkend, -capo)
}

const STEMMING = [4, 9, 2, 7, 11, 4]

/** De toonklassen die klinken bij deze frets (standaardstemming), zonder dubbelen. */
export function klinkendeTonen(frets: Fret[]): number[] {
  const tonen = new Set<number>()
  frets.forEach((fret, snaar) => {
    if (fret !== 'x') tonen.add((STEMMING[snaar] + fret) % 12)
  })
  return [...tonen]
}

/** De tonen die in dit akkoord horen (`toegestaan`) en die moeten klinken (`verplicht`). */
export function tonenVan(naam: string): { verplicht: number[]; toegestaan: number[] } | null {
  const a = ontleedAkkoord(naam)
  if (!a) return null
  const { intervallen, verplicht } = SUFFIXEN[a.suffix]
  const toon = (i: number) => (a.grondtoon + i) % 12
  const resultaat = { verplicht: verplicht.map(toon), toegestaan: intervallen.map(toon) }
  if (a.bas) {
    if (!resultaat.toegestaan.includes(a.bas.toon)) resultaat.toegestaan.push(a.bas.toon)
    if (!resultaat.verplicht.includes(a.bas.toon)) resultaat.verplicht.push(a.bas.toon)
  }
  return resultaat
}

/** Alle akkoorden (vormen) van een liedje, elk één keer, in volgorde van voorkomen. */
export function akkoordenVan(liedje: Liedje): string[] {
  const gezien = new Set<string>()
  for (const sectie of liedje.secties) for (const maat of sectie.maten) for (const a of maat) gezien.add(a)
  return [...gezien]
}

export interface SpeelMaat {
  sectie: string
  /** Positie in `liedje.volgorde`, zodat een herhaalde sectie te onderscheiden is. */
  volgordeIndex: number
  maatIndex: number
  akkoorden: string[]
}

/** De secties in `liedje.volgorde` uitgerold tot maten. */
export function speelVolgorde(liedje: Liedje): SpeelMaat[] {
  return liedje.volgorde.flatMap((naam, volgordeIndex) => {
    const sectie = liedje.secties.find((s) => s.naam === naam)
    return (sectie?.maten ?? []).map((akkoorden, maatIndex) => ({ sectie: naam, volgordeIndex, maatIndex, akkoorden }))
  })
}

function vindBekend(naam: string, bekend: readonly string[]): string | undefined {
  return bekend.find((b) => zelfdeAkkoord(b, naam))
}

function ontbrekendIn(akkoorden: readonly string[], bekend: readonly string[]): string[] {
  return akkoorden.filter((a) => !vindBekend(a, bekend))
}

/** De akkoorden van het liedje die niet bij `bekend` horen. */
export function ontbrekendeAkkoorden(liedje: Liedje, bekend: Iterable<string>): string[] {
  return ontbrekendIn(akkoordenVan(liedje), [...bekend])
}

export function speelbaarheidsLabel(ontbrekend: readonly string[]): string {
  if (ontbrekend.length === 0) return 'Kan je spelen'
  if (ontbrekend.length === 1) return `Mist 1 akkoord: ${ontbrekend[0]}`
  return `Mist er ${ontbrekend.length}`
}

/** Akkoorden die je in plaats van `naam` kunt spelen, de beste eerst. */
export function vereenvoudigingen(naam: string): string[] {
  const a = ontleedAkkoord(naam)
  if (!a) return []
  const resultaat: string[] = []
  const zonderBas = a.grondnaam + a.suffix
  if (a.bas) resultaat.push(zonderBas)
  for (const v of VASTE_VERVANGERS) if (v.grondtoon === a.grondtoon && v.suffix === a.suffix) resultaat.push(a.grondnaam + v.vervanger)
  for (const suffix of ZONDER_EXTENSIE[a.suffix] ?? []) resultaat.push(a.grondnaam + suffix)
  if (a.bas) for (const v of vereenvoudigingen(zonderBas)) resultaat.push(v)
  return [...new Set(resultaat)]
}

/** Per ontbrekend akkoord een bekende vereenvoudiging, als die er is. */
export function vereenvoudig(akkoorden: readonly string[], bekend: Iterable<string>): Record<string, string> {
  const lijst = [...bekend]
  const resultaat: Record<string, string> = {}
  for (const a of ontbrekendIn(akkoorden, lijst)) {
    for (const v of vereenvoudigingen(a)) {
      const gevonden = vindBekend(v, lijst)
      if (gevonden) {
        resultaat[a] = gevonden
        break
      }
    }
  }
  return resultaat
}

export interface CapoSuggestie {
  capo: number
  /** Oude vorm -> de vorm die je bij deze capo grijpt, gespeld zoals in `bekend`. */
  vormen: Record<string, string>
  /** De oude vormen waarvoor je een vereenvoudiging speelt. */
  vereenvoudigd: string[]
}

const HOOGSTE_CAPO = 7

/** Een andere capo waarmee een liedje dat je nog niet kunt wel lukt met de akkoorden die je kent. */
export function capoSuggestie(liedje: Liedje, bekend: Iterable<string>): CapoSuggestie | null {
  const lijst = [...bekend]
  const oud = akkoordenVan(liedje)
  if (ontbrekendIn(oud, lijst).length === 0) return null
  let beste: CapoSuggestie | null = null
  for (let capo = 0; capo <= HOOGSTE_CAPO; capo++) {
    if (capo === liedje.capo) continue
    const vormen: Record<string, string> = {}
    const vereenvoudigd: string[] = []
    const lukt = oud.every((vorm) => {
      const nieuw = transponeer(vorm, liedje.capo - capo)
      const direct = vindBekend(nieuw, lijst)
      if (direct) {
        vormen[vorm] = direct
        return true
      }
      const vervanger = vereenvoudig([nieuw], lijst)[nieuw]
      if (!vervanger) return false
      vormen[vorm] = vervanger
      vereenvoudigd.push(vorm)
      return true
    })
    if (!lukt) continue
    const kandidaat = { capo, vormen, vereenvoudigd }
    if (!beste || isBeter(kandidaat, beste, liedje.capo)) beste = kandidaat
  }
  return beste
}

function isBeter(a: CapoSuggestie, b: CapoSuggestie, oudeCapo: number): boolean {
  if (a.vereenvoudigd.length !== b.vereenvoudigd.length) return a.vereenvoudigd.length < b.vereenvoudigd.length
  return Math.abs(a.capo - oudeCapo) < Math.abs(b.capo - oudeCapo)
}

export interface Leeradvies {
  akkoord: string
  /** Id's van liedjes die je met dit akkoord erbij helemaal kunt spelen. */
  nieuwSpeelbaar: string[]
  /** In hoeveel liedjes die je nog niet kunt dit akkoord ontbreekt. */
  inLiedjes: number
}

/** Het akkoord dat de meeste nieuwe liedjes speelbaar maakt; bij gelijkspel het akkoord dat het vaakst ontbreekt. */
export function leeradvies(liedjes: readonly Liedje[], bekend: Iterable<string>): Leeradvies | null {
  const lijst = [...bekend]
  const kandidaten = new Map<string, Leeradvies>()
  for (const liedje of liedjes) {
    const ontbrekend = ontbrekendeAkkoorden(liedje, lijst)
    for (const naam of ontbrekend) {
      const k = kandidaten.get(naam) ?? { akkoord: naam, nieuwSpeelbaar: [], inLiedjes: 0 }
      k.inLiedjes++
      if (ontbrekend.length === 1) k.nieuwSpeelbaar.push(liedje.id)
      kandidaten.set(naam, k)
    }
  }
  const gesorteerd = [...kandidaten.values()].sort(
    (a, b) => b.nieuwSpeelbaar.length - a.nieuwSpeelbaar.length || b.inLiedjes - a.inLiedjes || a.akkoord.localeCompare(b.akkoord),
  )
  return gesorteerd[0] ?? null
}

/** Leest `D - D U - U D U`; `null` als er iets anders dan D, U of - in staat. */
export function leesSlagpatroon(tekst: string): Slag[] | null {
  const delen = tekst.trim().split(/\s+/)
  if (delen.length === 0 || delen[0] === '') return null
  return delen.every((d): d is Slag => d === 'D' || d === 'U' || d === '-') ? delen : null
}

export function leesMaatsoort(maatsoort: Maatsoort): { tellen: number; noemer: number } {
  const [tellen, noemer] = maatsoort.split('/').map(Number)
  return { tellen, noemer }
}

/** In x/4 een slag per tel of per achtste; in x/8 een slag per tel (achtste). */
export function slagenPasInMaat(aantal: number, maatsoort: Maatsoort): boolean {
  const { tellen, noemer } = leesMaatsoort(maatsoort)
  return noemer === 4 ? aantal === tellen || aantal === tellen * 2 : aantal === tellen
}

export function slagenPerTel(aantal: number, maatsoort: Maatsoort): number {
  return aantal / leesMaatsoort(maatsoort).tellen
}

/** 1 t/m 4 akkoorden per maat, die de tellen gelijk verdelen. */
export function akkoordenPassenInMaat(aantal: number, maatsoort: Maatsoort): boolean {
  return aantal >= 1 && aantal <= 4 && leesMaatsoort(maatsoort).tellen % aantal === 0
}
