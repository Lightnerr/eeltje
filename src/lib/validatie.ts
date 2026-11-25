import { akkoordenPassenInMaat, klinkendeTonen, leesSlagpatroon, ontleedAkkoord, slagenPasInMaat, tonenVan, toonnaam } from './muziek'
import { riffLengte, SNAREN } from './riffs'
import type { Maatsoort, Riff, Snaar } from './types'

// Controleert de inhoud in src/data tegen het schema in types.ts. Elke functie geeft een lijst met Nederlandse
// foutmeldingen; leeg is goed.

type Los = Record<string, unknown>

const MAATSOORTEN: readonly Maatsoort[] = ['2/4', '3/4', '4/4', '6/8']
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/

function isObject(x: unknown): x is Los {
  return typeof x === 'object' && x !== null && !Array.isArray(x)
}

function isTekst(x: unknown): x is string {
  return typeof x === 'string' && x.trim() !== ''
}

function isGeheel(x: unknown, min: number, max: number): x is number {
  return Number.isInteger(x) && (x as number) >= min && (x as number) <= max
}

function isTekstLijst(x: unknown): x is string[] {
  return Array.isArray(x) && x.every(isTekst)
}

function onbekendeVelden(x: Los, velden: readonly string[]): string[] {
  return Object.keys(x)
    .filter((k) => !velden.includes(k))
    .map((k) => `onbekend veld "${k}"`)
}

function isMaatsoort(x: unknown): x is Maatsoort {
  return MAATSOORTEN.includes(x as Maatsoort)
}

function controleerSlagpatroon(slagpatroon: unknown, maatsoort: unknown): string[] {
  const slagen = typeof slagpatroon === 'string' ? leesSlagpatroon(slagpatroon) : null
  if (!slagen) return ['slagpatroon moet bestaan uit D, U en -, gescheiden door spaties']
  if (isMaatsoort(maatsoort) && !slagenPasInMaat(slagen.length, maatsoort)) {
    return [`slagpatroon heeft ${slagen.length} slagen, dat past niet in ${maatsoort}`]
  }
  return []
}

const AKKOORDVELDEN = ['naam', 'variant', 'titel', 'standaard', 'frets', 'vingers', 'barre', 'basisfret', 'moeilijkheid', 'omschrijving']

function foutenInAkkoord(a: Los): string[] {
  const fouten = onbekendeVelden(a, AKKOORDVELDEN)
  if (typeof a.naam !== 'string' || !ontleedAkkoord(a.naam)) fouten.push('onbekende akkoordnaam')
  if (typeof a.variant !== 'string' || !KEBAB.test(a.variant)) fouten.push('variant moet kort zijn, kleine letters en streepjes')
  if (!isTekst(a.titel)) fouten.push('titel ontbreekt')
  if (typeof a.standaard !== 'boolean') fouten.push('standaard moet true of false zijn')
  if (!isGeheel(a.moeilijkheid, 1, 5)) fouten.push('moeilijkheid moet 1 t/m 5 zijn')
  if (a.omschrijving !== undefined && !isTekst(a.omschrijving)) fouten.push('omschrijving moet tekst zijn')
  if (a.basisfret !== undefined && !isGeheel(a.basisfret, 1, 20)) fouten.push('basisfret moet 1 t/m 20 zijn')
  if (!Array.isArray(a.frets) || a.frets.length !== 6) return [...fouten, 'moet 6 frets hebben']
  if (!Array.isArray(a.vingers) || a.vingers.length !== 6) return [...fouten, 'moet 6 vingers hebben']
  const frets = a.frets as unknown[]
  const vingers = a.vingers as unknown[]
  if (!frets.every((f) => f === 'x' || isGeheel(f, 0, 24))) return [...fouten, 'een fret is "x" of een getal van 0 t/m 24']
  if (!vingers.every((v) => isGeheel(v, 0, 4))) return [...fouten, 'een vinger is 0 t/m 4']

  const fretPerVinger = new Map<number, number>()
  frets.forEach((fret, snaar) => {
    const vinger = vingers[snaar] as number
    if ((fret === 'x' || fret === 0) && vinger !== 0) fouten.push(`snaar ${snaar + 1}: vinger op een open of niet gespeelde snaar`)
    if (typeof fret === 'number' && fret > 0) {
      if (vinger === 0) fouten.push(`snaar ${snaar + 1}: fret zonder vinger`)
      else if (fretPerVinger.has(vinger) && fretPerVinger.get(vinger) !== fret) fouten.push(`vinger ${vinger} op twee frets`)
      else fretPerVinger.set(vinger, fret)
    }
  })

  const basisfret = typeof a.basisfret === 'number' ? a.basisfret : 1
  const gegrepen = frets.filter((f): f is number => typeof f === 'number' && f > 0)
  if (gegrepen.some((f) => f < basisfret || f > basisfret + 4)) fouten.push(`frets vallen buiten het diagram vanaf basisfret ${basisfret}`)
  if (a.barre !== undefined) fouten.push(...foutenInBarre(a.barre, frets))

  const tonen = typeof a.naam === 'string' ? tonenVan(a.naam) : null
  if (tonen) {
    const klinkt = klinkendeTonen(frets as (number | 'x')[])
    const teVeel = klinkt.filter((t) => !tonen.toegestaan.includes(t)).map((t) => `${toonnaam(t)} hoort er niet in`)
    const teWeinig = tonen.verplicht.filter((t) => !klinkt.includes(t)).map((t) => `${toonnaam(t)} ontbreekt`)
    if (teVeel.length || teWeinig.length) fouten.push(`klinkt niet als ${a.naam} (${[...teVeel, ...teWeinig].join(', ')})`)
  }
  return fouten
}

function foutenInBarre(barre: unknown, frets: unknown[]): string[] {
  if (!isObject(barre) || !isGeheel(barre.fret, 1, 24) || !isGeheel(barre.vanSnaar, 0, 5) || !isGeheel(barre.totSnaar, 0, 5)) {
    return ['barré heeft een fret en snaren 0 t/m 5 nodig']
  }
  const { fret, vanSnaar, totSnaar } = barre
  if (vanSnaar >= totSnaar) return ['barré: vanSnaar moet lager zijn dan totSnaar']
  if (frets[vanSnaar] !== fret || frets[totSnaar] !== fret) return ['barré: de buitenste snaren liggen niet op de barréfret']
  if (frets.slice(vanSnaar, totSnaar + 1).some((f) => typeof f !== 'number' || f < fret)) return ['barré: een snaar onder de barré klinkt niet']
  return []
}

export function valideerAkkoorden(data: unknown): string[] {
  if (!Array.isArray(data)) return ['akkoorden.json: moet een lijst zijn']
  const fouten: string[] = []
  const perNaam = new Map<string, { varianten: string[]; standaard: number }>()
  for (const a of data) {
    if (!isObject(a)) {
      fouten.push('Akkoord: moet een object zijn')
      continue
    }
    const plek = `Akkoord ${String(a.naam)} (${String(a.variant)})`
    fouten.push(...foutenInAkkoord(a).map((f) => `${plek}: ${f}`))
    const naam = String(a.naam)
    const groep = perNaam.get(naam) ?? { varianten: [], standaard: 0 }
    if (groep.varianten.includes(String(a.variant))) fouten.push(`Akkoord ${naam}: variant ${String(a.variant)} staat er twee keer in`)
    groep.varianten.push(String(a.variant))
    if (a.standaard === true) groep.standaard++
    perNaam.set(naam, groep)
  }
  for (const [naam, groep] of perNaam) {
    if (groep.standaard === 0) fouten.push(`Akkoord ${naam}: geen standaardvariant`)
    if (groep.standaard > 1) fouten.push(`Akkoord ${naam}: ${groep.standaard} standaardvarianten, er mag er één zijn`)
  }
  return fouten
}

const LIEDJEVELDEN = [
  'id',
  'titel',
  'artiest',
  'soort',
  'toonsoort',
  'capo',
  'bpm',
  'maatsoort',
  'slagpatroon',
  'secties',
  'volgorde',
  'origineleAkkoorden',
  'bron',
  'geverifieerd',
  'opmerking',
]

function foutenInLiedje(l: Los, akkoordnamen: readonly string[]): string[] {
  const fouten = onbekendeVelden(l, LIEDJEVELDEN)
  if (typeof l.id !== 'string' || !KEBAB.test(l.id)) fouten.push('id moet kebab-case zijn')
  if (!isTekst(l.titel)) fouten.push('titel ontbreekt')
  if (!isTekst(l.artiest)) fouten.push('artiest ontbreekt')
  if (l.soort !== 'traditioneel' && l.soort !== 'pop') fouten.push('soort is traditioneel of pop')
  const toonsoort = typeof l.toonsoort === 'string' ? ontleedAkkoord(l.toonsoort) : null
  if (!toonsoort || toonsoort.bas || (toonsoort.suffix !== '' && toonsoort.suffix !== 'm')) fouten.push('toonsoort is een grondtoon, eventueel met m')
  if (!isGeheel(l.capo, 0, 12)) fouten.push('capo moet 0 t/m 12 zijn')
  if (!isGeheel(l.bpm, 30, 220)) fouten.push('bpm moet 30 t/m 220 zijn')
  if (!isMaatsoort(l.maatsoort)) fouten.push(`maatsoort moet een van ${MAATSOORTEN.join(', ')} zijn`)
  fouten.push(...controleerSlagpatroon(l.slagpatroon, l.maatsoort))
  if (l.bron !== 'ai-gegenereerd' && l.bron !== 'eigenaar') fouten.push('bron is ai-gegenereerd of eigenaar')
  if (typeof l.geverifieerd !== 'boolean') fouten.push('geverifieerd moet true of false zijn')
  if (l.opmerking !== undefined && !isTekst(l.opmerking)) fouten.push('opmerking moet tekst zijn')
  if (l.origineleAkkoorden !== undefined && !(Array.isArray(l.origineleAkkoorden) && l.origineleAkkoorden.every((a) => typeof a === 'string' && ontleedAkkoord(a)))) {
    fouten.push('origineleAkkoorden moet een lijst akkoordnamen zijn')
  }

  if (!Array.isArray(l.secties) || l.secties.length === 0) return [...fouten, 'secties ontbreken']
  const sectienamen: string[] = []
  for (const sectie of l.secties as unknown[]) {
    if (!isObject(sectie) || !isTekst(sectie.naam) || !Array.isArray(sectie.maten) || sectie.maten.length === 0) {
      fouten.push('een sectie heeft een naam en minstens één maat')
      continue
    }
    fouten.push(...onbekendeVelden(sectie, ['naam', 'maten']).map((f) => `sectie ${sectie.naam}: ${f}`))
    if (sectienamen.includes(sectie.naam)) fouten.push(`sectie ${sectie.naam} staat er twee keer in`)
    sectienamen.push(sectie.naam)
    sectie.maten.forEach((maat: unknown, i: number) => {
      const plek = `sectie ${sectie.naam}, maat ${i + 1}`
      if (!isTekstLijst(maat)) return fouten.push(`${plek}: een maat is een lijst akkoordnamen`)
      if (isMaatsoort(l.maatsoort) && !akkoordenPassenInMaat(maat.length, l.maatsoort)) {
        fouten.push(`${plek}: ${maat.length} akkoorden verdelen ${l.maatsoort} niet gelijk`)
      }
      for (const a of maat) if (!akkoordnamen.includes(a)) fouten.push(`${plek}: ${a} staat niet in akkoorden.json`)
    })
  }

  if (!isTekstLijst(l.volgorde) || l.volgorde.length === 0) return [...fouten, 'volgorde ontbreekt']
  for (const naam of l.volgorde) if (!sectienamen.includes(naam)) fouten.push(`volgorde noemt onbekende sectie ${naam}`)
  for (const naam of sectienamen) if (!l.volgorde.includes(naam)) fouten.push(`sectie ${naam} wordt nooit gespeeld`)
  return fouten
}

export function valideerLiedje(data: unknown, akkoordnamen: readonly string[]): string[] {
  if (!isObject(data)) return ['Liedje: moet een object zijn']
  return foutenInLiedje(data, akkoordnamen).map((f) => `Liedje ${String(data.id)}: ${f}`)
}

const OEFENINGVELDEN = ['id', 'titel', 'doel', 'stappen', 'tab', 'standaardtempo', 'maatsoort', 'slagpatroon']

export function valideerOefening(data: unknown): string[] {
  if (!isObject(data)) return ['Oefening: moet een object zijn']
  const fouten = onbekendeVelden(data, OEFENINGVELDEN)
  if (typeof data.id !== 'string' || !KEBAB.test(data.id)) fouten.push('id moet kebab-case zijn')
  if (!isTekst(data.titel)) fouten.push('titel ontbreekt')
  if (!isTekst(data.doel)) fouten.push('doel ontbreekt')
  if (!isTekstLijst(data.stappen) || data.stappen.length === 0) fouten.push('stappen moet een lijst met minstens één stap zijn')
  if (data.tab !== undefined && !isTekstLijst(data.tab)) fouten.push('tab moet een lijst regels zijn')
  if (!isGeheel(data.standaardtempo, 30, 220)) fouten.push('standaardtempo moet 30 t/m 220 bpm zijn')
  if (data.maatsoort !== undefined && !isMaatsoort(data.maatsoort)) fouten.push(`maatsoort moet een van ${MAATSOORTEN.join(', ')} zijn`)
  if (data.slagpatroon !== undefined) fouten.push(...controleerSlagpatroon(data.slagpatroon, data.maatsoort))
  return fouten.map((f) => `Oefening ${String(data.id)}: ${f}`)
}

const RIFFVELDEN = ['id', 'titel', 'artiest', 'bpm', 'maatsoort', 'onderverdeling', 'maten', 'noten', 'uitleg', 'bron', 'geverifieerd']
const NOOTVELDEN = ['stap', 'snaar', 'fret']

function foutenInNoten(noten: unknown, lengte: number | null): string[] {
  if (!Array.isArray(noten) || noten.length === 0) return ['noten moet een lijst met minstens één noot zijn']
  const fouten: string[] = []
  const bezet = new Set<string>()
  noten.forEach((n, i) => {
    if (!isObject(n)) {
      fouten.push(`noot ${i + 1}: moet een object zijn`)
      return
    }
    fouten.push(...onbekendeVelden(n, NOOTVELDEN).map((f) => `noot ${i + 1}: ${f}`))
    if (!isGeheel(n.stap, 0, 1000)) fouten.push(`noot ${i + 1}: stap moet een geheel getal vanaf 0 zijn`)
    else if (lengte !== null && n.stap >= lengte) fouten.push(`noot ${i + 1}: stap ${n.stap} valt buiten de riff (${lengte} stappen)`)
    if (!SNAREN.includes(n.snaar as Snaar)) fouten.push(`noot ${i + 1}: snaar moet een van ${SNAREN.join(', ')} zijn`)
    if (!isGeheel(n.fret, 0, 24)) fouten.push(`noot ${i + 1}: fret moet 0 t/m 24 zijn`)
    const plek = `${String(n.stap)}|${String(n.snaar)}`
    if (bezet.has(plek)) fouten.push(`noot ${i + 1}: twee noten op dezelfde snaar en stap`)
    bezet.add(plek)
  })
  return fouten
}

export function valideerRiff(data: unknown): string[] {
  if (!isObject(data)) return ['Riff: moet een object zijn']
  const fouten = onbekendeVelden(data, RIFFVELDEN)
  if (typeof data.id !== 'string' || !KEBAB.test(data.id)) fouten.push('id moet kebab-case zijn')
  if (!isTekst(data.titel)) fouten.push('titel ontbreekt')
  if (!isTekst(data.artiest)) fouten.push('artiest ontbreekt')
  if (!isGeheel(data.bpm, 30, 220)) fouten.push('bpm moet 30 t/m 220 zijn')
  if (!isMaatsoort(data.maatsoort)) fouten.push(`maatsoort moet een van ${MAATSOORTEN.join(', ')} zijn`)
  if (![1, 2, 4].includes(data.onderverdeling as number)) fouten.push('onderverdeling moet 1, 2 of 4 stappen per tel zijn')
  if (!isGeheel(data.maten, 1, 16)) fouten.push('maten moet 1 t/m 16 zijn')
  const vormOk = isMaatsoort(data.maatsoort) && [1, 2, 4].includes(data.onderverdeling as number) && isGeheel(data.maten, 1, 16)
  fouten.push(...foutenInNoten(data.noten, vormOk ? riffLengte(data as unknown as Riff) : null))
  if (!isTekstLijst(data.uitleg) || data.uitleg.length === 0) fouten.push('uitleg moet een lijst met minstens één stap zijn')
  if (data.bron !== 'ai-gegenereerd' && data.bron !== 'eigenaar') fouten.push('bron is ai-gegenereerd of eigenaar')
  if (typeof data.geverifieerd !== 'boolean') fouten.push('geverifieerd moet true of false zijn')
  return fouten.map((f) => `Riff ${String(data.id)}: ${f}`)
}

function dubbeleIds(lijst: readonly unknown[], soort: string): string[] {
  const gezien = new Set<unknown>()
  const fouten: string[] = []
  for (const x of lijst) {
    const id = isObject(x) ? x.id : undefined
    if (gezien.has(id)) fouten.push(`${soort} ${String(id)}: id staat er twee keer in`)
    gezien.add(id)
  }
  return fouten
}

export function valideerInhoud(inhoud: { akkoorden: unknown; liedjes: readonly unknown[]; oefeningen: unknown; riffs: readonly unknown[] }): string[] {
  const akkoordnamen = Array.isArray(inhoud.akkoorden)
    ? inhoud.akkoorden.filter(isObject).map((a) => a.naam).filter((n): n is string => typeof n === 'string')
    : []
  const oefeningen = Array.isArray(inhoud.oefeningen) ? inhoud.oefeningen : []
  return [
    ...valideerAkkoorden(inhoud.akkoorden),
    ...inhoud.liedjes.flatMap((l) => valideerLiedje(l, akkoordnamen)),
    ...dubbeleIds(inhoud.liedjes, 'Liedje'),
    ...(Array.isArray(inhoud.oefeningen) ? [] : ['oefeningen.json: moet een lijst zijn']),
    ...oefeningen.flatMap(valideerOefening),
    ...dubbeleIds(oefeningen, 'Oefening'),
    ...inhoud.riffs.flatMap(valideerRiff),
    ...dubbeleIds(inhoud.riffs, 'Riff'),
  ]
}
