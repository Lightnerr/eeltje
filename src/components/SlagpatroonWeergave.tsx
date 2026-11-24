import { telLabels } from '../lib/slagpatroon'
import type { Maatsoort, Slag } from '../lib/types'
import './SlagpatroonWeergave.css'

interface Props {
  slagen: Slag[]
  /** De slag die nu klinkt, vanaf 0 binnen de maat. */
  actief?: number | null
  grootte?: 'klein' | 'groot'
  /** Met maatsoort staat eronder hoe je telt (`1 & 2 &`). */
  maatsoort?: Maatsoort
}

const NAMEN: Record<Slag, string> = { D: 'omlaag', U: 'omhoog', '-': 'rust' }

function Pijl({ slag }: { slag: Slag }) {
  if (slag === '-') {
    return (
      <svg viewBox="0 0 24 40" aria-hidden="true">
        <circle cx="12" cy="20" r="3" fill="currentColor" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 40" aria-hidden="true" className={slag === 'U' ? 'pijl-omhoog' : undefined}>
      <path d="M12 4v28M4 24l8 10 8-10" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Het slagpatroon als pijltjes: omlaag, omhoog, of een punt voor een rust. */
export function SlagpatroonWeergave({ slagen, actief = null, grootte = 'klein', maatsoort }: Props) {
  const labels = maatsoort ? telLabels(slagen.length, maatsoort) : []
  return (
    <ol className={`slagpatroon slagpatroon-${grootte}`} aria-label={`Slagpatroon: ${slagen.map((s) => NAMEN[s]).join(', ')}`}>
      {slagen.map((slag, i) => (
        <li key={i} className={['slag', slag === '-' && 'slag-rust', i === actief && 'slag-aan'].filter(Boolean).join(' ')} aria-hidden="true">
          <Pijl slag={slag} />
          {labels.length > 0 && <span className="slag-tel">{labels[i]}</span>}
        </li>
      ))}
    </ol>
  )
}
