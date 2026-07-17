# Universal AI — docs

## What this repo is

Universal AI is a local-first, offline LLM chatbot: a mobile-first, installable
Progressive Web App that runs a small general-purpose language model **entirely
on-device** — no server, no API calls — and grounds its answers in pluggable
**RAG knowledge bases**.

Key pieces:

- **Inference** — [WebLLM](https://github.com/mlc-ai/web-llm) (WebGPU) running
  in a Web Worker, with an automatic fallback to
  [wllama](https://github.com/ngxson/wllama) (llama.cpp WASM) on devices
  without WebGPU. Both sit behind one `LLMEngine` interface in `src/lib/engine`.
- **RAG** — embeddings via transformers.js (`all-MiniLM-L6-v2`), an IndexedDB
  vector store for your own documents, plus a bundled int8-quantised Simple
  Wikipedia knowledge pack (built by `scripts/build-knowledge-pack.mjs`,
  shipped via Git LFS) so general-knowledge answers can cite a source offline.
- **Shell** — Svelte 5 + Vite + `vite-plugin-pwa`. A `capacitor.config.ts` and
  `ios/` scaffold exist for a native iOS wrapper.

The repo is public and the app is free to use. Unlike most Universal Apps it is
**not (yet) served by path under `opensource.unisim.co.uk`** — it's a
local-first, desktop/mobile-oriented app installed as a PWA. See the root
`README.md` for requirements (Git LFS) and the develop/build workflow.

## What's here

| File | What it covers |
|---|---|
| `claude-handover.md` | Dated session-handover log for AI-assisted development — newest entry first, each entry overrides older ones. |

## Suite context

This repo is one part of the **Universal Simulation suite** (the open-source
Universal Apps family). For cross-repo context — how the `@unisim/sdk`, edge
routing, and the suite changelog wire together — see the suite docs repo:
[`universal-simulation-ltd/docs`](https://github.com/universal-simulation-ltd/docs)
(private; checked out at the umbrella root as `Docs_UNI_SIM/` for suite
contributors). Start with `ARCHITECTURE.md` (the cross-repo map).
