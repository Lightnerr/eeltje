import { describe, expect, it } from 'vitest';
import { VoortgangOpslag, geheugenBackend, normaliseerVoortgang, speelbareAkkoorden, statusVan } from '../src/lib/storage';

describe('storage', () => {
  it('start met D en A op oefenen', () => {
    const o = new VoortgangOpslag(geheugenBackend());
    expect(statusVan(o.get(), 'D')).toBe('oefenen');
    expect(statusVan(o.get(), 'A')).toBe('oefenen');
    expect(statusVan(o.get(), 'G')).toBe('nieuw');
    expect(speelbareAkkoorden(o.get()).sort()).toEqual(['A', 'D']);
  });
  it('slaat op en laadt terug', () => {
    const b = geheugenBackend();
    const o = new VoortgangOpslag(b);
    o.zetStatus('G', 'kan ik');
    o.voegSessieToe(600, new Date('2026-01-01T10:00:00'));
    o.wisselFavoriet('zombie');
    const o2 = new VoortgangOpslag(b);
    expect(statusVan(o2.get(), 'G')).toBe('kan ik');
    expect(o2.get().sessies).toHaveLength(1);
    expect(o2.get().favorieten).toEqual(['zombie']);
  });
  it('meldt wijzigingen', () => {
    const o = new VoortgangOpslag(geheugenBackend());
    let n = 0;
    const stop = o.abonneer(() => n++);
    o.zetStatus('E', 'oefenen');
    stop();
    o.zetStatus('E', 'nieuw');
    expect(n).toBe(1);
  });
  it('exporteert en importeert', () => {
    const a = new VoortgangOpslag(geheugenBackend());
    a.zetStatus('Em', 'kan ik');
    a.voegChallengeToe({ type: 'spider-ladder', datum: '2026-01-01T10:00:00Z', waarde: 80 });
    const b = new VoortgangOpslag(geheugenBackend());
    b.importeer(a.exporteer());
    expect(b.get()).toEqual(a.get());
  });
  it('weigert onzin bij import en laat de voortgang heel', () => {
    const o = new VoortgangOpslag(geheugenBackend());
    o.zetStatus('G', 'kan ik');
    expect(() => o.importeer('{"hallo":1}')).toThrow();
    expect(() => o.importeer('geen json')).toThrow();
    expect(statusVan(o.get(), 'G')).toBe('kan ik');
  });
  it('filtert ongeldige velden bij normaliseren', () => {
    const v = normaliseerVoortgang({ versie: 1, akkoordStatus: { A: 'kan ik', B: 'raar' }, sessies: [{ datum: 'x' }], favorieten: [1, 'a'] });
    expect(v.akkoordStatus).toEqual({ A: 'kan ik' });
    expect(v.sessies).toEqual([]);
    expect(v.favorieten).toEqual(['a']);
  });
  it('herstelt van kapotte opslag', () => {
    const o = new VoortgangOpslag(geheugenBackend('{kapot'));
    expect(statusVan(o.get(), 'D')).toBe('oefenen');
  });
  it('wist alles', () => {
    const b = geheugenBackend();
    const o = new VoortgangOpslag(b);
    o.zetStatus('G', 'kan ik');
    o.wisAlles();
    expect(statusVan(o.get(), 'G')).toBe('nieuw');
    expect(b.lees()).toBeNull();
  });
  it('markeert liedjes als gecontroleerd zonder dubbelen', () => {
    const o = new VoortgangOpslag(geheugenBackend());
    o.markeerGecontroleerd('zombie');
    o.markeerGecontroleerd('zombie');
    expect(o.get().gecontroleerd).toEqual(['zombie']);
    o.markeerGecontroleerd('zombie', false);
    expect(o.get().gecontroleerd).toEqual([]);
  });
});
