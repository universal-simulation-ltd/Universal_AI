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
  webSearch,
  fetchManifest,
  loadPack,
  unloadPack,
  BUILTIN_PACKS,
  personaPackId,
  isPersonaPackId,
  warmEmbeddings,
  type KnowledgeBase,
  type RetrievedChunk,
} from './rag'
import { settings } from './settings'
import { getPersona } from './personas'

// Legacy: the first cut of persona knowledge embedded a small bundled corpus
// into a `persona:`-prefixed KB on device. That path is gone (each character now
// has a downloadable pre-embedded pack); these rows are cleaned up on startup.
const LEGACY_PERSONA_KB_PREFIX = 'persona:'

/** A numbered reference, mapping an inline [n] marker to its source. */
export interface Citation {
  n: number
  source: string
  /** The retrieved passage this source contributed — shown as the "explanation"
   *  when the Sources dropdown is expanded. */
  snippet?: string
  /** Real URL for web-search sources; undefined for local docs / the pack. */
  url?: string
}

/** Coarse confidence band for an answer, derived from retrieval scores. */
export type Confidence = 'high' | 'medium' | 'low'

export interface UIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  /** Numbered references cited from RAG, if any, for assistant turns. */
  sources?: Citation[]
  /** How well the cited sources matched the question (grounded answers only). */
  confidence?: Confidence
  /** Raw top source-match score (0..1) behind `confidence` — drives the bar fill. */
  confidenceScore?: number
  /** The user question this answer responded to — used by "double-check online". */
  query?: string
  /** True while an on-demand web double-check is running for this answer. */
  webChecking?: boolean
  /** Corroborating web results from a double-check (each carries a real URL). */
  webSources?: Citation[]
  /** Set when a double-check ran but found nothing, or couldn't run. */
  webCheckNote?: string
  streaming?: boolean
}

export type EngineStatus = 'idle' | 'loading' | 'ready' | 'error'

export const modelId = writable<string>(DEFAULT_MODEL_ID)
/** Which backend this device will use; null until detected. */
export const backend = writable<EngineKind | null>(null)
export const engineStatus = writable<EngineStatus>('idle')
export const loadProgress = writable<LoadProgress | null>(null)
export const engineError = writable<string | null>(null)

/** The model actually loaded in memory right now (null if none). */
export const loadedModelId = writable<string | null>(null)
/**
 * Per-model: whether its weights are cached on-device. Probed at startup (the
 * cache is the source of truth, which also copes with iOS clearing storage) and
 * updated whenever a model is loaded or deleted. Not persisted.
 */
export const downloadedModels = writable<Record<string, boolean>>({})

// --- Conversation persistence across page deaths ---------------------------
// iOS kills the whole page when memory peaks mid-generation; the app reloads
// and, before this, the conversation (including the message just typed) was
// simply gone. Persist the chat to localStorage (throttled, so streaming
// doesn't hammer storage) and restore it on boot. Clear-on-close still wipes
// it: clearChat() empties the store, which persists the empty list.
const MESSAGES_KEY = 'universal-ai:messages'

const OOM_NOTICE =
  '⚠️ The app ran out of memory while answering and had to restart. Your chat ' +
  'was saved. Try a shorter question — or switch to a smaller model in the ' +
  'Customise tab.'

function loadMessages(): UIMessage[] {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(MESSAGES_KEY) : null
    if (!raw) return []
    const list = JSON.parse(raw) as UIMessage[]
    // A message persisted as `streaming` means the page died mid-generation —
    // explain what happened in place of the answer that never finished.
    const last = list[list.length - 1]
    if (last?.role === 'assistant' && last.streaming) {
      last.content = last.content.trim() ? `${last.content}\n\n${OOM_NOTICE}` : OOM_NOTICE
    }
    return list.map((m) => ({ ...m, streaming: false }))
  } catch {
    return []
  }
}

export const messages = writable<UIMessage[]>(loadMessages())
export const generating = writable(false)

let persistTimer: ReturnType<typeof setTimeout> | null = null
messages.subscribe(() => {
  // Trailing-edge throttle: token streaming updates the store many times a
  // second; one write per 400ms is plenty (worst case a crash loses the last
  // 400ms of streamed text, never the user's own message).
  if (persistTimer) return
  persistTimer = setTimeout(() => {
    persistTimer = null
    try {
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(get(messages)))
    } catch {
      // storage unavailable — chat won't survive a crash, same as before
    }
  }, 400)
})

export const kbs = writable<KnowledgeBase[]>([])

/**
 * Whether the device currently has network access. The connection indicator
 * reads this: green = offline (private, the desired state), red = online. It
 * reflects reachability only — the app still makes no network calls unless the
 * user opts into web search.
 */
export const online = writable<boolean>(
  typeof navigator !== 'undefined' ? navigator.onLine : false,
)
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => online.set(true))
  window.addEventListener('offline', () => online.set(false))
}

// Has a model ever been downloaded/loaded on this device? Drives the first-run
// welcome gate — the app stays blocked behind it until the user has a model.
const MODEL_LOADED_KEY = 'universal-ai:model-loaded'
export const modelEverLoaded = writable<boolean>(
  typeof localStorage !== 'undefined' && localStorage.getItem(MODEL_LOADED_KEY) === '1',
)

let engine: LLMEngine | null = null
let idCounter = 0
const uid = () => `m_${Math.floor(performance.now() * 1000)}_${idCounter++}`

/** Detect the backend once at startup and ensure the selected model fits it. */
export async function detectCapabilities(): Promise<void> {
  const kind = await detectBackend()
  backend.set(kind)
  const runnable = modelsFor(kind)
  if (runnable.length === 0) return
  if (!runnable.some((m) => m.id === get(modelId))) {
    modelId.set(runnable[0].id)
  } else if (kind === 'wllama' && get(modelId) === DEFAULT_MODEL_ID) {
    // CPU/WASM devices are the memory-tight ones: bigger models may load but
    // get the page killed mid-generation. Suggest the lightest by default —
    // the user can still pick a bigger one, and auto-load prefers whatever is
    // already downloaded.
    const lightest = [...runnable].sort((a, b) => a.ramMB - b.ramMB)[0]
    modelId.set(lightest.id)
  }
}

export async function refreshKBs(): Promise<void> {
  kbs.set(await listKBs())
}

export async function toggleKB(kb: KnowledgeBase): Promise<void> {
  await putKB({ ...kb, enabled: !kb.enabled })
  await refreshKBs()
  // Turning a KB on means retrieval (and so the embedder) will be needed —
  // init it now, while there's memory headroom, rather than mid-chat.
  if (!kb.enabled) void warmEmbeddings()
}

export async function removeKB(kb: KnowledgeBase): Promise<void> {
  // The built-in pack isn't stored in IndexedDB chunks; "removing" it means
  // uninstalling the downloaded binary, not deleting a chunk set.
  if (kb.id.startsWith(BUILTIN_PREFIX)) {
    await uninstallBuiltinPack(kb.id)
    return
  }
  await deleteKBRecord(kb.id)
  await refreshKBs()
}

// A character's knowledge is a downloadable, pre-embedded pack (a `builtin:kb-*`
// KB, see BUILTIN_PACKS). Only the active character's pack stays enabled for
// retrieval — switching characters swaps which one is on, leaving the user's own
// KBs and the general packs alone. A character whose pack isn't downloaded yet
// still works as a personality; its knowledge simply isn't grounded until the
// pack is fetched from its expert card. Applications are serialized so rapid
// persona switches can't interleave.
let personaApplyChain: Promise<void> = Promise.resolve()

/**
 * Reconcile which character pack is enabled for retrieval to match the given
 * persona: enable that character's pack if it's downloaded, and disable every
 * other character's pack. Pass an empty id for the plain assistant, which just
 * turns all character knowledge off.
 */
export function applyPersonaKnowledge(personaId: string): Promise<void> {
  personaApplyChain = personaApplyChain.then(() => doApplyPersonaKnowledge(personaId))
  return personaApplyChain
}

async function doApplyPersonaKnowledge(personaId: string): Promise<void> {
  const targetId = personaId ? personaPackId(personaId) : undefined
  let changed = false

  // Turn off any other character's pack so only the chosen one is active.
  for (const kb of get(kbs)) {
    if (isPersonaPackId(kb.id) && kb.id !== targetId && kb.enabled) {
      await putKB({ ...kb, enabled: false })
      changed = true
    }
  }

  // Enable the chosen character's pack — but only if it's been downloaded.
  if (targetId && get(builtinInstalled)[targetId]) {
    const existing = get(kbs).find((k) => k.id === targetId)
    if (existing && !existing.enabled) {
      await putKB({ ...existing, enabled: true })
      changed = true
      // Retrieval will need the embedder — warm it now, with memory headroom.
      void warmEmbeddings()
    }
  }

  if (changed) await refreshKBs()
}

/** One-time cleanup of the retired on-device persona KBs (`persona:<id>`). */
async function cleanupLegacyPersonaKBs(): Promise<void> {
  const stale = get(kbs).filter((k) => k.id.startsWith(LEGACY_PERSONA_KB_PREFIX))
  if (stale.length === 0) return
  for (const kb of stale) await deleteKBRecord(kb.id)
  await refreshKBs()
}

// --- Built-in, pre-embedded knowledge packs ------------------------------
// The app ships several ready-made packs (Simple Wikipedia; a WSET-style wine
// pack). Each is seeded as a KB row so it shows in the Knowledge list, is
// downloaded on demand, and is searched from memory. All state is keyed by pack
// id (see BUILTIN_PACKS in rag/pack.ts) so multiple packs coexist independently.
const BUILTIN_PREFIX = 'builtin:'
const installKey = (id: string) => `${id}:installed`

function readInstalled(): Record<string, boolean> {
  const rec: Record<string, boolean> = {}
  for (const p of BUILTIN_PACKS) {
    rec[p.id] =
      typeof localStorage !== 'undefined' && localStorage.getItem(installKey(p.id)) === '1'
  }
  return rec
}

/** Per-pack: whether that pack's binary has been downloaded/cached on device. */
export const builtinInstalled = writable<Record<string, boolean>>(readInstalled())
/** Per-pack download progress 0..1 while installing, or null when idle. */
export const builtinDownloadProgress = writable<Record<string, number | null>>({})

/**
 * Ensure a KB row exists for every built-in pack so they appear in the Knowledge
 * list (even before download). Best-effort per pack: silently skips any whose
 * assets aren't present. Idempotent — never resets the user's enabled flag.
 */
export async function seedBuiltinKBs(): Promise<void> {
  await cleanupLegacyPersonaKBs()
  for (const def of BUILTIN_PACKS) {
    try {
      const manifest = await fetchManifest(def.id)
      const existing = get(kbs).find((k) => k.id === def.id)
      if (existing) {
        // Keep chunkCount/name fresh if the pack version changed; preserve enabled.
        if (existing.chunkCount !== manifest.count || existing.name !== manifest.name) {
          await putKB({ ...existing, name: manifest.name, chunkCount: manifest.count })
          await refreshKBs()
        }
        continue
      }
      await putKB({
        id: def.id,
        name: manifest.name,
        enabled: false,
        chunkCount: manifest.count,
        createdAt: 0, // sort built-in packs to the top of the list
      })
      await refreshKBs()
    } catch {
      // No assets for this pack — skip it.
    }
  }
}

/** Warm any previously installed packs into memory on startup. */
export async function loadPacksIntoMemory(): Promise<void> {
  const installed = get(builtinInstalled)
  for (const def of BUILTIN_PACKS) {
    if (!installed[def.id]) continue
    try {
      await loadPack(def.id)
    } catch {
      // Cached binary missing/corrupt — leave it; install can re-fetch.
    }
  }
}

/**
 * Download + cache a built-in pack. A general pack is enabled for retrieval
 * straight away; a character pack is only enabled if that character is the one
 * currently selected (so downloading Luigi's pack while the plain assistant is
 * active just stocks it, ready for when you pick him).
 */
export async function installBuiltinPack(id: string): Promise<void> {
  builtinDownloadProgress.update((p) => ({ ...p, [id]: 0 }))
  try {
    await loadPack(id, (loaded, total) =>
      builtinDownloadProgress.update((p) => ({ ...p, [id]: total > 0 ? loaded / total : 0 })),
    )
    try {
      localStorage.setItem(installKey(id), '1')
    } catch {
      // storage unavailable — pack still works for this session
    }
    builtinInstalled.update((s) => ({ ...s, [id]: true }))
    if (isPersonaPackId(id)) {
      // Reconcile against the active character: enables this pack iff it's the
      // selected one, and leaves every other character's pack off.
      await applyPersonaKnowledge(get(settings).personaId ?? '')
    } else {
      const row = get(kbs).find((k) => k.id === id)
      if (row) await putKB({ ...row, enabled: true })
      await refreshKBs()
    }
    // Pack installed → chats may retrieve from it; warm the embedder now (also
    // gets its weights browser-cached while the device is online).
    void warmEmbeddings()
  } finally {
    builtinDownloadProgress.update((p) => ({ ...p, [id]: null }))
  }
}

/** Free a built-in pack's cached binary and disable it. */
export async function uninstallBuiltinPack(id: string): Promise<void> {
  try {
    localStorage.removeItem(installKey(id))
  } catch {
    // storage unavailable — ignore
  }
  builtinInstalled.update((s) => ({ ...s, [id]: false }))
  unloadPack(id)
  const row = get(kbs).find((k) => k.id === id)
  if (row) await putKB({ ...row, enabled: false })
  await refreshKBs()
  // Best-effort eviction of this pack's service-worker cache entry.
  try {
    const manifest = await fetchManifest(id)
    const cache = await caches.open('knowledge-packs')
    for (const req of await cache.keys()) {
      if (req.url.includes(manifest.bin)) await cache.delete(req)
    }
  } catch {
    // Cache API unavailable (e.g. dev without SW) — ignore.
  }
}

// Set just before a model load starts and cleared when it finishes (success or
// handled error). If it's still present at next launch, the page DIED mid-load —
// on iOS, WKWebView jettisons the whole page when the model doesn't fit in
// memory. Startup checks this to avoid auto-loading straight into a crash loop.
const LOAD_SENTINEL_KEY = 'universal-ai:loading-model'

function clearLoadSentinel(): void {
  try {
    localStorage.removeItem(LOAD_SENTINEL_KEY)
  } catch {
    // storage unavailable — nothing to clear
  }
}

/**
 * Returns the id of a model whose load was interrupted by a page death last
 * session (and clears the marker so the next attempt starts fresh), or null.
 */
export function consumeInterruptedLoad(): string | null {
  try {
    const id = localStorage.getItem(LOAD_SENTINEL_KEY)
    if (id) localStorage.removeItem(LOAD_SENTINEL_KEY)
    return id
  } catch {
    return null
  }
}

export async function loadModel(): Promise<void> {
  // Re-entrancy guard: startup auto-load and a user tap (or a double-tap) can
  // race; loading the same weights twice doubles peak memory and can crash.
  if (get(engineStatus) === 'loading') return
  engineStatus.set('loading')
  engineError.set(null)
  loadProgress.set({ progress: 0, text: 'Initializing…' })
  try {
    if (!engine) engine = await createEngine()
    const model = MODELS.find((m) => m.id === get(modelId))
    if (!model) throw new Error('No model selected')
    try {
      localStorage.setItem(LOAD_SENTINEL_KEY, model.id)
    } catch {
      // storage unavailable — crash-loop protection just won't apply
    }
    await engine.load(model, (p) => loadProgress.set(p))
    clearLoadSentinel()
    engineStatus.set('ready')
    loadedModelId.set(model.id)
    // A model is now running — load the selected character's knowledge onto the
    // device (embedding it on first use, else just enabling it). Deferred to
    // here so onboarding embeds only after the model is up, not during download.
    void applyPersonaKnowledge(get(settings).personaId)
    downloadedModels.update((d) => ({ ...d, [model.id]: true }))
    // Remember that a model exists on this device so the first-run gate stays
    // closed on future visits.
    try {
      localStorage.setItem(MODEL_LOADED_KEY, '1')
    } catch {
      // storage unavailable — the gate will simply re-show next launch
    }
    modelEverLoaded.set(true)
  } catch (err) {
    clearLoadSentinel() // JS survived — this was a handled failure, not a page death
    engineStatus.set('error')
    loadProgress.set(null)
    engineError.set(err instanceof Error ? err.message : String(err))
  }
}

/**
 * Probe the cache to learn which models are already downloaded. Drives the
 * Customise UI and startup auto-load, and stays truthful even if the OS cleared
 * storage or the user deleted a model on another visit.
 */
export async function detectDownloadedModels(): Promise<void> {
  try {
    if (!engine) engine = await createEngine()
    const rec: Record<string, boolean> = {}
    for (const m of modelsFor(get(backend))) {
      try {
        rec[m.id] = await engine.isDownloaded(m)
      } catch {
        rec[m.id] = false
      }
    }
    downloadedModels.set(rec)
  } catch {
    // engine/cache unavailable — leave the map untouched
  }
}

/**
 * Delete a downloaded model's weights from the device to free storage. If it is
 * the model currently loaded, it is released from memory and the engine returns
 * to idle (the chat composer will disable until a model is loaded again).
 */
export async function deleteModel(id: string): Promise<void> {
  const model = MODELS.find((m) => m.id === id)
  if (!model) return
  if (!engine) engine = await createEngine()
  await engine.deleteModel(model)
  downloadedModels.update((d) => ({ ...d, [id]: false }))
  if (get(loadedModelId) === id) {
    loadedModelId.set(null)
    engineStatus.set('idle')
    loadProgress.set(null)
  }
}

const SYSTEM_BASE =
  'You are Universal AI, a concise, helpful offline assistant running entirely ' +
  'on the user\'s device. Answer the question directly and up front in your first ' +
  'sentence, then add any supporting detail. Only cite sources that are ' +
  'explicitly provided to you in a numbered context block. Never invent ' +
  'citations, source names, or [n] markers for general knowledge that did not ' +
  'come from such a block.'

const SAFE_MODE_ADDON =
  '\n\nSafe mode is enabled. You must refuse any request that involves sexual ' +
  'or adult content, gambling, violence, illegal activities, or other harmful ' +
  'or inappropriate topics. Politely decline and suggest the user use a ' +
  'different resource for such topics.'

/**
 * Map the best cited-source match score to a coarse confidence band. Cosine
 * similarity from the local embedding model is the most meaningful + feasible
 * on-device signal: a high top-match means the answer is grounded in passages
 * that closely match the question. (True token log-probabilities aren't exposed
 * by either backend's streaming API, so retrieval agreement is the practical
 * proxy.) Thresholds mirror the 0.25 relevance floor used for grounding.
 */
function scoreToConfidence(bestScore: number): Confidence {
  if (bestScore >= 0.6) return 'high'
  if (bestScore >= 0.4) return 'medium'
  return 'low'
}

export async function send(userText: string): Promise<void> {
  const text = userText.trim()
  if (!text || get(generating) || get(engineStatus) !== 'ready' || !engine) return

  const userMsg: UIMessage = { id: uid(), role: 'user', content: text }
  const botMsg: UIMessage = { id: uid(), role: 'assistant', content: '', streaming: true, query: text }
  messages.update((m) => [...m, userMsg, botMsg])
  generating.set(true)

  try {
    // RAG: retrieve from enabled KBs (+ opt-in web search) and ground the prompt.
    const cfg = get(settings)
    let system = SYSTEM_BASE + (cfg.safeMode !== false ? SAFE_MODE_ADDON : '')

    // Persona ("Knowledge"): give the assistant a character + subject expertise.
    // The persona's subject knowledge is retrieved from separately (its KB is
    // enabled by applyPersonaKnowledge). Its prompt describes manner and subject
    // only; the name is set once, below, so an explicit "My name" override in
    // Customise still wins over the persona.
    const persona = getPersona(cfg.personaId)
    if (persona.prompt) system += '\n\n' + persona.prompt

    const aiName = cfg.aiName.trim() || (persona.id ? persona.name : '')
    if (aiName) {
      system +=
        `\n\nYour name is ${aiName}. When asked your name or ` +
        `introducing yourself, say you are ${aiName}.`
    }
    if (cfg.userName.trim()) {
      system +=
        `\n\nThe user's name is ${cfg.userName.trim()}. Address them by name ` +
        'when it feels natural, without overusing it.'
    }

    const enabled = get(kbs).filter((k) => k.enabled).map((k) => k.id)
    let sources: Citation[] = []
    let confidence: Confidence | undefined
    let confidenceScore: number | undefined

    // Gather candidate passages from local KBs and, if opted in + online, the web.
    // Retrieval is best-effort: if the embedder can't run (its WASM heap can
    // fail to allocate under memory pressure from the chat model — "no
    // available backend found … Out of memory" — or its first fetch happens
    // offline), answer ungrounded rather than failing the whole turn.
    const candidates: RetrievedChunk[] = []
    try {
      if (enabled.length > 0) candidates.push(...(await retrieve(text, enabled, 4)))
      if (cfg.webSearch && get(online)) candidates.push(...(await webSearch(text, 3)))
    } catch (err) {
      console.warn('Retrieval unavailable — answering without context:', err)
      candidates.length = 0
    }

    if (candidates.length > 0) {
      const relevant = candidates
        .filter((h) => h.score > 0.25)
        .sort((a, b) => b.score - a.score)
        .slice(0, 4)
      if (relevant.length > 0) {
        system += '\n\n' + buildContext(relevant)
        // [n] markers in buildContext are 1-based and positional; mirror that
        // ordering here so each inline citation maps to the right source.
        sources = relevant.map((h, i) => ({
          n: i + 1,
          source: h.source,
          snippet: h.text.slice(0, 320),
          url: h.url,
        }))
        confidence = scoreToConfidence(relevant[0].score)
        confidenceScore = relevant[0].score
      }
    }

    // Cap the history we replay each turn. Sending the whole conversation grows
    // the prompt (and KV-cache memory) without bound, which on the CPU/WASM path
    // eventually overflows the context window and pushes memory past the point
    // where iOS reloads the WebView. Keep the most recent turns only.
    const MAX_HISTORY = 8
    const history = get(messages)
      .filter((m) => !m.streaming && (m.role === 'user' || m.role === 'assistant'))
      .slice(-MAX_HISTORY)
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
          ? {
              ...m,
              streaming: false,
              sources: sources.length ? sources : undefined,
              confidence: sources.length ? confidence : undefined,
              confidenceScore: sources.length ? confidenceScore : undefined,
            }
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

function patchMessage(id: string, patch: Partial<UIMessage>): void {
  messages.update((all) => all.map((m) => (m.id === id ? { ...m, ...patch } : m)))
}

/**
 * On-demand "double-check online": re-run the answer's question through the web
 * search pipeline (Wikipedia) and attach any corroborating web results to the
 * message, so the user can verify a local answer against a live source. Opt-in
 * per answer (clicking is the consent), independent of the always-on web-search
 * toggle. Best-effort and never throws.
 */
export async function doubleCheckOnline(id: string): Promise<void> {
  const msg = get(messages).find((m) => m.id === id)
  if (!msg || msg.role !== 'assistant' || msg.webChecking) return
  const query = (msg.query ?? '').trim()
  if (!query) return
  if (!get(online)) {
    patchMessage(id, { webCheckNote: 'You appear to be offline — connect to double-check on the web.' })
    return
  }
  patchMessage(id, { webChecking: true, webCheckNote: undefined, webSources: undefined })
  try {
    const hits = (await webSearch(query, 4))
      .filter((h) => h.score > 0.25)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
    if (hits.length === 0) {
      patchMessage(id, { webChecking: false, webCheckNote: 'No corroborating web results found.' })
      return
    }
    const webSources: Citation[] = hits.map((h, i) => ({
      n: i + 1,
      source: h.source,
      snippet: h.text.slice(0, 320),
      url: h.url,
    }))
    patchMessage(id, { webChecking: false, webSources, webCheckNote: undefined })
  } catch {
    patchMessage(id, { webChecking: false, webCheckNote: 'Web check failed — please try again.' })
  }
}

export function clearChat(): void {
  messages.set([])
  // Wipe storage synchronously: clear-on-close calls this from `pagehide`,
  // where the throttled persister's timeout would never get to run.
  if (persistTimer) {
    clearTimeout(persistTimer)
    persistTimer = null
  }
  try {
    localStorage.removeItem(MESSAGES_KEY)
  } catch {
    // storage unavailable — nothing persisted anyway
  }
}

// --- Saved responses -----------------------------------------------------
// Responses the user long-presses to keep. Unlike the chat (which clear-on-close
// can wipe), these persist to localStorage across sessions — that is the point
// of saving. Shown in the Saved tab.
export interface SavedResponse {
  id: string
  content: string
  sources?: Citation[]
  confidence?: Confidence
  savedAt: number
}

const SAVED_KEY = 'universal-ai:saved'
function loadSaved(): SavedResponse[] {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(SAVED_KEY) : null
    return raw ? (JSON.parse(raw) as SavedResponse[]) : []
  } catch {
    return []
  }
}

export const saved = writable<SavedResponse[]>(loadSaved())
saved.subscribe((list) => {
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(list))
  } catch {
    // storage unavailable — saved list stays in memory only
  }
})

/** Save an assistant response (newest first; ignores duplicates and non-bot). */
export function saveResponse(msg: UIMessage): void {
  if (msg.role !== 'assistant' || !msg.content.trim()) return
  saved.update((list) =>
    list.some((s) => s.id === msg.id)
      ? list
      : [
          {
            id: msg.id,
            content: msg.content,
            sources: msg.sources,
            confidence: msg.confidence,
            savedAt: Math.floor(performance.timeOrigin + performance.now()),
          },
          ...list,
        ],
  )
}

export function unsaveResponse(id: string): void {
  saved.update((list) => list.filter((s) => s.id !== id))
}
