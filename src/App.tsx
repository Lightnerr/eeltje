import type { ReactNode } from 'react';
import { useRoute, href } from './hooks/useRoute';
import { IcoonAkkoorden, IcoonLiedjes, IcoonOefenen, IcoonVandaag, IcoonVoortgang } from './components/Iconen';
import Vandaag from './pages/Vandaag';
import Akkoorden from './pages/Akkoorden';
import AkkoordDetail from './pages/AkkoordDetail';
import Liedjes from './pages/Liedjes';
import LiedjeDetail from './pages/LiedjeDetail';
import Meespelen from './pages/Meespelen';
import Oefenen from './pages/Oefenen';
import MetronoomPagina from './pages/MetronoomPagina';
import Slagpatroon from './pages/Slagpatroon';
import OefeningDetail from './pages/OefeningDetail';
import OneMinuteChanges from './pages/OneMinuteChanges';
import SpiderLadder from './pages/SpiderLadder';
import Wisselreeks from './pages/Wisselreeks';
import VoortgangPagina from './pages/VoortgangPagina';
import NietGevonden from './pages/NietGevonden';

const TABS = [
  { pad: 'vandaag', naam: 'Vandaag', Icoon: IcoonVandaag },
  { pad: 'akkoorden', naam: 'Akkoorden', Icoon: IcoonAkkoorden },
  { pad: 'liedjes', naam: 'Liedjes', Icoon: IcoonLiedjes },
  { pad: 'oefenen', naam: 'Oefenen', Icoon: IcoonOefenen },
  { pad: 'voortgang', naam: 'Voortgang', Icoon: IcoonVoortgang },
];

function pagina(pad: string[]): ReactNode {
  const [tab = 'vandaag', a, b] = pad;
  switch (tab) {
    case 'vandaag':
      return <Vandaag />;
    case 'akkoorden':
      return a ? <AkkoordDetail naam={a} /> : <Akkoorden />;
    case 'liedjes':
      if (a && b === 'meespelen') return <Meespelen id={a} />;
      return a ? <LiedjeDetail id={a} /> : <Liedjes />;
    case 'oefenen':
      switch (a) {
        case undefined:
          return <Oefenen />;
        case 'metronoom':
          return <MetronoomPagina />;
        case 'slagpatroon':
          return <Slagpatroon />;
        case 'one-minute-changes':
          return <OneMinuteChanges />;
        case 'spider-ladder':
          return <SpiderLadder />;
        case 'wisselreeks':
          return <Wisselreeks />;
        default:
          return <OefeningDetail id={a} />;
      }
    case 'voortgang':
      return <VoortgangPagina />;
    default:
      return <NietGevonden />;
  }
}

export default function App() {
  const pad = useRoute();
  const actief = pad[0] ?? 'vandaag';
  return (
    <div className="app">
      <a className="overslaan knop" href="#inhoud" onClick={(e) => { e.preventDefault(); document.getElementById('inhoud')?.focus(); }}>
        Naar inhoud
      </a>
      <nav className="hoofdnav" aria-label="Hoofdmenu">
        {TABS.map(({ pad: p, naam, Icoon }) => (
          <a key={p} href={href(p)} aria-current={actief === p ? 'page' : undefined}>
            <Icoon />
            {naam}
          </a>
        ))}
      </nav>
      <main id="inhoud" tabIndex={-1}>
        {pagina(pad)}
      </main>
    </div>
  );
}
