#!/usr/bin/env node
// The web assets Capacitor copied into the native projects are loadable, and
// carry no service worker.
//
//   node scripts/verify-mobile-bundle.mjs
//
// ⚠️ This exists because getting it wrong is INVISIBLE until the app is on a
// phone: Xcode still reports BUILD SUCCEEDED, the icon is right, the version is
// right, and the app is a blank screen. Universal PDF 0.6.14 shipped to a real
// iPhone that way. Every Capacitor app in the suite carries this guard.
//
// Two failures it catches:
//
//   1. **A service worker in the bundle.** A production build emits `sw.js`,
//      `registerSW.js` and `workbox-*.js`, all built for
//      https://opensource.unisim.co.uk. They have no business inside a
//      `capacitor://localhost` app. This app shipped all three for its whole
//      life and got away with it — WKWebView does not support service workers
//      on a custom scheme — but that is WebKit's choice, not ours. Build with
//      `npm run build:mobile` (`--mode mobile`), which omits the PWA plugin.
//
//   2. **An asset URL that does not resolve inside the bundle.** The sibling
//      apps are served under a path prefix (`/blackbook/`, `/polling/`), so
//      they test for a leading `/` — for them it always means the web base.
//      This app's base is `/` on the web too, and `capacitor://localhost` roots
//      that at the copied directory, so a leading `/` here is CORRECT and that
//      test would only produce false alarms. Instead this resolves every local
//      asset URL against the bundle and checks the file is actually there,
//      which is base-agnostic and strictly stronger.
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const TARGETS = [
  ['iOS', 'ios/App/App/public'],
  ['Android', 'android/app/src/main/assets/public']
]

let failed = false
for (const [platform, dir] of TARGETS) {
  const bundle = join(ROOT, dir)
  const html = join(bundle, 'index.html')
  if (!existsSync(html)) {
    console.log(`${platform}: no copied bundle at ${dir} — skipped.`)
    continue
  }
  const source = readFileSync(html, 'utf8')

  // Local asset references only — anything with a scheme is a genuine remote.
  const missing = []
  for (const [, url] of source.matchAll(/(?:src|href)="([^"]+)"/g)) {
    if (/^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//') || url.startsWith('#')) continue
    const path = url.split(/[?#]/)[0].replace(/^\.?\//, '')
    if (path && !existsSync(join(bundle, path))) missing.push(url)
  }

  // Capacitor's own copy step does not prune, so a stale worker from an earlier
  // production build survives here too — check the directory, not just the HTML.
  const sw = readdirSync(bundle).filter(
    (f) => f === 'sw.js' || f === 'registerSW.js' || /^workbox-.*\.js$/.test(f)
  )

  if (missing.length === 0 && sw.length === 0) {
    console.log(`${platform}: every asset URL resolves inside the bundle, no service worker. OK`)
    continue
  }
  failed = true
  console.error(`${platform}: ${dir} is a WEB build, not a mobile one.`)
  for (const url of missing) console.error(`  asset URL does not resolve in the bundle: ${url}`)
  for (const f of sw) console.error(`  service worker present: ${f}`)
}

if (failed) {
  console.error('\nRebuild and re-copy:  npm run cap:sync')
  process.exit(1)
}
