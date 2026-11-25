import { useEffect, useRef, type ReactNode } from 'react'
import { beoordeel, resultaatTekst } from '../lib/challenges'
import type { ChallengeResultaat } from '../lib/types'
import './ChallengeUitslag.css'

interface Props {
  /** `null` als er niets is opgeslagen. */
  resultaat: Omit<ChallengeResultaat, 'datum'> | null
  /** Het record van vóór deze poging. */
  vorigRecord: ChallengeResultaat | null
  /** Wat er staat als er niets is opgeslagen. */
  leeg: string
  children: ReactNode
}

function Oordeel({ waarde, vorigRecord }: { waarde: number; vorigRecord: ChallengeResultaat | null }) {
  switch (beoordeel(waarde, vorigRecord)) {
    case 'eerste':
      return <p>Je eerste record. Nu weet je waar je staat.</p>
    case 'nieuw-record':
      return (
        <>
          <p className="challenge-uitslag-record">Nieuw record!</p>
          <p className="zacht">Je vorige record was {resultaatTekst(vorigRecord!)}.</p>
        </>
      )
    case 'evenaard':
      return <p>Precies je record. Volgende keer eentje meer?</p>
    case 'onder-record':
      return <p className="zacht">Je record is {resultaatTekst(vorigRecord!)}.</p>
  }
}

/** Wat het werd en hoe het zich verhoudt tot je record. Krijgt de focus, zodat een schermlezer het meteen voorleest. */
export function ChallengeUitslag({ resultaat, vorigRecord, leeg, children }: Props) {
  const kop = useRef<HTMLHeadingElement>(null)
  useEffect(() => kop.current?.focus(), [])

  return (
    <div className="challenge-uitslag">
      <h2 ref={kop} tabIndex={-1}>
        {resultaat ? resultaatTekst(resultaat) : 'Klaar'}
      </h2>
      {resultaat ? <Oordeel waarde={resultaat.waarde} vorigRecord={vorigRecord} /> : <p className="zacht">{leeg}</p>}
      <div className="challenge-uitslag-knoppen">{children}</div>
    </div>
  )
}

/** "Record: 31 wissels", of dat er nog geen is. */
export function RecordRegel({ record, geen = 'Nog geen record' }: { record: ChallengeResultaat | null; geen?: string }) {
  return <p className="challenge-record">{record ? <>Record: <strong>{resultaatTekst(record)}</strong></> : geen}</p>
}

/** De challenge stopte omdat het scherm uit ging of je naar een ander tabblad ging; er is niets opgeslagen. */
export function ChallengeOnderbroken({ onOpnieuw }: { onOpnieuw: () => void }) {
  const kop = useRef<HTMLHeadingElement>(null)
  useEffect(() => kop.current?.focus(), [])

  return (
    <div className="challenge-uitslag">
      <h2 ref={kop} tabIndex={-1} className="challenge-onderbroken">
        Gestopt omdat je scherm uit ging
      </h2>
      <p className="zacht">Wat je in die tijd speelde, kon ik niet tellen. Er is niets opgeslagen.</p>
      <div className="challenge-uitslag-knoppen">
        <button type="button" className="knop" onClick={onOpnieuw}>
          Opnieuw starten
        </button>
      </div>
    </div>
  )
}
