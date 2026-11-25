import { useEffect, useRef } from 'react'

/** Roept `opVerborgen(performance.now())` aan als de pagina verborgen raakt (scherm uit, ander tabblad), zolang `actief`. */
export function useVerborgen(actief: boolean, opVerborgen: (nu: number) => void) {
  const terug = useRef(opVerborgen)
  useEffect(() => {
    terug.current = opVerborgen
  })

  useEffect(() => {
    if (!actief) return
    const opZichtbaarheid = () => {
      if (document.hidden) terug.current(performance.now())
    }
    document.addEventListener('visibilitychange', opZichtbaarheid)
    return () => document.removeEventListener('visibilitychange', opZichtbaarheid)
  }, [actief])
}
