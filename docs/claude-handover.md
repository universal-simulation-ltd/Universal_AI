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
    Sources: `--source=hf` (HF datasets-server rows API — recommended, no parquet
    tooling, generous rate limit), `--source=api` (live Simple Wikipedia, rate-
    limited — has backoff), `--source=jsonl --input=FILE`. Embeds with the SAME
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
- Committed to branch **`feat/knowledge-pack-citations`** (NOT merged to main, NOT
  pushed). One repo: Universal_AI.
- The generated pack binary is **git-ignored** and **not** committed — only the
  build script + runtime ship. `.gitattributes` routes `public/knowledge/*.bin`
  through Git LFS for when the real pack is added.

### What's left / next
1. **Ship a real pack:** `npm run build:knowledge -- --source=hf --limit=25000`
   (a few min CPU embedding), then commit the `.bin` via LFS — requires
   `brew install git-lfs && git lfs install` first (LFS not installed on this
   machine). Un-ignore `public/knowledge/` deliberately when committing it.
2. **Merge** `feat/knowledge-pack-citations` to main + push when ready.
3. **Future:** online web-search source — reuses the same `[n]`/`buildContext`
   citation path with web snippets + URLs instead of local files.
