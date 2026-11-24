import type { ChallengeResultaat, ChallengeType, Sessie, Voortgang } from './types'

// Een verzonnen gitarist die een maand bezig is. Previews en tools/kijk beginnen hiermee, zodat elk scherm iets
// laat zien. Alles ligt rond `nu`, zodat streak en "vandaag" altijd kloppen.

const MINUUT = 60 * 1000

function opDag(nu: Date, dagenGeleden: number, uur: number, minuut = 0): Date {
  return new Date(nu.getFullYear(), nu.getMonth(), nu.getDate() - dagenGeleden, uur, minuut)
}

function sessies(nu: Date): Sessie[] {
  const dagen = [...Array.from({ length: 7 }, (_, d) => d), ...Array.from({ length: 12 }, (_, i) => 8 + i * 2)]
  return dagen
    .map((d) => {
      const seconden = (10 + ((d * 7) % 16)) * 60
      // Vandaag eindigt de sessie vlak voor `nu`, maar niet vóór middernacht.
      const start =
        d === 0 ? new Date(Math.max(opDag(nu, 0, 0).getTime(), nu.getTime() - seconden * 1000 - 5 * MINUUT)) : opDag(nu, d, 19)
      return { start: start.toISOString(), seconden }
    })
    .reverse()
}

function reeks(nu: Date, type: ChallengeType, sleutel: string, punten: [dagenGeleden: number, waarde: number][], bpm?: number): ChallengeResultaat[] {
  return punten.map(([d, waarde]) => ({
    type,
    sleutel,
    waarde,
    ...(bpm === undefined ? {} : { bpm }),
    datum: opDag(nu, d, 19, 20).toISOString(),
  }))
}

export function demoVoortgang(nu = new Date()): Voortgang {
  return {
    versie: 1,
    akkoordStatus: { A: 'kan ik', D: 'kan ik', E: 'kan ik', Em: 'kan ik', G: 'oefenen', C: 'oefenen', Am: 'oefenen' },
    voorkeurVariant: { G: '3-vingers' },
    challenges: [
      ...reeks(nu, 'one-minute-changes', 'A-D', [[28, 14], [22, 18], [16, 21], [10, 25], [4, 28], [1, 31]]),
      ...reeks(nu, 'one-minute-changes', 'Em-G', [[20, 8], [14, 11], [8, 15], [2, 19]]),
      ...reeks(nu, 'one-minute-changes', 'C-G', [[12, 6], [6, 9], [1, 12]]),
      ...reeks(nu, 'spider-ladder', 'spider', [[26, 50], [20, 55], [14, 60], [10, 60], [5, 65], [2, 70]]),
      ...reeks(nu, 'wisselreeks', 'G-C-D', [[18, 20], [12, 35], [6, 45], [3, 70]], 70),
      ...reeks(nu, 'wisselreeks', 'A-D-E', [[24, 30], [16, 60], [8, 90]], 80),
    ],
    sessies: sessies(nu),
    favorieten: ['wonderwall', 'knockin-on-heavens-door'],
    gecontroleerd: ['knockin-on-heavens-door'],
  }
}
