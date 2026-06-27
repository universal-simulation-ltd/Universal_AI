# Universal AI — Offline LLM Chatbot (PWA)

A mobile-first, installable Progressive Web App that runs a small general-purpose
LLM **entirely on-device** — no server, no API calls — and lets you plug in your
own **RAG knowledge bases** to ground answers.

## What is RAG?

**Retrieval-Augmented Generation** lets the AI answer from *your* documents.
Language models are frozen at training time — they don't know your notes or
private docs. Instead of retraining, RAG breaks your documents into small
passages, finds the ones whose meaning is closest to your question, and gives
them to the model as context. The model then answers *grounded in your material*
— quoting it and citing the source — rather than guessing from memory. It's the
difference between asking someone to recall a fact and letting them read the
relevant page first.

## How it works

| Layer | Choice | Notes |
|-------|--------|-------|
| Inference (GPU) | [WebLLM](https://github.com/mlc-ai/web-llm) (WebGPU) in a Web Worker | Runs the LLM on the GPU off the main thread. Preferred when available. |
| Inference (CPU) | [wllama](https://github.com/ngxson/wllama) (llama.cpp WASM) | Automatic fallback when WebGPU is absent. Slower, but runs almost everywhere. |
| Engine abstraction | `src/lib/engine` | One `LLMEngine` interface; both backends implement it. `detectBackend()` picks GPU vs CPU and the chosen engine is dynamically imported, so a device only downloads the backend it uses. |
| Embeddings | [transformers.js](https://github.com/huggingface/transformers.js) — `all-MiniLM-L6-v2` (384-d) | Runs locally; WebGPU if available, else WASM. |
| Vector store | IndexedDB (your docs) + an in-memory int8 pack (bundled knowledge) | `src/lib/rag`. Brute-force cosine over both; fine for on-device corpus sizes. |
| Bundled knowledge | Pre-built Simple Wikipedia pack (`scripts/build-knowledge-pack.mjs`) | 25k article intros, int8-quantized, shipped via Git LFS; downloaded + cached on demand so general-knowledge answers can cite a source offline. |
| Shell | Svelte 5 + Vite + `vite-plugin-pwa` | Installable, offline app shell. |

Nothing leaves the device. The only network traffic is the **first-run download**
of the model + embedding weights, which are then cached (WebLLM/transformers
manage their own cache; the app shell is precached by the service worker).

## Requirements

- **iPhone**: iOS 26+ Safari runs the fast WebGPU path (iPhone 15 Pro etc.).
  Older iOS falls back to the wllama CPU path automatically.
- **Desktop**: recent Chrome, Edge, or Safari use WebGPU; anything else falls
  back to CPU.
- No WebGPU? The app transparently switches to the wllama (WASM/CPU) backend and
  shows a "CPU mode" hint. The model list is filtered to what that backend runs.

## Develop

> **Git LFS required.** The bundled general-knowledge pack
> (`public/knowledge/simplewiki.v1.bin`, ~17 MB) is stored in
> [Git LFS](https://git-lfs.com). Install it **before cloning** so the real
> binary is fetched instead of a small text pointer — otherwise the built-in
> "General knowledge" base will 404 on download. Already cloned? Run
> `git lfs install && git lfs pull`.
>
> ```
> brew install git-lfs && git lfs install   # once per machine
> ```

```
cd /Users/jamesmarkey/Github/UNISIM/Universal_Apps/Universal_AI
npm install
npm run dev      # http://localhost:5173
npm run build    # production build + service worker
npm run preview  # serve the built app
```

> Note: the PWA service worker is only generated in `build`/`preview`, not `dev`.

### Rebuilding the knowledge pack

The pre-built pack ships in the repo, so you don't need to regenerate it. To
rebuild or resize it (Simple English Wikipedia intros, embedded + int8-packed):

```
cd /Users/jamesmarkey/Github/UNISIM/Universal_Apps/Universal_AI
curl -sL "https://huggingface.co/datasets/wikimedia/wikipedia/resolve/refs%2Fconvert%2Fparquet/20231101.simple/train/0000.parquet" -o /tmp/simplewiki.parquet
npm run build:knowledge -- --source=parquet --input=/tmp/simplewiki.parquet --limit=25000
```

Other sources: `--source=hf` (datasets-server API, fine for a few thousand),
`--source=api` (live wiki, rate-limited), `--source=jsonl --input=FILE`.

## Using it

1. Pick a model in the top bar and tap **Load model** (downloads once, ~0.9–2.2 GB).
2. Chat. Generation streams token-by-token; **■** stops it.
3. Open **Knowledge** to paste text or upload `.txt`/`.md` files. They’re chunked,
   embedded, and stored locally. Toggle a base on to ground answers; cited
   sources appear under the reply (as numbered `[n]` footnotes).
4. The built-in **General knowledge (Simple Wikipedia)** base is one tap to
   download (~17 MB, cached offline). Enable it to cite broad facts without
   uploading anything.

## Models

Defaults target an iPhone-15-Pro-class device (`src/lib/engine/models.ts`):

- **Llama 3.2 1B** — fast, light, default.
- **Qwen2.5 1.5B** — a bit sharper.
- **Llama 3.2 3B** — best quality; prefer desktop / 8 GB+ phones (mobile Safari
  may hit its per-tab memory ceiling).

## Project layout

```
src/
  lib/
    engine/    LLM abstraction + WebLLM worker implementation + model list
    rag/       embeddings, IndexedDB vector store, chunk/retrieve/ground, websearch
    components/ ModelBar, ChatView, MessageBubble, KnowledgeView,
                CustomiseView, WelcomeGate
    stores.ts  app state + orchestration (engine + RAG, online, modelEverLoaded)
    settings.ts persisted prefs (theme, name, web-search opt-in)
  App.svelte   shell (Chat / Knowledge / Customise tabs + first-run gate)
```

## Known follow-ups

- Real PNG/maskable icons (currently an SVG placeholder).
- PDF ingestion (today: plain text / markdown).
- Optionally run embeddings in a worker to keep ingestion fully off the main thread.
- End-to-end browser verification of both backends (model download + inference).
