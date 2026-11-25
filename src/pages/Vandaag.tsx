import { useState } from 'react'
import { Kerngetallen } from '../components/Kerngetallen'
import { useOefentimer } from '../hooks/useOefentimer'
import { useRoutine } from '../hooks/useRoutine'
import { useNu } from '../hooks/useNu'
import { useVoortgang } from '../hooks/useVoortgang'
import { duurTekst } from '../lib/challenges'
import { timerTekst } from '../lib/oefentimer'
import { naarHash } from '../lib/route'
import type { RoutineSoort } from '../lib/routine'
import { minutenVandaag, streak, streakZin, totaalMinuten } from '../lib/statistiek'
import './Vandaag.css'

const SOORT: Record<RoutineSoort, string> = { opwarmen: 'Opwarmen', akkoordwissel: 'Akkoordwissel', liedje: 'Liedje' }
const datumLang = new Intl.DateTimeFormat('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })

function Oefentimer() {
  const { timer, loopt, verstreken, start, pauze, stop } = useOefentimer()
  const [melding, zetMelding] = useState('')
  const [mislukt, zetMislukt] = useState(false)

  return (
    <section className="kaart oefentimer" aria-labelledby="oefentimer-kop">
      <div className="oefentimer-kop">
        <h2 id="oefentimer-kop">Oefentimer</h2>
        <p className="oefentimer-tijd" aria-label={`${timerTekst(verstreken)} geoefend`}>
          {timerTekst(verstreken)}
        </p>
      </div>
      <div className="oefentimer-knoppen">
        {loopt ? (
          <button type="button" className="knop knop-rustig" onClick={pauze}>
            Pauze
          </button>
        ) : (
          <button
            type="button"
            className="knop"
            onClick={() => {
              zetMelding('')
              start()
            }}
          >
            {timer ? 'Doorgaan' : 'Start'}
          </button>
        )}
        {timer && (
          <button
            type="button"
            className="knop knop-rustig"
            onClick={() => {
              const { uitkomst, sessie } = stop()
              zetMislukt(uitkomst === 'vol')
              zetMelding(
                uitkomst === 'bewaard' && sessie
                  ? `Bewaard: ${duurTekst(sessie.seconden)} geoefend.`
                  : uitkomst === 'vol'
                    ? 'Niet bewaard: de opslag van je browser is vol. De timer staat op pauze; probeer het straks opnieuw.'
                    : 'Nog niets geoefend, dus niets bewaard.',
              )
            }}
          >
            Stop en bewaar
          </button>
        )}
      </div>
      <p className="zacht oefentimer-uitleg">{loopt ? 'Hij loopt door als je naar een onderdeel gaat.' : timer ? 'Gepauzeerd.' : 'Start hem en tik dan op een onderdeel van je routine.'}</p>
      <p role="status" className={melding ? `oefentimer-melding${mislukt ? ' oefentimer-melding-fout' : ''}` : 'verborgen'}>
        {melding}
      </p>
    </section>
  )
}

export default function VandaagPagina() {
  const { voortgang } = useVoortgang()
  const nu = useNu()
  const routine = useRoutine(voortgang, nu)

  return (
    <section className="vandaag">
      <div>
        <h1>Vandaag</h1>
        <p className="zacht vandaag-datum">{datumLang.format(nu)}</p>
      </div>

      <div className="vandaag-cijfers">
        <Kerngetallen streak={streak(voortgang, nu)} vandaag={minutenVandaag(voortgang, nu)} totaal={totaalMinuten(voortgang, nu)} />
        <p className="zacht">{streakZin(voortgang, nu)}</p>
      </div>

      <Oefentimer />

      <section className="vandaag-routine" aria-labelledby="routine-kop">
        <div className="vandaag-routine-kop">
          <h2 id="routine-kop">Je routine</h2>
          <span className="zacht">{routine.minuten} minuten</span>
        </div>
        <ol className="routine-lijst">
          {routine.onderdelen.map((o, i) => (
            <li key={o.soort}>
              <a className="kaart routine-onderdeel" href={naarHash(o.route)}>
                <span className="routine-nummer" aria-hidden="true">
                  {i + 1}
                </span>
                <span className="routine-tekst">
                  <span className="routine-soort">
                    {SOORT[o.soort]} · {o.minuten} min
                  </span>
                  <span className="routine-titel">{o.titel}</span>
                  <span className="routine-uitleg">{o.uitleg}</span>
                </span>
              </a>
            </li>
          ))}
        </ol>
      </section>
    </section>
  )
}
