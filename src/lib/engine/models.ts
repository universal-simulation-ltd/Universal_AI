import type { ModelOption } from './types'

// Small general-purpose instruct models that fit in a mobile Safari tab.
// Each entry can carry a `webllm` id (WebGPU backend) and/or a `wllama` GGUF
// (WASM/CPU backend). The active engine uses whichever ref it understands; the
// UI only offers models the current backend can actually run.
export const MODELS: ModelOption[] = [
  {
    id: 'llama-3.2-1b',
    label: 'Llama 3.2 1B (fast, default)',
    sizeMB: 880,
    ramMB: 1200,
    note: 'Safest choice on mobile. Quick, light on memory.',
    webllm: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
    wllama: { repo: 'bartowski/Llama-3.2-1B-Instruct-GGUF', file: 'Llama-3.2-1B-Instruct-Q4_K_M.gguf' },
  },
  {
    id: 'qwen2.5-1.5b',
    label: 'Qwen2.5 1.5B (balanced)',
    sizeMB: 1100,
    ramMB: 1600,
    note: 'A bit sharper than 1B; still mobile-friendly.',
    webllm: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
    wllama: { repo: 'bartowski/Qwen2.5-1.5B-Instruct-GGUF', file: 'Qwen2.5-1.5B-Instruct-Q4_K_M.gguf' },
  },
  {
    id: 'llama-3.2-3b',
    label: 'Llama 3.2 3B (best quality)',
    sizeMB: 2200,
    ramMB: 2900,
    note: 'Best answers, but heavy. WebGPU only — prefer desktop / 8GB+ phones.',
    webllm: 'Llama-3.2-3B-Instruct-q4f16_1-MLC',
    // No wllama entry: 3B on single-thread WASM is too slow/heavy to recommend.
  },
]

export const DEFAULT_MODEL_ID = MODELS[0].id

/** Models the given backend can actually run. */
export function modelsFor(backend: 'webllm' | 'wllama' | null): ModelOption[] {
  if (!backend) return MODELS
  return MODELS.filter((m) => m[backend] != null)
}
