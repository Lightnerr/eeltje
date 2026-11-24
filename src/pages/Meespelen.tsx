import { useEffect, useRef, useState } from 'react'
import { slaAan, stopGitaar } from '../audio/gitaar'
import { Schermvullend } from '../components/Schermvullend'
import { SlagpatroonWeergave } from '../components/SlagpatroonWeergave'
import { akkoorden, zoekLiedje } from '../data'
import { useMetronoom } from '../hooks/useMetronoom'
import { navigeer } from '../hooks/useRoute'
import { useVoortgang } from '../hooks/useVoortgang'
import { gekozenVariant } from '../lib/akkoorden'
import { capoTekst } from '../lib/liedjes'
import {
  begrensTempo,
  beginMeespelen,
  MAX_TEMPO,
  meespeelBpm,
  meespeelStap,
  meespeelWeergave,
  MIN_TEMPO,
  TEMPO_STAP,
  type Meespeelactie,
  type Meespeelstand,
} from '../lib/meespelen'
import { leesSlagpatroon, slagenPerTel, speelVolgorde } from '../lib/muziek'
import type { RouteGegevens } from '../lib/route'
import type { Liedje } from '../lib/types'
import NietGevondenPagina from './NietGevonden'
import './Meespelen.css'

export default function MeespelenPagina({ id }: RouteGegevens<'meespelen'>) {
  const liedje = zoekLiedje(id)
  if (!liedje) return <NietGevondenPagina wat="Dit liedje" />
  return <Meespelen liedje={liedje} />
}

function Meespelen({ liedje }: { liedje: Liedje }) {
  const { voortgang } = useVoortgang()
  const [volgorde] = useState(() => speelVolgorde(liedje))
  const [stand, zetStand] = useState(beginMeespelen)
  const standRef = useRef<Meespeelstand>(stand)
  const [procent, zetProcent] = useState(100)
  const [geluid, zetGeluid] = useState(false)
  const slagen = leesSlagpatroon(liedje.slagpatroon) ?? []
  const metronoom = useMetronoom({
    bpm: meespeelBpm(liedje.bpm, procent),
    maatsoort: liedje.maatsoort,
    onderverdeling: slagenPerTel(slagen.length, liedje.maatsoort),
    opTel,
  })
  const w = meespeelWeergave(stand, volgorde, liedje.maatsoort)
  const speelt = w.fase === 'aftellen' || w.fase === 'spelen'

  // Via een ref, zodat elke tel op de nieuwste stand voortbouwt, ook als React renders samenvoegt.
  function doe(actie: Meespeelactie): Meespeelstand {
    standRef.current = meespeelStap(standRef.current, actie, volgorde)
    zetStand(standRef.current)
    return standRef.current
  }

  function opTel(tel: number) {
    const nu = meespeelWeergave(doe({ type: 'tel', tel }), volgorde, liedje.maatsoort)
    if (nu.fase === 'einde') metronoom.stop()
    if (geluid && nu.aanslaan && nu.akkoord) {
      const akkoord = gekozenVariant(akkoorden, voortgang, nu.akkoord)
      if (akkoord) slaAan(akkoord)
    }
  }

  function wissel() {
    const { fase } = standRef.current
    if (fase === 'aftellen' || fase === 'spelen') {
      metronoom.stop()
      doe({ type: 'pauze' })
    } else {
      metronoom.start()
      doe({ type: 'start' })
    }
  }

  useEffect(() => stopGitaar, [])

  // De spatiebalk start of pauzeert altijd, ook als een knop de focus heeft (die druk je met Enter).
  const wisselRef = useRef(wissel)
  useEffect(() => {
    wisselRef.current = wissel
  })
  useEffect(() => {
    const opToets = (e: KeyboardEvent) => {
      if (e.key !== ' ') return
      e.preventDefault()
      if (e.type === 'keydown' && !e.repeat) wisselRef.current()
    }
    document.addEventListener('keydown', opToets, true)
    document.addEventListener('keyup', opToets, true)
    return () => {
      document.removeEventListener('keydown', opToets, true)
      document.removeEventListener('keyup', opToets, true)
    }
  }, [])

  const startTekst = speelt ? 'Pauze' : w.fase === 'einde' ? 'Opnieuw' : 'Start'

  return (
    <Schermvullend titel={liedje.titel} onSluit={() => navigeer({ pagina: 'liedje', id: liedje.id })}>
      <div className="meespelen">
        <p className="meespelen-plek">
          <span className="meespelen-sectie">{w.sectie}</span>
          {liedje.capo > 0 && <span className="meespelen-capo">{capoTekst(liedje.capo)}</span>}
          {w.herhaalt && <span className="meespelen-herhaalt">Herhaalt</span>}
        </p>

        <div className="meespelen-nu" aria-live="off">
          {w.aftellen !== null ? (
            <span className="meespelen-aftellen" aria-label={`Aftellen: ${w.aftellen}`}>
              {w.aftellen}
            </span>
          ) : w.fase === 'einde' ? (
            <span className="meespelen-klaar">Klaar!</span>
          ) : (
            <span className={`meespelen-akkoord${w.fase === 'spelen' ? ' meespelen-akkoord-aan' : ''}`}>{w.akkoord}</span>
          )}
          <span className="meespelen-volgend">{w.volgend ? <>Straks: <strong>{w.volgend}</strong></> : w.fase === 'einde' ? '' : 'Laatste akkoord'}</span>
        </div>

        <ol className="meespelen-maten" aria-label={`Maten van ${w.sectie}`}>
          {w.maten.map((maat, i) => (
            <li key={i} className={i === w.actieveMaat ? 'meespelen-maat meespelen-maat-aan' : 'meespelen-maat'} aria-current={i === w.actieveMaat ? 'step' : undefined}>
              {maat.map((a, j) => (
                <span key={j}>{a}</span>
              ))}
            </li>
          ))}
        </ol>

        <SlagpatroonWeergave slagen={slagen} actief={w.fase === 'spelen' ? metronoom.slag : null} grootte="groot" maatsoort={liedje.maatsoort} />

        <button type="button" className="knop meespelen-start" onClick={wissel}>
          {startTekst}
        </button>

        <div className="meespelen-tempo" role="group" aria-label="Tempo">
          <button
            type="button"
            className="knop knop-rustig"
            aria-label="Langzamer"
            disabled={procent <= MIN_TEMPO}
            onClick={() => zetProcent((p) => begrensTempo(p - TEMPO_STAP))}
          >
            −
          </button>
          <p className="meespelen-tempo-waarde">
            <strong>{procent}%</strong> <span className="zacht">{meespeelBpm(liedje.bpm, procent)} bpm</span>
          </p>
          <button
            type="button"
            className="knop knop-rustig"
            aria-label="Sneller"
            disabled={procent >= MAX_TEMPO}
            onClick={() => zetProcent((p) => begrensTempo(p + TEMPO_STAP))}
          >
            +
          </button>
        </div>

        <div className="meespelen-schakelaars">
          <button type="button" className="knop knop-rustig" aria-pressed={w.herhaalt} onClick={() => doe({ type: 'herhaal', aan: !w.herhaalt })}>
            Herhaal deze sectie
          </button>
          <button type="button" className="knop knop-rustig" aria-pressed={geluid} onClick={() => zetGeluid((g) => !g)}>
            Akkoordgeluid
          </button>
        </div>

        <div className="meespelen-secties">
          <h2>Naar sectie</h2>
          <ul>
            {liedje.volgorde.map((naam, i) => (
              <li key={i}>
                <button
                  type="button"
                  className="meespelen-sectieknop"
                  aria-current={i === w.volgordeIndex ? 'true' : undefined}
                  onClick={() => doe({ type: 'naarSectie', volgordeIndex: i })}
                >
                  {naam}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Schermvullend>
  )
}
