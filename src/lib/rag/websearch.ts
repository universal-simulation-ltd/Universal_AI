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
 * Run a web search for `query`, then score the returned snippets locally with
 * the same embedding model used everywhere else, so web hits rank coherently
 * against local-document / bundled-pack hits in retrieve(). Returns
 * RetrievedChunk[] (each with a `url`). Never throws — on any failure (offline,
 * CORS, rate limit) it resolves to [] so chat degrades gracefully to local-only.
 */
export async function webSearch(query: string, k = 3): Promise<RetrievedChunk[]> {
  try {
    const raw = await fetchRawResults(query, k)
    const usable = raw.filter((r) => r.snippet.length > 0)
    if (usable.length === 0) return []
    const [qVec, ...snippetVecs] = await embed([query, ...usable.map((r) => r.snippet)])
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
