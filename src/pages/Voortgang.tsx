import { useRef, useState, type ChangeEvent } from 'react'
import { Grafiek } from '../components/Grafiek'
import { Kerngetallen } from '../components/Kerngetallen'
import { StatusLabel } from '../components/StatusLabel'
import { akkoorden } from '../data'
import { vergeetTimer } from '../hooks/useOefentimer'
import { useNu } from '../hooks/useNu'
import { useVoortgang } from '../hooks/useVoortgang'
import { rasterVan } from '../lib/akkoorden'
import { bestandsnaam, leesBestand, MAX_BESTAND_TEKENS, samenvatting, samenvattingTekst } from '../lib/bestand'
import { geschiedenis, record, resultaatTekst } from '../lib/challenges'
import { naarHash, type Route } from '../lib/route'
import { challengeSleutels, dagSleutel, minutenPerWeek, minutenVandaag, streak, streakZin, totaalMinuten } from '../lib/statistiek'
import type { AkkoordStatus, ChallengeType, Voortgang } from '../lib/types'
import { exporteerVoortgang } from '../lib/voortgang'
import './Voortgang.css'

const datumKort = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short' })

function datumLabel(dag: string): string {
  return datumKort.format(new Date(`${dag}T12:00:00`)).replace('.', '')
}

const CHALLENGES: { type: ChallengeType; titel: string; eenheid: string; kies?: string }[] = [
  { type: 'one-minute-changes', titel: 'One minute changes', eenheid: 'wissels', kies: 'Akkoordpaar' },
  { type: 'spider-ladder', titel: 'Spider-ladder', eenheid: 'bpm' },
  { type: 'wisselreeks', titel: 'Wisselreeks', eenheid: 'seconden', kies: 'Reeks' },
]

function challengeRoute(type: ChallengeType, sleutel?: string): Route {
  if (type === 'one-minute-changes' && sleutel) {
    const [a, b] = sleutel.split('-')
    return { pagina: type, a, b }
  }
  if (type === 'wisselreeks' && sleutel) return { pagina: type, akkoorden: sleutel.split('-') }
  return { pagina: type }
}

function grafiekTitel(type: ChallengeType, sleutel: string): string {
  if (type === 'spider-ladder') return 'Hoogste tempo per keer'
  return type === 'one-minute-changes' ? `Paar ${sleutel}` : `Reeks ${sleutel}`
}

function ChallengeKaart({ voortgang, type, titel, eenheid, kies }: { voortgang: Voortgang } & (typeof CHALLENGES)[number]) {
  const sleutels = challengeSleutels(voortgang, type)
  const [gekozen, zetGekozen] = useState<string | undefined>(undefined)
  const sleutel = gekozen && sleutels.includes(gekozen) ? gekozen : sleutels[0]
  const best = sleutel ? record(voortgang, type, sleutel) : null
  const punten = sleutel
    ? geschiedenis(voortgang, type, sleutel).map((c) => ({ x: c.datum, y: c.waarde, label: datumLabel(dagSleutel(new Date(c.datum))) }))
    : []
  const kiesId = `kies-${type}`

  return (
    <article className="kaart voortgang-challenge">
      <div className="voortgang-challenge-kop">
        <h3>{titel}</h3>
        {best && <span className="voortgang-record">Record {resultaatTekst(best)}</span>}
      </div>
      {kies && sleutels.length > 1 && (
        <div className="voortgang-kies">
          <label htmlFor={kiesId}>{kies}</label>
          <select id={kiesId} value={sleutel} onChange={(e) => zetGekozen(e.target.value)}>
            {sleutels.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      )}
      {sleutel ? (
        <Grafiek titel={grafiekTitel(type, sleutel)} eenheid={eenheid} soort="lijn" punten={punten} />
      ) : (
        <p className="zacht">Nog geen resultaten.</p>
      )}
      <a className="voortgang-naar" href={naarHash(challengeRoute(type, sleutel))}>
        {sleutel ? 'Nog een keer' : 'Probeer hem'}
      </a>
    </article>
  )
}

const GROEPEN: AkkoordStatus[] = ['kan ik', 'oefenen', 'nieuw']

function Akkoordoverzicht({ voortgang }: { voortgang: Voortgang }) {
  const raster = rasterVan(akkoorden, voortgang)
  return (
    <ul className="kaart voortgang-akkoorden">
      {GROEPEN.map((status) => {
        const namen = raster.filter((r) => r.status === status).map((r) => r.akkoord.naam)
        return (
          <li key={status}>
            <span className="voortgang-akkoorden-kop">
              <StatusLabel status={status} /> <span className="zacht">{namen.length}</span>
            </span>
            {namen.length > 0 && <span className="voortgang-akkoorden-namen">{namen.join(', ')}</span>}
          </li>
        )
      })}
      <li>
        <a className="voortgang-naar" href={naarHash({ pagina: 'akkoorden' })}>
          Naar je akkoorden
        </a>
      </li>
    </ul>
  )
}

function download(naam: string, tekst: string) {
  const url = URL.createObjectURL(new Blob([tekst], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = naam
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

type Vraag = { soort: 'importeren'; voortgang: Voortgang; bestand: string } | { soort: 'wissen' }

function Gegevens() {
  const { voortgang, vervang, wis } = useVoortgang()
  const invoer = useRef<HTMLInputElement>(null)
  const [vraag, zetVraag] = useState<Vraag | null>(null)
  const [melding, zetMelding] = useState<{ tekst: string; fout?: boolean } | null>(null)

  async function kiesBestand(e: ChangeEvent<HTMLInputElement>) {
    const bestand = e.target.files?.[0]
    e.target.value = ''
    if (!bestand) return
    zetMelding(null)
    try {
      // Niet eerst een enorm bestand inlezen; een teken is in UTF-8 hooguit 4 bytes.
      if (bestand.size > MAX_BESTAND_TEKENS * 4) throw new Error('Dit bestand is te groot voor een voortgang van Eeltje.')
      zetVraag({ soort: 'importeren', voortgang: leesBestand(await bestand.text()), bestand: bestand.name })
    } catch (fout) {
      zetVraag(null)
      zetMelding({ tekst: `Niet geïmporteerd. ${(fout as Error).message} Je voortgang is niet veranderd.`, fout: true })
    }
  }

  return (
    <div className="kaart voortgang-gegevens">
      <p className="zacht">Neem je voortgang mee naar een ander apparaat: exporteer hem hier als bestand en importeer hem daar.</p>
      <div className="voortgang-knoppen">
        <button type="button" className="knop" onClick={() => download(bestandsnaam(new Date()), exporteerVoortgang(voortgang))}>
          Exporteer als bestand
        </button>
        <button type="button" className="knop knop-rustig" onClick={() => invoer.current?.click()}>
          Importeer een bestand
        </button>
        <input ref={invoer} className="verborgen" type="file" accept=".json,application/json" tabIndex={-1} aria-hidden="true" onChange={kiesBestand} />
      </div>

      {vraag?.soort === 'importeren' && (
        <div className="voortgang-vraag" role="group" aria-labelledby="vraag-importeren">
          <p id="vraag-importeren">
            <strong>Dit vervangt je huidige voortgang.</strong> In {vraag.bestand}: {samenvattingTekst(samenvatting(vraag.voortgang))}.
          </p>
          <div className="voortgang-knoppen">
            <button
              type="button"
              className="knop"
              autoFocus
              onClick={() => {
                vervang(vraag.voortgang)
                zetVraag(null)
                zetMelding({ tekst: `Geïmporteerd: ${samenvattingTekst(samenvatting(vraag.voortgang))}.` })
              }}
            >
              Vervangen
            </button>
            <button type="button" className="knop knop-rustig" onClick={() => zetVraag(null)}>
              Annuleren
            </button>
          </div>
        </div>
      )}

      <div className="voortgang-wissen">
        {vraag?.soort === 'wissen' ? (
          <div className="voortgang-vraag voortgang-vraag-gevaar" role="group" aria-labelledby="vraag-wissen">
            <p id="vraag-wissen">
              <strong>Weet je het zeker?</strong> Je sessies, records en akkoordstatussen gaan weg. Wil je ze bewaren, exporteer dan eerst.
            </p>
            <div className="voortgang-knoppen">
              <button
                type="button"
                className="knop knop-gevaar"
                autoFocus
                onClick={() => {
                  wis()
                  vergeetTimer()
                  zetVraag(null)
                  zetMelding({ tekst: 'Alles is gewist. Je begint opnieuw, met D en A op oefenen.' })
                }}
              >
                Ja, alles wissen
              </button>
              <button type="button" className="knop knop-rustig" onClick={() => zetVraag(null)}>
                Nee, laat staan
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="knop knop-rustig knop-gevaar-rustig"
            onClick={() => {
              zetMelding(null)
              zetVraag({ soort: 'wissen' })
            }}
          >
            Alles wissen
          </button>
        )}
      </div>

      <p role="status" className={melding ? `voortgang-melding${melding.fout ? ' voortgang-melding-fout' : ''}` : 'verborgen'}>
        {melding?.tekst}
      </p>
    </div>
  )
}

export default function VoortgangPagina() {
  const { voortgang } = useVoortgang()
  const nu = useNu()
  const weken = minutenPerWeek(voortgang, nu, 8).map((w) => ({ x: w.start, y: w.minuten, label: datumLabel(w.start) }))

  return (
    <section className="voortgang">
      <h1>Voortgang</h1>

      <div className="voortgang-blok">
        <Kerngetallen streak={streak(voortgang, nu)} vandaag={minutenVandaag(voortgang, nu)} totaal={totaalMinuten(voortgang, nu)} />
        <p className="zacht">{streakZin(voortgang, nu)}</p>
      </div>

      <div className="kaart">
        <Grafiek titel="Minuten per week" eenheid="minuten" soort="staaf" punten={weken} />
      </div>

      <section className="voortgang-blok" aria-labelledby="kop-challenges">
        <h2 id="kop-challenges">Challenges</h2>
        <div className="voortgang-challenges">
          {CHALLENGES.map((c) => (
            <ChallengeKaart key={c.type} voortgang={voortgang} {...c} />
          ))}
        </div>
      </section>

      <section className="voortgang-blok" aria-labelledby="kop-akkoorden">
        <h2 id="kop-akkoorden">Akkoorden</h2>
        <Akkoordoverzicht voortgang={voortgang} />
      </section>

      <section className="voortgang-blok" aria-labelledby="kop-gegevens">
        <h2 id="kop-gegevens">Je gegevens</h2>
        <Gegevens />
      </section>
    </section>
  )
}
