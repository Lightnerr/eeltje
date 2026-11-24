import { Schermvullend } from '../components/Schermvullend'
import { navigeer } from '../hooks/useRoute'
import type { RouteGegevens } from '../lib/route'

export default function SpiderLadderPagina({ bpm }: RouteGegevens<'spider-ladder'>) {
  return (
    <Schermvullend titel="Spider-ladder" onSluit={() => navigeer({ pagina: 'oefenen' })}>
      <p>Begin laag; na elke ronde die lukte gaat het tempo omhoog. Je hoogste tempo wordt je record. Komt in stap 5.</p>
      {bpm && <p className="zacht">Je begint op {bpm} bpm.</p>}
    </Schermvullend>
  )
}
