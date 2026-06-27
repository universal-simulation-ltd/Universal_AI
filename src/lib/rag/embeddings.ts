import { pipeline, env, type FeatureExtractionPipeline } from '@huggingface/transformers'

// All models load from the HF CDN on first use, then cache in the browser.
// Allow remote fetch; we are not bundling weights.
env.allowLocalModels = false

const MODEL_ID = 'Xenova/all-MiniLM-L6-v2' // 384-dim, ~23MB quantized
export const EMBED_DIM = 384

let extractorPromise: Promise<FeatureExtractionPipeline> | null = null

function getExtractor(): Promise<FeatureExtractionPipeline> {
  if (!extractorPromise) {
    // Cast through `any`: the pipeline() overload set produces a union type too
    // complex for the checker. WebGPU is used if available, else WASM; dtype
    // hint keeps the model small/fast.
    extractorPromise = (pipeline as any)('feature-extraction', MODEL_ID, {
      dtype: 'q8',
    }) as Promise<FeatureExtractionPipeline>
  }
  return extractorPromise
}

/** Embed one or more texts. Returns L2-normalized Float32Array vectors. */
export async function embed(texts: string[]): Promise<Float32Array[]> {
  if (texts.length === 0) return []
  const extractor = await getExtractor()
  const output = await extractor(texts, { pooling: 'mean', normalize: true })
  // output.data is a flat Float32Array of shape [texts.length, EMBED_DIM]
  const flat = output.data as Float32Array
  const out: Float32Array[] = []
  for (let i = 0; i < texts.length; i++) {
    out.push(flat.slice(i * EMBED_DIM, (i + 1) * EMBED_DIM))
  }
  return out
}

export async function embedOne(text: string): Promise<Float32Array> {
  return (await embed([text]))[0]
}

/** Cosine similarity for already-normalized vectors == dot product. */
export function cosine(a: Float32Array, b: Float32Array): number {
  let dot = 0
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i]
  return dot
}
