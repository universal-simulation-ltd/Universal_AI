// The status bar's own glyphs (clock, signal, battery) follow the app's theme.
//
// ⚠️ WHY THIS EXISTS (Capacitor 8). The glyphs are drawn by the OS over whatever
// sits at the very top of the screen, and Capacitor 8's core SystemBars plugin
// decides what that is:
//
// - iOS, and Android with a WebView from Chromium 140: the page is drawn under
//   the status bar (index.html's `viewport-fit=cover`) and pads itself by
//   `env(safe-area-inset-top)`, so the glyphs sit over the APP's own ground —
//   light or dark by the theme picked in Customise.
// - Android with an older WebView: SystemBars pads the web view natively and
//   the glyphs sit over the window background, which the DayNight theme in
//   values/styles.xml draws in the PHONE's mode. SystemBars' DEFAULT style also
//   follows the phone, so the two already agree there and this leaves it alone.
//
// Left at DEFAULT everywhere, the glyphs follow the phone rather than the app:
// a dark app on a light-mode phone gets dark glyphs on its dark ground, and the
// clock is gone. So where the page really is under the bar, the glyphs follow
// the app's resolved theme (<html data-theme>, set by settings.ts), including
// every later change.
//
// ⚠️ Capacitor's names read backwards: `Dark` means "for a dark background",
// i.e. LIGHT glyphs.
//
// This module has NO static imports, so `scripts/systemBars.test.mjs` can load
// it under Node's type-stripping, and so nothing here reaches the network or
// the web bundle's startup path: `@capacitor/core` is imported dynamically, and
// only inside the native shell. SystemBars is a local, on-device call.

/** Is the page drawn under the status bar (so the app's ground is behind the glyphs)? */
export function pageUnderStatusBar(platform: string, userAgent: string): boolean {
  if (platform === 'ios') return true
  if (platform !== 'android') return false
  // SystemBars' own rule: edge-to-edge only on a WebView from Chromium 140.
  const major = Number(/Chrome\/(\d+)/.exec(userAgent)?.[1] ?? 0)
  return major >= 140
}

type CapacitorGlobal = { isNativePlatform?: () => boolean; getPlatform?: () => string }

/** Keeps the status-bar glyphs legible over the theme. Does nothing on the plain web. */
export function followThemeWithStatusBar(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  // The global the native runtime injects — present only inside the shell.
  const cap = (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor
  let platform = 'web'
  try {
    if (cap?.isNativePlatform?.() !== true) return
    platform = cap.getPlatform?.() ?? 'web'
  } catch {
    return
  }
  if (!pageUnderStatusBar(platform, navigator.userAgent)) return

  let last: string | null = null
  const apply = () => {
    const dark = document.documentElement.dataset.theme === 'dark'
    const style = dark ? 'DARK' : 'LIGHT'
    if (style === last) return
    last = style
    void (async () => {
      try {
        const { SystemBars, SystemBarsStyle } = await import('@capacitor/core')
        await SystemBars.setStyle({ style: dark ? SystemBarsStyle.Dark : SystemBarsStyle.Light })
      } catch {
        /* Cosmetic: a status bar that cannot be styled never breaks a render. */
      }
    })()
  }
  new MutationObserver(apply).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  })
  apply()
}
