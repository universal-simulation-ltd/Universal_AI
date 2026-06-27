# Claude session handover — Universal AI

Newest entries first. Each dated entry overrides the older body below it.

## Update — 2026-06-27 (Answer citations + bundled general-knowledge pack)

### What shipped
- **Inline answer citations.** RAG answers now render `[n]` markers as clickable
  chips with a numbered footnote list (click a chip → highlights its source).
  Anti-hallucination guardrails: the grounding prompt + base system prompt forbid
  inventing citations, and the renderer drops any `[n]` outside the real source
  range. Footnotes are **cited-only** — a retrieved-but-uncited chunk (just over
  the 0.25 threshold) no longer shows as a source.
  Files: `src/lib/components/MessageBubble.svelte`, `src/lib/stores.ts`
  (`buildContext` lives in `src/lib/rag/index.ts`).
- **Pre-loaded "general knowledge" pack (Simple Wikipedia).** Lets the app cite
  broad facts offline, out of the box.
  - Build pipeline: `scripts/build-knowledge-pack.mjs` (npm `build:knowledge`).
    Sources: `--source=parquet --input=FILE` (read a local HF parquet shard via
    hyparquet — recommended for large builds, no API calls, immune to rate
    limits), `--source=hf` (HF datasets-server rows API — fine for a few thousand,
    throttles at 25k), `--source=api` (live Simple Wikipedia, backoff),
    `--source=jsonl --input=FILE`. Embeds with the SAME
    model as the app (all-MiniLM-L6-v2, normalize:true), int8-quantizes, writes a
    versioned `.bin` + `.json` manifest to `public/knowledge/`.
  - Runtime: `src/lib/rag/pack.ts` holds the pack in memory (NOT IndexedDB) as a
    single Int8Array + text; `retrieve()` in `rag/index.ts` merges pack hits
    (kbId prefix `builtin:`) with IndexedDB hits — `send()`/`buildContext`
    unchanged. Install lifecycle (download/enable/remove, localStorage flag,
    progress) in `stores.ts`; seeded + warmed in `App.svelte` onMount; UI card in
    `KnowledgeView.svelte`. Offline caching via a `/knowledge/` CacheFirst rule in
    `vite.config.ts`.
- **Landing copy:** expanded "RAG" → "RAG — Retrieval-Augmented Generation"
  (`ChatView.svelte`).

### Verified (Claude_Preview, real Llama 3.2 1B + WebGPU)
- 3000-article pack built via `--source=hf` (2.1 MB). Retrieval: "April" → April
  0.738 top; "Wannsee Conference" → 0.635 top. int8 ranking matches float32.
- Full chat E2E: model cited `[1] Wannsee Conference` from the pack (a fact not in
  any user upload). Download→install→toggle→remove UX all work. `svelte-check`: 0.

### Deploy state
- Merged into **main** (local; NOT pushed to origin). Feature branch
  `feat/knowledge-pack-citations` retained. One repo: Universal_AI.
- A real **25k-article pack (16.9 MB)** is built locally at
  `public/knowledge/simplewiki.v1.{bin,json}` but is **git-ignored** and NOT
  committed — only the build script + runtime ship. `.gitattributes` routes
  `public/knowledge/*.bin` through Git LFS for when the pack is committed.

### What's left / next
1. **Ship the built pack:** the 25k `.bin` already exists locally. To commit it:
   `brew install git-lfs && git lfs install`, then un-ignore `public/knowledge/`
   and `git add` the `.bin` (LFS handles it). Rebuild any time with
   `npm run build:knowledge -- --source=parquet --input=/tmp/simplewiki.parquet --limit=25000`.
2. **Push** main to origin when ready.
3. **Future:** online web-search source — reuses the same `[n]`/`buildContext`
   citation path with web snippets + URLs instead of local files.
