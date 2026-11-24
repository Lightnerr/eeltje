import { useEffect, useRef, useState } from 'react'
import { record, voegResultaatToe } from '../lib/challenges'
import type { ChallengeResultaat, ChallengeType } from '../lib/types'
import { useVoortgang } from './useVoortgang'

type ZonderDatum = Omit<ChallengeResultaat, 'datum'>

/**
 * Bewaart het resultaat één keer per `stand` van de challenge, zodra `resultaat` er is (de challenge is klaar), en
 * onthoudt het record van vóór die poging, voor "Nieuw record!". `resultaat` is `null` zolang hij niet klaar is;
 * afbreken slaat dus niets op.
 */
export function useChallengeResultaat(type: ChallengeType, sleutel: string | undefined, stand: object, resultaat: ZonderDatum | null) {
  const { voortgang, wijzig } = useVoortgang()
  const huidigRecord = record(voortgang, type, sleutel)
  const [vorigRecord, zetVorigRecord] = useState<ChallengeResultaat | null>(null)
  const bewaard = useRef<object | null>(null)

  useEffect(() => {
    if (!resultaat || bewaard.current === stand) return
    bewaard.current = stand
    wijzig((v) => voegResultaatToe(v, { ...resultaat, datum: new Date().toISOString() }))
  }, [stand, resultaat, wijzig])

  return {
    /** Het record nu, inclusief een net bewaard resultaat. */
    record: huidigRecord,
    /** Het record van vóór deze poging; zet je bij de start met `onthoudRecord`. */
    vorigRecord,
    onthoudRecord: () => zetVorigRecord(huidigRecord),
  }
}
