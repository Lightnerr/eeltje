import { Binnenkort } from '../components/Binnenkort'
import { zoekAkkoord } from '../data'
import type { RouteGegevens } from '../lib/route'
import NietGevondenPagina from './NietGevonden'

export default function AkkoordPagina({ naam, variant }: RouteGegevens<'akkoord'>) {
  const akkoord = zoekAkkoord(naam, variant)
  if (!akkoord) return <NietGevondenPagina wat={`Het akkoord ${naam}`} />
  return (
    <Binnenkort titel={akkoord.naam} stap={2}>
      Hier zie je straks het grote diagram van {akkoord.naam} ({akkoord.titel.toLowerCase()}), hoor je hoe het klinkt, kies je een
      variant en zet je je status.
    </Binnenkort>
  )
}
