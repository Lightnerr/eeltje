import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;
const basis = (p: P) => ({
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  ...p,
});

export const IcoonVandaag = (p: P) => (
  <svg {...basis(p)}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
);
export const IcoonAkkoorden = (p: P) => (
  <svg {...basis(p)}><rect x="5" y="3" width="14" height="18" rx="1" /><path d="M5 8h14M5 13h14M9.5 3v18M14.5 3v18" /></svg>
);
export const IcoonLiedjes = (p: P) => (
  <svg {...basis(p)}><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
);
export const IcoonOefenen = (p: P) => (
  <svg {...basis(p)}><path d="M8 21h8M12 3l-5 18M12 3l5 18M9.5 12h5" /></svg>
);
export const IcoonVoortgang = (p: P) => (
  <svg {...basis(p)}><path d="M3 3v18h18" /><path d="M7 15l4-4 3 3 5-6" /></svg>
);
export const IcoonPlay = (p: P) => (
  <svg {...basis(p)} fill="currentColor" stroke="none"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z" /></svg>
);
export const IcoonStop = (p: P) => (
  <svg {...basis(p)} fill="currentColor" stroke="none"><rect x="6" y="6" width="12" height="12" rx="1.5" /></svg>
);
export const IcoonPijlOmlaag = (p: P) => (
  <svg {...basis(p)} strokeWidth={3}><path d="M12 4v16M5 13l7 7 7-7" /></svg>
);
export const IcoonPijlOmhoog = (p: P) => (
  <svg {...basis(p)} strokeWidth={3}><path d="M12 20V4M5 11l7-7 7 7" /></svg>
);
export const IcoonTerug = (p: P) => (
  <svg {...basis(p)} width={22} height={22}><path d="M15 18l-6-6 6-6" /></svg>
);
export const IcoonSluit = (p: P) => (
  <svg {...basis(p)}><path d="M18 6L6 18M6 6l12 12" /></svg>
);
export const IcoonVolledig = (p: P) => (
  <svg {...basis(p)}><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
);
export const IcoonHart = ({ gevuld, ...p }: P & { gevuld?: boolean }) => (
  <svg {...basis(p)} fill={gevuld ? 'currentColor' : 'none'}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" /></svg>
);
export const IcoonKopie = (p: P) => (
  <svg {...basis(p)}><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" /></svg>
);
