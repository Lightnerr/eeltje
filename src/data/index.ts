import type { Akkoord, Liedje, Oefening } from '../lib/types';
import akkoordenJson from './akkoorden.json';
import oefeningenJson from './oefeningen.json';

const liedjeModules = import.meta.glob<{ default: Liedje }>('./liedjes/*.json', { eager: true });

export const akkoorden = akkoordenJson as Akkoord[];
export const oefeningen = oefeningenJson as Oefening[];
export const liedjes: Liedje[] = Object.values(liedjeModules)
  .map((m) => m.default)
  .sort((a, b) => a.titel.localeCompare(b.titel, 'nl'));

/** Unieke akkoordnamen in de volgorde van akkoorden.json. */
export const akkoordNamen: string[] = [...new Set(akkoorden.map((a) => a.naam))];

export function variantenVan(naam: string): Akkoord[] {
  return akkoorden.filter((a) => a.naam === naam);
}

export function standaardVariant(naam: string, voorkeurId?: string): Akkoord | undefined {
  const varianten = variantenVan(naam);
  return (
    varianten.find((a) => a.id === voorkeurId) ?? varianten.find((a) => a.standaard) ?? varianten[0]
  );
}

export function moeilijkheidVan(naam: string): number {
  return Math.min(...variantenVan(naam).map((a) => a.moeilijkheid), 5);
}

export function vindLiedje(id: string): Liedje | undefined {
  return liedjes.find((l) => l.id === id);
}

export function vindOefening(id: string): Oefening | undefined {
  return oefeningen.find((o) => o.id === id);
}
