import { describe, expect, it } from 'vitest';
import { demoVoortgang } from '../src/lib/demo';
import { liedjes } from '../src/data';
import { VoortgangOpslag, geheugenBackend, normaliseerVoortgang } from '../src/lib/storage';
import { streak } from '../src/lib/statistiek';

describe('demo', () => {
  const nu = new Date('2026-11-24T12:00:00');

  it('is een geldige voortgang', () => {
    const v = demoVoortgang(nu);
    expect(normaliseerVoortgang(JSON.parse(JSON.stringify(v)))).toEqual(v);
  });

  it('heeft een lopende streak en ligt helemaal in het verleden', () => {
    const v = demoVoortgang(nu);
    expect(streak(v.sessies, nu)).toBeGreaterThanOrEqual(7);
    for (const d of [...v.sessies, ...v.challenges].map((x) => x.datum)) expect(new Date(d) < nu).toBe(true);
  });

  it('verwijst alleen naar bestaande liedjes', () => {
    const ids = new Set(liedjes.map((l) => l.id));
    const v = demoVoortgang(nu);
    for (const id of [...v.favorieten, ...v.gecontroleerd]) expect(ids.has(id)).toBe(true);
  });

  it('is het begin van een opslag met demo, ook na alles wissen', () => {
    const o = new VoortgangOpslag(geheugenBackend(), () => demoVoortgang(nu));
    expect(o.get().akkoordStatus.G).toBe('oefenen');
    o.zetStatus('G', 'kan ik');
    o.wisAlles();
    expect(o.get().akkoordStatus.G).toBe('oefenen');
  });
});
