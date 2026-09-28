import type { Article } from './types'
import en from './en'

export type { Article } from './types'

// The same eight languages as the rest of the suite's knowledge bases. This
// app's own interface is English-only, so the reader carries its own language
// picker rather than following an app setting that does not exist.
export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
  { code: 'it', label: 'Italiano' },
  { code: 'de', label: 'Deutsch' },
  { code: 'pt-BR', label: 'Português (Brasil)' },
  { code: 'pt-PT', label: 'Português (Portugal)' },
  { code: 'tr', label: 'Türkçe' },
] as const

export type KbLanguage = (typeof LANGUAGES)[number]['code']

// English ships in the main bundle; each translation is its own chunk, loaded
// only when the reader's language asks for it.
const LOADERS: Record<string, () => Promise<{ default: Article[] }>> = {
  fr: () => import('./fr'),
  es: () => import('./es'),
  it: () => import('./it'),
  de: () => import('./de'),
  'pt-BR': () => import('./pt-BR'),
  'pt-PT': () => import('./pt-PT'),
  tr: () => import('./tr'),
}

/** Articles for a language. Throws if a translation chunk fails to load. */
export async function loadArticles(language: string): Promise<Article[]> {
  const load = LOADERS[language]
  return load ? (await load()).default : en
}

/** Best match for the device's languages; English when nothing fits. */
export function detectLanguage(prefs: readonly string[]): KbLanguage {
  for (const raw of prefs) {
    const tag = raw.toLowerCase()
    if (tag === 'pt-br') return 'pt-BR'
    if (tag.startsWith('pt')) return 'pt-PT'
    const base = tag.split('-')[0]
    const hit = LANGUAGES.find((l) => l.code === base)
    if (hit) return hit.code
  }
  return 'en'
}

// The reader's own words. Taken from @unisim/sdk's i18n (kb.*, menu.*, nav.*)
// so they read the same as the knowledge base in the other Universal Apps.
export const UI: Record<KbLanguage, {
  title: string
  back: string
  close: string
  loading: string
  failed: string
  language: string
}> = {
  en: { title: 'Knowledge base', back: 'All articles', close: 'Close', loading: 'Loading…', failed: "The articles couldn't be loaded. Check your connection and try again.", language: 'Language' },
  fr: { title: 'Base de connaissances', back: 'Tous les articles', close: 'Fermer', loading: 'Chargement…', failed: 'Impossible de charger les articles. Vérifiez votre connexion et réessayez.', language: 'Langue' },
  es: { title: 'Base de conocimientos', back: 'Todos los artículos', close: 'Cerrar', loading: 'Cargando…', failed: 'No se han podido cargar los artículos. Compruebe su conexión e inténtelo de nuevo.', language: 'Idioma' },
  it: { title: 'Knowledge base', back: 'Tutti gli articoli', close: 'Chiudi', loading: 'Caricamento…', failed: 'Impossibile caricare gli articoli. Controlla la connessione e riprova.', language: 'Lingua' },
  de: { title: 'Wissensdatenbank', back: 'Alle Artikel', close: 'Schließen', loading: 'Wird geladen…', failed: 'Die Artikel konnten nicht geladen werden. Prüfen Sie Ihre Verbindung und versuchen Sie es erneut.', language: 'Sprache' },
  'pt-BR': { title: 'Base de conhecimento', back: 'Todos os artigos', close: 'Fechar', loading: 'Carregando…', failed: 'Não foi possível carregar os artigos. Verifique sua conexão e tente novamente.', language: 'Idioma' },
  'pt-PT': { title: 'Base de conhecimento', back: 'Todos os artigos', close: 'Fechar', loading: 'A carregar…', failed: 'Não foi possível carregar os artigos. Verifique a ligação e tente novamente.', language: 'Idioma' },
  tr: { title: 'Bilgi bankası', back: 'Tüm makaleler', close: 'Kapat', loading: 'Yükleniyor…', failed: 'Makaleler yüklenemedi. Bağlantınızı kontrol edip tekrar deneyin.', language: 'Dil' },
}
