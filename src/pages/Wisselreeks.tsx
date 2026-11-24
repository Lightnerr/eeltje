import { Schermvullend } from '../components/Schermvullend'
import { navigeer } from '../hooks/useRoute'
import type { RouteGegevens } from '../lib/route'

export default function WisselreeksPagina({ akkoorden, bpm }: RouteGegevens<'wisselreeks'>) {
  return (
    <Schermvullend titel="Wisselreeks" onSluit={() => navigeer({ pagina: 'oefenen' })}>
      <p>Drie of vier akkoorden in een vast tempo, zo lang als je het volhoudt. Komt in stap 5.</p>
      {akkoorden && <p className="zacht">Gekozen: {akkoorden.join(' – ')}{bpm ? ` op ${bpm} bpm` : ''}.</p>}
    </Schermvullend>
  )
}
