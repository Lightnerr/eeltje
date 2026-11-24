import './TelWeergave.css'

interface Props {
  tellen: number
  /** De tel die nu klinkt, vanaf 0; `null` als de metronoom stilstaat. */
  tel: number | null
  accent?: boolean
}

/** De tellen van de maat als grote bolletjes; de tel die klinkt licht op, de 1 met accent in de accentkleur. */
export function TelWeergave({ tellen, tel, accent = true }: Props) {
  return (
    <ol className="tel-weergave" aria-label={tel === null ? `${tellen} tellen per maat` : `Tel ${tel + 1}`}>
      {Array.from({ length: tellen }, (_, i) => (
        <li
          // De key wisselt per tik, zodat de animatie elke tel opnieuw start.
          key={i === tel ? `${i}-aan` : i}
          className={['tel', accent && i === 0 && 'tel-accent', i === tel && 'tel-aan'].filter(Boolean).join(' ')}
        >
          {i + 1}
        </li>
      ))}
    </ol>
  )
}
