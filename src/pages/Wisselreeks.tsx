import { useEffect, useRef, useState } from 'react'
import { AkkoordDiagram } from '../components/AkkoordDiagram'
import { AkkoordKiezer } from '../components/AkkoordKiezer'
import { ChallengeOnderbroken, ChallengeUitslag, RecordRegel } from '../components/ChallengeUitslag'
import { Schermvullend } from '../components/Schermvullend'
import { StartTempo } from '../components/StartTempo'
import { TelWeergave } from '../components/TelWeergave'
import { akkoorden as alleAkkoorden } from '../data'
import { useChallengeResultaat } from '../hooks/useChallengeResultaat'
import { useKlok } from '../hooks/useKlok'
import { useMetronoom } from '../hooks/useMetronoom'
import { navigeer } from '../hooks/useRoute'
import { useSpatiebalk } from '../hooks/useSpatiebalk'
import { useVerborgen } from '../hooks/useVerborgen'
import { useVoortgang } from '../hooks/useVoortgang'
import { akkoordnamen, gekozenVariant } from '../lib/akkoorden'
import { duurTekst, geldigeReeks, reeksSleutel, standaardAkkoorden } from '../lib/challenges'
import { begrensBpm } from '../lib/metronoom'
import type { RouteGegevens } from '../lib/route'
import {
  TELLEN_PER_AKKOORD,
  WISSELREEKS_START_BPM,
  wisselreeksPositie,
  wisselreeksResultaat,
  wisselreeksVerloop,
  wisselreeksVolgehouden,
  type WisselreeksActie,
  type WisselreeksStand,
} from '../lib/wisselreeks'
import './Challenge.css'

export default function WisselreeksPagina({ akkoorden: routeAkkoorden, bpm: routeBpm }: RouteGegevens<'wisselreeks'>) {
  const { voortgang } = useVoortgang()
  const namen = akkoordnamen(alleAkkoorden)
  const [reeks, zetReeks] = useState(() => geldigeReeks(routeAkkoorden, namen) ?? standaardAkkoorden(voortgang, namen, 3))
  const [bpm, zetBpm] = useState(() => begrensBpm(routeBpm ?? WISSELREEKS_START_BPM))
  const [stand, zetStand] = useState<WisselreeksStand>({ fase: 'wacht' })
  const [nu, zetNu] = useState(0)
  const knop = useRef<HTMLButtonElement>(null)
  const stuur = (actie: WisselreeksActie) => zetStand((s) => wisselreeksVerloop(s, actie))
  // Het akkoord en de volgehouden tijd lopen op de tellen zoals je ze hoort, niet op het moment van de klik op Start.
  const metronoom = useMetronoom({ bpm, maatsoort: '4/4', opTel: (tel) => stuur({ soort: 'tel', tel, nu: performance.now() }) })
  const geldig = geldigeReeks(reeks, namen) !== null
  const resultaat = wisselreeksResultaat(stand, reeks)
  const { record, vorigRecord, onthoudRecord } = useChallengeResultaat('wisselreeks', reeksSleutel(reeks), stand, resultaat)
  const bezig = stand.fase === 'aftellen' || stand.fase === 'lopen'

  useKlok(bezig, 250, zetNu)

  useVerborgen(bezig, (t) => {
    metronoom.stop()
    stuur({ soort: 'verborgen', nu: t })
  })

  function opKnop() {
    if (stand.fase === 'wacht') {
      if (!geldig) return
      onthoudRecord()
      metronoom.start()
      stuur({ soort: 'start', bpm })
    } else {
      metronoom.stop()
      stuur({ soort: 'gestopt', nu: performance.now() })
    }
  }

  const knopZichtbaar = stand.fase === 'wacht' || bezig
  useSpatiebalk(knopZichtbaar, knop, opKnop)

  useEffect(() => {
    if (stand.fase !== 'wacht') return
    const frame = requestAnimationFrame(() => knop.current?.focus())
    return () => cancelAnimationFrame(frame)
  }, [stand.fase])

  function zetAantal(aantal: number) {
    const extra = namen.filter((n) => !reeks.includes(n))
    zetReeks(aantal > reeks.length ? [...reeks, ...extra].slice(0, aantal) : reeks.slice(0, aantal))
  }

  const positie = wisselreeksPositie(stand, reeks.length)
  const huidig = gekozenVariant(alleAkkoorden, voortgang, reeks[positie.akkoord])

  return (
    <Schermvullend titel="Wisselreeks" onSluit={() => navigeer({ pagina: 'oefenen' })}>
      <div className="challenge">
        {stand.fase === 'wacht' && (
          <div className="challenge-instellen">
            <p>
              Speel de akkoorden steeds rond, elk {TELLEN_PER_AKKOORD} tellen, zo lang als je het volhoudt. Mis je een wissel? Tik op de grote knop of
              druk op de spatiebalk.
            </p>
            <div className="challenge-keuze" role="group" aria-label="Aantal akkoorden">
              {[3, 4].map((n) => (
                <button key={n} type="button" className={`knop ${reeks.length === n ? '' : 'knop-rustig'}`} aria-pressed={reeks.length === n} onClick={() => zetAantal(n)}>
                  {n} akkoorden
                </button>
              ))}
            </div>
            <div className="challenge-kiezers">
              {reeks.map((naam, i) => (
                <AkkoordKiezer
                  key={i}
                  label={`${i + 1}e`}
                  waarde={naam}
                  voortgang={voortgang}
                  onKies={(n) => zetReeks(reeks.map((r, j) => (j === i ? n : r)))}
                />
              ))}
            </div>
            <StartTempo bpm={bpm} onBpm={zetBpm} />
            {geldig ? <RecordRegel record={record} /> : <p className="challenge-fout">Zet niet twee dezelfde akkoorden na elkaar, ook niet het laatste en het eerste.</p>}
          </div>
        )}

        {bezig && (
          <>
            <div className="challenge-akkoorden">
              <div className="challenge-akkoord">
                <span className="challenge-akkoordnaam" aria-live="polite">
                  {reeks[positie.akkoord]}
                </span>
                {huidig && <AkkoordDiagram akkoord={huidig} grootte="klein" />}
              </div>
              <div className="challenge-akkoord challenge-volgende">
                <span className="zacht">Straks</span>
                <span>{reeks[positie.volgende]}</span>
              </div>
            </div>
            <TelWeergave tellen={TELLEN_PER_AKKOORD} tel={metronoom.tel} />
            <p className="challenge-stand">
              {stand.fase === 'aftellen' ? `${bpm} bpm · tel af en begin op de 1` : `${duurTekst(wisselreeksVolgehouden(stand, nu))} volgehouden`}
            </p>
          </>
        )}

        {knopZichtbaar && (
          <button ref={knop} type="button" className={`knop challenge-tik ${stand.fase === 'wacht' ? 'challenge-tik-start' : ''}`} disabled={stand.fase === 'wacht' && !geldig} onClick={opKnop}>
            {stand.fase === 'wacht' && 'Start'}
            {stand.fase === 'aftellen' && 'Stoppen'}
            {stand.fase === 'lopen' && 'Ik ben eruit'}
          </button>
        )}

        {stand.fase === 'onderbroken' && <ChallengeOnderbroken onOpnieuw={() => stuur({ soort: 'opnieuw' })} />}

        {stand.fase === 'klaar' && (
          <ChallengeUitslag resultaat={resultaat} vorigRecord={vorigRecord} leeg="Korter dan een seconde, dus er is niets opgeslagen.">
            <button type="button" className="knop" onClick={() => stuur({ soort: 'opnieuw' })}>
              Nog een keer
            </button>
          </ChallengeUitslag>
        )}
      </div>
    </Schermvullend>
  )
}
