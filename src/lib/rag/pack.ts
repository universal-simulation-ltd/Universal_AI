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
  scale: number
  bytes: number
  approxMB: number
}

const KNOWLEDGE_BASE = '/knowledge/'
/** Bump alongside the pack version produced by the build script. */
export const MANIFEST_URL = `${KNOWLEDGE_BASE}simplewiki.v1.json`

interface LoadedPack {
  count: number
  dim: number
  invScale: number
  emb: Int8Array
  titles: string[]
  texts: string[]
}

let pack: LoadedPack | null = null
let loadPromise: Promise<void> | null = null
let manifestPromise: Promise<PackManifest> | null = null

export function isPackLoaded(): boolean {
  return pack !== null
}

/** Fetch (and memoize) the pack manifest — used by the UI before download. */
export function fetchManifest(): Promise<PackManifest> {
  if (!manifestPromise) {
    manifestPromise = fetch(MANIFEST_URL).then((res) => {
      if (!res.ok) throw new Error(`Knowledge manifest ${res.status}`)
      return res.json() as Promise<PackManifest>
    })
  }
  return manifestPromise
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

/** Download + decode the pack into memory. Idempotent / coalesces callers. */
export function loadPack(onProgress?: (loaded: number, total: number) => void): Promise<void> {
  if (pack) return Promise.resolve()
  if (loadPromise) return loadPromise
  loadPromise = (async () => {
    const manifest = await fetchManifest()
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
    pack = decodePack(blob.buffer)
  })().finally(() => {
    loadPromise = null
  })
  return loadPromise
}

/** Load the pack if it isn't already in memory (no progress reporting). */
export async function ensurePackLoaded(): Promise<void> {
  if (!pack) await loadPack()
}

export function unloadPack(): void {
  pack = null
}

/**
 * Brute-force top-k over the int8 pack. The query is L2-normalized (from the
 * same model), so cosine == dot product; scoring the dequantized vectors is
 * just `(Σ q·qi) / scale`. Maintains a fixed-size top-k to avoid sorting N.
 */
export function searchPack(q: Float32Array, k: number): RetrievedChunk[] {
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
