import { useEffect, useRef, useState } from 'react'
import { AkkoordDiagram } from '../components/AkkoordDiagram'
import { AkkoordKiezer } from '../components/AkkoordKiezer'
import { ChallengeOnderbroken, ChallengeUitslag, RecordRegel } from '../components/ChallengeUitslag'
import { Schermvullend } from '../components/Schermvullend'
import { akkoorden } from '../data'
import { useChallengeResultaat } from '../hooks/useChallengeResultaat'
import { useKlok } from '../hooks/useKlok'
import { navigeer } from '../hooks/useRoute'
import { useSpatiebalk } from '../hooks/useSpatiebalk'
import { useVerborgen } from '../hooks/useVerborgen'
import { useVoortgang } from '../hooks/useVoortgang'
import { akkoordnamen, gekozenVariant } from '../lib/akkoorden'
import { geldigPaar, paarSleutel, standaardAkkoorden } from '../lib/challenges'
import { klokTekst, omcResterend, omcResultaat, omcVerloop, type OmcActie, type OmcStand } from '../lib/oneMinuteChanges'
import type { RouteGegevens } from '../lib/route'
import type { Voortgang } from '../lib/types'
import './Challenge.css'

function Akkoord({ naam, voortgang }: { naam: string; voortgang: Voortgang }) {
  const akkoord = gekozenVariant(akkoorden, voortgang, naam)
  return (
    <div className="challenge-akkoord">
      <span className="challenge-akkoordnaam">{naam}</span>
      {akkoord && <AkkoordDiagram akkoord={akkoord} grootte="klein" />}
    </div>
  )
}

export default function OneMinuteChangesPagina({ a: routeA, b: routeB }: RouteGegevens<'one-minute-changes'>) {
  const { voortgang } = useVoortgang()
  const [[a, b], zetPaar] = useState(
    () => geldigPaar(routeA, routeB, akkoordnamen(akkoorden)) ?? (standaardAkkoorden(voortgang, akkoordnamen(akkoorden), 2) as [string, string]),
  )
  const [stand, zetStand] = useState<OmcStand>({ fase: 'wacht' })
  const [nu, zetNu] = useState(0)
  const knop = useRef<HTMLButtonElement>(null)
  const resultaat = omcResultaat(stand, a, b)
  const { record, vorigRecord, onthoudRecord } = useChallengeResultaat('one-minute-changes', paarSleutel(a, b), stand, resultaat)
  const bezig = stand.fase === 'aftellen' || stand.fase === 'lopen'

  const stuur = (actie: OmcActie) => zetStand((s) => omcVerloop(s, actie))

  useKlok(bezig, 100, (t) => {
    zetNu(t)
    stuur({ soort: 'tijd', nu: t })
  })

  useVerborgen(bezig, (t) => stuur({ soort: 'verborgen', nu: t }))

  function opKnop() {
    const t = performance.now()
    if (stand.fase === 'wacht') {
      if (a === b) return
      onthoudRecord()
      zetNu(t)
      stuur({ soort: 'start', nu: t })
    } else stuur({ soort: 'tik', nu: t })
  }

  const knopZichtbaar = stand.fase === 'wacht' || bezig
  useSpatiebalk(knopZichtbaar, knop, opKnop)

  // Na Schermvullend, dat de sluitknop focust: de spatie hoort bij de grote knop, niet bij "Sluiten".
  useEffect(() => {
    if (stand.fase !== 'wacht') return
    const frame = requestAnimationFrame(() => knop.current?.focus())
    return () => cancelAnimationFrame(frame)
  }, [stand.fase])

  const resterend = omcResterend(stand, nu)
  const zelfde = a === b

  return (
    <Schermvullend titel="One minute changes" onSluit={() => navigeer({ pagina: 'oefenen' })}>
      <div className="challenge">
        {stand.fase === 'wacht' && (
          <div className="challenge-instellen">
            <p>Wissel een minuut lang zo vaak als je kunt tussen twee akkoorden. Tik bij elke wissel op de grote knop of druk op de spatiebalk.</p>
            <div className="challenge-kiezers">
              <AkkoordKiezer label="Van" waarde={a} voortgang={voortgang} onKies={(n) => zetPaar([n, b])} />
              <AkkoordKiezer label="Naar" waarde={b} voortgang={voortgang} onKies={(n) => zetPaar([a, n])} />
            </div>
            {zelfde ? <p className="challenge-fout">Kies twee verschillende akkoorden.</p> : <RecordRegel record={record} />}
          </div>
        )}

        {stand.fase !== 'wacht' && stand.fase !== 'onderbroken' && (
          <div className="challenge-akkoorden" aria-label={`${a} en ${b}`}>
            <Akkoord naam={a} voortgang={voortgang} />
            <svg className="challenge-pijl" viewBox="0 0 32 24" aria-hidden="true">
              <path d="M4 8h22m-5-5 5 5-5 5M28 16H6m5-5-5 5 5 5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <Akkoord naam={b} voortgang={voortgang} />
          </div>
        )}

        {bezig && (
          <p className="challenge-klok" aria-live={stand.fase === 'aftellen' ? 'assertive' : 'off'}>
            {stand.fase === 'aftellen' ? `Klaar? ${Math.ceil(resterend / 1000)}` : klokTekst(resterend)}
          </p>
        )}

        {knopZichtbaar && (
          <button
            ref={knop}
            type="button"
            className={`knop challenge-tik ${stand.fase === 'wacht' ? 'challenge-tik-start' : ''}`}
            disabled={stand.fase === 'wacht' && zelfde}
            onClick={opKnop}
            aria-label={stand.fase === 'lopen' ? `Wissel, ${stand.wissels} geteld` : undefined}
          >
            {stand.fase === 'wacht' && 'Start'}
            {stand.fase === 'aftellen' && 'Zet je vingers klaar'}
            {stand.fase === 'lopen' && (
              <>
                <span className="challenge-teller">{stand.wissels}</span>
                <span>Tik bij elke wissel</span>
              </>
            )}
          </button>
        )}

        {stand.fase === 'onderbroken' && <ChallengeOnderbroken onOpnieuw={() => stuur({ soort: 'opnieuw' })} />}

        {stand.fase === 'klaar' && (
          <ChallengeUitslag resultaat={resultaat} vorigRecord={vorigRecord} leeg="Geen wissels geteld, dus er is niets opgeslagen.">
            <button type="button" className="knop" onClick={() => stuur({ soort: 'opnieuw' })}>
              Nog een keer
            </button>
          </ChallengeUitslag>
        )}
      </div>
    </Schermvullend>
  )
}
