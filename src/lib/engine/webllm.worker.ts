// Dedicated worker that hosts the WebLLM engine. Running inference off the main
// thread keeps the UI responsive during model load and token generation.
import { WebWorkerMLCEngineHandler } from '@mlc-ai/web-llm'

const handler = new WebWorkerMLCEngineHandler()
self.onmessage = (msg: MessageEvent) => {
  handler.onmessage(msg)
}
