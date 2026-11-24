import { STATUSLABEL } from '../lib/akkoorden'
import type { AkkoordStatus } from '../lib/types'
import './StatusLabel.css'

export function StatusLabel({ status }: { status: AkkoordStatus }) {
  return <span className={`status-label status-${status.replace(' ', '-')}`}>{STATUSLABEL[status]}</span>
}
