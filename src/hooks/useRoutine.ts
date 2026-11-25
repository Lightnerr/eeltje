import { useEffect, useState } from 'react'
import { akkoorden, liedjes, oefeningen } from '../data'
import { routineVoorVandaag, type Routine } from '../lib/routine'
import { opslag } from '../lib/storage'
import type { Voortgang } from '../lib/types'

/** De routine van vandaag: de bewaarde als die nog klopt, anders een nieuwe, die meteen bewaard wordt. */
export function useRoutine(voortgang: Voortgang): Routine {
  const [routine] = useState(() => routineVoorVandaag(opslag.laadRoutine(), voortgang, { akkoorden, liedjes, oefeningen }, new Date()))
  useEffect(() => {
    opslag.bewaarRoutine({ datum: routine.datum, routine })
  }, [routine])
  return routine
}
