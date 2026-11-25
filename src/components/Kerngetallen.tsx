import { dagenTekst, minutenTekst } from '../lib/statistiek'
import './Kerngetallen.css'

/** Streak, minuten vandaag en het totaal, als drie tegels. */
export function Kerngetallen({ streak, vandaag, totaal }: { streak: number; vandaag: number; totaal: number }) {
  const tegels = [
    { label: 'Streak', waarde: dagenTekst(streak) },
    { label: 'Vandaag', waarde: minutenTekst(vandaag) },
    { label: 'Totaal', waarde: minutenTekst(totaal) },
  ]
  return (
    <dl className="kerngetallen">
      {tegels.map((t) => (
        <div key={t.label} className="kaart kerngetal">
          <dt>{t.label}</dt>
          <dd>{t.waarde}</dd>
        </div>
      ))}
    </dl>
  )
}
