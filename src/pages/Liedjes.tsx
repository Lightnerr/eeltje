import { AkkoordDiagram } from '../components/AkkoordDiagram'
import { SpeelbaarheidLabel } from '../components/SpeelbaarheidLabel'
import { Ster } from '../components/Ster'
import { akkoorden, liedjes } from '../data'
import { useVoortgang } from '../hooks/useVoortgang'
import { gekozenVariant } from '../lib/akkoorden'
import { capoSuggestieTekst, leeradviesTekst, liedjesOverzicht, type LiedjeRegel } from '../lib/liedjes'
import { leeradvies } from '../lib/muziek'
import { naarHash } from '../lib/route'
import { bekendeAkkoorden } from '../lib/voortgang'
import './Liedjes.css'

function Regel({ regel }: { regel: LiedjeRegel }) {
  const { liedje, label, speelbaarheid, capoSuggestie, favoriet } = regel
  return (
    <li>
      <a className="kaart liedjes-kaart" href={naarHash({ pagina: 'liedje', id: liedje.id })}>
        <span className="liedjes-titel">
          {liedje.titel}
          {favoriet && (
            <span className="liedjes-ster">
              <Ster vol />
              <span className="verborgen">favoriet</span>
            </span>
          )}
        </span>
        <span className="zacht liedjes-artiest">{liedje.artiest}</span>
        <SpeelbaarheidLabel speelbaarheid={speelbaarheid} label={label} />
        {capoSuggestie && <span className="liedjes-capo">{capoSuggestieTekst(liedje, capoSuggestie)}</span>}
      </a>
    </li>
  )
}

export default function LiedjesPagina() {
  const { voortgang } = useVoortgang()
  const overzicht = liedjesOverzicht(liedjes, voortgang)
  const favorieten = overzicht.filter((r) => r.favoriet)
  const overige = overzicht.filter((r) => !r.favoriet)
  const advies = leeradvies(liedjes, bekendeAkkoorden(voortgang))
  const adviesAkkoord = advies && gekozenVariant(akkoorden, voortgang, advies.akkoord)

  return (
    <section className="liedjes">
      <h1>Liedjes</h1>

      <div className="kaart liedjes-advies">
        <h2>Welk akkoord moet ik nu leren?</h2>
        {advies ? (
          <a className="liedjes-advies-akkoord" href={naarHash({ pagina: 'akkoord', naam: advies.akkoord })}>
            {adviesAkkoord && (
              <span className="liedjes-advies-diagram">
                <AkkoordDiagram akkoord={adviesAkkoord} grootte="klein" />
              </span>
            )}
            <span>
              <span className="liedjes-advies-naam">{advies.akkoord}</span>
              <span className="liedjes-advies-tekst">{leeradviesTekst(advies)}</span>
            </span>
          </a>
        ) : (
          <p>Je kunt alle liedjes al spelen. Knap!</p>
        )}
      </div>

      {favorieten.length > 0 && (
        <div className="liedjes-groep">
          <h2>Favorieten</h2>
          <ul className="liedjes-lijst">
            {favorieten.map((r) => (
              <Regel key={r.liedje.id} regel={r} />
            ))}
          </ul>
        </div>
      )}

      <div className="liedjes-groep">
        <h2>{favorieten.length > 0 ? 'Alle andere liedjes' : 'Alle liedjes'}</h2>
        <ul className="liedjes-lijst">
          {overige.map((r) => (
            <Regel key={r.liedje.id} regel={r} />
          ))}
        </ul>
      </div>
    </section>
  )
}
