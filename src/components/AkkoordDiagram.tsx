import { beschrijfAkkoord, diagramVan, FRETNUMMER_AFSTAND, SNAARNAMEN } from '../lib/diagram'
import type { Akkoord } from '../lib/types'
import './AkkoordDiagram.css'

// Maten in viewBox-eenheden; de grootte zet alleen de breedte in css, zo blijven de verhoudingen gelijk.
const SNAAR = 20
const VAK = 24
const RECHTS = 12
const BOVEN = 26

const y = (vak: number) => BOVEN + (vak - 0.5) * VAK

export function AkkoordDiagram({ akkoord, grootte = 'middel' }: { akkoord: Akkoord; grootte?: 'klein' | 'middel' | 'groot' }) {
  const d = diagramVan(akkoord)
  const x = (snaar: number) => d.ruimteLinks + snaar * SNAAR
  const breedte = d.ruimteLinks + 5 * SNAAR + RECHTS
  const beschrijving = beschrijfAkkoord(akkoord)
  // Klein (bij een liedje) zonder snaarnamen: die zijn altijd hetzelfde, en zo blijft er ruimte voor de rest.
  const snaarnamen = grootte !== 'klein'
  // Klein wordt zo'n 100px breed: grotere stippen en cijfers in verhouding, anders zijn de vingers niet te lezen.
  const stip = grootte === 'klein' ? 9.5 : 8.5
  const onder = BOVEN + d.vakken * VAK
  const hoogte = onder + (snaarnamen ? 22 : 6)

  return (
    <svg className={`akkoord-diagram akkoord-diagram-${grootte}`} viewBox={`0 0 ${breedte} ${hoogte}`} role="img" aria-label={beschrijving}>
      <title>{beschrijving}</title>

      {Array.from({ length: d.vakken + 1 }, (_, i) => (
        <line key={i} className="fret" x1={x(0)} x2={x(5)} y1={BOVEN + i * VAK} y2={BOVEN + i * VAK} />
      ))}
      {d.topkam && <rect className="topkam" x={x(0) - 1} y={BOVEN - 4} width={5 * SNAAR + 2} height={5} rx={1} />}
      {SNAARNAMEN.map((_, s) => (
        <line key={s} className="snaar" x1={x(s)} x2={x(s)} y1={BOVEN} y2={onder} strokeWidth={2 - s * 0.2} />
      ))}

      {d.fretnummer !== null && (
        <text className="fretnummer" x={d.ruimteLinks - FRETNUMMER_AFSTAND} y={y(1)} textAnchor="end" dominantBaseline="central">
          {d.fretnummer}
        </text>
      )}

      {d.boven.map((teken, s) =>
        teken === 'o' ? (
          <circle key={s} className="open" cx={x(s)} cy={BOVEN - 13} r={5} />
        ) : teken === 'x' ? (
          <path key={s} className="dicht" d={`M${x(s) - 4.5} ${BOVEN - 17.5}l9 9m0 -9l-9 9`} />
        ) : null,
      )}

      {d.barres.map((b) => (
        <g key={`${b.vak}-${b.vanSnaar}`}>
          <rect className="stip" x={x(b.vanSnaar) - stip} y={y(b.vak) - stip} width={x(b.totSnaar) - x(b.vanSnaar) + 2 * stip} height={2 * stip} rx={stip} />
          <text className="vinger" x={(x(b.vanSnaar) + x(b.totSnaar)) / 2} y={y(b.vak)} textAnchor="middle" dominantBaseline="central">
            {b.vinger || ''}
          </text>
        </g>
      ))}
      {d.bolletjes.map((b) => (
        <g key={b.snaar}>
          <circle className="stip" cx={x(b.snaar)} cy={y(b.vak)} r={stip} />
          <text className="vinger" x={x(b.snaar)} y={y(b.vak)} textAnchor="middle" dominantBaseline="central">
            {b.vinger || ''}
          </text>
        </g>
      ))}

      {snaarnamen &&
        SNAARNAMEN.map((naam, s) => (
          <text key={s} className="snaarnaam" x={x(s)} y={onder + 15} textAnchor="middle">
            {naam}
          </text>
        ))}
    </svg>
  )
}
