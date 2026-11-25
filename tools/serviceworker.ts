// Vite-plugin: bouwt src/sw.ts als dist/sw.js en vult de precache (alle bestanden van de build plus public/) en de
// versie (een hash van hun inhoud) in. Een preview (VITE_PREVIEW) krijgt geen service worker.
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'
import { precacheLijst } from '../src/lib/pwa.ts'

function bestandenIn(map: string): string[] {
  if (!fs.existsSync(map)) return []
  return fs.readdirSync(map, { recursive: true, encoding: 'utf8' }).filter((b) => fs.statSync(path.join(map, b)).isFile())
}

export function serviceWorker(): Plugin {
  let publicMap = ''
  let preview = false
  return {
    name: 'eeltje-serviceworker',
    apply: 'build',
    configResolved(config) {
      publicMap = config.publicDir
      preview = !!config.env.VITE_PREVIEW
    },
    buildStart() {
      if (!preview) this.emitFile({ type: 'chunk', id: path.resolve(import.meta.dirname, '../src/sw.ts'), fileName: 'sw.js' })
    },
    generateBundle: {
      order: 'post',
      handler(_, bundle) {
        const sw = bundle['sw.js']
        if (!sw) return
        if (sw.type !== 'chunk') throw new Error('sw.js is geen chunk')
        // Een service worker zonder type: 'module' kent geen import; alles moet in sw.js zelf zitten.
        if (sw.imports.length || sw.dynamicImports.length) throw new Error(`sw.js importeert ${[...sw.imports, ...sw.dynamicImports].join(', ')}`)

        const inhoud = new Map<string, string | Uint8Array>()
        for (const b of bestandenIn(publicMap)) inhoud.set(b, fs.readFileSync(path.join(publicMap, b)))
        for (const [naam, b] of Object.entries(bundle)) inhoud.set(naam, b.type === 'chunk' ? b.code : b.source)
        const lijst = precacheLijst([...inhoud.keys()])
        const hash = createHash('sha256')
        for (const naam of lijst) hash.update(naam).update(inhoud.get(naam)!)
        const versie = hash.digest('hex').slice(0, 12)

        sw.code = sw.code.replaceAll('__PRECACHE__', JSON.stringify(lijst)).replaceAll('__VERSIE__', JSON.stringify(versie))
        if (/__PRECACHE__|__VERSIE__/.test(sw.code)) throw new Error('sw.js: precache of versie niet ingevuld')
      },
    },
  }
}
