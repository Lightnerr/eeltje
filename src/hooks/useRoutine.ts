import { useEffect, useState } from 'react'
import { akkoorden, liedjes, oefeningen } from '../data'
import { routineVoorVandaag, type Routine } from '../lib/routine'
import { dagSleutel } from '../lib/statistiek'
import { opslag } from '../lib/storage'
import type { Voortgang } from '../lib/types'

function kies(voortgang: Voortgang, nu: Date): Routine {
  return routineVoorVandaag(opslag.laadRoutine(), voortgang, { akkoorden, liedjes, oefeningen }, nu)
}

/**
 * De routine van vandaag: de bewaarde als die nog klopt, anders een nieuwe, die meteen bewaard wordt. Geef de tijd
 * van `useNu` mee: staat Vandaag over middernacht open, dan komt er vanzelf de routine van de nieuwe dag.
 */
export function useRoutine(voortgang: Voortgang, nu: Date): Routine {
  const [routine, zetRoutine] = useState(() => kies(voortgang, nu))
  if (routine.datum !== dagSleutel(nu)) zetRoutine(kies(voortgang, nu))
  useEffect(() => {
    opslag.bewaarRoutine({ datum: routine.datum, routine })
  }, [routine])
  return routine
}
