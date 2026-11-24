import { useEffect, useRef, useState } from 'react'
import { ChallengeUitslag, RecordRegel } from '../components/ChallengeUitslag'
import { Schermvullend } from '../components/Schermvullend'
import { StartTempo } from '../components/StartTempo'
import { TelWeergave } from '../components/TelWeergave'
import { useChallengeResultaat } from '../hooks/useChallengeResultaat'
import { useMetronoom } from '../hooks/useMetronoom'
import { navigeer } from '../hooks/useRoute'
import { useSpatiebalk } from '../hooks/useSpatiebalk'
import { SPIDER_SLEUTEL } from '../lib/challenges'
import { naarHash, type RouteGegevens } from '../lib/route'
import { SPIDER_STAP, spiderBegin, spiderResultaat, spiderVerloop, type SpiderActie, type SpiderStand } from '../lib/spiderLadder'
import './Challenge.css'

export default function SpiderLadderPagina({ bpm: routeBpm }: RouteGegevens<'spider-ladder'>) {
  const [stand, zetStand] = useState<SpiderStand>(() => spiderBegin(routeBpm))
  const knop = useRef<HTMLButtonElement>(null)
  const metronoom = useMetronoom({ bpm: stand.bpm, maatsoort: '4/4' })
  const resultaat = spiderResultaat(stand)
  const { record, vorigRecord, onthoudRecord } = useChallengeResultaat('spider-ladder', SPIDER_SLEUTEL, stand, resultaat)

  function stuur(actie: SpiderActie) {
    const volgende = spiderVerloop(stand, actie)
    zetStand(volgende)
    if (volgende.fase !== 'lopen') metronoom.stop()
  }

  function opKnop() {
    if (stand.fase === 'wacht') {
      onthoudRecord()
      metronoom.start()
      stuur({ soort: 'start' })
    } else stuur({ soort: 'gelukt' })
  }

  useSpatiebalk(stand.fase !== 'klaar', knop, opKnop)

  useEffect(() => {
    if (stand.fase !== 'wacht') return
    const frame = requestAnimationFrame(() => knop.current?.focus())
    return () => cancelAnimationFrame(frame)
  }, [stand.fase])

  return (
    <Schermvullend titel="Spider-ladder" onSluit={() => navigeer({ pagina: 'oefenen' })}>
      <div className="challenge">
        {stand.fase === 'wacht' && (
          <div className="challenge-instellen">
            <p>
              Speel de <a href={naarHash({ pagina: 'oefening', id: 'spider' })}>spider</a> op de metronoom, heen en terug. Lukte het schoon? Dan
              gaat het tempo {SPIDER_STAP} bpm omhoog. Je hoogste tempo is je record.
            </p>
            <StartTempo bpm={stand.bpm} tekst="Begin op" onBpm={(bpm) => stuur({ soort: 'zetBpm', bpm })} />
            <RecordRegel record={record} />
          </div>
        )}

        {stand.fase === 'lopen' && (
          <>
            <p className="challenge-klok">
              <span className="challenge-akkoordnaam">{stand.bpm}</span> bpm
            </p>
            <TelWeergave tellen={4} tel={metronoom.tel} />
            <p className="challenge-stand">
              Ronde {stand.rondes + 1} · {stand.hoogste === null ? 'nog niets gelukt' : `gelukt tot ${stand.hoogste} bpm`}
              {record && <> · record {record.waarde} bpm</>}
            </p>
          </>
        )}

        {stand.fase !== 'klaar' && (
          <button ref={knop} type="button" className={`knop challenge-tik ${stand.fase === 'wacht' ? 'challenge-tik-start' : ''}`} onClick={opKnop}>
            {stand.fase === 'wacht' ? 'Start' : 'Gelukt, sneller!'}
          </button>
        )}

        {stand.fase === 'lopen' && (
          <button type="button" className="knop knop-rustig" onClick={() => stuur({ soort: 'mislukt' })}>
            Lukte niet, stoppen
          </button>
        )}

        {stand.fase === 'klaar' && (
          <ChallengeUitslag resultaat={resultaat} vorigRecord={vorigRecord} leeg="Er lukte nog geen ronde, dus er is niets opgeslagen.">
            <button type="button" className="knop" onClick={() => stuur({ soort: 'opnieuw' })}>
              Nog een keer
            </button>
          </ChallengeUitslag>
        )}
      </div>
    </Schermvullend>
  )
}
