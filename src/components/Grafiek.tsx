import { useEffect, useRef, useState, type RefObject } from 'react'
import { beschrijfGrafiek, indeling, labelIndices, puntLabel, type GrafiekPunt, type GrafiekSoort, type Maten } from '../lib/grafiek'
import './Grafiek.css'

export type { GrafiekPunt, GrafiekSoort }

interface Props {
  punten: readonly GrafiekPunt[]
  soort: GrafiekSoort
  eenheid?: string
  titel: string
}

const HOOGTE = 180
const RUIMTE_PER_LABEL = 56

/** Het svg krijgt de echte breedte als viewBox, zodat letters op elk scherm even groot blijven. */
function useBreedte<T extends Element>(): [RefObject<T | null>, number] {
  const ref = useRef<T>(null)
  const [breedte, zetBreedte] = useState(320)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const waarnemer = new ResizeObserver(([e]) => zetBreedte(Math.max(200, Math.round(e.contentRect.width))))
    waarnemer.observe(el)
    return () => waarnemer.disconnect()
  }, [])
  return [ref, breedte]
}

export function Grafiek({ punten, soort, eenheid, titel }: Props) {
  const [ref, breedte] = useBreedte<HTMLDivElement>()
  const maten: Maten = { breedte, hoogte: HOOGTE, links: 40, rechts: 12, boven: 12, onder: 32 }
  const { ticks, punten: posities, staafBreedte, onderkant } = indeling(
    punten.map((p) => p.y),
    soort,
    maten,
  )
  const labels = new Set(labelIndices(punten.length, Math.floor((breedte - maten.links - maten.rechts) / RUIMTE_PER_LABEL)))
  const beschrijving = beschrijfGrafiek(titel, punten, eenheid)

  return (
    <figure className="grafiek">
      <figcaption className="grafiek-titel">
        {titel}
        {eenheid && <span className="zacht"> ({eenheid})</span>}
      </figcaption>
      <div ref={ref} className="grafiek-vlak">
        {punten.length === 0 ? (
          <p className="zacht grafiek-leeg">Nog niets om te laten zien.</p>
        ) : (
          <svg viewBox={`0 0 ${breedte} ${HOOGTE}`} role="img" aria-label={beschrijving}>
            <title>{beschrijving}</title>
            {ticks.map((t) => (
              <g key={t.waarde}>
                <line className="grafiek-hulplijn" x1={maten.links} x2={breedte - maten.rechts} y1={t.y} y2={t.y} />
                <text className="grafiek-tick" x={maten.links - 8} y={t.y} textAnchor="end" dominantBaseline="middle">
                  {t.waarde}
                </text>
              </g>
            ))}
            <line className="grafiek-as" x1={maten.links} x2={breedte - maten.rechts} y1={onderkant} y2={onderkant} />
            {soort === 'staaf' ? (
              posities.map((p, i) => (
                <rect
                  key={i}
                  className="grafiek-staaf"
                  x={p.x - staafBreedte / 2}
                  y={p.y}
                  width={staafBreedte}
                  height={onderkant - p.y}
                  rx={Math.min(4, staafBreedte / 4)}
                />
              ))
            ) : (
              <>
                {posities.length > 1 && <polyline className="grafiek-lijn" points={posities.map((p) => `${p.x},${p.y}`).join(' ')} />}
                {posities.map((p, i) => (
                  <circle key={i} className="grafiek-punt" cx={p.x} cy={p.y} r={4} />
                ))}
              </>
            )}
            {posities.map((p, i) =>
              labels.has(i) ? (
                <text key={i} className="grafiek-label" x={p.x} y={onderkant + 20} textAnchor="middle">
                  {puntLabel(punten[i])}
                </text>
              ) : null,
            )}
          </svg>
        )}
      </div>
    </figure>
  )
}
