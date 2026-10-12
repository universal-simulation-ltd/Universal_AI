import { embed, cosine } from './embeddings'
import type { RetrievedChunk } from './index'

// Opt-in online retrieval source. When the user turns web search ON (Customise
// tab) and the device is online, enabled chats can pull a few snippets from the
// web and feed them through the SAME retrieve()/buildContext() → [n] citation
// pipeline as local docs — the only difference is each source carries a real
// clickable URL.
//
// Default provider is the **keyless, CORS-enabled Wikipedia REST search** so the
// feature works out of the box with no API key and no proxy. The shape below is
// deliberately provider-agnostic: swapping in Brave / Tavily / SearXNG is just a
// new `fetchRawResults` implementation that returns {title, snippet, url}.

interface RawResult {
  title: string
  snippet: string
  url: string
}

/** Strip the <span class="searchmatch"> highlight markup Wikipedia returns. */
function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()
}

// Common words that carry no search meaning. Wikipedia is searched in English,
// so the list is English; anything else simply survives as a key word.
const STOP_WORDS = new Set(
  (
    'a an the and or but if then so of to in on at by for with from about into over ' +
    'is are was were be been being am do does did done have has had having can could ' +
    'will would shall should may might must i me my mine you your yours he him his she ' +
    'her hers it its we us our they them their this that these those there here what ' +
    'which who whom whose when where why how please tell explain describe give show ' +
    'know think want like just also very really some any all more most much many no ' +
    'not yes ok okay hi hello hey thanks thank name called email phone let lets let\'s i\'m im it\'s whats what\'s'
  ).split(' '),
)

/** Most words sent to Wikipedia, and most characters. */
const MAX_QUERY_WORDS = 8
const MAX_QUERY_CHARS = 100

/**
 * The few key words of a chat message, which is all that goes to Wikipedia —
 * never the message itself (privacy audit 2026-10-12). Drops common words,
 * repeats and anything that looks like an email address, phone number or
 * link, keeps the first {@link MAX_QUERY_WORDS} that are left, and caps the
 * result at {@link MAX_QUERY_CHARS} characters. Empty when nothing is left, in
 * which case no search is made.
 */
export function toSearchQuery(message: string): string {
  const seen = new Set<string>()
  const words: string[] = []
  for (const raw of message.split(/\s+/)) {
    if (words.length >= MAX_QUERY_WORDS) break
    if (/@|:\/\/|^www\./i.test(raw)) continue
    const word = raw.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '')
    if (!word) continue
    const lower = word.toLowerCase()
    if (STOP_WORDS.has(lower) || seen.has(lower)) continue
    if (/\d{5,}/.test(word)) continue
    seen.add(lower)
    words.push(word)
  }
  let q = ''
  for (const w of words) {
    const next = q ? q + ' ' + w : w
    if (next.length > MAX_QUERY_CHARS) break
    q = next
  }
  return q
}

async function fetchRawResults(query: string, limit: number): Promise<RawResult[]> {
  const url =
    'https://en.wikipedia.org/w/rest.php/v1/search/page?q=' +
    encodeURIComponent(query) +
    '&limit=' +
    Math.max(1, Math.min(limit, 10))
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`Web search failed (${res.status})`)
  const data = (await res.json()) as {
    pages?: { key: string; title: string; excerpt?: string; description?: string }[]
  }
  return (data.pages ?? []).map((p) => ({
    title: p.title,
    snippet: stripHtml(p.excerpt ?? p.description ?? ''),
    url: 'https://en.wikipedia.org/wiki/' + encodeURIComponent(p.key),
  }))
}

/**
 * Search the web for the key words of `message` ({@link toSearchQuery} — only
 * those leave the device), then score the returned snippets locally with
 * the same embedding model used everywhere else, so web hits rank coherently
 * against local-document / bundled-pack hits in retrieve(). Returns
 * RetrievedChunk[] (each with a `url`). Never throws — on any failure (offline,
 * CORS, rate limit) it resolves to [] so chat degrades gracefully to local-only.
 */
export async function webSearch(message: string, k = 3): Promise<RetrievedChunk[]> {
  try {
    const query = toSearchQuery(message)
    if (!query) return []
    const raw = await fetchRawResults(query, k)
    const usable = raw.filter((r) => r.snippet.length > 0)
    if (usable.length === 0) return []
    const [qVec, ...snippetVecs] = await embed([message, ...usable.map((r) => r.snippet)])
    return usable.map((r, i) => ({
      text: r.snippet,
      source: r.title,
      url: r.url,
      score: cosine(qVec, snippetVecs[i]),
    }))
  } catch {
    return []
  }
}
