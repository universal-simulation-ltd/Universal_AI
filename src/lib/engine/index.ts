import type { LLMEngine } from './types'
import { WebLLMEngine } from './webllm'

export * from './types'
export { MODELS, DEFAULT_MODEL_ID } from './models'

// Engine factory. Today it returns WebLLM when WebGPU is available.
// To add the WASM/CPU fallback later: implement WllamaEngine (same LLMEngine
// interface) and return it here when isSupported() is false for WebLLM.
export async function createEngine(): Promise<LLMEngine> {
  const webllm = new WebLLMEngine()
  if (await webllm.isSupported()) return webllm

  throw new Error(
    'WebGPU is not available in this browser. A WASM/CPU fallback (wllama) ' +
      'is planned but not yet implemented. On iPhone, use iOS 26+ Safari; on ' +
      'desktop, use a recent Chrome, Edge, or Safari.',
  )
}
