import { oefeningen } from '../data'
import { naarHash, type Route } from '../lib/route'
import './Oefenen.css'

const GEREEDSCHAP: { route: Route; titel: string }[] = [
  { route: { pagina: 'metronoom' }, titel: 'Metronoom' },
  { route: { pagina: 'slagpatroon' }, titel: 'Slagpatroon-trainer' },
]

const CHALLENGES: { route: Route; titel: string }[] = [
  { route: { pagina: 'one-minute-changes' }, titel: 'One minute changes' },
  { route: { pagina: 'spider-ladder' }, titel: 'Spider-ladder' },
  { route: { pagina: 'wisselreeks' }, titel: 'Wisselreeks' },
]

function Lijst({ items }: { items: { route: Route; titel: string }[] }) {
  return (
    <ul className="oefenen-lijst">
      {items.map((i) => (
        <li key={i.titel}>
          <a className="kaart" href={naarHash(i.route)}>
            {i.titel}
          </a>
        </li>
      ))}
    </ul>
  )
}

export default function OefenenPagina() {
  return (
    <section className="oefenen">
      <h1>Oefenen</h1>
      <div className="oefenen-groep">
        <h2>Challenges</h2>
        <Lijst items={CHALLENGES} />
      </div>
      <div className="oefenen-groep">
        <h2>Oefeningen</h2>
        <Lijst items={oefeningen.map((o) => ({ route: { pagina: 'oefening', id: o.id }, titel: o.titel }))} />
      </div>
      <div className="oefenen-groep">
        <h2>In de maat</h2>
        <Lijst items={GEREEDSCHAP} />
      </div>
    </section>
  )
}
