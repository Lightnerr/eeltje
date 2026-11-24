import type { ReactNode } from 'react'
import { naarHash, type Tab } from '../lib/route'

const icoon = (pad: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {pad}
  </svg>
)

const TABS: { tab: Tab; label: string; icoon: ReactNode }[] = [
  {
    tab: 'vandaag',
    label: 'Vandaag',
    icoon: icoon(
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </>,
    ),
  },
  {
    tab: 'akkoorden',
    label: 'Akkoorden',
    icoon: icoon(
      <>
        <rect x="5" y="3" width="14" height="18" rx="1" />
        <path d="M5 8h14M5 13h14M9.7 3v18M14.3 3v18" />
        <circle cx="12" cy="10.5" r="1.2" fill="currentColor" />
      </>,
    ),
  },
  {
    tab: 'liedjes',
    label: 'Liedjes',
    icoon: icoon(
      <>
        <path d="M9 18V5l11-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="17" cy="16" r="3" />
      </>,
    ),
  },
  {
    tab: 'oefenen',
    label: 'Oefenen',
    icoon: icoon(
      <>
        <path d="M9 3h6l4 18H5L9 3z" />
        <path d="M12 17l4-9" />
        <path d="M8 13h8" />
      </>,
    ),
  },
  {
    tab: 'voortgang',
    label: 'Voortgang',
    icoon: icoon(<path d="M3 3v18h18M7 15l4-4 3 3 6-7" />),
  },
]

export function Tabbalk({ actief }: { actief: Tab | null }) {
  return (
    <nav className="tabbalk" aria-label="Hoofdmenu">
      <ul>
        {TABS.map((t) => (
          <li key={t.tab}>
            <a href={naarHash({ pagina: t.tab })} aria-current={t.tab === actief ? 'page' : undefined}>
              {t.icoon}
              <span>{t.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
