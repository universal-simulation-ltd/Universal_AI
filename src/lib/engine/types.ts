// The engine abstraction. Today there is one implementation (WebLLM / WebGPU).
// A future wllama (WASM/CPU) implementation can satisfy the same interface so
// the rest of the app never needs to know which backend is running.

export type Role = 'system' | 'user' | 'assistant'

export interface ChatMessage {
  role: Role
  content: string
}

export interface LoadProgress {
  /** 0..1, or undefined if the backend can't report a fraction. */
  progress: number
  /** Human-readable status, e.g. "Fetching weights [3/12]". */
  text: string
}

export interface GenerateOptions {
  temperature?: number
  /** Hard cap on generated tokens. */
  maxTokens?: number
}

export interface LLMEngine {
  readonly id: string
  /** True if this engine can run in the current browser/device. */
  isSupported(): Promise<boolean>
  /** Download (cached after first run) + initialise the model. */
  load(modelId: string, onProgress?: (p: LoadProgress) => void): Promise<void>
  /** Stream a completion. Resolves with the full text once finished. */
  generate(
    messages: ChatMessage[],
    onToken: (delta: string) => void,
    opts?: GenerateOptions,
  ): Promise<string>
  /** Stop an in-flight generation. */
  interrupt(): Promise<void>
  /** Release the model from memory. */
  unload(): Promise<void>
}

export interface ModelOption {
  id: string
  label: string
  /** Approx download size, for the UI. */
  sizeMB: number
  /** Approx RAM/VRAM needed while running. */
  ramMB: number
  note?: string
}
