import { oefeningen, riffs } from '../data'
import { useVoortgang } from '../hooks/useVoortgang'
import { recordTekst } from '../lib/challenges'
import { naarHash, type Route } from '../lib/route'
import type { ChallengeType } from '../lib/types'
import './Oefenen.css'

const GEREEDSCHAP: { route: Route; titel: string }[] = [
  { route: { pagina: 'metronoom' }, titel: 'Metronoom' },
  { route: { pagina: 'slagpatroon' }, titel: 'Slagpatroon-trainer' },
]

const CHALLENGES: { type: ChallengeType; titel: string }[] = [
  { type: 'one-minute-changes', titel: 'One minute changes' },
  { type: 'spider-ladder', titel: 'Spider-ladder' },
  { type: 'wisselreeks', titel: 'Wisselreeks' },
]

interface Item {
  route: Route
  titel: string
  onder?: string
}

function Lijst({ items }: { items: Item[] }) {
  return (
    <ul className="oefenen-lijst">
      {items.map((i) => (
        <li key={i.titel}>
          <a className="kaart" href={naarHash(i.route)}>
            <span>
              {i.titel}
              {i.onder && <span className="oefenen-onder">{i.onder}</span>}
            </span>
          </a>
        </li>
      ))}
    </ul>
  )
}

export default function OefenenPagina() {
  const { voortgang } = useVoortgang()
  const challenges: Item[] = CHALLENGES.map((c) => ({ route: { pagina: c.type }, titel: c.titel, onder: recordTekst(voortgang, c.type) }))
  return (
    <section className="oefenen">
      <h1>Oefenen</h1>
      <div className="oefenen-groep">
        <h2>Challenges</h2>
        <Lijst items={challenges} />
      </div>
      <div className="oefenen-groep">
        <h2>Oefeningen</h2>
        <Lijst items={oefeningen.map((o) => ({ route: { pagina: 'oefening', id: o.id }, titel: o.titel }))} />
      </div>
      <div className="oefenen-groep">
        <h2>Riffs</h2>
        <Lijst items={riffs.map((r) => ({ route: { pagina: 'riff', id: r.id }, titel: r.titel, onder: r.artiest }))} />
      </div>
      <div className="oefenen-groep">
        <h2>In de maat</h2>
        <Lijst items={GEREEDSCHAP} />
      </div>
    </section>
  )
}
