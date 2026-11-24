import { useEffect, useRef } from 'react'

/** Roept `opTijd(performance.now())` elke `ms` aan zolang `actief` waar is. Rekenen doe je met die tijd, niet met het aantal keren. */
export function useKlok(actief: boolean, ms: number, opTijd: (nu: number) => void) {
  const terug = useRef(opTijd)
  useEffect(() => {
    terug.current = opTijd
  })

  useEffect(() => {
    if (!actief) return
    const stap = () => terug.current(performance.now())
    stap()
    const timer = setInterval(stap, ms)
    // Terug uit de achtergrond: meteen bijwerken in plaats van op de volgende tik te wachten.
    document.addEventListener('visibilitychange', stap)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', stap)
    }
  }, [actief, ms])
}
