import { Binnenkort } from '../components/Binnenkort'
import { zoekOefening } from '../data'
import type { RouteGegevens } from '../lib/route'
import NietGevondenPagina from './NietGevonden'

export default function OefeningPagina({ id }: RouteGegevens<'oefening'>) {
  const oefening = zoekOefening(id)
  if (!oefening) return <NietGevondenPagina wat="Deze oefening" />
  return (
    <Binnenkort titel={oefening.titel} stap={5}>
      {oefening.doel} Hier komen straks de stappen, het tabje en de metronoom op {oefening.standaardtempo} bpm.
    </Binnenkort>
  )
}
