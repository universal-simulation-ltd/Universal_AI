import { writable } from 'svelte/store'

// User-facing preferences, persisted to localStorage so they survive reloads.
// Kept separate from the engine/RAG orchestration in `stores.ts` — this is just
// "how the user wants the app to look and behave".

export type ThemePref = 'light' | 'dark' | 'system'

export interface Settings {
  /** Colour theme. 'system' follows the OS light/dark setting. LIGHT until the
   *  user picks otherwise — the suite rule is that an app never opens dark on
   *  its own, even on a device set to dark. */
  theme: ThemePref
  /**
   * Has the user actually picked a theme in Customise? Needed because this whole
   * object is written back to storage on every load, and the default used to be
   * 'system' — so every earlier visitor has `theme: 'system'` saved whether or
   * not they ever chose it. A saved 'system' WITHOUT this flag is that old
   * default, not a choice, and is read as 'light'. 'light' / 'dark' were only
   * ever saved by a click, so they are honoured as they are.
   *
   * ⚠️ index.html repeats this rule in its pre-paint script — change both.
   */
  themeChosen: boolean
  /** Optional name for the assistant itself ("my name") — what it calls itself. */
  aiName: string
  /** Optional display name for the user ("your name") so the assistant can
   *  address the user by name. */
  userName: string
  /**
   * The chosen character / "Knowledge" persona id (see personas.ts). Empty
   * string = the plain assistant with no particular personality. Picked on the
   * first-run welcome screen and changeable later in Customise.
   */
  personaId: string
  /**
   * Opt-in online web search. OFF by default — the app is offline-first, so
   * leaving the device for a search is a deliberate choice. When ON (and the
   * device is online) enabled chats can cite real URLs alongside local docs.
   */
  webSearch: boolean
  /**
   * Safe mode — on by default. When on, the assistant refuses to discuss adult,
   * sexual, gambling, or otherwise inappropriate topics.
   */
  safeMode: boolean
  /**
   * Clear on close — on by default. Clears the conversation history when the
   * browser tab/window is closed, so no chat lingers between sessions.
   */
  clearOnClose: boolean
}

const KEY = 'universal-ai:settings'

const DEFAULTS: Settings = {
  theme: 'light',
  themeChosen: false,
  aiName: '',
  userName: '',
  personaId: '',
  webSearch: false,
  safeMode: true,
  clearOnClose: true,
}

function load(): Settings {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null
    if (!raw) return { ...DEFAULTS }
    const s: Settings = { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) }
    // The old 'system' default, saved without anyone choosing it — see
    // `themeChosen`. Light, as a new visitor gets.
    if (s.theme === 'system' && !s.themeChosen) s.theme = 'light'
    return s
  } catch {
    return { ...DEFAULTS }
  }
}

export const settings = writable<Settings>(load())

// Declared before the subscribe below, which fires synchronously on creation and
// calls applyTheme() → reads mediaQuery. If this `let` sat after the subscribe,
// that first call would hit its temporal dead zone: V8 tolerates it, but
// JavaScriptCore (Safari / iOS WKWebView) throws, blanking the app on launch.
let mediaQuery: MediaQueryList | null = null

/** The browser-chrome tint for each theme: the top bar's own surface in light,
 *  the dark ground it always used in dark. Kept in step with index.html.
 *  ⚠️ Up here for the same temporal-dead-zone reason as `mediaQuery` — the
 *  first applyTheme() runs during the subscribe below, and a `const` declared
 *  after it blanks the app ("Cannot access 'THEME_COLOR' before
 *  initialization"), which is exactly what happened when it sat lower down. */
const THEME_COLOR = { light: '#f6f8fb', dark: '#0b0d12' } as const

// Persist + re-apply the theme on every change.
settings.subscribe((s) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    // storage unavailable (private mode etc.) — settings stay in memory only
  }
  applyTheme(s.theme)
})

/** Resolve 'system' to the OS preference; 'light'/'dark' pass through. */
function resolveTheme(pref: ThemePref): 'light' | 'dark' {
  if (pref === 'system') {
    const dark =
      typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches
    return dark ? 'dark' : 'light'
  }
  return pref
}

/**
 * Apply the resolved theme to <html data-theme> (app.css keys its variable sets
 * off this attribute). For 'system' we also subscribe to OS changes so the app
 * re-themes live without a reload.
 */
export function applyTheme(pref: ThemePref): void {
  if (typeof document === 'undefined') return
  paint(resolveTheme(pref))

  // (Re)wire the OS listener only while tracking the system preference.
  if (mediaQuery) {
    mediaQuery.onchange = null
    mediaQuery = null
  }
  if (pref === 'system' && typeof matchMedia !== 'undefined') {
    mediaQuery = matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.onchange = () => paint(resolveTheme('system'))
  }
}

function paint(theme: 'light' | 'dark'): void {
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme])
}

export function setTheme(theme: ThemePref): void {
  settings.update((s) => ({ ...s, theme, themeChosen: true }))
}

export function setAiName(aiName: string): void {
  settings.update((s) => ({ ...s, aiName }))
}

export function setUserName(userName: string): void {
  settings.update((s) => ({ ...s, userName }))
}

export function setPersona(personaId: string): void {
  settings.update((s) => ({ ...s, personaId }))
}

export function setWebSearch(webSearch: boolean): void {
  settings.update((s) => ({ ...s, webSearch }))
}

export function setSafeMode(safeMode: boolean): void {
  settings.update((s) => ({ ...s, safeMode }))
}

export function setClearOnClose(clearOnClose: boolean): void {
  settings.update((s) => ({ ...s, clearOnClose }))
}
