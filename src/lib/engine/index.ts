import type { EngineKind, LLMEngine } from './types'

export * from './types'
export { MODELS, DEFAULT_MODEL_ID, modelsFor } from './models'

/** Cheap WebGPU probe — avoids importing the (heavy) WebLLM bundle just to ask. */
async function hasWebGPU(): Promise<boolean> {
  if (!('gpu' in navigator)) return false
  try {
    const adapter = await (navigator as any).gpu.requestAdapter()
    return !!adapter
  } catch {
    return false
  }
}

/**
 * Decide which backend the current device/browser will use.
 * WebGPU (WebLLM) is strongly preferred; wllama (WASM/CPU) is the universal
 * fallback. Detection is cheap and pulls in neither backend bundle, so the UI
 * can call this up front to show only the models the chosen backend can run.
 */
export async function detectBackend(): Promise<EngineKind> {
  return (await hasWebGPU()) ? 'webllm' : 'wllama'
}

/**
 * Build the engine for the current device. The backend implementation is
 * dynamically imported so a device only ever downloads the one it uses.
 */
export async function createEngine(): Promise<LLMEngine> {
  if (await detectBackend() === 'webllm') {
    const { WebLLMEngine } = await import('./webllm')
    return new WebLLMEngine()
  }
  const { WllamaEngine } = await import('./wllama')
  return new WllamaEngine()
}
