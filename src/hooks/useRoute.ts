import { useEffect, useState } from 'react';

function huidigPad(): string[] {
  const hash = window.location.hash.replace(/^#\/?/, '');
  return hash.split('/').filter(Boolean).map(decodeURIComponent);
}

export function useRoute(): string[] {
  const [pad, setPad] = useState(huidigPad);
  useEffect(() => {
    const opWijziging = () => {
      setPad(huidigPad());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', opWijziging);
    return () => window.removeEventListener('hashchange', opWijziging);
  }, []);
  return pad;
}

export function href(...delen: string[]): string {
  return '#/' + delen.map(encodeURIComponent).join('/');
}

export function navigeer(...delen: string[]): void {
  window.location.hash = href(...delen).slice(1);
}
