import type { ReactNode } from 'react'
import './Binnenkort.css'

/** Placeholder voor een scherm dat in een latere stap komt. */
export function Binnenkort({ titel, stap, children }: { titel: string; stap: number; children: ReactNode }) {
  return (
    <section className="binnenkort">
      <h1>{titel}</h1>
      <div className="kaart binnenkort-kaart">
        <p>{children}</p>
        <span className="binnenkort-stap">Komt in stap {stap}</span>
      </div>
    </section>
  )
}
