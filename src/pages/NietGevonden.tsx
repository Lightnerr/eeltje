import { naarHash } from '../lib/route'
import './NietGevonden.css'

export default function NietGevondenPagina({ wat = 'Deze pagina' }: { wat?: string }) {
  return (
    <section className="niet-gevonden">
      <h1>Niet gevonden</h1>
      <p>{wat} bestaat niet (meer).</p>
      <a className="knop" href={naarHash({ pagina: 'vandaag' })}>
        Naar vandaag
      </a>
    </section>
  )
}
