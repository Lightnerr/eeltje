import { useRef, useState } from 'react'
import { annuleerGeplandeGitaar, speelNoten, stopGitaar } from '../audio/gitaar'
import { TelWeergave } from '../components/TelWeergave'
import { zoekRiff } from '../data'
import { useMetronoom } from '../hooks/useMetronoom'
import { useWakeLock } from '../hooks/useWakeLock'
import { MAX_TEMPO, MIN_TEMPO, TEMPO_STAP, begrensTempo, meespeelBpm } from '../lib/meespelen'
import { telDuur } from '../lib/metronoom'
import { leesMaatsoort } from '../lib/muziek'
import { beschrijfRiff, notenInTel, RIFF_START_TEMPO, riffPositie, tabVan, type GeplandeNoot } from '../lib/riffs'
import { naarHash, type RouteGegevens } from '../lib/route'
import type { Riff } from '../lib/types'
import NietGevondenPagina from './NietGevonden'
import './Riff.css'

const SNAARNAMEN_HOOG_LAAG = ['e', 'B', 'G', 'D', 'A', 'E']

function Tab({ riff, stap }: { riff: Riff; stap: number | null }) {
  return (
    <figure className="riff-tab" role="img" tabIndex={0} aria-label={`Tab, hoge e bovenaan: ${beschrijfRiff(riff)}`}>
      {tabVan(riff).map((maat, i) => (
        <div className="riff-maat" key={i}>
          <div className="riff-kolom riff-snaarnamen">
            {SNAARNAMEN_HOOG_LAAG.map((naam) => (
              <span className="riff-cel" key={naam}>
                {naam}
              </span>
            ))}
          </div>
          {maat.kolommen.map((k) => (
            <div key={k.stap} className={['riff-kolom', k.opTel && 'riff-op-tel', k.frets.every((f) => f === null) && 'riff-leeg', k.stap === stap && 'riff-nu'].filter(Boolean).join(' ')}>
              {k.frets.map((fret, snaar) => (
                <span className="riff-cel" key={snaar}>
                  {fret !== null && <span className="riff-fret">{fret}</span>}
                </span>
              ))}
            </div>
          ))}
        </div>
      ))}
    </figure>
  )
}

function Speler({ riff }: { riff: Riff }) {
  const [procent, zetProcent] = useState(RIFF_START_TEMPO)
  const [geluid, zetGeluid] = useState(true)
  const [maat, zetMaat] = useState(-1)
  // Plannen loopt vóór op wat je hoort, dus een eigen teller.
  const planMaat = useRef(-1)
  const bpm = meespeelBpm(riff.bpm, procent)

  function opPlan(tel: number, tijd: number) {
    if (tel === 0) planMaat.current++
    if (!geluid) return
    const perDeel = new Map<number, GeplandeNoot[]>()
    for (const n of notenInTel(riff, planMaat.current, tel)) perDeel.set(n.deel, [...(perDeel.get(n.deel) ?? []), n])
    for (const [deel, noten] of perDeel) speelNoten(noten, { tijd: tijd + deel * telDuur(bpm) })
  }

  const metronoom = useMetronoom({
    bpm,
    maatsoort: riff.maatsoort,
    onderverdeling: riff.onderverdeling,
    opTel: (tel) => tel === 0 && zetMaat((m) => m + 1),
    opPlan,
  })
  useWakeLock(metronoom.loopt)

  const positie = metronoom.loopt && maat >= 0 && metronoom.slag !== null ? riffPositie(riff, maat, metronoom.slag) : null

  function wissel() {
    if (metronoom.loopt) {
      metronoom.stop()
      annuleerGeplandeGitaar()
      stopGitaar()
      return
    }
    planMaat.current = -1
    zetMaat(-1)
    metronoom.start()
  }

  function wisselGeluid() {
    if (geluid) annuleerGeplandeGitaar()
    zetGeluid(!geluid)
  }

  return (
    <>
      <Tab riff={riff} stap={positie?.fase === 'spelen' ? positie.stap : null} />

      <div className="kaart riff-speler">
        <p className="riff-stand" aria-live="polite">
          {positie?.fase === 'aftellen' ? <strong>{positie.nog}</strong> : metronoom.loopt ? <strong>Speel mee</strong> : 'Eerst een maat aftellen, dan gaat hij steeds rond.'}
        </p>
        <TelWeergave tellen={leesMaatsoort(riff.maatsoort).tellen} tel={metronoom.tel} />
        <button type="button" className="knop riff-start" onClick={wissel}>
          {metronoom.loopt ? 'Stop' : 'Start'}
        </button>

        <div className="riff-tempo" role="group" aria-label="Tempo">
          <button
            type="button"
            className="knop knop-rustig"
            aria-label="Langzamer"
            disabled={procent <= MIN_TEMPO}
            onClick={() => zetProcent((p) => begrensTempo(p - TEMPO_STAP))}
          >
            −
          </button>
          <p className="riff-tempo-waarde">
            <strong>{procent}%</strong> <span className="zacht">{bpm} bpm</span>
          </p>
          <button
            type="button"
            className="knop knop-rustig"
            aria-label="Sneller"
            disabled={procent >= MAX_TEMPO}
            onClick={() => zetProcent((p) => begrensTempo(p + TEMPO_STAP))}
          >
            +
          </button>
        </div>
        <button type="button" className="knop knop-rustig" aria-pressed={geluid} onClick={wisselGeluid}>
          Riff laten horen
        </button>
      </div>
    </>
  )
}

export default function RiffPagina({ id }: RouteGegevens<'riff'>) {
  const riff = zoekRiff(id)
  if (!riff) return <NietGevondenPagina wat="Deze riff" />

  return (
    <section className="riff">
      <a className="riff-terug" href={naarHash({ pagina: 'oefenen' })}>
        ‹ Oefenen
      </a>
      <div>
        <h1>{riff.titel}</h1>
        <p className="zacht">
          {riff.artiest} · origineel {riff.bpm} bpm
        </p>
      </div>
      {riff.bron === 'ai-gegenereerd' && !riff.geverifieerd && (
        <p className="riff-ai">
          <strong>AI-versie, op gehoor nagemaakt.</strong> Klinkt het anders dan je kent? Vertrouw je oren.
        </p>
      )}

      <Speler riff={riff} />

      <div className="riff-uitleg">
        <h2>Zo speel je hem</h2>
        <ol>
          {riff.uitleg.map((stap) => (
            <li key={stap}>{stap}</li>
          ))}
        </ol>
      </div>
    </section>
  )
}
