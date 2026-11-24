import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useWakeLock } from '../hooks/useWakeLock'
import './Schermvullend.css'

/**
 * Bedekt het hele scherm (meespelen, challenges), sluit met Escape of de sluitknop en houdt het scherm wakker.
 * Staat via een portal direct in <body>; de rest van de pagina is zolang `inert`, zodat Tab en schermlezers binnen blijven.
 */
const FOCUSBAAR = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function houdFocusBinnen(e: KeyboardEvent, paneel: HTMLElement) {
  const focusbaar = [...paneel.querySelectorAll<HTMLElement>(FOCUSBAAR)]
  if (focusbaar.length === 0) return
  const eerste = focusbaar[0]
  const laatste = focusbaar[focusbaar.length - 1]
  const binnen = paneel.contains(document.activeElement)
  if (e.shiftKey && (!binnen || document.activeElement === eerste)) {
    e.preventDefault()
    laatste.focus()
  } else if (!e.shiftKey && (!binnen || document.activeElement === laatste)) {
    e.preventDefault()
    eerste.focus()
  }
}

export function Schermvullend({ titel, onSluit, children }: { titel?: string; onSluit: () => void; children: ReactNode }) {
  const paneel = useRef<HTMLDivElement>(null)
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
    const achtergrond = [...document.body.children].filter((el): el is HTMLElement => el instanceof HTMLElement && el !== paneel.current && !el.inert)
    for (const el of achtergrond) el.inert = true
    sluitknop.current?.focus()
    const opToets = (e: KeyboardEvent) => {
      if (e.key === 'Escape') sluit.current()
      if (e.key === 'Tab' && paneel.current) houdFocusBinnen(e, paneel.current)
    }
    document.addEventListener('keydown', opToets)
    return () => {
      document.removeEventListener('keydown', opToets)
      document.body.style.overflow = vorigeOverflow
      for (const el of achtergrond) el.inert = false
      vorigeFocus?.focus?.()
    }
  }, [])

  return createPortal(
    <div ref={paneel} className="schermvullend" role="dialog" aria-modal="true" aria-label={titel ?? 'Schermvullend'}>
      <div className="schermvullend-kop">
        {titel && <h1>{titel}</h1>}
        <button ref={sluitknop} type="button" className="knop knop-rustig schermvullend-sluit" onClick={onSluit} aria-label="Sluiten">
          ×
        </button>
      </div>
      <div className="schermvullend-inhoud">{children}</div>
    </div>,
    document.body,
  )
}
