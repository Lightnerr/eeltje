import { describe, expect, it } from 'vitest';
import { maakRoutine } from '../src/lib/routine';
import { beginVoortgang } from '../src/lib/storage';
import type { Liedje } from '../src/lib/types';

const l = (id: string, akk: string[]): Liedje => ({
  id, titel: id, artiest: 'x', toonsoort: 'C', capo: 0, bpm: 90, maatsoort: '4/4', slagpatroon: 'D D D D',
  secties: [{ naam: 'A', maten: akk.map((a) => ({ akkoorden: [a] })), herhalingen: 1 }],
  volgorde: ['A'], notities: [], bron: 'handmatig', geverifieerd: true,
});
const akk = ['A', 'D', 'E', 'G', 'C'].map((naam, i) => ({ naam, moeilijkheid: i < 3 ? 1 : 2 }));

describe('dagroutine', () => {
  it('kiest een wissel uit akkoorden die ik oefen', () => {
    const r = maakRoutine(beginVoortgang(), [], akk, new Date('2026-05-01'));
    expect([...r.wissel].sort()).toEqual(['A', 'D']);
  });
  it('vult aan met makkelijke akkoorden als ik er te weinig oefen', () => {
    const v = { ...beginVoortgang(), akkoordStatus: { A: 'oefenen' as const } };
    const r = maakRoutine(v, [], akk, new Date('2026-05-01'));
    expect(r.wissel[0]).toBe('A');
    expect(r.wissel[1]).not.toBe('A');
  });
  it('kiest een liedje dat (bijna) speelbaar is', () => {
    const r = maakRoutine(beginVoortgang(), [l('moeilijk', ['Bb', 'Eb', 'F#']), l('makkelijk', ['A', 'D'])], akk, new Date('2026-05-01'));
    expect(r.liedje?.id).toBe('makkelijk');
  });
  it('start spider op 80% van mijn record', () => {
    const v = { ...beginVoortgang(), challenges: [{ type: 'spider-ladder' as const, datum: '2026-01-01', waarde: 100 }] };
    expect(maakRoutine(v, [], akk).spiderBpm).toBe(80);
    expect(maakRoutine(beginVoortgang(), [], akk).spiderBpm).toBe(60);
  });
  it('is de hele dag hetzelfde', () => {
    const v = { ...beginVoortgang(), akkoordStatus: { A: 'oefenen' as const, D: 'oefenen' as const, E: 'oefenen' as const, G: 'oefenen' as const } };
    const a = maakRoutine(v, [], akk, new Date('2026-05-01T08:00'));
    const b = maakRoutine(v, [], akk, new Date('2026-05-01T22:00'));
    expect(a.wissel).toEqual(b.wissel);
  });
});
