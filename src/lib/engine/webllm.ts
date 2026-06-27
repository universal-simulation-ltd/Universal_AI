import {
  CreateWebWorkerMLCEngine,
  type MLCEngineInterface,
  type InitProgressReport,
} from '@mlc-ai/web-llm'
import type { ChatMessage, GenerateOptions, LLMEngine, LoadProgress } from './types'

export class WebLLMEngine implements LLMEngine {
  readonly id = 'webllm'
  private engine: MLCEngineInterface | null = null
  private worker: Worker | null = null
  private loadedModel: string | null = null

  async isSupported(): Promise<boolean> {
    if (!('gpu' in navigator)) return false
    try {
      const adapter = await (navigator as any).gpu.requestAdapter()
      return !!adapter
    } catch {
      return false
    }
  }

  async load(modelId: string, onProgress?: (p: LoadProgress) => void): Promise<void> {
    if (this.loadedModel === modelId && this.engine) return

    // Reuse one worker across model swaps.
    if (!this.worker) {
      this.worker = new Worker(new URL('./webllm.worker.ts', import.meta.url), {
        type: 'module',
      })
    }

    const initProgressCallback = (r: InitProgressReport) => {
      onProgress?.({ progress: r.progress ?? 0, text: r.text })
    }

    if (this.engine) {
      // Engine already exists (different model) — reload weights in place.
      await this.engine.reload(modelId)
    } else {
      this.engine = await CreateWebWorkerMLCEngine(this.worker, modelId, {
        initProgressCallback,
      })
    }
    this.loadedModel = modelId
  }

  async generate(
    messages: ChatMessage[],
    onToken: (delta: string) => void,
    opts: GenerateOptions = {},
  ): Promise<string> {
    if (!this.engine) throw new Error('Engine not loaded')

    const stream = await this.engine.chat.completions.create({
      stream: true,
      messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 800,
    })

    let full = ''
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? ''
      if (delta) {
        full += delta
        onToken(delta)
      }
    }
    return full
  }

  async interrupt(): Promise<void> {
    await this.engine?.interruptGenerate()
  }

  async unload(): Promise<void> {
    await this.engine?.unload()
    this.loadedModel = null
  }
}
