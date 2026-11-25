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
import { klokTekst, leesWissels, MAX_WISSELS, omcResterend, omcResultaat, omcVerloop, type OmcActie, type OmcStand } from '../lib/oneMinuteChanges'
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

function ScoreInvullen({ voorstel, onBewaar }: { voorstel: number; onBewaar: (wissels: number) => void }) {
  const [tekst, zetTekst] = useState(String(voorstel))
  const invoer = useRef<HTMLInputElement>(null)
  const wissels = leesWissels(tekst)

  // Een frame later, zodat de focus niet blijft hangen op de tikknop die net verdween.
  useEffect(() => {
    const frame = requestAnimationFrame(() => invoer.current?.select())
    return () => cancelAnimationFrame(frame)
  }, [])

  const verschuif = (stap: number) => zetTekst(String(Math.min(MAX_WISSELS, Math.max(0, (wissels ?? voorstel) + stap))))

  return (
    <form
      className="challenge-invullen"
      onSubmit={(e) => {
        e.preventDefault()
        if (wissels !== null) onBewaar(wissels)
      }}
    >
      <label htmlFor="omc-wissels" className="challenge-invullen-vraag">
        Tijd! Hoeveel wissels had je?
      </label>
      <div className="challenge-invullen-rij">
        <button type="button" className="knop knop-rustig" aria-label="Eén minder" onClick={() => verschuif(-1)}>
          −
        </button>
        <input
          ref={invoer}
          id="omc-wissels"
          className="challenge-invullen-getal"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={tekst}
          onChange={(e) => zetTekst(e.target.value)}
          aria-invalid={wissels === null}
          aria-describedby={wissels === null ? 'omc-wissels-fout' : undefined}
        />
        <button type="button" className="knop knop-rustig" aria-label="Eén meer" onClick={() => verschuif(1)}>
          +
        </button>
      </div>
      {wissels === null && (
        <p id="omc-wissels-fout" className="challenge-fout">
          Vul een getal van 0 t/m {MAX_WISSELS} in.
        </p>
      )}
      <button type="submit" className="knop challenge-invullen-bewaar" disabled={wissels === null}>
        Bewaar
      </button>
    </form>
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
            <p>Wissel een minuut lang zo vaak als je kunt tussen twee akkoorden. Tik bij elke wissel op de grote knop of de spatiebalk, of tel zelf: aan het eind vul je je score in.</p>
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
                <span>Tik bij elke wissel, of tel zelf</span>
              </>
            )}
          </button>
        )}

        {stand.fase === 'onderbroken' && <ChallengeOnderbroken onOpnieuw={() => stuur({ soort: 'opnieuw' })} />}

        {stand.fase === 'invullen' && <ScoreInvullen voorstel={stand.wissels} onBewaar={(wissels) => stuur({ soort: 'invullen', wissels })} />}

        {stand.fase === 'klaar' && (
          <ChallengeUitslag resultaat={resultaat} vorigRecord={vorigRecord} leeg="0 wissels, dus er is niets opgeslagen.">
            <button type="button" className="knop" onClick={() => stuur({ soort: 'opnieuw' })}>
              Nog een keer
            </button>
          </ChallengeUitslag>
        )}
      </div>
    </Schermvullend>
  )
}
