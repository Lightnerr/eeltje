import { useEffect, useRef, useState } from 'react'
import { maakMetronoom, type Metronoom } from '../audio/metronoom'
import type { Maatsoort } from '../lib/types'

interface Instelling {
  bpm: number
  maatsoort: Maatsoort
  accent?: boolean
  onderverdeling?: number
  /** Per tel, naast de state `tel`: elke tel komt door, ook als React renders samenvoegt (verborgen tabblad). */
  opTel?: (tel: number) => void
}

/**
 * Een metronoom voor een scherm: `tel` en `slag` lichten op als ze klinken, en zijn `null` als hij stilstaat.
 * Wijzigingen in de instelling gaan direct door; bij het verlaten van het scherm stopt hij.
 */
export function useMetronoom({ bpm, maatsoort, accent = true, onderverdeling = 1, opTel }: Instelling) {
  const [loopt, zetLoopt] = useState(false)
  const [tel, zetTel] = useState<number | null>(null)
  const [slag, zetSlag] = useState<number | null>(null)
  const ref = useRef<Metronoom | null>(null)
  const opTelRef = useRef(opTel)

  useEffect(() => {
    opTelRef.current = opTel
  }, [opTel])

  function metronoom(): Metronoom {
    ref.current ??= maakMetronoom({ bpm, maatsoort, accent, onderverdeling, opTel: (t) => (zetTel(t), opTelRef.current?.(t)), opSlag: zetSlag })
    return ref.current
  }

  useEffect(() => ref.current?.zetBpm(bpm), [bpm])
  useEffect(() => ref.current?.zetMaatsoort(maatsoort), [maatsoort])
  useEffect(() => ref.current?.zetAccent(accent), [accent])
  useEffect(() => ref.current?.zetOnderverdeling(onderverdeling), [onderverdeling])
  useEffect(() => () => ref.current?.stop(), [])

  function start() {
    metronoom().start()
    zetLoopt(true)
  }

  function stop() {
    ref.current?.stop()
    zetLoopt(false)
    zetTel(null)
    zetSlag(null)
  }

  return { loopt, tel, slag, start, stop, wissel: () => (loopt ? stop() : start()) }
}
