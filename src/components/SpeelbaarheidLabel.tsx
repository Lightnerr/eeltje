import type { Speelbaarheid } from '../lib/liedjes'
import './SpeelbaarheidLabel.css'

/** "Kan je spelen", "Mist 1 akkoord: G" of "Mist er 3", in de kleuren van kan ik, oefenen en nieuw. */
export function SpeelbaarheidLabel({ speelbaarheid, label }: { speelbaarheid: Speelbaarheid; label: string }) {
  return <span className={`speelbaarheid speelbaarheid-${speelbaarheid}`}>{label}</span>
}
