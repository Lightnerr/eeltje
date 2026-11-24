import { AkkoordDiagram } from '../components/AkkoordDiagram'
import { SlagpatroonWeergave } from '../components/SlagpatroonWeergave'
import { SpeelbaarheidLabel } from '../components/SpeelbaarheidLabel'
import { StatusLabel } from '../components/StatusLabel'
import { Ster } from '../components/Ster'
import { akkoorden, zoekLiedje } from '../data'
import { useVoortgang } from '../hooks/useVoortgang'
import { gekozenVariant } from '../lib/akkoorden'
import { capoSuggestieTekst, capoTekst, liedjesOverzicht, toonAiLabel } from '../lib/liedjes'
import { akkoordenVan, leesSlagpatroon } from '../lib/muziek'
import { naarHash, type RouteGegevens } from '../lib/route'
import { statusVan, wisselFavoriet, zetGecontroleerd } from '../lib/voortgang'
import NietGevondenPagina from './NietGevonden'
import './Liedje.css'

export default function LiedjePagina({ id }: RouteGegevens<'liedje'>) {
  const { voortgang, wijzig } = useVoortgang()
  const liedje = zoekLiedje(id)
  if (!liedje) return <NietGevondenPagina wat="Dit liedje" />

  const regel = liedjesOverzicht([liedje], voortgang)[0]
  const aiLabel = toonAiLabel(liedje, voortgang)
  const doorJouGecontroleerd = liedje.bron === 'ai-gegenereerd' && !liedje.geverifieerd && !aiLabel
  const slagen = leesSlagpatroon(liedje.slagpatroon) ?? []

  return (
    <section className="liedje">
      <a className="liedje-terug" href={naarHash({ pagina: 'liedjes' })}>
        ‹ Alle liedjes
      </a>

      <div className="liedje-kop">
        <h1>{liedje.titel}</h1>
        <p className="zacht">{liedje.artiest}</p>
      </div>

      <ul className="liedje-feiten" aria-label="Over dit liedje">
        <li className={liedje.capo > 0 ? 'liedje-capo' : undefined}>{capoTekst(liedje.capo)}</li>
        <li>{liedje.bpm} bpm</li>
        <li>{liedje.maatsoort}</li>
        <li>Klinkt in {liedje.toonsoort}</li>
      </ul>

      {aiLabel && (
        <div className="kaart liedje-ai" role="note">
          <p>
            <strong>AI-versie, nog niet gecontroleerd.</strong> Klopt het schema met hoe jij het kent?
          </p>
          <button type="button" className="knop knop-rustig" onClick={() => wijzig((v) => zetGecontroleerd(v, liedje.id))}>
            Ik heb hem gecontroleerd
          </button>
        </div>
      )}
      {doorJouGecontroleerd && (
        <p className="liedje-gecontroleerd">
          <span>✓ Door jou gecontroleerd.</span>
          <button type="button" className="liedje-terugdraaien" onClick={() => wijzig((v) => zetGecontroleerd(v, liedje.id, false))}>
            Terugdraaien
          </button>
        </p>
      )}

      <div className="liedje-acties">
        <a className="knop liedje-meespelen" href={naarHash({ pagina: 'meespelen', id: liedje.id })}>
          Meespelen
        </a>
        <button type="button" className="knop knop-rustig" aria-pressed={regel.favoriet} onClick={() => wijzig((v) => wisselFavoriet(v, liedje.id))}>
          <Ster vol={regel.favoriet} /> Favoriet
        </button>
      </div>

      <div className="kaart liedje-speelbaar">
        <SpeelbaarheidLabel speelbaarheid={regel.speelbaarheid} label={regel.label} />
        {regel.capoSuggestie && <p>{capoSuggestieTekst(liedje, regel.capoSuggestie)}</p>}
        {liedje.origineleAkkoorden && (
          <p>Origineel: {liedje.origineleAkkoorden.join(', ')}</p>
        )}
        {liedje.opmerking && <p className="zacht">{liedje.opmerking}</p>}
      </div>

      <div className="liedje-blok">
        <h2>Akkoorden{liedje.capo > 0 ? ` (vormen bij ${capoTekst(liedje.capo).toLowerCase()})` : ''}</h2>
        <ul className="liedje-akkoorden">
          {akkoordenVan(liedje).map((naam) => {
            const akkoord = gekozenVariant(akkoorden, voortgang, naam)
            return (
              <li key={naam}>
                <a className="kaart liedje-akkoord" href={naarHash({ pagina: 'akkoord', naam })}>
                  <span className="liedje-akkoord-naam">{naam}</span>
                  {akkoord && <AkkoordDiagram akkoord={akkoord} grootte="klein" />}
                  <StatusLabel status={statusVan(voortgang, naam)} />
                </a>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="liedje-blok">
        <h2>Slagpatroon</h2>
        <div className="kaart liedje-slagpatroon">
          <SlagpatroonWeergave slagen={slagen} grootte="groot" maatsoort={liedje.maatsoort} />
        </div>
      </div>

      <div className="liedje-blok">
        <h2>Schema</h2>
        <p className="zacht">Volgorde: {liedje.volgorde.join(', ')}</p>
        {liedje.secties.map((sectie) => (
          <div key={sectie.naam} className="kaart liedje-sectie">
            <h3>{sectie.naam}</h3>
            <ol className="liedje-maten">
              {sectie.maten.map((maat, i) => (
                <li key={i} className="liedje-maat" aria-label={`Maat ${i + 1}: ${maat.join(', ')}`}>
                  {maat.map((a, j) => (
                    <span key={j}>{a}</span>
                  ))}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </section>
  )
}
