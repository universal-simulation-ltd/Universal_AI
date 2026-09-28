// Where the page sits under the status bar — the decision behind the glyphs.
//
//   npm run test:status-bar
//
// Runs under Node's type-stripping, so `src/lib/systemBars.ts` is imported
// directly; it has no static imports for exactly that reason.
//
// What is being pinned. The glyphs follow the app's theme only where the page
// is drawn under the bar (iOS, and Android with a WebView from Chromium 140 —
// Capacitor SystemBars' own rule). Anywhere else the strip is the phone-mode
// window background and the glyphs must be left to follow the phone.

import { pageUnderStatusBar } from '../src/lib/systemBars.ts'

let failed = 0
const check = (label, actual, expected) => {
  const ok = actual === expected
  if (!ok) failed++
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label} → ${actual}${ok ? '' : ` (expected ${expected})`}`)
}

const android = (chrome) =>
  `Mozilla/5.0 (Linux; Android 15; Pixel 9 Build/AP3A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/${chrome}.0.0.0 Mobile Safari/537.36`

check('iOS is always under the bar', pageUnderStatusBar('ios', 'Mozilla/5.0 (iPhone)'), true)
check('Android WebView 124 is padded natively', pageUnderStatusBar('android', android(124)), false)
check('Android WebView 139 is padded natively', pageUnderStatusBar('android', android(139)), false)
check('Android WebView 140 is edge-to-edge', pageUnderStatusBar('android', android(140)), true)
check('Android WebView 141 is edge-to-edge', pageUnderStatusBar('android', android(141)), true)
check('Android with no Chrome token is padded natively', pageUnderStatusBar('android', 'Mozilla/5.0'), false)
check('the plain web is never under a native bar', pageUnderStatusBar('web', android(141)), false)

if (failed) {
  console.error(`\n${failed} check(s) failed`)
  process.exit(1)
}
console.log('\nall status-bar checks passed')
