import { Binnenkort } from '../components/Binnenkort'
import { zoekLiedje } from '../data'
import type { RouteGegevens } from '../lib/route'
import NietGevondenPagina from './NietGevonden'

export default function LiedjePagina({ id }: RouteGegevens<'liedje'>) {
  const liedje = zoekLiedje(id)
  if (!liedje) return <NietGevondenPagina wat="Dit liedje" />
  return (
    <Binnenkort titel={liedje.titel} stap={4}>
      {liedje.artiest}. Hier komen straks het schema per maat, de akkoorden als diagram, het slagpatroon en de meespeelmodus.
    </Binnenkort>
  )
}
