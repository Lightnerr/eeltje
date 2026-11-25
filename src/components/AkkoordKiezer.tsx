import { akkoorden } from '../data'
import { akkoordnamen, STATUSLABEL } from '../lib/akkoorden'
import type { AkkoordStatus, Voortgang } from '../lib/types'
import { statusVan } from '../lib/voortgang'
import './AkkoordKiezer.css'

const VOLGORDE: AkkoordStatus[] = ['oefenen', 'kan ik', 'nieuw']

interface Props {
  label: string
  waarde: string
  voortgang: Voortgang
  onKies: (naam: string) => void
}

/** Een akkoord kiezen, gegroepeerd op status: wat je aan het oefenen bent bovenaan. */
export function AkkoordKiezer({ label, waarde, voortgang, onKies }: Props) {
  const namen = akkoordnamen(akkoorden)
  return (
    <label className="akkoord-kiezer">
      <span>{label}</span>
      <select value={waarde} onChange={(e) => onKies(e.target.value)}>
        {VOLGORDE.map((status) => {
          const groep = namen.filter((n) => statusVan(voortgang, n) === status)
          return (
            groep.length > 0 && (
              <optgroup key={status} label={STATUSLABEL[status]}>
                {groep.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </optgroup>
            )
          )
        })}
      </select>
    </label>
  )
}
