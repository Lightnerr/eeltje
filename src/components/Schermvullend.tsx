import { useEffect, useRef, type ReactNode } from 'react'
import { useWakeLock } from '../hooks/useWakeLock'
import './Schermvullend.css'

/** Bedekt het hele scherm (meespelen, challenges), sluit met Escape of de sluitknop en houdt het scherm wakker. */
export function Schermvullend({ titel, onSluit, children }: { titel?: string; onSluit: () => void; children: ReactNode }) {
  const sluitknop = useRef<HTMLButtonElement>(null)
  const sluit = useRef(onSluit)
  useWakeLock(true)

  useEffect(() => {
    sluit.current = onSluit
  }, [onSluit])

  useEffect(() => {
    const vorigeFocus = document.activeElement as HTMLElement | null
    const vorigeOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    sluitknop.current?.focus()
    const opToets = (e: KeyboardEvent) => {
      if (e.key === 'Escape') sluit.current()
    }
    document.addEventListener('keydown', opToets)
    return () => {
      document.removeEventListener('keydown', opToets)
      document.body.style.overflow = vorigeOverflow
      vorigeFocus?.focus?.()
    }
  }, [])

  return (
    <div className="schermvullend" role="dialog" aria-modal="true" aria-label={titel ?? 'Schermvullend'}>
      <div className="schermvullend-kop">
        {titel && <h1>{titel}</h1>}
        <button ref={sluitknop} type="button" className="knop knop-rustig schermvullend-sluit" onClick={onSluit} aria-label="Sluiten">
          ×
        </button>
      </div>
      <div className="schermvullend-inhoud">{children}</div>
    </div>
  )
}
