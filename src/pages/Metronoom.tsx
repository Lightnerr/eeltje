import { TelWeergave } from '../components/TelWeergave'
import { TempoKiezer } from '../components/TempoKiezer'
import { useMetronoom } from '../hooks/useMetronoom'
import { useMetronoomInstelling } from '../hooks/useMetronoomInstelling'
import { useWakeLock } from '../hooks/useWakeLock'
import { leesMaatsoort } from '../lib/muziek'
import { naarHash } from '../lib/route'
import './Metronoom.css'

export default function MetronoomPagina() {
  const [instelling, wijzig] = useMetronoomInstelling()
  const { bpm, maatsoort, accent } = instelling
  const metronoom = useMetronoom({ bpm, maatsoort, accent })
  useWakeLock(metronoom.loopt)

  return (
    <section className="metronoom">
      <h1>Metronoom</h1>
      <div className="kaart metronoom-speler">
        <TelWeergave tellen={leesMaatsoort(maatsoort).tellen} tel={metronoom.tel} accent={accent} />
        <button type="button" className="knop metronoom-start" onClick={metronoom.wissel}>
          {metronoom.loopt ? 'Stop' : 'Start'}
        </button>
        <label className="metronoom-accent">
          <input type="checkbox" checked={accent} onChange={(e) => wijzig({ accent: e.target.checked })} />
          Accent op de 1
        </label>
      </div>
      <div className="kaart">
        <TempoKiezer bpm={bpm} maatsoort={maatsoort} onBpm={(b) => wijzig({ bpm: b })} onMaatsoort={(m) => wijzig({ maatsoort: m })} />
      </div>
      <p className="zacht">
        Tip: zet hem eerst langzaam en speel pas sneller als het een paar keer foutloos ging. Op het slagpatroon oefenen? Dat kan in de{' '}
        <a href={naarHash({ pagina: 'slagpatroon' })}>slagpatroon-trainer</a>.
      </p>
    </section>
  )
}
