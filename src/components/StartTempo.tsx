import { MAX_BPM, MIN_BPM, begrensBpm } from '../lib/metronoom'
import './StartTempo.css'

const STAP = 5

/** Het tempo waarop een challenge begint, met grote knoppen van 5 bpm. */
export function StartTempo({ bpm, onBpm, tekst = 'Tempo' }: { bpm: number; onBpm: (bpm: number) => void; tekst?: string }) {
  return (
    <div className="start-tempo">
      <button type="button" className="knop knop-rustig" aria-label={`Langzamer: ${STAP} bpm`} disabled={bpm <= MIN_BPM} onClick={() => onBpm(begrensBpm(bpm - STAP))}>
        −{STAP}
      </button>
      <output aria-live="polite">
        <span className="zacht">{tekst}</span> <span className="start-tempo-bpm"><strong>{bpm}</strong> bpm</span>
      </output>
      <button type="button" className="knop knop-rustig" aria-label={`Sneller: ${STAP} bpm`} disabled={bpm >= MAX_BPM} onClick={() => onBpm(begrensBpm(bpm + STAP))}>
        +{STAP}
      </button>
    </div>
  )
}
