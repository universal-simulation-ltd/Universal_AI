import type { Article } from './types'
import en from './en'
import { SOURCES } from './sources'

export type { Article, Source } from './types'

/**
 * The guide PDFs, one per article per language, printed by universal-platform's
 * packages/sdk/scripts/kb-pdfs.mjs and served by the portal. Re-run it after
 * editing an article or a source, and commit the output to the portal.
 */
export const GUIDES_BASE = 'https://opensource.unisim.co.uk/kb/ai'
/** Where hosted papers (`source.pdf`, library-relative) are served from. */
export const LIBRARY_URL = 'https://opensource.unisim.co.uk/kb'

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

// The research behind each article is the same in every language, so it is
// kept once, in ./sources, and attached here by article id.
const withSources = (articles: Article[]): Article[] =>
  articles.map((a) => (SOURCES[a.id] ? { ...a, sources: SOURCES[a.id] } : a))

/** Articles for a language. Throws if a translation chunk fails to load. */
export async function loadArticles(language: string): Promise<Article[]> {
  const load = LOADERS[language]
  return withSources(load ? (await load()).default : en)
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
  intro: string
  read: string
  sources: string
  sourcesCount: string
  sourcesCountOne: string
  downloadGuide: string
  publisher: string
  readSource: string
  previous: string
  next: string
  kinds: Record<'paper' | 'standard' | 'report' | 'guidance' | 'law', string>
}> = {
  en: { title: 'Knowledge base', back: 'All articles', close: 'Close', loading: 'Loading…', failed: "The articles couldn't be loaded. Check your connection and try again.", language: 'Language', intro: "Plain-English guides to how Universal AI works, with the research and standards behind them.", read: "Read", sources: "Research and sources", sourcesCount: "{n} sources", sourcesCountOne: "1 source", downloadGuide: "Download this guide (PDF)", publisher: "Publisher", readSource: "Read at source", previous: "Previous", next: "Next", kinds: { paper: "Research paper", standard: "Standard", report: "Report", guidance: "Guidance", law: "Law" } },
  fr: { title: 'Base de connaissances', back: 'Tous les articles', close: 'Fermer', loading: 'Chargement…', failed: 'Impossible de charger les articles. Vérifiez votre connexion et réessayez.', language: 'Langue', intro: "Des guides en langage clair sur le fonctionnement de Universal AI, avec les recherches et les normes sur lesquelles ils s'appuient.", read: "Lire", sources: "Recherches et sources", sourcesCount: "{n} sources", sourcesCountOne: "1 source", downloadGuide: "Télécharger ce guide (PDF)", publisher: "Éditeur", readSource: "Lire à la source", previous: "Précédent", next: "Suivant", kinds: { paper: "Article de recherche", standard: "Norme", report: "Rapport", guidance: "Recommandations", law: "Législation" } },
  es: { title: 'Base de conocimientos', back: 'Todos los artículos', close: 'Cerrar', loading: 'Cargando…', failed: 'No se han podido cargar los artículos. Compruebe su conexión e inténtelo de nuevo.', language: 'Idioma', intro: "Guías claras sobre cómo funciona Universal AI, con la investigación y las normas en que se basan.", read: "Leer", sources: "Investigación y fuentes", sourcesCount: "{n} fuentes", sourcesCountOne: "1 fuente", downloadGuide: "Descargar esta guía (PDF)", publisher: "Editor", readSource: "Leer en la fuente", previous: "Anterior", next: "Siguiente", kinds: { paper: "Artículo de investigación", standard: "Norma", report: "Informe", guidance: "Guía", law: "Legislación" } },
  it: { title: 'Knowledge base', back: 'Tutti gli articoli', close: 'Chiudi', loading: 'Caricamento…', failed: 'Impossibile caricare gli articoli. Controlla la connessione e riprova.', language: 'Lingua', intro: "Guide chiare su come funziona Universal AI, con le ricerche e gli standard su cui si basano.", read: "Leggi", sources: "Ricerche e fonti", sourcesCount: "{n} fonti", sourcesCountOne: "1 fonte", downloadGuide: "Scarica questa guida (PDF)", publisher: "Editore", readSource: "Leggi alla fonte", previous: "Precedente", next: "Successivo", kinds: { paper: "Articolo di ricerca", standard: "Standard", report: "Rapporto", guidance: "Linee guida", law: "Normativa" } },
  de: { title: 'Wissensdatenbank', back: 'Alle Artikel', close: 'Schließen', loading: 'Wird geladen…', failed: 'Die Artikel konnten nicht geladen werden. Prüfen Sie Ihre Verbindung und versuchen Sie es erneut.', language: 'Sprache', intro: "Verständliche Anleitungen dazu, wie Universal AI funktioniert, mit der Forschung und den Normen dahinter.", read: "Lesen", sources: "Forschung und Quellen", sourcesCount: "{n} Quellen", sourcesCountOne: "1 Quelle", downloadGuide: "Diese Anleitung herunterladen (PDF)", publisher: "Herausgeber", readSource: "An der Quelle lesen", previous: "Zurück", next: "Weiter", kinds: { paper: "Fachartikel", standard: "Norm", report: "Bericht", guidance: "Leitfaden", law: "Rechtsvorschrift" } },
  'pt-BR': { title: 'Base de conhecimento', back: 'Todos os artigos', close: 'Fechar', loading: 'Carregando…', failed: 'Não foi possível carregar os artigos. Verifique sua conexão e tente novamente.', language: 'Idioma', intro: "Guias claros sobre como o Universal AI funciona, com as pesquisas e as normas em que se baseiam.", read: "Ler", sources: "Pesquisas e fontes", sourcesCount: "{n} fontes", sourcesCountOne: "1 fonte", downloadGuide: "Baixar este guia (PDF)", publisher: "Editora", readSource: "Ler na fonte", previous: "Anterior", next: "Próximo", kinds: { paper: "Artigo científico", standard: "Norma", report: "Relatório", guidance: "Orientações", law: "Legislação" } },
  'pt-PT': { title: 'Base de conhecimento', back: 'Todos os artigos', close: 'Fechar', loading: 'A carregar…', failed: 'Não foi possível carregar os artigos. Verifique a ligação e tente novamente.', language: 'Idioma', intro: "Guias claros sobre o funcionamento da Universal AI, com a investigação e as normas em que se baseiam.", read: "Ler", sources: "Investigação e fontes", sourcesCount: "{n} fontes", sourcesCountOne: "1 fonte", downloadGuide: "Transferir este guia (PDF)", publisher: "Editor", readSource: "Ler na fonte", previous: "Anterior", next: "Seguinte", kinds: { paper: "Artigo de investigação", standard: "Norma", report: "Relatório", guidance: "Orientações", law: "Legislação" } },
  tr: { title: 'Bilgi bankası', back: 'Tüm makaleler', close: 'Kapat', loading: 'Yükleniyor…', failed: 'Makaleler yüklenemedi. Bağlantınızı kontrol edip tekrar deneyin.', language: 'Dil', intro: "Universal AI uygulamasının nasıl çalıştığına dair anlaşılır rehberler ve dayandıkları araştırmalar ile standartlar.", read: "Oku", sources: "Araştırma ve kaynaklar", sourcesCount: "{n} kaynak", sourcesCountOne: "1 kaynak", downloadGuide: "Bu rehberi indir (PDF)", publisher: "Yayıncı", readSource: "Kaynağında oku", previous: "Önceki", next: "Sonraki", kinds: { paper: "Araştırma makalesi", standard: "Standart", report: "Rapor", guidance: "Kılavuz", law: "Mevzuat" } },
}
