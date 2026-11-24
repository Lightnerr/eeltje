import type { ChallengeResultaat, Sessie, Voortgang } from './types';
import { paarSleutel } from './statistiek';

const DAG = 24 * 60 * 60 * 1000;

/**
 * Een gitarist die een maand bezig is, met datums rond `nu`. Previews en tools/kijk starten hiermee,
 * zodat elke pagina iets laat zien. Nieuwe functies krijgen hier een voorbeeld.
 */
export function demoVoortgang(nu = new Date()): Voortgang {
  const dagenTerug = (d: number, uur = 19) => {
    const t = new Date(nu.getTime() - d * DAG);
    t.setHours(uur, 30, 0, 0);
    return t.toISOString();
  };

  // Elke dag van de afgelopen week (streak), daarvoor om de dag.
  const sessies: Sessie[] = [];
  for (let d = 28; d >= 1; d -= d > 8 ? 2 : 1) sessies.push({ datum: dagenTerug(d), duurSec: (10 + (d % 4) * 3) * 60 });

  const challenges: ChallengeResultaat[] = [];
  [9, 11, 12, 14, 15, 17, 19].forEach((waarde, i) =>
    challenges.push({ type: 'one-minute-changes', datum: dagenTerug(27 - i * 4), waarde, sleutel: paarSleutel('A', 'D') }),
  );
  [6, 8, 10, 11].forEach((waarde, i) =>
    challenges.push({ type: 'one-minute-changes', datum: dagenTerug(14 - i * 4), waarde, sleutel: paarSleutel('G', 'C') }),
  );
  [60, 64, 68, 68, 72, 76].forEach((waarde, i) =>
    challenges.push({ type: 'spider-ladder', datum: dagenTerug(25 - i * 4), waarde, bpm: waarde }),
  );
  [45, 70, 95].forEach((waarde, i) =>
    challenges.push({ type: 'wisselreeks', datum: dagenTerug(10 - i * 4), waarde, sleutel: 'G-C-D', bpm: 70 }),
  );

  return {
    versie: 1,
    akkoordStatus: { A: 'kan ik', D: 'kan ik', E: 'kan ik', Em: 'kan ik', G: 'oefenen', C: 'oefenen', Am: 'oefenen' },
    voorkeurVariant: {},
    challenges,
    sessies,
    favorieten: ['wonderwall', 'stand-by-me'],
    gecontroleerd: ['amazing-grace'],
  };
}
