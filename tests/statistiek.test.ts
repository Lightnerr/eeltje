import { describe, expect, it } from 'vitest';
import { kopieerTekst, minutenPerWeek, paarSleutel, record, streak, totaalMinuten, weekStart } from '../src/lib/statistiek';
import type { AkkoordStatus } from '../src/lib/types';

const s = (datum: string, duurSec = 600) => ({ datum: new Date(datum).toISOString(), duurSec });

describe('streak', () => {
  const nu = new Date('2026-03-10T20:00:00');
  it('telt aaneengesloten dagen tot vandaag', () => {
    expect(streak([s('2026-03-08T10:00'), s('2026-03-09T10:00'), s('2026-03-10T10:00')], nu)).toBe(3);
  });
  it('blijft staan als je vandaag nog niet hebt geoefend', () => {
    expect(streak([s('2026-03-08T10:00'), s('2026-03-09T10:00')], nu)).toBe(2);
  });
  it('breekt bij een gemiste dag', () => {
    expect(streak([s('2026-03-07T10:00'), s('2026-03-10T10:00')], nu)).toBe(1);
    expect(streak([s('2026-03-07T10:00')], nu)).toBe(0);
  });
  it('telt meerdere sessies op één dag als één dag', () => {
    expect(streak([s('2026-03-10T08:00'), s('2026-03-10T21:00')], nu)).toBe(1);
  });
});

describe('minuten', () => {
  it('telt totaal', () => {
    expect(totaalMinuten([s('2026-03-10', 90), s('2026-03-11', 90)])).toBe(3);
  });
  it('groepeert per week (maandag)', () => {
    expect(weekStart(new Date('2026-03-15T12:00')).getDate()).toBe(9);
    const w = minutenPerWeek([s('2026-03-09T10:00', 600), s('2026-03-15T10:00', 600), s('2026-03-02T10:00', 300)], 3, new Date('2026-03-12T10:00'));
    expect(w.map((x) => x.minuten)).toEqual([0, 5, 20]);
  });
});

describe('records', () => {
  it('pakt de hoogste waarde', () => {
    const c = [
      { type: 'one-minute-changes' as const, datum: '2026-01-01', waarde: 20, sleutel: 'A-D' },
      { type: 'one-minute-changes' as const, datum: '2026-01-02', waarde: 30, sleutel: 'A-D' },
      { type: 'one-minute-changes' as const, datum: '2026-01-03', waarde: 40, sleutel: 'C-G' },
    ];
    expect(record(c, 'one-minute-changes', 'A-D')!.waarde).toBe(30);
    expect(record(c, 'one-minute-changes')!.waarde).toBe(40);
    expect(record(c, 'spider-ladder')).toBeUndefined();
  });
  it('maakt paarsleutel onafhankelijk van volgorde', () => {
    expect(paarSleutel('D', 'A')).toBe('A-D');
    expect(paarSleutel('A', 'D')).toBe('A-D');
  });
});

describe('kopieerTekst', () => {
  it('maakt de chattekst', () => {
    const st: Record<string, AkkoordStatus> = { A: 'kan ik', D: 'kan ik', E: 'kan ik', G: 'oefenen', Em: 'oefenen' };
    expect(kopieerTekst(['A', 'C', 'D', 'E', 'G', 'Em'], (n) => st[n] ?? 'nieuw')).toBe(
      'Akkoorden die ik kan: A, D, E. Aan het oefenen: G, Em.',
    );
  });
  it('zegt "nog geen" bij lege lijst', () => {
    expect(kopieerTekst(['A'], () => 'nieuw')).toBe('Akkoorden die ik kan: nog geen. Aan het oefenen: nog geen.');
  });
});
