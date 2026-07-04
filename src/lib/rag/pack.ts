// In-memory index for the pre-built "general knowledge" pack (Simple Wikipedia).
//
// The pack is deliberately kept OUT of IndexedDB: tens of thousands of rows +
// per-query object allocation would be slow and memory-heavy. Instead we fetch
// one packed binary (int8 embeddings + UTF-8 text), hold it in module memory as
// a single Int8Array + parallel string arrays, and brute-force search it. The
// service worker runtime-caches the binary so it stays available offline.
//
// Binary layout is produced by scripts/build-knowledge-pack.mjs (little-endian):
//   0  4   magic "UWK1"
//   4  4   uint32 version
//   8  4   uint32 count N
//   12 4   uint32 dim
//   16 4   float32 scale
//   20 4   uint32 textBlockOffset
//   24 4   uint32 reserved
//   28 ..  int8[N*dim] embeddings (q = round(v*scale))
//   textBlockOffset: uint32[N*2] (titleLen, textLen) then UTF-8 [title|text]*

import type { RetrievedChunk } from './index'

export interface PackManifest {
  id: string
  name: string
  version: number
  bin: string
  dim: number
  count: number
  /** Noun for the count shown in the UI ("142 articles" / "112 topics"). */
  unit?: string
  /** Optional one-line description shown on the pack card. */
  description?: string
  scale: number
  bytes: number
  approxMB: number
}

const KNOWLEDGE_BASE = '/knowledge/'

/** A built-in, pre-embedded knowledge pack that ships with the app. */
export interface BuiltinPackDef {
  id: string
  manifestUrl: string
}

/**
 * The built-in packs the app knows how to seed, download and search. Each entry
 * points at a manifest produced by scripts/build-knowledge-pack.mjs. Bump the
 * versioned filename here alongside the pack version when rebuilding.
 */
export const BUILTIN_PACKS: BuiltinPackDef[] = [
  { id: 'builtin:simplewiki', manifestUrl: `${KNOWLEDGE_BASE}simplewiki.v1.json` },
  { id: 'builtin:wset-wine', manifestUrl: `${KNOWLEDGE_BASE}wset-wine.v1.json` },
]

function manifestUrlFor(id: string): string {
  const def = BUILTIN_PACKS.find((p) => p.id === id)
  if (!def) throw new Error(`Unknown built-in pack: ${id}`)
  return def.manifestUrl
}

interface LoadedPack {
  count: number
  dim: number
  invScale: number
  emb: Int8Array
  titles: string[]
  texts: string[]
}

// Keyed by pack id so multiple built-in packs can be loaded/searched at once.
const packs = new Map<string, LoadedPack>()
const loadPromises = new Map<string, Promise<void>>()
const manifestPromises = new Map<string, Promise<PackManifest>>()

export function isPackLoaded(id: string): boolean {
  return packs.has(id)
}

/** Fetch (and memoize) a pack's manifest — used by the UI before download. */
export function fetchManifest(id: string): Promise<PackManifest> {
  let p = manifestPromises.get(id)
  if (!p) {
    p = fetch(manifestUrlFor(id)).then((res) => {
      if (!res.ok) throw new Error(`Knowledge manifest ${res.status}`)
      return res.json() as Promise<PackManifest>
    })
    manifestPromises.set(id, p)
  }
  return p
}

function decodePack(buf: ArrayBuffer): LoadedPack {
  const view = new DataView(buf)
  const magic = String.fromCharCode(
    view.getUint8(0),
    view.getUint8(1),
    view.getUint8(2),
    view.getUint8(3),
  )
  if (magic !== 'UWK1') throw new Error('Bad knowledge pack (magic mismatch)')
  const count = view.getUint32(8, true)
  const dim = view.getUint32(12, true)
  const scale = view.getFloat32(16, true)
  const textBlockOffset = view.getUint32(20, true)

  const emb = new Int8Array(buf, 28, count * dim)

  const titles = new Array<string>(count)
  const texts = new Array<string>(count)
  const dec = new TextDecoder()
  let tablePos = textBlockOffset
  let textPos = textBlockOffset + count * 8
  for (let i = 0; i < count; i++) {
    const titleLen = view.getUint32(tablePos, true)
    const textLen = view.getUint32(tablePos + 4, true)
    tablePos += 8
    titles[i] = dec.decode(new Uint8Array(buf, textPos, titleLen))
    textPos += titleLen
    texts[i] = dec.decode(new Uint8Array(buf, textPos, textLen))
    textPos += textLen
  }
  return { count, dim, invScale: 1 / scale, emb, titles, texts }
}

/** Download + decode a pack into memory. Idempotent / coalesces callers. */
export function loadPack(
  id: string,
  onProgress?: (loaded: number, total: number) => void,
): Promise<void> {
  if (packs.has(id)) return Promise.resolve()
  const existing = loadPromises.get(id)
  if (existing) return existing
  const promise = (async () => {
    const manifest = await fetchManifest(id)
    const url = `${KNOWLEDGE_BASE}${manifest.bin}`
    const res = await fetch(url)
    if (!res.ok || !res.body) throw new Error(`Knowledge pack ${res.status}`)
    const total = Number(res.headers.get('content-length')) || manifest.bytes
    const reader = res.body.getReader()
    const parts: Uint8Array[] = []
    let loaded = 0
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      parts.push(value)
      loaded += value.length
      onProgress?.(loaded, total)
    }
    const blob = new Uint8Array(loaded)
    let off = 0
    for (const p of parts) {
      blob.set(p, off)
      off += p.length
    }
    packs.set(id, decodePack(blob.buffer))
  })().finally(() => {
    loadPromises.delete(id)
  })
  loadPromises.set(id, promise)
  return promise
}

/** Load a pack if it isn't already in memory (no progress reporting). */
export async function ensurePackLoaded(id: string): Promise<void> {
  if (!packs.has(id)) await loadPack(id)
}

export function unloadPack(id: string): void {
  packs.delete(id)
}

/**
 * Brute-force top-k over one int8 pack. The query is L2-normalized (from the
 * same model), so cosine == dot product; scoring the dequantized vectors is
 * just `(Σ q·qi) / scale`. Maintains a fixed-size top-k to avoid sorting N.
 */
export function searchPack(id: string, q: Float32Array, k: number): RetrievedChunk[] {
  const pack = packs.get(id)
  if (!pack) return []
  const { count, dim, emb, invScale, titles, texts } = pack
  // Parallel arrays for the current top-k, ascending by score.
  const topScore = new Array<number>(k).fill(-Infinity)
  const topIdx = new Array<number>(k).fill(-1)
  for (let i = 0; i < count; i++) {
    const base = i * dim
    let dot = 0
    for (let d = 0; d < dim; d++) dot += q[d] * emb[base + d]
    const score = dot * invScale
    if (score <= topScore[0]) continue
    // Insert into the sorted-ascending top-k, displacing the smallest.
    let j = 0
    while (j < k - 1 && score > topScore[j + 1]) {
      topScore[j] = topScore[j + 1]
      topIdx[j] = topIdx[j + 1]
      j++
    }
    topScore[j] = score
    topIdx[j] = i
  }
  const out: RetrievedChunk[] = []
  for (let j = k - 1; j >= 0; j--) {
    if (topIdx[j] < 0) continue
    out.push({ text: texts[topIdx[j]], source: titles[topIdx[j]], score: topScore[j] })
  }
  return out
}
