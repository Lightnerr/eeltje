import { Schermvullend } from '../components/Schermvullend'
import { zoekLiedje } from '../data'
import { navigeer } from '../hooks/useRoute'
import type { RouteGegevens } from '../lib/route'
import NietGevondenPagina from './NietGevonden'

export default function MeespelenPagina({ id }: RouteGegevens<'meespelen'>) {
  const liedje = zoekLiedje(id)
  if (!liedje) return <NietGevondenPagina wat="Dit liedje" />
  return (
    <Schermvullend titel={liedje.titel} onSluit={() => navigeer({ pagina: 'liedje', id })}>
      <p>Meespelen komt in stap 4: aftellen, metronoom, de huidige maat licht op en het volgende akkoord staat klaar.</p>
    </Schermvullend>
  )
}
