import { useState } from 'react'
import type { Maatsoort, Slag } from '../lib/types'

export interface MetronoomInstelling {
  bpm: number
  maatsoort: Maatsoort
  accent: boolean
  slagen: Slag[]
}

// Alleen in het geheugen: de metronoom en de trainer delen hun tempo, tot je de app sluit. Geen veld in de voortgang.
let onthouden: MetronoomInstelling = { bpm: 80, maatsoort: '4/4', accent: true, slagen: ['D', '-', 'D', 'U', '-', 'U', 'D', 'U'] }

export function useMetronoomInstelling(): [MetronoomInstelling, (wijziging: Partial<MetronoomInstelling>) => void] {
  const [instelling, zet] = useState(onthouden)
  const wijzig = (wijziging: Partial<MetronoomInstelling>) => {
    onthouden = { ...onthouden, ...wijziging }
    zet(onthouden)
  }
  return [instelling, wijzig]
}
