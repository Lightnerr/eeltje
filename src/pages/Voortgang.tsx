import { useState } from 'react'
import { Binnenkort } from '../components/Binnenkort'
import { Grafiek } from '../components/Grafiek'
import { useVoortgang } from '../hooks/useVoortgang'
import { dagSleutel, minutenPerWeek } from '../lib/statistiek'
import './Voortgang.css'

const datumKort = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short' })

function weekLabel(start: string): string {
  return datumKort.format(new Date(`${start}T12:00:00`)).replace('.', '')
}

export default function VoortgangPagina() {
  const { voortgang } = useVoortgang()
  const [nu] = useState(() => new Date())
  const weken = minutenPerWeek(voortgang, nu, 8).map((w) => ({ x: w.start, y: w.minuten, label: weekLabel(w.start) }))
  // Voorlopig: de echte geschiedenis per challenge komt uit stap 5 (`geschiedenis` in src/lib/challenges.ts).
  const wissels = voortgang.challenges
    .filter((c) => c.type === 'one-minute-changes' && c.sleutel === 'A-D')
    .sort((a, b) => a.datum.localeCompare(b.datum))
    .map((c) => ({ x: c.datum, y: c.waarde, label: weekLabel(dagSleutel(new Date(c.datum))) }))

  return (
    <section className="voortgang">
      <Binnenkort titel="Voortgang" stap={6}>
        Hier komen grafiekjes per challenge, je records, streak, minuten per week en je akkoordstatussen. En exporteren, importeren en alles wissen.
      </Binnenkort>
      <div className="kaart">
        <Grafiek titel="Minuten per week" eenheid="minuten" soort="staaf" punten={weken} />
      </div>
      <div className="kaart">
        <Grafiek titel="One minute changes A-D" eenheid="wissels" soort="lijn" punten={wissels} />
      </div>
    </section>
  )
}
