import { useState } from 'react'
import { useKlok } from './useKlok'

/**
 * De tijd voor streak en minuten, elke seconde bijgewerkt. Met een tijd van bij het openen zou een sessie die je
 * daarna begon "in de toekomst" liggen en niet meetellen (sessies na `nu` tellen niet).
 */
export function useNu(): Date {
  const [nu, zetNu] = useState(() => new Date())
  useKlok(true, 1000, () => zetNu(new Date()))
  return nu
}
