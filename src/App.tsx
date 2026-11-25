import { useEffect, useRef } from 'react'
import { NieuweVersie } from './components/NieuweVersie'
import { Tabbalk } from './components/Tabbalk'
import { useNieuweVersie } from './hooks/useNieuweVersie'
import { useRoute } from './hooks/useRoute'
import { tabVan, type Route } from './lib/route'
import AkkoordPagina from './pages/Akkoord'
import AkkoordenPagina from './pages/Akkoorden'
import LiedjePagina from './pages/Liedje'
import LiedjesPagina from './pages/Liedjes'
import MeespelenPagina from './pages/Meespelen'
import MetronoomPagina from './pages/Metronoom'
import NietGevondenPagina from './pages/NietGevonden'
import OefenenPagina from './pages/Oefenen'
import OefeningPagina from './pages/Oefening'
import OneMinuteChangesPagina from './pages/OneMinuteChanges'
import SlagpatroonPagina from './pages/Slagpatroon'
import SpiderLadderPagina from './pages/SpiderLadder'
import VandaagPagina from './pages/Vandaag'
import VoortgangPagina from './pages/Voortgang'
import WisselreeksPagina from './pages/Wisselreeks'

function Pagina({ route }: { route: Route }) {
  switch (route.pagina) {
    case 'vandaag':
      return <VandaagPagina />
    case 'akkoorden':
      return <AkkoordenPagina />
    case 'akkoord':
      return <AkkoordPagina key={route.naam} naam={route.naam} variant={route.variant} />
    case 'liedjes':
      return <LiedjesPagina />
    case 'liedje':
      return <LiedjePagina key={route.id} id={route.id} />
    case 'meespelen':
      return <MeespelenPagina key={route.id} id={route.id} />
    case 'oefenen':
      return <OefenenPagina />
    case 'metronoom':
      return <MetronoomPagina />
    case 'slagpatroon':
      return <SlagpatroonPagina />
    case 'oefening':
      return <OefeningPagina key={route.id} id={route.id} />
    case 'one-minute-changes':
      return <OneMinuteChangesPagina key={`${route.a}|${route.b}`} a={route.a} b={route.b} />
    case 'spider-ladder':
      return <SpiderLadderPagina key={route.bpm} bpm={route.bpm} />
    case 'wisselreeks':
      return <WisselreeksPagina key={`${route.akkoorden?.join(',')}|${route.bpm}`} akkoorden={route.akkoorden} bpm={route.bpm} />
    case 'voortgang':
      return <VoortgangPagina />
    case 'niet-gevonden':
      return <NietGevondenPagina />
  }
}

export default function App() {
  const route = useRoute()
  const versie = useNieuweVersie()
  const inhoud = useRef<HTMLElement>(null)
  const eerste = useRef(true)

  // Na navigatie bovenaan beginnen, en de focus naar de inhoud voor wie met toetsenbord of schermlezer werkt.
  // Een open Schermvullend houdt zelf de focus; dit effect draait na dat van het kind.
  useEffect(() => {
    if (eerste.current) {
      eerste.current = false
      return
    }
    window.scrollTo(0, 0)
    if (!document.querySelector('[aria-modal="true"]')) inhoud.current?.focus({ preventScroll: true })
  }, [route])

  return (
    <>
      <a className="naar-inhoud" href="#inhoud" onClick={(e) => (e.preventDefault(), inhoud.current?.focus())}>
        Naar de inhoud
      </a>
      <Tabbalk actief={tabVan(route)} />
      <main id="inhoud" ref={inhoud} className="app-inhoud" tabIndex={-1}>
        {versie.nieuw && <NieuweVersie herlaad={versie.herlaad} />}
        <Pagina route={route} />
      </main>
    </>
  )
}
