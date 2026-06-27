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
      n_ctx: 4096,
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
}
