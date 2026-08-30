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

  ⚠️ **Build the native bundle with `npm run cap:sync`, never a bare
  `npx cap sync`.** `cap` copies whatever is sitting in `dist`, and after
  `npm run build` that is the *web* build — service worker included. The
  `cap:sync` script runs `build:mobile` (`--mode mobile`, which drops the PWA
  plugin) and then `scripts/verify-mobile-bundle.mjs`, which fails the build if
  `sw.js` / `registerSW.js` / `workbox-*.js` reached the copied bundle or if any
  asset URL in its `index.html` does not resolve inside it. The iOS bundle
  shipped all three worker files until 2026-08-30; nothing broke, because
  WKWebView has no service workers on a custom scheme, but that was WebKit's
  choice rather than ours.

  Unlike the other Capacitor apps in the suite, `--mode mobile` does **not**
  change `base`. They are served under a path prefix (`/blackbook/`,
  `/polling/`) so their production asset URLs are wrong inside the app; this
  app's `base` is `/` everywhere and `capacitor://localhost` roots that at the
  copied bundle, so there is nothing to correct.

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
