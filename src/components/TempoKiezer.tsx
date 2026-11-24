import { useRef, useState } from 'react'
import { MAX_BPM, MIN_BPM, begrensBpm, tapTempo, voegTikToe } from '../lib/metronoom'
import type { Maatsoort } from '../lib/types'
import './TempoKiezer.css'

const MAATSOORTEN: Maatsoort[] = ['2/4', '3/4', '4/4', '6/8']
const STAPPEN = [-5, -1, 1, 5]

interface Props {
  bpm: number
  maatsoort: Maatsoort
  onBpm: (bpm: number) => void
  onMaatsoort: (maatsoort: Maatsoort) => void
}

/** Tempo (knoppen, schuif en tap tempo) en maatsoort. */
export function TempoKiezer({ bpm, maatsoort, onBpm, onMaatsoort }: Props) {
  const tikken = useRef<number[]>([])
  const [wachtOpTik, zetWachtOpTik] = useState(false)

  function tik() {
    tikken.current = voegTikToe(tikken.current, performance.now())
    const tempo = tapTempo(tikken.current)
    zetWachtOpTik(tempo === null)
    if (tempo !== null) onBpm(tempo)
  }

  return (
    <div className="tempo-kiezer">
      <div className="tempo-kiezer-rij">
        <output className="tempo-kiezer-bpm" htmlFor="tempo-schuif" aria-live="polite">
          <span>{bpm}</span> bpm
        </output>
        {maatsoort === '6/8' && <span className="zacht tempo-kiezer-uitleg">in achtsten</span>}
      </div>
      <input
        id="tempo-schuif"
        className="tempo-kiezer-schuif"
        type="range"
        min={MIN_BPM}
        max={MAX_BPM}
        value={bpm}
        aria-label="Tempo in bpm"
        onChange={(e) => onBpm(begrensBpm(Number(e.target.value)))}
      />
      <div className="tempo-kiezer-knoppen">
        {STAPPEN.map((stap) => (
          <button
            key={stap}
            type="button"
            className="knop knop-rustig"
            aria-label={`${stap > 0 ? 'Sneller' : 'Langzamer'}: ${Math.abs(stap)} bpm`}
            disabled={(stap < 0 && bpm <= MIN_BPM) || (stap > 0 && bpm >= MAX_BPM)}
            onClick={() => onBpm(begrensBpm(bpm + stap))}
          >
            {stap > 0 ? `+${stap}` : `−${-stap}`}
          </button>
        ))}
      </div>
      <button type="button" className="knop knop-rustig tempo-kiezer-tap" onClick={tik}>
        {wachtOpTik ? 'En nog een keer' : 'Tik het tempo'}
      </button>
      <fieldset className="tempo-kiezer-maatsoort">
        <legend>Maatsoort</legend>
        <div className="tempo-kiezer-knoppen">
          {MAATSOORTEN.map((m) => (
            <button
              key={m}
              type="button"
              className={`knop ${m === maatsoort ? '' : 'knop-rustig'}`}
              aria-pressed={m === maatsoort}
              onClick={() => onMaatsoort(m)}
            >
              {m}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  )
}
