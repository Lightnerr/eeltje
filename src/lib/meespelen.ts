import { begrensBpm } from './metronoom'
import { leesMaatsoort, type SpeelMaat } from './muziek'
import type { Maatsoort } from './types'

export const MIN_TEMPO = 40
export const MAX_TEMPO = 120
export const TEMPO_STAP = 10

/** Tempo als percentage van het liedje, 40 t/m 120. */
export function begrensTempo(procent: number): number {
  if (!Number.isFinite(procent)) return 100
  return Math.min(MAX_TEMPO, Math.max(MIN_TEMPO, Math.round(procent)))
}

/** Het bpm voor de metronoom: `procent` van `Liedje.bpm`, binnen de grenzen van de metronoom. */
export function meespeelBpm(bpm: number, procent: number): number {
  return begrensBpm((bpm * begrensTempo(procent)) / 100)
}

/** Welk akkoord op `tel` (vanaf 0) van een maat klinkt; meerdere akkoorden verdelen de tellen gelijk. */
export function akkoordOpTel(maat: readonly string[], tel: number, maatsoort: Maatsoort): { index: number; akkoord: string; begint: boolean } {
  const perAkkoord = leesMaatsoort(maatsoort).tellen / maat.length
  const index = Math.min(maat.length - 1, Math.floor(tel / perAkkoord))
  return { index, akkoord: maat[index], begint: tel % perAkkoord === 0 }
}

export type Meespeelfase = 'stil' | 'aftellen' | 'spelen' | 'einde'

export interface Meespeelstand {
  fase: Meespeelfase
  /** Index in `speelVolgorde(liedje)`: de maat die klinkt, of waar je begint. */
  maat: number
  /** De laatste tel van de metronoom (vanaf 0 in de maat); -1 = nog geen tel in deze fase. */
  tel: number
  /** `volgordeIndex` van de sectie die blijft herhalen, of `null`. */
  herhaal: number | null
}

export type Meespeelactie =
  | { type: 'start' }
  | { type: 'pauze' }
  /** Elke tel van de metronoom (`opTel`), vanaf 0 binnen de maat. */
  | { type: 'tel'; tel: number }
  | { type: 'herhaal'; aan: boolean }
  | { type: 'naarSectie'; volgordeIndex: number }

export function beginMeespelen(): Meespeelstand {
  return { fase: 'stil', maat: 0, tel: -1, herhaal: null }
}

function eersteMaatVan(volgorde: readonly SpeelMaat[], volgordeIndex: number): number {
  return volgorde.findIndex((m) => m.volgordeIndex === volgordeIndex)
}

/** De maat na `maat`; bij herhalen terug naar het begin van de sectie. `null` na de laatste maat. */
function volgendeMaat(volgorde: readonly SpeelMaat[], maat: number, herhaal: number | null): number | null {
  const sectieKlaar = volgorde[maat + 1]?.volgordeIndex !== volgorde[maat].volgordeIndex
  if (herhaal !== null && sectieKlaar && volgorde[maat].volgordeIndex === herhaal) return eersteMaatVan(volgorde, herhaal)
  return maat + 1 < volgorde.length ? maat + 1 : null
}

const speelt = (s: Meespeelstand) => s.fase === 'aftellen' || s.fase === 'spelen'

/**
 * De toestandsmachine van het meespelen. Het aftellen loopt tot de volgende 1 van de metronoom: bij de start een
 * hele maat, na een sprong naar een andere sectie de rest van de maat. Daarna gaat elke 1 naar de volgende maat.
 */
export function meespeelStap(stand: Meespeelstand, actie: Meespeelactie, volgorde: readonly SpeelMaat[]): Meespeelstand {
  switch (actie.type) {
    case 'start':
      if (speelt(stand) || volgorde.length === 0) return stand
      return { ...stand, fase: 'aftellen', tel: -1, maat: stand.fase === 'einde' ? 0 : stand.maat }
    case 'pauze':
      return speelt(stand) ? { ...stand, fase: 'stil', tel: -1 } : stand
    case 'herhaal':
      return { ...stand, herhaal: actie.aan && volgorde.length > 0 ? volgorde[stand.maat].volgordeIndex : null }
    case 'naarSectie': {
      const maat = eersteMaatVan(volgorde, actie.volgordeIndex)
      if (maat < 0) return stand
      const herhaal = stand.herhaal === null ? null : actie.volgordeIndex
      if (stand.fase === 'einde') return { ...stand, fase: 'stil', maat, herhaal }
      return { ...stand, maat, herhaal, tel: -1, fase: speelt(stand) ? 'aftellen' : stand.fase }
    }
    case 'tel': {
      if (stand.fase === 'aftellen') {
        if (actie.tel === 0 && stand.tel >= 0) return { ...stand, fase: 'spelen', tel: 0 }
        return { ...stand, tel: actie.tel }
      }
      if (stand.fase !== 'spelen') return stand
      if (actie.tel !== 0) return { ...stand, tel: actie.tel }
      const maat = volgendeMaat(volgorde, stand.maat, stand.herhaal)
      return maat === null ? { ...stand, fase: 'einde', tel: -1 } : { ...stand, maat, tel: 0 }
    }
  }
}

export interface Meespeelweergave {
  fase: Meespeelfase
  /** Het getal van het aftellen (4, 3, 2, 1), anders `null`. */
  aftellen: number | null
  /** Wat je nu speelt; stil of tijdens het aftellen het eerste akkoord van de maat. `null` na het einde. */
  akkoord: string | null
  volgend: string | null
  /** Op deze tel begint een akkoord: aanslaan. */
  aanslaan: boolean
  sectie: string
  volgordeIndex: number
  /** De maten van de huidige sectie, en welke daarvan nu is. */
  maten: string[][]
  actieveMaat: number
  herhaalt: boolean
}

/** Alles wat het meespeelscherm laat zien, uit de stand. */
export function meespeelWeergave(stand: Meespeelstand, volgorde: readonly SpeelMaat[], maatsoort: Maatsoort): Meespeelweergave {
  const huidig = volgorde[stand.maat]
  const tel = stand.fase === 'spelen' ? stand.tel : 0
  const op = akkoordOpTel(huidig.akkoorden, tel, maatsoort)
  const einde = stand.fase === 'einde'

  let volgend: string | null = huidig.akkoorden[op.index + 1] ?? null
  if (volgend === null) {
    const maat = volgendeMaat(volgorde, stand.maat, stand.herhaal)
    volgend = maat === null ? null : volgorde[maat].akkoorden[0]
  }

  return {
    fase: stand.fase,
    aftellen: stand.fase === 'aftellen' && stand.tel >= 0 ? leesMaatsoort(maatsoort).tellen - stand.tel : null,
    akkoord: einde ? null : op.akkoord,
    volgend: einde ? null : volgend,
    aanslaan: stand.fase === 'spelen' && op.begint,
    sectie: huidig.sectie,
    volgordeIndex: huidig.volgordeIndex,
    maten: volgorde.filter((m) => m.volgordeIndex === huidig.volgordeIndex).map((m) => m.akkoorden),
    actieveMaat: huidig.maatIndex,
    herhaalt: stand.herhaal !== null,
  }
}
