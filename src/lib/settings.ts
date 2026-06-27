import { writable } from 'svelte/store'

// User-facing preferences, persisted to localStorage so they survive reloads.
// Kept separate from the engine/RAG orchestration in `stores.ts` — this is just
// "how the user wants the app to look and behave".

export type ThemePref = 'light' | 'dark' | 'system'

export interface Settings {
  /** Colour theme. 'system' follows the OS light/dark setting. */
  theme: ThemePref
  /** Optional name for the assistant itself ("my name") — what it calls itself. */
  aiName: string
  /** Optional display name for the user ("your name") so the assistant can
   *  address the user by name. */
  userName: string
  /**
   * Opt-in online web search. OFF by default — the app is offline-first, so
   * leaving the device for a search is a deliberate choice. When ON (and the
   * device is online) enabled chats can cite real URLs alongside local docs.
   */
  webSearch: boolean
}

const KEY = 'universal-ai:settings'

const DEFAULTS: Settings = {
  theme: 'system',
  aiName: '',
  userName: '',
  webSearch: false,
}

function load(): Settings {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null
    if (!raw) return { ...DEFAULTS }
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) }
  } catch {
    return { ...DEFAULTS }
  }
}

export const settings = writable<Settings>(load())

// Persist + re-apply the theme on every change.
settings.subscribe((s) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    // storage unavailable (private mode etc.) — settings stay in memory only
  }
  applyTheme(s.theme)
})

let mediaQuery: MediaQueryList | null = null

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
  document.documentElement.dataset.theme = resolveTheme(pref)

  // (Re)wire the OS listener only while tracking the system preference.
  if (mediaQuery) {
    mediaQuery.onchange = null
    mediaQuery = null
  }
  if (pref === 'system' && typeof matchMedia !== 'undefined') {
    mediaQuery = matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.onchange = () => {
      document.documentElement.dataset.theme = resolveTheme('system')
    }
  }
}

export function setTheme(theme: ThemePref): void {
  settings.update((s) => ({ ...s, theme }))
}

export function setAiName(aiName: string): void {
  settings.update((s) => ({ ...s, aiName }))
}

export function setUserName(userName: string): void {
  settings.update((s) => ({ ...s, userName }))
}

export function setWebSearch(webSearch: boolean): void {
  settings.update((s) => ({ ...s, webSearch }))
}
