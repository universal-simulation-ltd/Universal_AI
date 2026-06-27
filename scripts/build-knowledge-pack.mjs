// Build a pre-computed "general knowledge" RAG pack for Universal AI.
//
// Produces two files in public/knowledge/:
//   simplewiki.v<version>.bin   — packed int8 embeddings + article text
//   simplewiki.v<version>.json  — manifest read by the UI before download
//
// Embeddings use the SAME model + options as the app (src/lib/rag/embeddings.ts):
//   Xenova/all-MiniLM-L6-v2, dtype q8, { pooling: 'mean', normalize: true }
// so query vectors computed in the browser are directly comparable.
//
// Sources:
//   --source=api    (default) pull intros live from simple.wikipedia.org.
//                   Great for a quick sample; subject to API rate limits.
//   --source=hf      pull rows from the Hugging Face datasets-server rows API
//                   (wikimedia/wikipedia, config 20231101.simple). No parquet
//                   tooling needed and a much higher rate limit than the wiki
//                   API — this is the recommended path for the full build.
//   --source=parquet --input=FILE
//                   read a local HF parquet shard directly (title/text columns)
//                   via hyparquet — no API calls, immune to rate limits, the
//                   most reliable path for a large (25k+) build. Download once:
//                     curl -sL "https://huggingface.co/datasets/wikimedia/wikipedia/resolve/refs%2Fconvert%2Fparquet/20231101.simple/train/0000.parquet" -o simplewiki.parquet
//   --source=jsonl --input=FILE
//                   one {"title","text"} JSON object per line.
//
// Realism: Node embeds on CPU (onnxruntime), ~30–120 texts/sec. A ~25k pack
// takes a few minutes; --limit=300 finishes in seconds for end-to-end wiring.
//
// Usage:
//   node scripts/build-knowledge-pack.mjs --limit=300
//   node scripts/build-knowledge-pack.mjs --source=jsonl --input=simple.jsonl --limit=25000

import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// ---- args ----------------------------------------------------------------
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/)
    return m ? [m[1], m[2] ?? true] : [a, true]
  }),
)
const LIMIT = Number(args.limit ?? 300)
const VERSION = Number(args.version ?? 1)
const SOURCE = String(args.source ?? 'api')
const INPUT = args.input ? String(args.input) : null
const MIN_LEN = Number(args.minLen ?? 120) // skip stubs/disambiguation
const MAX_CHARS = 700 // one intro chunk per article (context-budget friendly)
const OUT_DIR = resolve(ROOT, 'public/knowledge')

const MODEL_ID = 'Xenova/all-MiniLM-L6-v2'
const EMBED_DIM = 384
const SCALE = 127
const MAGIC = 'UWK1'

// ---- text helpers --------------------------------------------------------
function cleanIntro(text) {
  // First paragraph, collapsed whitespace, truncated to MAX_CHARS on a word edge.
  const firstPara = String(text).replace(/\r/g, '').split(/\n\s*\n/)[0]
  const collapsed = firstPara.replace(/\s+/g, ' ').trim()
  if (collapsed.length <= MAX_CHARS) return collapsed
  const cut = collapsed.slice(0, MAX_CHARS)
  return cut.slice(0, cut.lastIndexOf(' ') > 0 ? cut.lastIndexOf(' ') : MAX_CHARS).trim()
}

function isUsable(title, intro) {
  if (!intro || intro.length < MIN_LEN) return false
  if (/\b(may refer to|disambiguation)\b/i.test(intro)) return false
  if (/^List of /i.test(title)) return false
  return true
}

// ---- sources -------------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function fetchPagesBatch(url, headers) {
  // Polite retry with backoff for rate-limits / transient errors.
  for (let attempt = 0; attempt < 8; attempt++) {
    const res = await fetch(url, { headers })
    if (res.ok) return res.json()
    if (res.status === 429 || res.status >= 500) {
      const wait = Math.min(2000 * Math.pow(2, attempt), 60000)
      process.stdout.write(`\r  rate-limited (${res.status}), waiting ${Math.round(wait / 1000)}s…   `)
      await sleep(wait)
      continue
    }
    throw new Error(`Wikipedia API ${res.status}`)
  }
  throw new Error('Wikipedia API: exhausted retries (rate-limited)')
}

async function fromApi(limit) {
  const items = []
  const seen = new Set()
  const headers = {
    'User-Agent': 'UniversalAI-KnowledgePackBuilder/1.0 (offline RAG sample)',
  }
  let guard = 0
  while (items.length < limit && guard++ < limit * 2) {
    const url =
      'https://simple.wikipedia.org/w/api.php?action=query&format=json' +
      '&generator=random&grnnamespace=0&grnlimit=20' +
      '&prop=extracts&exintro=1&explaintext=1&exlimit=20'
    const data = await fetchPagesBatch(url, headers)
    await sleep(1000) // be polite to the API between batches
    const pages = data?.query?.pages ?? {}
    for (const p of Object.values(pages)) {
      if (!p?.title || seen.has(p.title)) continue
      const intro = cleanIntro(p.extract ?? '')
      if (!isUsable(p.title, intro)) continue
      seen.add(p.title)
      items.push({ title: p.title, text: intro })
      if (items.length >= limit) break
    }
    process.stdout.write(`\r  fetched ${items.length}/${limit} articles…`)
  }
  process.stdout.write('\n')
  return items
}

async function fromHf(limit) {
  // Hugging Face datasets-server returns rows as JSON, max 100 per request.
  const items = []
  const headers = { 'User-Agent': 'UniversalAI-KnowledgePackBuilder/1.0' }
  const PAGE = 100
  for (let offset = 0; items.length < limit; offset += PAGE) {
    const url =
      'https://datasets-server.huggingface.co/rows?dataset=wikimedia%2Fwikipedia' +
      `&config=20231101.simple&split=train&offset=${offset}&length=${PAGE}`
    const data = await fetchPagesBatch(url, headers)
    const rows = data?.rows ?? []
    if (rows.length === 0) break // ran past the end of the split
    for (const r of rows) {
      const title = r?.row?.title ?? ''
      const intro = cleanIntro(r?.row?.text ?? '')
      if (!isUsable(title, intro)) continue
      items.push({ title: String(title), text: intro })
      if (items.length >= limit) break
    }
    process.stdout.write(`\r  fetched ${items.length}/${limit} articles (offset ${offset})…`)
    await sleep(200)
  }
  process.stdout.write('\n')
  return items
}

async function fromParquet(path, limit) {
  // Read title/text columns directly from a local parquet shard, in row chunks
  // to keep memory flat (the `text` column holds full articles).
  const { parquetReadObjects, asyncBufferFromFile } = await import('hyparquet')
  const { compressors } = await import('hyparquet-compressors')
  const file = await asyncBufferFromFile(path)
  const items = []
  const CHUNK = 5000
  let start = 0
  for (;;) {
    if (items.length >= limit) break
    const rows = await parquetReadObjects({
      file,
      columns: ['title', 'text'],
      compressors,
      rowStart: start,
      rowEnd: start + CHUNK,
    })
    if (rows.length === 0) break // past the end
    for (const r of rows) {
      const intro = cleanIntro(r.text ?? '')
      if (!isUsable(r.title ?? '', intro)) continue
      items.push({ title: String(r.title), text: intro })
      if (items.length >= limit) break
    }
    start += CHUNK
    process.stdout.write(`\r  read ${items.length}/${limit} usable (scanned ${start} rows)…`)
  }
  process.stdout.write('\n')
  return items
}

async function fromJsonl(file, limit) {
  const raw = await readFile(file, 'utf8')
  const items = []
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue
    const obj = JSON.parse(line)
    const intro = cleanIntro(obj.text ?? '')
    if (!isUsable(obj.title ?? '', intro)) continue
    items.push({ title: String(obj.title), text: intro })
    if (items.length >= limit) break
  }
  return items
}

// ---- embedding -----------------------------------------------------------
async function embedAll(items) {
  const { pipeline, env } = await import('@huggingface/transformers')
  env.allowLocalModels = false
  console.log(`Loading embedding model ${MODEL_ID}…`)
  const extractor = await pipeline('feature-extraction', MODEL_ID, { dtype: 'q8' })

  const N = items.length
  const quant = new Int8Array(N * EMBED_DIM)
  const BATCH = 32
  for (let i = 0; i < N; i += BATCH) {
    const batch = items.slice(i, i + BATCH).map((it) => it.text)
    const out = await extractor(batch, { pooling: 'mean', normalize: true })
    const flat = out.data // Float32Array [batch * EMBED_DIM]
    for (let b = 0; b < batch.length; b++) {
      const base = (i + b) * EMBED_DIM
      for (let d = 0; d < EMBED_DIM; d++) {
        const q = Math.round(flat[b * EMBED_DIM + d] * SCALE)
        quant[base + d] = q < -127 ? -127 : q > 127 ? 127 : q
      }
    }
    process.stdout.write(`\r  embedded ${Math.min(i + BATCH, N)}/${N}…`)
  }
  process.stdout.write('\n')
  return quant
}

// ---- packing -------------------------------------------------------------
function pack(items, quant) {
  const N = items.length
  const enc = new TextEncoder()
  const titleBufs = items.map((it) => enc.encode(it.title))
  const textBufs = items.map((it) => enc.encode(it.text))

  const headerBytes = 28
  const embBytes = N * EMBED_DIM
  const tableBytes = N * 8
  const textBytes = titleBufs.reduce((s, b, i) => s + b.length + textBufs[i].length, 0)
  const textBlockOffset = headerBytes + embBytes
  const total = textBlockOffset + tableBytes + textBytes

  const buf = new ArrayBuffer(total)
  const view = new DataView(buf)
  const bytes = new Uint8Array(buf)

  // header
  for (let i = 0; i < 4; i++) view.setUint8(i, MAGIC.charCodeAt(i))
  view.setUint32(4, VERSION, true)
  view.setUint32(8, N, true)
  view.setUint32(12, EMBED_DIM, true)
  view.setFloat32(16, SCALE, true)
  view.setUint32(20, textBlockOffset, true)
  view.setUint32(24, 0, true)

  // embeddings
  bytes.set(quant, headerBytes)

  // offset table + text data
  let tablePos = textBlockOffset
  let textPos = textBlockOffset + tableBytes
  for (let i = 0; i < N; i++) {
    view.setUint32(tablePos, titleBufs[i].length, true)
    view.setUint32(tablePos + 4, textBufs[i].length, true)
    tablePos += 8
    bytes.set(titleBufs[i], textPos)
    textPos += titleBufs[i].length
    bytes.set(textBufs[i], textPos)
    textPos += textBufs[i].length
  }
  return buf
}

// ---- main ----------------------------------------------------------------
async function main() {
  console.log(`Building knowledge pack: source=${SOURCE} limit=${LIMIT} version=${VERSION}`)
  let items
  if (SOURCE === 'jsonl') {
    if (!INPUT) throw new Error('--source=jsonl requires --input=FILE')
    items = await fromJsonl(INPUT, LIMIT)
  } else if (SOURCE === 'parquet') {
    if (!INPUT) throw new Error('--source=parquet requires --input=FILE')
    items = await fromParquet(INPUT, LIMIT)
  } else if (SOURCE === 'hf') {
    items = await fromHf(LIMIT)
  } else {
    items = await fromApi(LIMIT)
  }
  if (items.length === 0) throw new Error('No usable articles collected')
  console.log(`Collected ${items.length} articles. Embedding…`)

  const quant = await embedAll(items)
  const buf = pack(items, quant)

  await mkdir(OUT_DIR, { recursive: true })
  const binName = `simplewiki.v${VERSION}.bin`
  const jsonName = `simplewiki.v${VERSION}.json`
  await writeFile(resolve(OUT_DIR, binName), Buffer.from(buf))

  const manifest = {
    id: 'builtin:simplewiki',
    name: 'General knowledge (Simple Wikipedia)',
    version: VERSION,
    bin: binName,
    dim: EMBED_DIM,
    count: items.length,
    scale: SCALE,
    bytes: buf.byteLength,
    approxMB: Math.round((buf.byteLength / (1024 * 1024)) * 10) / 10,
  }
  await writeFile(resolve(OUT_DIR, jsonName), JSON.stringify(manifest, null, 2))

  console.log(
    `\nWrote ${OUT_DIR}/${binName} (${manifest.approxMB} MB, ${items.length} articles)\n` +
      `Wrote ${OUT_DIR}/${jsonName}`,
  )
}

main().catch((err) => {
  console.error('\nBuild failed:', err)
  process.exit(1)
})
