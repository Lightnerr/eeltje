import { Schermvullend } from '../components/Schermvullend'
import { navigeer } from '../hooks/useRoute'
import type { RouteGegevens } from '../lib/route'

export default function OneMinuteChangesPagina({ a, b }: RouteGegevens<'one-minute-changes'>) {
  return (
    <Schermvullend titel="One minute changes" onSluit={() => navigeer({ pagina: 'oefenen' })}>
      <p>Kies twee akkoorden en wissel 60 seconden zo vaak als je kunt. Elke wissel is een tik op de grote knop of de spatiebalk. Komt in stap 5.</p>
      {a && b && <p className="zacht">Gekozen: {a} en {b}.</p>}
    </Schermvullend>
  )
}
