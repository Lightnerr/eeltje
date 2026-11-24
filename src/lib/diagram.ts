import type { Akkoord } from './types'

// De geometrie van een akkoorddiagram, los van SVG: AkkoordDiagram rekent alleen nog vakken en snaren om naar pixels.
// Snaren 0 (lage E) t/m 5 (hoge e); vak 1 is het bovenste vak van het diagram.

export interface Bolletje {
  snaar: number
  vak: number
  vinger: number
}

export interface DiagramBarre {
  vak: number
  vanSnaar: number
  totSnaar: number
  vinger: number
}

export interface Diagram {
  basisfret: number
  /** Het fretnummer naast het bovenste vak; `null` bij een akkoord vanaf de eerste fret. */
  fretnummer: number | null
  /** De dikke lijn bovenaan: alleen als het diagram bij de eerste fret begint. */
  topkam: boolean
  vakken: number
  /** Boven elke snaar: `x` = niet spelen, `o` = open, `null` = gegrepen. */
  boven: ('x' | 'o' | null)[]
  barres: DiagramBarre[]
  bolletjes: Bolletje[]
}

const MINSTE_VAKKEN = 4

function barresVan(akkoord: Akkoord): { fret: number; vanSnaar: number; totSnaar: number; vinger: number }[] {
  const { frets, vingers, barre } = akkoord
  const groepen = new Map<string, number[]>()
  frets.forEach((fret, snaar) => {
    if (typeof fret !== 'number' || fret === 0 || vingers[snaar] === 0) return
    const sleutel = `${vingers[snaar]}@${fret}`
    groepen.set(sleutel, [...(groepen.get(sleutel) ?? []), snaar])
  })
  const resultaat = [...groepen.values()]
    .filter((snaren) => snaren.length > 1)
    .map((snaren) => ({
      fret: frets[snaren[0]] as number,
      vanSnaar: snaren[0],
      totSnaar: snaren[snaren.length - 1],
      vinger: vingers[snaren[0]],
    }))
    // Een vinger die over een open of niet gespeelde snaar zou liggen, is geen barré maar twee losse vingertoppen.
    .filter((b) => frets.slice(b.vanSnaar, b.totSnaar + 1).every((f) => typeof f === 'number' && f >= b.fret))
  if (barre) {
    const vinger = vingers[barre.vanSnaar]
    const zonder = resultaat.filter((b) => !(b.fret === barre.fret && b.vinger === vinger))
    zonder.push({ ...barre, vinger })
    return zonder.sort((a, b) => a.fret - b.fret || a.vanSnaar - b.vanSnaar)
  }
  return resultaat.sort((a, b) => a.fret - b.fret || a.vanSnaar - b.vanSnaar)
}

export function diagramVan(akkoord: Akkoord): Diagram {
  const basisfret = akkoord.basisfret ?? 1
  const vak = (fret: number) => fret - basisfret + 1
  const barres = barresVan(akkoord)
  const onderBarre = (snaar: number, fret: number) =>
    barres.some((b) => b.fret === fret && b.vanSnaar <= snaar && snaar <= b.totSnaar && b.vinger === akkoord.vingers[snaar])
  const gegrepen = akkoord.frets.filter((f): f is number => typeof f === 'number' && f > 0)
  return {
    basisfret,
    fretnummer: basisfret > 1 ? basisfret : null,
    topkam: basisfret === 1,
    vakken: Math.max(MINSTE_VAKKEN, ...gegrepen.map(vak)),
    boven: akkoord.frets.map((f) => (f === 'x' ? 'x' : f === 0 ? 'o' : null)),
    barres: barres.map(({ fret, ...rest }) => ({ vak: vak(fret), ...rest })),
    bolletjes: akkoord.frets.flatMap((fret, snaar) =>
      typeof fret === 'number' && fret > 0 && !onderBarre(snaar, fret) ? [{ snaar, vak: vak(fret), vinger: akkoord.vingers[snaar] }] : [],
    ),
  }
}

export const SNAARNAMEN = ['E', 'A', 'D', 'G', 'B', 'e'] as const
const SNAREN_VOLUIT = ['lage E', 'A', 'D', 'G', 'B', 'hoge e']
const VINGERS = ['', 'wijsvinger', 'middelvinger', 'ringvinger', 'pink']

/** Voor `aria-label` en `<title>`: wat je per snaar doet. */
export function beschrijfAkkoord(akkoord: Akkoord): string {
  const barres = barresVan(akkoord)
  const delen = barres.map(
    (b) => `${VINGERS[b.vinger]} als barré op de ${b.fret}e fret over ${SNAREN_VOLUIT[b.vanSnaar]} t/m ${SNAREN_VOLUIT[b.totSnaar]}`,
  )
  akkoord.frets.forEach((fret, snaar) => {
    const naam = SNAREN_VOLUIT[snaar]
    if (fret === 'x') delen.push(`${naam} niet spelen`)
    else if (fret === 0) delen.push(`${naam} open`)
    else if (!barres.some((b) => b.fret === fret && b.vanSnaar <= snaar && snaar <= b.totSnaar && b.vinger === akkoord.vingers[snaar])) {
      delen.push(`${naam} ${fret}e fret ${VINGERS[akkoord.vingers[snaar]]}`)
    }
  })
  return `${akkoord.naam}, ${akkoord.titel.toLowerCase()}: ${delen.join(', ')}.`
}
