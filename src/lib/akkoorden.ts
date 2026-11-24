import type { Akkoord, AkkoordStatus, Voortgang } from './types'
import { statusVan } from './voortgang'

/** Elke akkoordnaam één keer, in de volgorde van de lijst. */
export function akkoordnamen(akkoorden: readonly Pick<Akkoord, 'naam'>[]): string[] {
  return [...new Set(akkoorden.map((a) => a.naam))]
}

/** De variant die je zelf koos, anders de standaard. */
export function gekozenVariant(akkoorden: readonly Akkoord[], voortgang: Voortgang, naam: string): Akkoord | undefined {
  const voorkeur = voortgang.voorkeurVariant[naam]
  return (
    akkoorden.find((a) => a.naam === naam && a.variant === voorkeur) ??
    akkoorden.find((a) => a.naam === naam && a.standaard) ??
    akkoorden.find((a) => a.naam === naam)
  )
}

export interface RasterItem {
  akkoord: Akkoord
  status: AkkoordStatus
}

/** Elk akkoord één keer, met de gekozen variant; met `filter` alleen die status. */
export function rasterVan(akkoorden: readonly Akkoord[], voortgang: Voortgang, filter?: AkkoordStatus): RasterItem[] {
  return akkoordnamen(akkoorden)
    .map((naam) => ({ akkoord: gekozenVariant(akkoorden, voortgang, naam) as Akkoord, status: statusVan(voortgang, naam) }))
    .filter((r) => filter === undefined || r.status === filter)
}

/** De tekst achter "Kopieer mijn akkoorden": om in een chat of in mijn-akkoorden.txt te plakken. */
export function kopieerTekst(voortgang: Voortgang, akkoorden: readonly Pick<Akkoord, 'naam'>[]): string {
  const namen = akkoordnamen(akkoorden)
  const met = (status: AkkoordStatus) => namen.filter((n) => statusVan(voortgang, n) === status).join(', ')
  const zinnen = [
    [met('kan ik'), 'Akkoorden die ik kan'],
    [met('oefenen'), 'Aan het oefenen'],
  ]
    .filter(([lijst]) => lijst)
    .map(([lijst, kop]) => `${kop}: ${lijst}.`)
  return zinnen.length ? zinnen.join(' ') : 'Ik ken nog geen akkoorden.'
}

export const STATUSLABEL: Record<AkkoordStatus, string> = { nieuw: 'Nieuw', oefenen: 'Oefenen', 'kan ik': 'Kan ik' }
