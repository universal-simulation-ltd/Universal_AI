import type { ModelOption } from './types'

// Small general-purpose instruct models that fit in a mobile Safari tab.
// Defaults are tuned for an iPhone-15-Pro-class device; the 3B option is for
// desktop / higher-RAM phones. IDs come from WebLLM's prebuilt model list.
export const MODELS: ModelOption[] = [
  {
    id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
    label: 'Llama 3.2 1B (fast, default)',
    sizeMB: 880,
    ramMB: 1200,
    note: 'Safest choice on mobile. Quick, light on memory.',
  },
  {
    id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
    label: 'Qwen2.5 1.5B (balanced)',
    sizeMB: 1100,
    ramMB: 1600,
    note: 'A bit sharper than 1B; still mobile-friendly.',
  },
  {
    id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC',
    label: 'Llama 3.2 3B (best quality)',
    sizeMB: 2200,
    ramMB: 2900,
    note: 'Best answers, but may exceed mobile Safari memory. Prefer desktop / 8GB+ phones.',
  },
]

export const DEFAULT_MODEL_ID = MODELS[0].id
