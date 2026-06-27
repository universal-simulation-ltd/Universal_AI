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
  type KnowledgeBase,
} from './rag'

export interface UIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  /** Sources cited from RAG, if any, for assistant turns. */
  sources?: string[]
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
  await deleteKBRecord(kb.id)
  await refreshKBs()
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
  'on the user’s device.'

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
    let sources: string[] = []
    if (enabled.length > 0) {
      const hits = await retrieve(text, enabled, 4)
      const relevant = hits.filter((h) => h.score > 0.25)
      if (relevant.length > 0) {
        system += '\n\n' + buildContext(relevant)
        sources = [...new Set(relevant.map((h) => h.source))]
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
