import { useEffect } from 'react'
import { slaAan, stopGitaar, tokkel } from '../audio/gitaar'
import { AkkoordDiagram } from '../components/AkkoordDiagram'
import { akkoorden, variantenVan, zoekAkkoord } from '../data'
import { useVoortgang } from '../hooks/useVoortgang'
import { gekozenVariant, STATUSLABEL } from '../lib/akkoorden'
import { naarHash, type RouteGegevens } from '../lib/route'
import { STATUSSEN, statusVan, zetStatus, zetVoorkeurVariant } from '../lib/voortgang'
import NietGevondenPagina from './NietGevonden'
import './Akkoord.css'

export default function AkkoordPagina({ naam, variant }: RouteGegevens<'akkoord'>) {
  const { voortgang, wijzig } = useVoortgang()
  useEffect(() => stopGitaar, [])

  const gekozen = gekozenVariant(akkoorden, voortgang, naam)
  const akkoord = variant === undefined ? gekozen : zoekAkkoord(naam, variant)
  if (!akkoord || !gekozen) return <NietGevondenPagina wat={`Het akkoord ${naam}`} />

  const varianten = variantenVan(naam)
  const status = statusVan(voortgang, naam)
  const isVoorkeur = (v: string) => gekozen.variant === v

  return (
    <section className="akkoord">
      <a className="akkoord-terug" href={naarHash({ pagina: 'akkoorden' })}>
        ‹ Alle akkoorden
      </a>
      <div className="akkoord-kop">
        <h1>{akkoord.naam}</h1>
        {varianten.length > 1 && <p className="zacht">{akkoord.titel}</p>}
      </div>

      <div className="akkoord-hoofd">
        <div className="kaart akkoord-groot">
          <AkkoordDiagram akkoord={akkoord} grootte="groot" />
        </div>
        <div className="akkoord-zijkant">
          {akkoord.omschrijving && <p>{akkoord.omschrijving}</p>}
          <div className="akkoord-afspelen">
            <button type="button" className="knop" onClick={() => slaAan(akkoord)}>
              Aanslaan
            </button>
            <button type="button" className="knop knop-rustig" onClick={() => tokkel(akkoord)}>
              Per snaar
            </button>
          </div>

          <fieldset className="akkoord-status">
            <legend>Hoe ver ben je met {naam}?</legend>
            <div className="akkoord-status-keuzes">
              {STATUSSEN.map((s) => (
                <label key={s} className={`akkoord-status-keuze akkoord-status-${s.replace(' ', '-')}`}>
                  <input type="radio" name="status" checked={status === s} onChange={() => wijzig((v) => zetStatus(v, naam, s))} />
                  {STATUSLABEL[s]}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </div>

      {varianten.length > 1 && (
        <div className="akkoord-varianten">
          <h2>Varianten</h2>
          <p className="zacht">De variant die je kiest, zie je in het overzicht en straks bij de liedjes.</p>
          <ul>
            {varianten.map((v) => (
              <li key={v.variant} className={`kaart akkoord-variant${v.variant === akkoord.variant ? ' akkoord-variant-getoond' : ''}`}>
                <a href={naarHash({ pagina: 'akkoord', naam, variant: v.variant })} aria-current={v.variant === akkoord.variant ? 'true' : undefined}>
                  <AkkoordDiagram akkoord={v} grootte="klein" />
                  <strong>{v.titel}</strong>
                  {v.standaard && v.titel !== 'Standaard' && <span className="zacht akkoord-variant-noot">standaard</span>}
                </a>
                {isVoorkeur(v.variant) ? (
                  <p className="akkoord-voorkeur vinkje">Jouw keuze</p>
                ) : (
                  <button type="button" className="knop knop-rustig akkoord-kies" onClick={() => wijzig((x) => zetVoorkeurVariant(x, naam, v.variant))}>
                    Kies deze
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
