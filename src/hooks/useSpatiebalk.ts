import { useEffect, useRef, type RefObject } from 'react'

const INTERACTIEF = 'button, a[href], input, select, textarea, summary, [contenteditable], [role="button"], [role="slider"]'

/**
 * De spatiebalk doet hetzelfde als `knop`. Staat de focus op een andere knop of een invoer, dan blijft de spatie
 * van hen, anders telt één druk dubbel of mis je hem. Op de knop zelf voorkomen we de klik die de browser bij het
 * loslaten geeft, zodat één druk één tik is. De pagina scrolt niet. Een ingehouden Enter op de knop klikt maar één
 * keer: de herhaalde toetsen gaan niet door.
 */
export function useSpatiebalk(actief: boolean, knop: RefObject<HTMLElement | null>, opTik: () => void) {
  const tik = useRef(opTik)
  useEffect(() => {
    tik.current = opTik
  })

  useEffect(() => {
    if (!actief) return
    const voorOns = (e: KeyboardEvent) => {
      if (e.code !== 'Space' && e.key !== ' ') return false
      if (e.ctrlKey || e.metaKey || e.altKey) return false
      const doel = e.target instanceof Element ? e.target : null
      return !doel || doel === knop.current || !doel.closest(INTERACTIEF)
    }
    const neer = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && e.repeat && e.target === knop.current) e.preventDefault()
      if (!voorOns(e)) return
      e.preventDefault()
      if (!e.repeat) tik.current()
    }
    const op = (e: KeyboardEvent) => {
      if (voorOns(e)) e.preventDefault()
    }
    document.addEventListener('keydown', neer)
    document.addEventListener('keyup', op)
    return () => {
      document.removeEventListener('keydown', neer)
      document.removeEventListener('keyup', op)
    }
  }, [actief, knop])
}
