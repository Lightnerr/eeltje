import { useState } from 'react'
import { SlagpatroonWeergave } from '../components/SlagpatroonWeergave'
import { TelWeergave } from '../components/TelWeergave'
import { TempoKiezer } from '../components/TempoKiezer'
import { zoekOefening } from '../data'
import { useMetronoom } from '../hooks/useMetronoom'
import { useWakeLock } from '../hooks/useWakeLock'
import { leesMaatsoort, leesSlagpatroon, slagenPerTel } from '../lib/muziek'
import { naarHash, type Route, type RouteGegevens } from '../lib/route'
import type { Oefening } from '../lib/types'
import NietGevondenPagina from './NietGevonden'
import './Oefening.css'

// Een oefening die een challenge heeft, linkt ernaar.
const CHALLENGE: Record<string, { route: Route; titel: string }> = {
  spider: { route: { pagina: 'spider-ladder' }, titel: 'Spider-ladder' },
  akkoordwissels: { route: { pagina: 'one-minute-changes' }, titel: 'One minute changes' },
}

function Metronoom({ oefening }: { oefening: Oefening }) {
  const [bpm, zetBpm] = useState(oefening.standaardtempo)
  const maatsoort = oefening.maatsoort ?? '4/4'
  const slagen = oefening.slagpatroon ? leesSlagpatroon(oefening.slagpatroon) : null
  const metronoom = useMetronoom({ bpm, maatsoort, onderverdeling: slagen ? slagenPerTel(slagen.length, maatsoort) : 1 })
  useWakeLock(metronoom.loopt)

  return (
    <div className="kaart oefening-metronoom">
      <h2>Metronoom</h2>
      <TelWeergave tellen={leesMaatsoort(maatsoort).tellen} tel={metronoom.tel} />
      {slagen && <SlagpatroonWeergave slagen={slagen} actief={metronoom.slag} maatsoort={maatsoort} />}
      <button type="button" className="knop oefening-start" onClick={metronoom.wissel}>
        {metronoom.loopt ? 'Stop' : 'Start'}
      </button>
      <TempoKiezer bpm={bpm} maatsoort={maatsoort} onBpm={zetBpm} />
      {bpm !== oefening.standaardtempo && (
        <button type="button" className="knop knop-rustig" onClick={() => zetBpm(oefening.standaardtempo)}>
          Terug naar {oefening.standaardtempo} bpm
        </button>
      )}
    </div>
  )
}

export default function OefeningPagina({ id }: RouteGegevens<'oefening'>) {
  const oefening = zoekOefening(id)
  if (!oefening) return <NietGevondenPagina wat="Deze oefening" />
  const challenge = CHALLENGE[oefening.id]

  return (
    <section className="oefening">
      <a className="oefening-terug" href={naarHash({ pagina: 'oefenen' })}>
        ‹ Oefenen
      </a>
      <h1>{oefening.titel}</h1>
      <p className="oefening-doel">{oefening.doel}</p>

      <div className="oefening-hoofd">
        <div className="oefening-uitleg">
          <h2>Zo doe je het</h2>
          <ol className="oefening-stappen">
            {oefening.stappen.map((stap) => (
              <li key={stap}>{stap}</li>
            ))}
          </ol>
          {oefening.tab && (
            <figure className="oefening-tab">
              <pre tabIndex={0} aria-label="Tabje, hoge e bovenaan">{oefening.tab.join('\n')}</pre>
            </figure>
          )}
          {challenge && (
            <p>
              Gaat het goed? Probeer de <a href={naarHash(challenge.route)}>{challenge.titel}</a> en zet een record neer.
            </p>
          )}
        </div>
        <Metronoom oefening={oefening} />
      </div>
    </section>
  )
}
