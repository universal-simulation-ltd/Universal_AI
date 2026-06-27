import { writable, get } from 'svelte/store'
import {
  createEngine,
  detectBackend,
  DEFAULT_MODEL_ID,
  MODELS,
  modelsFor,
  type ChatMessage,
  type EngineKind,
  type LLMEngine,
  type LoadProgress,
} from './engine'
import {
  buildContext,
  listKBs,
  putKB,
  deleteKB as deleteKBRecord,
  retrieve,
  fetchManifest,
  loadPack,
  unloadPack,
  type KnowledgeBase,
} from './rag'

/** A numbered reference, mapping an inline [n] marker to its source. */
export interface Citation {
  n: number
  source: string
}

export interface UIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  /** Numbered references cited from RAG, if any, for assistant turns. */
  sources?: Citation[]
  streaming?: boolean
}

export type EngineStatus = 'idle' | 'loading' | 'ready' | 'error'

export const modelId = writable<string>(DEFAULT_MODEL_ID)
/** Which backend this device will use; null until detected. */
export const backend = writable<EngineKind | null>(null)
export const engineStatus = writable<EngineStatus>('idle')
export const loadProgress = writable<LoadProgress | null>(null)
export const engineError = writable<string | null>(null)

export const messages = writable<UIMessage[]>([])
export const generating = writable(false)

export const kbs = writable<KnowledgeBase[]>([])

let engine: LLMEngine | null = null
let idCounter = 0
const uid = () => `m_${Math.floor(performance.now() * 1000)}_${idCounter++}`

/** Detect the backend once at startup and ensure the selected model fits it. */
export async function detectCapabilities(): Promise<void> {
  const kind = await detectBackend()
  backend.set(kind)
  const runnable = modelsFor(kind)
  if (!runnable.some((m) => m.id === get(modelId)) && runnable.length > 0) {
    modelId.set(runnable[0].id)
  }
}

export async function refreshKBs(): Promise<void> {
  kbs.set(await listKBs())
}

export async function toggleKB(kb: KnowledgeBase): Promise<void> {
  await putKB({ ...kb, enabled: !kb.enabled })
  await refreshKBs()
}

export async function removeKB(kb: KnowledgeBase): Promise<void> {
  // The built-in pack isn't stored in IndexedDB chunks; "removing" it means
  // uninstalling the downloaded binary, not deleting a chunk set.
  if (kb.id.startsWith(BUILTIN_PREFIX)) {
    await uninstallBuiltinPack()
    return
  }
  await deleteKBRecord(kb.id)
  await refreshKBs()
}

// --- Built-in "general knowledge" pack (Simple Wikipedia) ----------------
const BUILTIN_PREFIX = 'builtin:'
export const BUILTIN_SIMPLEWIKI_ID = 'builtin:simplewiki'
const INSTALL_KEY = 'builtin:simplewiki:installed'

/** Whether the pack binary has been downloaded/cached on this device. */
export const builtinInstalled = writable<boolean>(
  typeof localStorage !== 'undefined' && localStorage.getItem(INSTALL_KEY) === '1',
)
/** Download progress 0..1 while installing, or null when idle. */
export const builtinDownloadProgress = writable<number | null>(null)

/**
 * Ensure a metadata row exists for the built-in pack so it appears in the
 * Knowledge list (even before download). Best-effort: silently no-ops if the
 * pack assets aren't present. Idempotent — never resets the user's enabled flag.
 */
export async function seedBuiltinKB(): Promise<void> {
  try {
    const existing = get(kbs).find((k) => k.id === BUILTIN_SIMPLEWIKI_ID)
    const manifest = await fetchManifest()
    if (existing) {
      // Keep chunkCount/name fresh if the pack version changed; preserve enabled.
      if (existing.chunkCount !== manifest.count || existing.name !== manifest.name) {
        await putKB({ ...existing, name: manifest.name, chunkCount: manifest.count })
        await refreshKBs()
      }
      return
    }
    await putKB({
      id: BUILTIN_SIMPLEWIKI_ID,
      name: manifest.name,
      enabled: false,
      chunkCount: manifest.count,
      createdAt: 0, // sort to the top of the list
    })
    await refreshKBs()
  } catch {
    // No pack assets available — nothing to seed.
  }
}

/** Warm the pack into memory on startup if it was previously installed. */
export async function loadPackIntoMemory(): Promise<void> {
  if (!get(builtinInstalled)) return
  try {
    await loadPack()
  } catch {
    // Cached binary missing/corrupt — leave it; install can re-fetch.
  }
}

/** Download + cache the pack, then enable it for retrieval. */
export async function installBuiltinPack(): Promise<void> {
  builtinDownloadProgress.set(0)
  try {
    await loadPack((loaded, total) =>
      builtinDownloadProgress.set(total > 0 ? loaded / total : 0),
    )
    localStorage.setItem(INSTALL_KEY, '1')
    builtinInstalled.set(true)
    const row = get(kbs).find((k) => k.id === BUILTIN_SIMPLEWIKI_ID)
    if (row) await putKB({ ...row, enabled: true })
    await refreshKBs()
  } finally {
    builtinDownloadProgress.set(null)
  }
}

/** Free the cached binary and disable the pack. */
export async function uninstallBuiltinPack(): Promise<void> {
  localStorage.removeItem(INSTALL_KEY)
  builtinInstalled.set(false)
  unloadPack()
  const row = get(kbs).find((k) => k.id === BUILTIN_SIMPLEWIKI_ID)
  if (row) await putKB({ ...row, enabled: false })
  await refreshKBs()
  // Best-effort eviction of the service-worker cache entry.
  try {
    const cache = await caches.open('knowledge-packs')
    for (const req of await cache.keys()) {
      if (req.url.includes('/knowledge/')) await cache.delete(req)
    }
  } catch {
    // Cache API unavailable (e.g. dev without SW) — ignore.
  }
}

export async function loadModel(): Promise<void> {
  engineStatus.set('loading')
  engineError.set(null)
  loadProgress.set({ progress: 0, text: 'Initializing…' })
  try {
    if (!engine) engine = await createEngine()
    const model = MODELS.find((m) => m.id === get(modelId))
    if (!model) throw new Error('No model selected')
    await engine.load(model, (p) => loadProgress.set(p))
    engineStatus.set('ready')
  } catch (err) {
    engineStatus.set('error')
    engineError.set(err instanceof Error ? err.message : String(err))
  }
}

const SYSTEM_BASE =
  'You are Universal AI, a concise, helpful offline assistant running entirely ' +
  'on the user’s device. Only cite sources that are explicitly provided to you ' +
  'in a numbered context block. Never invent citations, source names, or [n] ' +
  'markers for general knowledge that did not come from such a block.'

export async function send(userText: string): Promise<void> {
  const text = userText.trim()
  if (!text || get(generating) || get(engineStatus) !== 'ready' || !engine) return

  const userMsg: UIMessage = { id: uid(), role: 'user', content: text }
  const botMsg: UIMessage = { id: uid(), role: 'assistant', content: '', streaming: true }
  messages.update((m) => [...m, userMsg, botMsg])
  generating.set(true)

  try {
    // RAG: retrieve from enabled KBs and ground the system prompt.
    const enabled = get(kbs).filter((k) => k.enabled).map((k) => k.id)
    let system = SYSTEM_BASE
    let sources: Citation[] = []
    if (enabled.length > 0) {
      const hits = await retrieve(text, enabled, 4)
      const relevant = hits.filter((h) => h.score > 0.25)
      if (relevant.length > 0) {
        system += '\n\n' + buildContext(relevant)
        // [n] markers in buildContext are 1-based and positional; mirror that
        // ordering here so each inline citation maps to the right source.
        sources = relevant.map((h, i) => ({ n: i + 1, source: h.source }))
      }
    }

    const history = get(messages)
      .filter((m) => !m.streaming && (m.role === 'user' || m.role === 'assistant'))
      .map<ChatMessage>((m) => ({ role: m.role, content: m.content }))

    const payload: ChatMessage[] = [{ role: 'system', content: system }, ...history]

    await engine.generate(payload, (delta) => {
      messages.update((all) =>
        all.map((m) => (m.id === botMsg.id ? { ...m, content: m.content + delta } : m)),
      )
    })

    messages.update((all) =>
      all.map((m) =>
        m.id === botMsg.id
          ? { ...m, streaming: false, sources: sources.length ? sources : undefined }
          : m,
      ),
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    messages.update((all) =>
      all.map((m) =>
        m.id === botMsg.id
          ? { ...m, streaming: false, content: m.content || `⚠️ ${msg}` }
          : m,
      ),
    )
  } finally {
    generating.set(false)
  }
}

export async function stop(): Promise<void> {
  await engine?.interrupt()
}

export function clearChat(): void {
  messages.set([])
}
