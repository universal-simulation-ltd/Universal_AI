import { Wllama, WllamaAbortError } from '@wllama/wllama/esm/index.js'
// Vite emits these as hashed asset URLs; wllama is told where to fetch them.
import singleThreadWasm from '@wllama/wllama/esm/single-thread/wllama.wasm?url'
import multiThreadWasm from '@wllama/wllama/esm/multi-thread/wllama.wasm?url'
import type {
  ChatMessage,
  GenerateOptions,
  LLMEngine,
  LoadProgress,
  ModelOption,
} from './types'

const CONFIG_PATHS = {
  'single-thread/wllama.wasm': singleThreadWasm,
  // Multi-thread needs SharedArrayBuffer (cross-origin isolation), which we
  // don't enable. wllama detects this and falls back to single-thread; the URL
  // is harmless to provide.
  'multi-thread/wllama.wasm': multiThreadWasm,
}

// The WASM/CPU fallback for browsers/devices without WebGPU. Slower than WebLLM
// but runs essentially everywhere WebAssembly does (older iOS Safari, Firefox…).
export class WllamaEngine implements LLMEngine {
  readonly id = 'wllama'
  private wllama: Wllama | null = null
  private loadedModel: string | null = null
  private abort: AbortController | null = null

  async isSupported(): Promise<boolean> {
    return typeof WebAssembly === 'object'
  }

  async load(model: ModelOption, onProgress?: (p: LoadProgress) => void): Promise<void> {
    if (!model.wllama) {
      throw new Error(
        `"${model.label}" has no CPU (GGUF) variant — pick a different model.`,
      )
    }
    if (this.loadedModel === model.id && this.wllama?.isModelLoaded()) return

    // wllama has no in-place reload; recreate for a clean swap.
    if (this.wllama) {
      await this.wllama.exit().catch(() => {})
      this.wllama = null
      this.loadedModel = null
    }

    const wllama = new Wllama(CONFIG_PATHS, {
      suppressNativeLog: true,
      allowOffline: true,
    })
    onProgress?.({ progress: 0, text: 'Downloading model…' })
    await wllama.loadModelFromHF(model.wllama.repo, model.wllama.file, {
      // 2048 rather than 4096: the KV cache is the dominant runtime allocation on
      // the CPU/WASM path, and halving the context markedly cuts peak memory —
      // which is what triggers iOS WKWebView to jettison (and reload) the page
      // mid-chat. Paired with the history cap in stores.send() so prompts stay
      // within this window.
      n_ctx: 2048,
      // llama.cpp's default n_batch is 2048; the prompt-processing compute
      // buffers scale with it, costing hundreds of MB at load time. 256 keeps
      // chat latency fine (prompts are decoded in 256-token slices) and lowers
      // the peak that gets WKWebView jettisoned right after "Download & load".
      n_batch: 256,
      // Quantize the K half of the KV cache (V must stay f16 — quantized V
      // requires flash-attn, which the single-thread WASM build can't rely on).
      cache_type_k: 'q8_0',
      progressCallback: ({ loaded, total }) => {
        const p = total ? loaded / total : 0
        onProgress?.({ progress: p, text: `Downloading weights ${Math.round(p * 100)}%` })
      },
    })
    this.wllama = wllama
    this.loadedModel = model.id
  }

  async generate(
    messages: ChatMessage[],
    onToken: (delta: string) => void,
    opts: GenerateOptions = {},
  ): Promise<string> {
    if (!this.wllama) throw new Error('Engine not loaded')
    this.abort = new AbortController()
    let emitted = 0

    try {
      // `currentText` is the full decoded string so far; diffing it avoids
      // splitting multi-byte UTF-8 characters across token boundaries.
      const full = await this.wllama.createChatCompletion(messages, {
        nPredict: opts.maxTokens ?? 800,
        sampling: { temp: opts.temperature ?? 0.7, top_p: 0.9 },
        useCache: true,
        abortSignal: this.abort.signal,
        onNewToken: (_token, _piece, currentText) => {
          const delta = currentText.slice(emitted)
          emitted = currentText.length
          if (delta) onToken(delta)
        },
      })
      return full
    } catch (err) {
      if (err instanceof WllamaAbortError) return '' // streamed text already delivered
      throw err
    } finally {
      this.abort = null
    }
  }

  async interrupt(): Promise<void> {
    this.abort?.abort()
  }

  async unload(): Promise<void> {
    await this.wllama?.exit().catch(() => {})
    this.wllama = null
    this.loadedModel = null
  }

  // wllama caches model files (in OPFS / Cache Storage). Reuse the live instance's
  // cache manager when a model is loaded, else a lightweight throwaway that only
  // reads the cache (constructing Wllama downloads nothing on its own).
  private standaloneCm: { list(): Promise<unknown[]>; deleteMany(p: (e: unknown) => boolean): Promise<void> } | null = null
  private cacheMgr() {
    if (this.wllama) return this.wllama.cacheManager
    if (!this.standaloneCm) {
      this.standaloneCm = new Wllama(CONFIG_PATHS, { suppressNativeLog: true })
        .cacheManager as unknown as typeof this.standaloneCm
    }
    return this.standaloneCm!
  }

  async isDownloaded(model: ModelOption): Promise<boolean> {
    if (!model.wllama) return false
    const file = model.wllama.file
    try {
      const entries = (await this.cacheMgr().list()) as Array<{
        name?: string
        metadata?: { originalURL?: string }
      }>
      return entries.some(
        (e) => (e.name ?? '').includes(file) || (e.metadata?.originalURL ?? '').includes(file),
      )
    } catch {
      return false
    }
  }

  async deleteModel(model: ModelOption): Promise<void> {
    if (!model.wllama) return
    const file = model.wllama.file
    if (this.loadedModel === model.id) await this.unload()
    try {
      await this.cacheMgr().deleteMany((e) => {
        const entry = e as { name?: string; metadata?: { originalURL?: string } }
        return (entry.name ?? '').includes(file) || (entry.metadata?.originalURL ?? '').includes(file)
      })
    } catch {
      // Cache unavailable — nothing to delete.
    }
  }
}
