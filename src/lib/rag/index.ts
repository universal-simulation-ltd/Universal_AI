import { embed, embedOne, cosine } from './embeddings'
import {
  addChunks,
  getChunksFor,
  putKB,
  type Chunk,
  type KnowledgeBase,
} from './store'
import { ensurePackLoaded, searchPack } from './pack'

export * from './store'
export * from './pack'

/** KB ids with this prefix are served by the in-memory pack, not IndexedDB. */
export const BUILTIN_PREFIX = 'builtin:'

let counter = 0
function uid(prefix: string): string {
  // Avoids Math.random()/Date.now() restrictions in some contexts; monotonic +
  // perf time is unique enough for local IDs.
  return `${prefix}_${Math.floor(performance.now() * 1000)}_${counter++}`
}

/**
 * Split text into overlapping chunks on paragraph/sentence boundaries.
 * ~700 chars with ~120 char overlap keeps chunks inside the embedding model's
 * window while preserving context across boundaries.
 */
export function chunkText(text: string, size = 700, overlap = 120): string[] {
  const clean = text.replace(/\r\n/g, '\n').trim()
  if (clean.length <= size) return clean ? [clean] : []

  // Prefer splitting on blank lines, then single newlines, then sentences.
  const paras = clean.split(/\n\s*\n/)
  const chunks: string[] = []
  let buf = ''

  const flush = () => {
    if (buf.trim()) chunks.push(buf.trim())
    buf = ''
  }

  for (const para of paras) {
    if ((buf + '\n\n' + para).length > size) {
      flush()
      if (para.length > size) {
        // Hard-wrap an oversized paragraph with overlap.
        for (let i = 0; i < para.length; i += size - overlap) {
          chunks.push(para.slice(i, i + size).trim())
        }
      } else {
        buf = para
      }
    } else {
      buf = buf ? buf + '\n\n' + para : para
    }
  }
  flush()
  return chunks.filter(Boolean)
}

/** Create a KB from raw text: chunk, embed, and persist. */
export async function ingestDocument(
  name: string,
  text: string,
  source = name,
  onProgress?: (done: number, total: number) => void,
): Promise<KnowledgeBase> {
  const pieces = chunkText(text)
  const kbId = uid('kb')

  // Embed in small batches to keep memory flat and report progress.
  const batchSize = 16
  const chunks: Chunk[] = []
  for (let i = 0; i < pieces.length; i += batchSize) {
    const batch = pieces.slice(i, i + batchSize)
    const vecs = await embed(batch)
    batch.forEach((t, j) => {
      chunks.push({ id: uid('c'), kbId, text: t, source, embedding: vecs[j] })
    })
    onProgress?.(Math.min(i + batchSize, pieces.length), pieces.length)
  }

  await addChunks(chunks)
  const kb: KnowledgeBase = {
    id: kbId,
    name,
    enabled: true,
    chunkCount: chunks.length,
    createdAt: Math.floor(performance.timeOrigin + performance.now()),
  }
  await putKB(kb)
  return kb
}

export interface RetrievedChunk {
  text: string
  source: string
  score: number
}

/**
 * Top-k cosine retrieval across the given (enabled) KBs. KB ids prefixed with
 * `builtin:` are served by the in-memory pack (Simple Wikipedia); the rest come
 * from IndexedDB. Both candidate sets are merged and the global top-k returned,
 * so callers (send/buildContext) need no knowledge of where a chunk came from.
 */
export async function retrieve(
  query: string,
  kbIds: string[],
  k = 4,
): Promise<RetrievedChunk[]> {
  const usePack = kbIds.some((id) => id.startsWith(BUILTIN_PREFIX))
  const regularIds = kbIds.filter((id) => !id.startsWith(BUILTIN_PREFIX))

  const pool = regularIds.length > 0 ? await getChunksFor(regularIds) : []
  if (pool.length === 0 && !usePack) return []

  const q = await embedOne(query)
  const scored: RetrievedChunk[] = pool.map((c) => ({
    text: c.text,
    source: c.source,
    score: cosine(q, c.embedding),
  }))

  if (usePack) {
    await ensurePackLoaded()
    scored.push(...searchPack(q, k))
  }

  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, k)
}

/** Build the grounding block injected into the system prompt. */
export function buildContext(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) return ''
  const body = chunks
    .map((c, i) => `[${i + 1}] (source: ${c.source})\n${c.text}`)
    .join('\n\n')
  return (
    'Use the following retrieved context to answer the user. When a statement ' +
    'is supported by the context, cite it inline with its bracketed number, ' +
    'e.g. "India’s population is about 1.4 billion [2]." Only cite numbers that ' +
    'appear in the context below, and place the marker right after the claim it ' +
    'supports. If the context does not contain the answer, say so plainly and ' +
    'answer from general knowledge — but do NOT attach a citation to anything ' +
    'that is not in the context.\n\n' +
    '--- CONTEXT ---\n' +
    body +
    '\n--- END CONTEXT ---'
  )
}
