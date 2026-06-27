# Claude session handover — Universal AI

Newest entries first. Each dated entry overrides the older body below it.

## Update — 2026-06-27 (First-run gate, Customise tab, connection light, answer-first sources, confidence, opt-in web search)

Shipped the five Universal AI backlog items in one pass. `svelte-check` clean (0
errors), `npm run build` green. Browser E2E (model download + live inference)
still owner-to-verify — these are code + build verified only.

### New files
- **`src/lib/settings.ts`** — persisted user prefs store (`theme`,
  `userName`, `webSearch`) + `applyTheme()` (sets `<html data-theme>`, follows the
  OS for `'system'`, re-themes live on OS change). Persists to
  `localStorage['universal-ai:settings']`.
- **`src/lib/components/WelcomeGate.svelte`** — first-run gate / onboarding.
- **`src/lib/components/CustomiseView.svelte`** — the Customise tab.
- **`src/lib/rag/websearch.ts`** — opt-in online retrieval source.

### What shipped
1. **First-run model gate + Customise tab.**
   - `WelcomeGate` is an undismissable modal (no close button / no backdrop click)
     shown by `App.svelte` while `modelEverLoaded` (new store, backed by
     `localStorage['universal-ai:model-loaded']`, set on first successful
     `loadModel()`) is false. Leads with the friendly "Hello there! Welcome to
     Universal AI…" intro, then model picker + Download & start + progress. Doubles
     as the welcome tutorial.
   - **Customise tab** (third tab): Appearance (Light/Dark/System segmented —
     `app.css` gained a `:root[data-theme='light']` palette; dark stays the base
     `:root`), AI model (switch/download — reuses `modelId`/`loadModel`), Your name
     (→ `settings.userName`, injected into the system prompt so the bot addresses
     the user), and the web-search opt-in toggle.
2. **Connection indicator.** The brand dot in the topbar now reflects the new
   `online` store (`navigator.onLine` + online/offline listeners):
   **green = offline (private, desired), red = connected.** Tooltip explains.
3. **Answer-first + collapsible Sources.** `SYSTEM_BASE` now asks for the direct
   answer in the first sentence. `MessageBubble` keeps the inline `[n]` chips but
   replaced the always-on footnote list with a collapsible **Sources (n)**
   dropdown; each source shows its explanation (the retrieved snippet) and, for
   web results, a clickable URL. Clicking a URL shows an in-bubble "Open this link
   in your web browser?" confirm before `window.open`.
4. **Confidence per response.** `Citation` gained `snippet`/`url`; `UIMessage`
   gained `confidence: 'high'|'medium'|'low'`. Derived in `send()` via
   `scoreToConfidence(bestCitedScore)` — **research note:** cosine similarity from
   the local embedding model is the most meaningful + feasible on-device signal
   (neither WebLLM nor wllama exposes token log-probs through their streaming API),
   so retrieval agreement is the chosen proxy. Bands: ≥0.6 high, ≥0.4 medium, else
   low. Shown only for grounded (cited) answers. Badge rendered in `MessageBubble`.
5. **Opt-in online web search.** `webSearch()` (in `rag/websearch.ts`) fetches via
   the **keyless, CORS-enabled Wikipedia REST search** (`/w/rest.php/v1/search/page`)
   — provider-agnostic shape so Brave/Tavily/SearXNG is a drop-in `fetchRawResults`
   swap. Snippets are embedded with the same local model and cosine-scored so web
   hits rank coherently against local hits, then merged into the SAME
   `buildContext()` → `[n]` pipeline (each web source carries its real URL).
   `send()` calls it only when `settings.webSearch` is on **and** `online`. Never
   throws — degrades to local-only on any failure. Default OFF preserves the
   offline-first promise + the green indicator.

### What's left / next
- Browser E2E of all five (esp. live web-search round-trip + confidence bands on
  real answers). Optional: a real general-web provider (Brave/Tavily) behind a key.

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
- Merged into **main** and **pushed to origin**. Feature branch
  `feat/knowledge-pack-citations` retained. One repo: Universal_AI.
- The real **25k-article pack (16.9 MB)** at `public/knowledge/simplewiki.v1.bin`
  is committed via **Git LFS** (`.gitattributes` routes `*.bin`; the `.json`
  manifest is a normal small file). Git LFS is now installed on this machine.
- Rebuild the pack any time with:
  `npm run build:knowledge -- --source=parquet --input=/tmp/simplewiki.parquet --limit=25000`
  (parquet shard from HF; see the build script header for the curl one-liner).

### What's left / next
1. **Future:** online web-search source — reuses the same `[n]`/`buildContext`
   citation path with web snippets + URLs instead of local files.
2. Optional: larger pack (>25k) or multiple language packs — same pipeline,
   bump `--limit` / `--version` and the `MANIFEST_URL` in `src/lib/rag/pack.ts`.
