// bun tools/kijk/iconen.mjs: maakt de iconen in public/iconen uit één plectrum. Draai opnieuw na een wijziging hier.
// De PNG's rendert headless Chrome; daarom staat dit script naast kijk.mjs (zelfde puppeteer-core).
import fs from 'node:fs'
import path from 'node:path'
import puppeteer from 'puppeteer-core'

const UIT = path.resolve(import.meta.dirname, '../../public/iconen')
const ACCENT = '#a8480c'
const ROOM = '#faf7f2'

// Plectrum in een vak van 512: brede bovenkant, punt naar beneden. Met een snaar erdoorheen.
const plectrum = (kleur, snaar) => `
  <path d="M256 70C366 70 442 112 442 182C442 286 334 404 256 446C178 404 70 286 70 182C70 112 146 70 256 70Z" fill="${kleur}"/>
  <path d="M256 70V446" stroke="${snaar}" stroke-width="14" stroke-linecap="round" opacity="0.35"/>`

// `schaal`: hoe groot het plectrum is; bij maskable moet hij binnen de veilige cirkel van 80% blijven.
const icoon = ({ achtergrond, hoek = 0, schaal = 1 }) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  ${achtergrond ? `<rect width="512" height="512" rx="${hoek}" fill="${achtergrond}"/>` : ''}
  <g transform="translate(256 258) scale(${schaal}) translate(-256 -258)">${achtergrond ? plectrum(ROOM, ACCENT) : plectrum(ACCENT, ROOM)}</g>
</svg>
`

const bestanden = [
  { naam: 'icoon.svg', svg: icoon({}) },
  { naam: 'icoon-192.png', grootte: 192, svg: icoon({ achtergrond: ACCENT, hoek: 96, schaal: 0.8 }) },
  { naam: 'icoon-512.png', grootte: 512, svg: icoon({ achtergrond: ACCENT, hoek: 96, schaal: 0.8 }) },
  { naam: 'icoon-maskable-512.png', grootte: 512, svg: icoon({ achtergrond: ACCENT, schaal: 0.6 }) },
  { naam: 'apple-touch-icon.png', grootte: 180, svg: icoon({ achtergrond: ACCENT, schaal: 0.7 }) },
]

fs.mkdirSync(UIT, { recursive: true })
const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox'] })
try {
  const page = await browser.newPage()
  for (const { naam, grootte, svg } of bestanden) {
    if (!grootte) {
      fs.writeFileSync(path.join(UIT, naam), svg)
    } else {
      await page.setViewport({ width: grootte, height: grootte, deviceScaleFactor: 1 })
      await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:100vw;height:100vh}</style>${svg}`)
      await page.screenshot({ path: path.join(UIT, naam), omitBackground: true })
    }
    console.log(naam)
  }
} finally {
  await browser.close()
}
