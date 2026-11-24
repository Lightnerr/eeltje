import { useState } from 'react'
import { AkkoordDiagram } from '../components/AkkoordDiagram'
import { StatusLabel } from '../components/StatusLabel'
import { akkoorden } from '../data'
import { useVoortgang } from '../hooks/useVoortgang'
import { kopieerTekst, rasterVan, STATUSLABEL } from '../lib/akkoorden'
import { naarHash } from '../lib/route'
import type { AkkoordStatus } from '../lib/types'
import { STATUSSEN } from '../lib/voortgang'
import './Akkoorden.css'

async function naarKlembord(tekst: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(tekst)
    return true
  } catch {
    return false
  }
}

function KopieerKnop({ tekst }: { tekst: string }) {
  // Zonder https (bv. de devserver op je telefoon) is er geen klembord; dan tonen we de tekst om zelf te kopiëren.
  const [uitkomst, zetUitkomst] = useState<'gekopieerd' | 'mislukt' | null>(null)
  return (
    <div className="akkoorden-kopieer">
      <button
        type="button"
        className="knop knop-rustig"
        onClick={async () => {
          // Eerst leegmaken, zodat een schermlezer ook een tweede keer dezelfde melding voorleest.
          zetUitkomst(null)
          zetUitkomst((await naarKlembord(tekst)) ? 'gekopieerd' : 'mislukt')
        }}
      >
        Kopieer mijn akkoorden
      </button>
      <p role="status" className={uitkomst ? 'zacht' : 'verborgen'}>
        {uitkomst === 'gekopieerd' && `Gekopieerd: "${tekst}"`}
        {uitkomst === 'mislukt' && 'Kopiëren lukte niet. Selecteer de tekst hieronder en kopieer hem zelf.'}
      </p>
      {uitkomst === 'mislukt' && <textarea className="akkoorden-kopieer-tekst" readOnly value={tekst} rows={3} onFocus={(e) => e.target.select()} />}
    </div>
  )
}

export default function AkkoordenPagina() {
  const { voortgang } = useVoortgang()
  const [filter, zetFilter] = useState<AkkoordStatus | undefined>(undefined)
  const alle = rasterVan(akkoorden, voortgang)
  const zichtbaar = filter === undefined ? alle : alle.filter((r) => r.status === filter)
  const keuzes: { waarde: AkkoordStatus | undefined; label: string; aantal: number }[] = [
    { waarde: undefined, label: 'Alle', aantal: alle.length },
    ...STATUSSEN.map((s) => ({ waarde: s, label: STATUSLABEL[s], aantal: alle.filter((r) => r.status === s).length })),
  ]

  return (
    <section className="akkoorden">
      <h1>Akkoorden</h1>
      <KopieerKnop tekst={kopieerTekst(voortgang, akkoorden)} />

      <div className="akkoorden-filter" role="group" aria-label="Toon akkoorden met status">
        {keuzes.map((k) => (
          <button key={k.label} type="button" aria-pressed={filter === k.waarde} onClick={() => zetFilter(k.waarde)}>
            {k.label} <span className="akkoorden-aantal">{k.aantal}</span>
          </button>
        ))}
      </div>

      {zichtbaar.length === 0 ? (
        <p className="zacht">Geen akkoorden met deze status.</p>
      ) : (
        <ul className="akkoorden-raster">
          {zichtbaar.map(({ akkoord, status }) => (
            <li key={akkoord.naam}>
              <a className="kaart akkoorden-kaart" href={naarHash({ pagina: 'akkoord', naam: akkoord.naam })} aria-label={`${akkoord.naam}, ${STATUSLABEL[status]}`}>
                <span className="akkoorden-naam">{akkoord.naam}</span>
                <AkkoordDiagram akkoord={akkoord} grootte="klein" />
                <StatusLabel status={status} />
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
