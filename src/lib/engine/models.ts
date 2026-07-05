import type { ModelOption } from './types'

// Small general-purpose instruct models that fit in a mobile Safari tab.
// Each entry can carry a `webllm` id (WebGPU backend) and/or a `wllama` GGUF
// (WASM/CPU backend). The active engine uses whichever ref it understands; the
// UI only offers models the current backend can actually run.
//
// Three tiers only, chosen so a user can pick by their phone rather than by
// model size: lightest (older phones), the default (most phones), and the
// heaviest/best (future or high-end phones).
export const MODELS: ModelOption[] = [
  {
    id: 'qwen2.5-0.5b',
    label: 'Qwen2.5 0.5B',
    tier: 'Older phones',
    sizeMB: 400,
    ramMB: 650,
    note: 'Best for older or low-memory phones — smallest download and the least likely to run out of memory.',
    webllm: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
    wllama: { repo: 'bartowski/Qwen2.5-0.5B-Instruct-GGUF', file: 'Qwen2.5-0.5B-Instruct-Q4_K_M.gguf' },
  },
  {
    id: 'llama-3.2-1b',
    label: 'Llama 3.2 1B',
    tier: 'Most phones',
    sizeMB: 900,
    ramMB: 1200,
    note: 'The balanced default — quick, light on memory, and safe on most phones.',
    webllm: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
    wllama: { repo: 'bartowski/Llama-3.2-1B-Instruct-GGUF', file: 'Llama-3.2-1B-Instruct-Q4_K_M.gguf' },
  },
  {
    id: 'llama-3.2-3b',
    label: 'Llama 3.2 3B',
    tier: 'Future phones',
    sizeMB: 2200,
    ramMB: 2900,
    note: 'Best answers, but heavy. WebGPU only — prefer newer / 8GB+ phones or desktop.',
    webllm: 'Llama-3.2-3B-Instruct-q4f16_1-MLC',
    // No wllama entry: 3B on single-thread WASM is too slow/heavy to recommend.
  },
]

// The WebGPU default. The WASM/CPU path overrides this to the lightest model
// at detect time (see detectCapabilities) — phones that lack WebGPU are also
// the devices where 1B+ models get the page killed for memory.
export const DEFAULT_MODEL_ID = 'llama-3.2-1b'

/** Models the given backend can actually run. */
export function modelsFor(backend: 'webllm' | 'wllama' | null): ModelOption[] {
  if (!backend) return MODELS
  return MODELS.filter((m) => m[backend] != null)
}
