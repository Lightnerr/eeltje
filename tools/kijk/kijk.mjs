// bun kijk.mjs <uitmap> <route...>
// Maakt per route een screenshot op elke breedte en in licht en donker (via prefers-color-scheme).
// Route: /pad (de hash-route, dus /liedjes/wonderwall wordt #/liedjes/wonderwall) of /pad!selector (tik vóór de screenshot).
// De preview-build start met de demo-voortgang (src/lib/demo.ts). KIJK_NIEUW=1 begint als nieuwe gebruiker.
// Omgeving: KIJK_BASE (standaard http://127.0.0.1:5177, ook een PR-preview op GitHub Pages), KIJK_BREEDTES (360,1280),
// KIJK_THEMAS (licht,donker), KIJK_HOOGTE (vaste hoogte zonder fullPage), KIJK_EVAL (js na het laden, resultaat gelogd).
import fs from 'node:fs'
import puppeteer from 'puppeteer-core'

const [uit, ...routes] = process.argv.slice(2)
if (!uit || routes.length === 0) {
  console.error('Gebruik: bun kijk.mjs <uitmap> <route...>')
  process.exit(1)
}
const base = (process.env.KIJK_BASE || 'http://127.0.0.1:5177').replace(/\/$/, '')
const hoogte = Number(process.env.KIJK_HOOGTE || 0)
const breedtes = (process.env.KIJK_BREEDTES || '360,1280').split(',').map(Number)
const themas = (process.env.KIJK_THEMAS || 'licht,donker').split(',')
fs.mkdirSync(uit, { recursive: true })

const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', '--no-proxy-server'] })
try {
  const page = await browser.newPage()
  page.on('dialog', (d) => d.dismiss())
  // Niet op Vandaag beginnen: die bewaart de routine van vandaag, mogelijk pas nadat de opslag hieronder leeg is.
  await page.goto(base + '/#/kijk-leeg')
  await page.evaluate((nieuw) => {
    for (const k of Object.keys(localStorage)) if (k.startsWith('eeltje.voortgang')) localStorage.removeItem(k)
    if (nieuw) for (const k of ['eeltje.voortgang.v1', 'eeltje.voortgang.v1.kijk']) localStorage.setItem(k, '{"versie":1}')
  }, !!process.env.KIJK_NIEUW)

  for (const thema of themas) {
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: thema === 'donker' ? 'dark' : 'light' }])
    for (const route of routes) {
      const [pad, tik] = route.split('!')
      for (const breedte of breedtes) {
        await page.setViewport({ width: breedte, height: hoogte || 800, deviceScaleFactor: 1 })
        await page.goto(`${base}/#${pad}`, { waitUntil: 'networkidle0' })
        await page.reload({ waitUntil: 'networkidle0' })
        if (tik) {
          await page.$eval(tik, (el) => el.click())
          await new Promise((r) => setTimeout(r, 400))
        }
        await new Promise((r) => setTimeout(r, 250))
        if (process.env.KIJK_EVAL) console.log('EVAL', pad, breedte, JSON.stringify(await page.evaluate(process.env.KIJK_EVAL)))
        const scrollbreedte = await page.evaluate(() => document.documentElement.scrollWidth)
        const naam = `${uit}/${pad.replace(/[^a-z0-9]+/gi, '_') || '_'}${tik ? '-tik' : ''}-${breedte}-${thema}.png`
        if (!hoogte) {
          await page.setViewport({ width: breedte, height: await page.evaluate(() => document.documentElement.scrollHeight), deviceScaleFactor: 1 })
          await new Promise((r) => setTimeout(r, 150))
        }
        await page.screenshot({ path: naam })
        console.log(naam, scrollbreedte > breedte ? `HORIZONTAAL SCROLLT: ${scrollbreedte}px` : '')
      }
    }
  }
} finally {
  await browser.close()
}
