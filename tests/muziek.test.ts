import { describe, expect, it } from 'vitest';
import type { Liedje } from '../src/lib/types';
import {
  accentOpTel, besteCapoOptie, capoSuggestie, gebruikteAkkoorden, klinkendAkkoord, leerAdvies, maakBekend,
  normaliseer, ontbrekendeAkkoorden, parseAkkoord, parseMaatsoort, parseSlagpatroon, speelVolgorde,
  speelbareVorm, speelbaarheidsLabel, transponeer, vereenvoudigingen, vormMetCapo,
} from '../src/lib/muziek';

function liedje(akkoorden: string[][], extra: Partial<Liedje> = {}): Liedje {
  return {
    id: 'test', titel: 'Test', artiest: 'X', toonsoort: 'C', capo: 0, bpm: 100, maatsoort: '4/4',
    slagpatroon: 'D D D D',
    secties: [{ naam: 'A', maten: akkoorden.map((a) => ({ akkoorden: a })), herhalingen: 1 }],
    volgorde: ['A'], notities: [], bron: 'handmatig', geverifieerd: true, ...extra,
  };
}

describe('parseAkkoord', () => {
  it('leest grondtoon, suffix en bas', () => {
    expect(parseAkkoord('F#m7')).toEqual({ grondtoon: 6, suffix: 'm7' });
    expect(parseAkkoord('D/F#')).toEqual({ grondtoon: 2, suffix: '', bas: 6 });
    expect(parseAkkoord('Bb')).toEqual({ grondtoon: 10, suffix: '' });
  });
  it('gooit bij onzin', () => {
    expect(() => parseAkkoord('H')).toThrow();
    expect(() => parseAkkoord('')).toThrow();
    expect(() => parseAkkoord('C/X')).toThrow();
  });
});

describe('transponeren', () => {
  it('schuift omhoog en omlaag', () => {
    expect(transponeer('C', 2)).toBe('D');
    expect(transponeer('Am', 3)).toBe('Cm');
    expect(transponeer('G', 5)).toBe('C');
    expect(transponeer('C', -1)).toBe('B');
    expect(transponeer('E', 12)).toBe('E');
    expect(transponeer('E', -13)).toBe('Eb');
  });
  it('houdt suffix en bas', () => {
    expect(transponeer('Cadd9', 2)).toBe('Dadd9');
    expect(transponeer('D/F#', 2)).toBe('E/Ab');
    expect(transponeer('Fmaj7', 1)).toBe('F#maj7');
  });
  it('gebruikt een vaste spelling', () => {
    expect(transponeer('A', 1)).toBe('Bb');
    expect(transponeer('E', 2)).toBe('F#');
    expect(normaliseer('A#m')).toBe('Bbm');
    expect(normaliseer('Gb')).toBe('F#');
  });
  it('is omkeerbaar', () => {
    for (const a of ['C', 'F#m', 'Bb7', 'Dsus2', 'G/B']) {
      for (let n = -11; n <= 11; n++) expect(transponeer(transponeer(a, n), -n)).toBe(normaliseer(a));
    }
  });
});

describe('capo', () => {
  it('rekent klinkend akkoord uit', () => {
    expect(klinkendAkkoord('G', 2)).toBe('A');
    expect(klinkendAkkoord('Em', 2)).toBe('F#m');
    expect(klinkendAkkoord('C', 0)).toBe('C');
  });
  it('rekent de vorm uit bij een capo', () => {
    expect(vormMetCapo('A', 2)).toBe('G');
    expect(vormMetCapo('F#m', 2)).toBe('Em');
    expect(vormMetCapo('Bb', 3)).toBe('G');
  });
});

describe('speelbaarheid', () => {
  const bekend = maakBekend(['A', 'D', 'E']);
  it('vindt unieke akkoorden in volgorde', () => {
    expect(gebruikteAkkoorden(liedje([['A'], ['D', 'E'], ['A']]))).toEqual(['A', 'D', 'E']);
  });
  it('vindt ontbrekende akkoorden', () => {
    expect(ontbrekendeAkkoorden(['A', 'D', 'G'], bekend)).toEqual(['G']);
    expect(ontbrekendeAkkoorden(['A#', 'D'], maakBekend(['Bb', 'D']))).toEqual([]);
  });
  it('maakt labels', () => {
    expect(speelbaarheidsLabel([])).toBe('Kan je spelen');
    expect(speelbaarheidsLabel(['G'])).toBe('Mist 1 akkoord: G');
    expect(speelbaarheidsLabel(['G', 'C', 'Em'])).toBe('Mist er 3');
  });
});

describe('vereenvoudigingen', () => {
  it('stelt makkelijkere vormen voor', () => {
    expect(vereenvoudigingen('F')).toEqual(['Fmaj7']);
    expect(vereenvoudigingen('C')).toEqual(['Cadd9']);
    expect(vereenvoudigingen('Em7')).toEqual(['Em']);
    expect(vereenvoudigingen('A7sus4')).toEqual(['A']);
    expect(vereenvoudigingen('D/F#')).toEqual(['D']);
    expect(vereenvoudigingen('Bm')).toEqual(['Bm7']);
    expect(vereenvoudigingen('Cmaj7')).toEqual(['C']);
    expect(vereenvoudigingen('E5')).toEqual(['E', 'Em']);
    expect(vereenvoudigingen('Em')).toEqual([]);
  });
  it('kiest wat je kent', () => {
    const bekend = maakBekend(['Fmaj7', 'Em', 'D']);
    expect(speelbareVorm('F', bekend)).toBe('Fmaj7');
    expect(speelbareVorm('Em7', bekend)).toBe('Em');
    expect(speelbareVorm('D', bekend)).toBe('D');
    expect(speelbareVorm('G', bekend)).toBeNull();
  });
});

describe('capo-suggestie', () => {
  it('vindt een capo waarmee het liedje speelbaar wordt', () => {
    // Klinkt als A - D - E, je kent alleen G, C, D
    const l = liedje([['A'], ['D'], ['E']]);
    const s = capoSuggestie(l, maakBekend(['G', 'C', 'D']))!;
    expect(s).not.toBeNull();
    expect(s.capo).toBe(2);
    expect(s.ontbrekend).toEqual([]);
    expect(s.vormen.map((v) => v.speel)).toEqual(['G', 'C', 'D']);
  });
  it('houdt rekening met de capo die al in het liedje staat', () => {
    // Vormen G C D met capo 2 klinken als A D E. Je kent A, D, E: zonder capo!
    const l = liedje([['G'], ['C'], ['D']], { capo: 2 });
    const s = capoSuggestie(l, maakBekend(['A', 'D', 'E']))!;
    expect(s.capo).toBe(0);
    expect(s.vormen.map((v) => v.speel)).toEqual(['A', 'D', 'E']);
  });
  it('gebruikt vereenvoudigingen', () => {
    const l = liedje([['C'], ['F'], ['G']]);
    const s = capoSuggestie(l, maakBekend(['C', 'Fmaj7', 'G']))!;
    expect(s.capo).toBe(0);
    expect(s.ontbrekend).toEqual([]);
    expect(s.vormen.find((v) => v.origineel === 'F')!.speel).toBe('Fmaj7');
  });
  it('geeft niets als het liedje al speelbaar is', () => {
    expect(capoSuggestie(liedje([['A'], ['D']]), maakBekend(['A', 'D']))).toBeNull();
  });
  it('geeft niets als niks beter wordt', () => {
    expect(capoSuggestie(liedje([['Bb'], ['Eb']]), maakBekend(['Am']))).toBeNull();
  });
  it('geeft een gedeeltelijke verbetering', () => {
    const l = liedje([['A'], ['D'], ['E'], ['F#m']]);
    const s = capoSuggestie(l, maakBekend(['G', 'C', 'D']))!;
    expect(s.capo).toBe(2);
    expect(s.ontbrekend).toEqual(['Em']);
  });
  it('kiest bij gelijke stand de capo het dichtst bij het origineel', () => {
    const l = liedje([['C']]);
    expect(besteCapoOptie(l, maakBekend(['C'])).capo).toBe(0);
  });
});

describe('leerAdvies', () => {
  const liedjes = [
    liedje([['A'], ['D'], ['G']], { id: 'een' }),
    liedje([['D'], ['G']], { id: 'twee' }),
    liedje([['A'], ['C'], ['G'], ['Em']], { id: 'drie' }),
  ];
  const kandidaten = ['A', 'C', 'D', 'G', 'Em', 'Bm'].map((naam) => ({ naam, moeilijkheid: naam === 'Bm' ? 3 : 1 }));
  it('kiest het akkoord dat de meeste liedjes speelbaar maakt', () => {
    const advies = leerAdvies(liedjes, maakBekend(['A', 'D']), kandidaten);
    expect(advies[0].akkoord).toBe('G');
    expect(advies[0].nieuweLiedjes).toContain('een');
    // 'twee' (D-G) is al speelbaar met capo 5 als A-D
    expect(advies[0].nieuweLiedjes).not.toContain('twee');
  });
  it('slaat akkoorden over die je al kent', () => {
    const advies = leerAdvies(liedjes, maakBekend(['A', 'D']), kandidaten);
    expect(advies.map((a) => a.akkoord)).not.toContain('A');
  });
  it('geeft lege lijst als alles speelbaar is', () => {
    expect(leerAdvies(liedjes, maakBekend(['A', 'C', 'D', 'G', 'Em']), kandidaten)).toEqual([]);
  });
});

describe('slagpatroon en maatsoort', () => {
  it('leest patronen', () => {
    expect(parseSlagpatroon('D - D U - U D U')).toEqual(['D', '-', 'D', 'U', '-', 'U', 'D', 'U']);
    expect(parseSlagpatroon(' d u ')).toEqual(['D', 'U']);
    expect(() => parseSlagpatroon('D X')).toThrow();
  });
  it('leest maatsoorten', () => {
    expect(parseMaatsoort('4/4')).toEqual({ tellen: 4, eenheid: 4 });
    expect(parseMaatsoort('6/8')).toEqual({ tellen: 6, eenheid: 8 });
    expect(() => parseMaatsoort('4/3')).toThrow();
    expect(() => parseMaatsoort('vier')).toThrow();
  });
  it('legt accenten', () => {
    const z = parseMaatsoort('6/8');
    expect([0, 1, 2, 3, 4, 5].map((t) => accentOpTel(t, z))).toEqual([2, 0, 0, 1, 0, 0]);
    expect([0, 1, 2, 3].map((t) => accentOpTel(t, parseMaatsoort('4/4')))).toEqual([2, 0, 0, 0]);
  });
});

describe('speelVolgorde', () => {
  const l: Liedje = {
    ...liedje([]),
    secties: [
      { naam: 'Couplet', maten: [{ akkoorden: ['G'] }, { akkoorden: ['D'] }], herhalingen: 2 },
      { naam: 'Refrein', maten: [{ akkoorden: ['C', 'D'] }], herhalingen: 1 },
    ],
    volgorde: ['Couplet', 'Refrein', 'Couplet'],
  };
  it('rolt het liedje uit', () => {
    const v = speelVolgorde(l);
    expect(v.map((m) => m.akkoorden.join('|'))).toEqual(['G', 'D', 'G', 'D', 'C|D', 'G', 'D', 'G', 'D']);
    expect(v[2]).toMatchObject({ sectieNaam: 'Couplet', herhaling: 1, maatIndex: 0 });
  });
  it('kan één sectie loopen', () => {
    expect(speelVolgorde(l, 'Refrein').map((m) => m.akkoorden)).toEqual([['C', 'D']]);
  });
  it('gooit bij een onbekende sectie', () => {
    expect(() => speelVolgorde({ ...l, volgorde: ['Brug'] })).toThrow();
  });
});
