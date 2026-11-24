import { describe, expect, it } from 'vitest';
import type { Akkoord, Liedje, Oefening } from '../src/lib/types';
import akkoorden from '../src/data/akkoorden.json';
import oefeningen from '../src/data/oefeningen.json';
import { valideerAlles } from '../src/lib/validatie';

const modules = import.meta.glob<{ default: Liedje }>('../src/data/liedjes/*.json', { eager: true });
const liedjes = Object.entries(modules).map(([pad, m]) => ({ bestand: pad.split('/').pop()!, liedje: m.default }));

const VERBODEN_VELDEN = ['tekst', 'songtekst', 'lyrics', 'tab', 'tabs'];

describe('inhoud in src/data', () => {
  it('voldoet aan het schema', () => {
    const fouten = valideerAlles(akkoorden as Akkoord[], liedjes, oefeningen as Oefening[]);
    expect(fouten).toEqual([]);
  });

  it('bevat geen songteksten of tabs in liedjes', () => {
    for (const { liedje } of liedjes) {
      for (const veld of VERBODEN_VELDEN) expect(liedje, liedje.id).not.toHaveProperty(veld);
    }
  });

  it('heeft de verplichte akkoorden', () => {
    const namen = new Set((akkoorden as Akkoord[]).map((a) => a.naam));
    for (const n of ['A', 'Am', 'C', 'D', 'Dm', 'E', 'Em', 'G', 'Cadd9', 'Asus2', 'Dsus2', 'Fmaj7', 'F', 'Bm', 'E7', 'A7', 'D7', 'B7']) {
      expect(namen.has(n), n).toBe(true);
    }
  });

  it('heeft mijn A-variant als standaard', () => {
    const a = (akkoorden as Akkoord[]).find((x) => x.naam === 'A' && x.standaard)!;
    expect(a.frets).toEqual(['x', 0, 2, 2, 2, 0]);
    expect(a.vingers).toEqual([0, 0, 2, 1, 3, 0]);
  });

  it('heeft een G-variant met 3 vingers', () => {
    const g = (akkoorden as Akkoord[]).filter((x) => x.naam === 'G');
    expect(g.some((x) => x.vingers.filter((v) => v > 0).length === 3)).toBe(true);
  });
});
