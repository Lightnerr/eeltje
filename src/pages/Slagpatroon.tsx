import { SlagpatroonWeergave } from '../components/SlagpatroonWeergave'
import { TempoKiezer } from '../components/TempoKiezer'
import { liedjes } from '../data'
import { useMetronoom } from '../hooks/useMetronoom'
import { useMetronoomInstelling } from '../hooks/useMetronoomInstelling'
import { useWakeLock } from '../hooks/useWakeLock'
import { slagenPerTel } from '../lib/muziek'
import { ontwerpStatus, slagpatroonKeuzes } from '../lib/slagpatroon'
import type { Maatsoort, Slag } from '../lib/types'
import './Slagpatroon.css'

const KNOPPEN: { slag: Slag; tekst: string }[] = [
  { slag: 'D', tekst: '↓ Omlaag' },
  { slag: 'U', tekst: '↑ Omhoog' },
  { slag: '-', tekst: 'Rust' },
]

export default function SlagpatroonPagina() {
  const [instelling, wijzig] = useMetronoomInstelling()
  const { bpm, maatsoort, slagen } = instelling
  const status = ontwerpStatus(slagen.length, maatsoort)
  const metronoom = useMetronoom({ bpm, maatsoort, onderverdeling: status.past ? slagenPerTel(slagen.length, maatsoort) : 1 })
  useWakeLock(metronoom.loopt)
  const keuzes = slagpatroonKeuzes(maatsoort, liedjes)
  const tekst = slagen.join(' ')

  function kiesMaatsoort(m: Maatsoort) {
    wijzig(ontwerpStatus(slagen.length, m).past ? { maatsoort: m } : { maatsoort: m, slagen: slagpatroonKeuzes(m, [])[0].slagen })
  }

  return (
    <section className="slagpatroon-pagina">
      <h1>Slagpatroon</h1>
      <div className="kaart slagpatroon-speler">
        {slagen.length > 0 ? (
          <SlagpatroonWeergave slagen={slagen} actief={status.past ? metronoom.slag : null} grootte="groot" maatsoort={maatsoort} />
        ) : (
          <p className="zacht slagpatroon-leeg">Nog geen slagen. Maak hieronder een patroon.</p>
        )}
        <p className="slagpatroon-status" aria-live="polite">
          {status.past
            ? `Past in ${maatsoort}.`
            : `Nog ${status.nogNodig} ${status.nogNodig === 1 ? 'slag' : 'slagen'} voor een maat in ${maatsoort}.`}
        </p>
        <button type="button" className="knop slagpatroon-start" onClick={metronoom.wissel}>
          {metronoom.loopt ? 'Stop' : 'Start'}
        </button>
      </div>

      <div className="kaart slagpatroon-ontwerp">
        <h2>Zelf maken</h2>
        <p className="zacht">Tik de slagen van één maat. In {maatsoort} past een slag per tel{maatsoort === '6/8' ? '' : ' of twee per tel'}.</p>
        <div className="slagpatroon-knoppen">
          {KNOPPEN.map((k) => (
            <button key={k.slag} type="button" className="knop" disabled={status.vol} onClick={() => wijzig({ slagen: [...slagen, k.slag] })}>
              {k.tekst}
            </button>
          ))}
        </div>
        {status.vol && <p className="zacht">De maat is vol. Haal een slag weg of begin opnieuw.</p>}
        <div className="slagpatroon-knoppen slagpatroon-knoppen-wis">
          <button type="button" className="knop knop-rustig" disabled={slagen.length === 0} onClick={() => wijzig({ slagen: slagen.slice(0, -1) })}>
            Laatste weg
          </button>
          <button type="button" className="knop knop-rustig" disabled={slagen.length === 0} onClick={() => wijzig({ slagen: [] })}>
            Begin opnieuw
          </button>
        </div>
      </div>

      <div className="kaart">
        <TempoKiezer bpm={bpm} maatsoort={maatsoort} onBpm={(b) => wijzig({ bpm: b })} onMaatsoort={kiesMaatsoort} />
      </div>

      <div className="slagpatroon-keuzes">
        <h2>Kies een patroon in {maatsoort}</h2>
        <ul>
          {keuzes.map((k) => {
            const gekozen = k.slagen.join(' ') === tekst
            return (
              <li key={k.naam}>
                <button type="button" className="kaart slagpatroon-keuze" aria-pressed={gekozen} onClick={() => wijzig({ slagen: k.slagen })}>
                  <span className="slagpatroon-keuze-naam">{k.naam}</span>
                  <SlagpatroonWeergave slagen={k.slagen} />
                  {k.liedjes.length > 0 && <span className="zacht slagpatroon-keuze-liedjes">{k.liedjes.join(', ')}</span>}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
