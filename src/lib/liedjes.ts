import { capoSuggestie, ontbrekendeAkkoorden, speelbaarheidsLabel, transponeer, type CapoSuggestie, type Leeradvies } from './muziek'
import type { Liedje, Voortgang } from './types'
import { bekendeAkkoorden } from './voortgang'

/** Geverifieerd in de data, of door de eigenaar nagekeken. */
export function isGecontroleerd(liedje: Liedje, voortgang: Voortgang): boolean {
  return liedje.geverifieerd || voortgang.gecontroleerd.includes(liedje.id)
}

/** "AI-versie, nog niet gecontroleerd". */
export function toonAiLabel(liedje: Liedje, voortgang: Voortgang): boolean {
  return liedje.bron === 'ai-gegenereerd' && !isGecontroleerd(liedje, voortgang)
}

export function capoTekst(capo: number): string {
  return capo === 0 ? 'Geen capo' : `Capo ${capo}`
}

/** "Met capo 5 en de vormen A, D, E kan je dit spelen.", plus welke vereenvoudiging je speelt. */
export function capoSuggestieTekst(liedje: Liedje, suggestie: CapoSuggestie): string {
  const vormen = [...new Set(Object.values(suggestie.vormen))].join(', ')
  const begin = suggestie.capo === 0 ? 'Zonder capo en met' : `Met capo ${suggestie.capo} en`
  const vereenvoudigd = suggestie.vereenvoudigd.map((oud) => ` Speel ${suggestie.vormen[oud]} voor ${transponeer(oud, liedje.capo - suggestie.capo)}.`)
  return `${begin} de vormen ${vormen} kan je dit spelen.${vereenvoudigd.join('')}`
}

const liedjesWoord = (n: number) => (n === 1 ? '1 liedje' : `${n} liedjes`)

export function leeradviesTekst(advies: Leeradvies): string {
  const n = advies.nieuwSpeelbaar.length
  if (n > 0) return `Daarmee kan je ${liedjesWoord(n)} meer spelen.`
  return `Het zit in ${liedjesWoord(advies.inLiedjes)} ${advies.inLiedjes === 1 ? 'dat' : 'die'} je nog niet kunt spelen.`
}

export type Speelbaarheid = 'kan' | 'bijna' | 'mist'

export interface LiedjeRegel {
  liedje: Liedje
  ontbrekend: string[]
  label: string
  speelbaarheid: Speelbaarheid
  capoSuggestie: CapoSuggestie | null
  favoriet: boolean
  aiVersie: boolean
}

/** De liedjeslijst: favorieten bovenaan, dan wat het minst mist, dan op titel. */
export function liedjesOverzicht(liedjes: readonly Liedje[], voortgang: Voortgang): LiedjeRegel[] {
  const bekend = bekendeAkkoorden(voortgang)
  return liedjes
    .map((liedje): LiedjeRegel => {
      const ontbrekend = ontbrekendeAkkoorden(liedje, bekend)
      return {
        liedje,
        ontbrekend,
        label: speelbaarheidsLabel(ontbrekend),
        speelbaarheid: ontbrekend.length === 0 ? 'kan' : ontbrekend.length === 1 ? 'bijna' : 'mist',
        capoSuggestie: capoSuggestie(liedje, bekend),
        favoriet: voortgang.favorieten.includes(liedje.id),
        aiVersie: toonAiLabel(liedje, voortgang),
      }
    })
    .sort(
      (a, b) =>
        Number(b.favoriet) - Number(a.favoriet) ||
        a.ontbrekend.length - b.ontbrekend.length ||
        a.liedje.titel.localeCompare(b.liedje.titel, 'nl'),
    )
}
