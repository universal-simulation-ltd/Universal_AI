# Claude session handover — Universal AI

Newest entries first. Each dated entry overrides the older body below it.

## Update — 2026-07-06 (Confidence bar + source provenance on answers)

Made the existing answer-confidence signal visual, in `MessageBubble.svelte`.

- **Confidence bar** — the old text-only "High/Medium/Low confidence" pill is now
  a label + horizontal **fill bar**, coloured by band (green/amber/red). Fill is
  proportional to the raw top source-match score: `stores.ts` `send()` now also
  stashes `confidenceScore` (0..1, the top retrieval cosine) on the `UIMessage`
  alongside the band; the bar fills to `min(100, score/0.8*100)` (floored at 8%),
  falling back to per-band fills for older messages without a score.
- **Provenance badge** — each grounded answer shows **🌐 Web-checked** when any
  cited source carries a live URL (opt-in web search), else **📚 On-device**.
- Honest labelling: the tooltip says confidence reflects *how well-supported by
  sources* the answer is, **not** guaranteed factual accuracy (it's the retrieval
  cosine, not model certainty).
- The confidence bar only appears on answers that cite sources; the double-check
  button (below) appears on any finished answer.
- The sources disclosure is now a clickable **pill labelled "References (N)"**
  (was a flat "Sources (N)" text button); it turns accent when expanded.

### On-demand "Double-check online"
- Every finished answer shows a **🌐 Double-check online** button. It re-runs the
  answer's question through the existing web-search pipeline (`webSearch`,
  Wikipedia) and attaches the corroborating web results under the answer in a
  "Web double-check" section (with openable links), flipping the provenance badge
  to 🌐 Web-checked. `stores.ts` `doubleCheckOnline(id)` + `UIMessage.query`
  (stashed on send) / `webChecking` / `webSources` / `webCheckNote`.
- Opt-in per answer (the click is the consent) — independent of the always-on
  web-search toggle. Best-effort: offline → a note; no hits → a note.
- The double-check panel also has a **🔎 See all web results ↗** link that opens
  a real search engine's ranked results — `https://duckduckgo.com/?q=<query>` — in
  the browser (via the open-link confirm flow). Keyless/private; shows even when
  the inline corroboration found nothing, so the user can always go look. (We
  can't fetch a general engine's #1 result *inline* without a key + proxy, so we
  link out to the engine instead.)
- **Provider = Wikipedia**, not DuckDuckGo (DDG has no clean CORS JSON API). The
  pipeline is provider-agnostic (`fetchRawResults` in `rag/websearch.ts`) if a
  keyed web API is wanted later.

## Update — 2026-07-06 (Characters moved to Knowledge tab + per-character downloadable RAG packs)

Two connected changes to how "characters" (personas) and their knowledge work.

### 1. Characters unified INTO the Knowledge-bases list
- Removed the whole **Character** section from `CustomiseView.svelte` (plus its
  now-dead imports/CSS). Customise is now: Appearance, AI model, Names, Web
  search, Privacy & Safety, Universal ID.
- `KnowledgeView.svelte` was rebuilt around **one unified "Knowledge bases"
  list**: characters first (canonical `BUILTIN_PACKS`/`personas.ts` order, Luigi
  first), then general packs (Simple Wikipedia, Wine), then the user's own KBs,
  then an "Add your own knowledge" section. **A character IS its knowledge pack**
  — there is no separate "select character" vs "download knowledge" step:
  Download = become that character; a per-row **toggle** turns the active
  character on/off (only one active at a time); 🗑 removes the download; an **(i)**
  button expands an "about + Knows about" panel. (An earlier iteration had a
  separate "Expert characters" card section — that was replaced by this unified
  list per the user's request.)
- `WelcomeGate.svelte` onboarding picker left in place; its 📚 badge + copy
  updated to reflect download-only knowledge.

### 2. Each character now has a sizeable, downloadable, pre-embedded RAG pack
- **Design decision (user-chosen):** *Large* packs, **download-only** — the old
  small bundled on-device persona corpus (`personaKnowledge.ts` + `src/lib/
  knowledge/personas/*.md`) was **deleted**. A character has personality only
  until you download its pack from its card in the Knowledge tab.
- Persona packs are ordinary **built-in packs** (`builtin:kb-*`) — same machinery
  as the Simple-Wikipedia / wine packs. Registered in `rag/pack.ts` `BUILTIN_PACKS`
  with a `personaId` link + helpers `personaPackId` / `isPersonaPackId` /
  `hasPersonaPack`. Persona packs are hidden from the generic "Knowledge bases"
  list (filtered by `isPersonaPackId`) and surfaced only on the expert cards.
- `stores.ts`: `applyPersonaKnowledge` rewritten to enable the selected
  character's pack (iff downloaded) and disable all other character packs;
  removed the on-device embedding path + `personaKnowledgeStatus`;
  `installBuiltinPack` is now persona-aware (a character pack only auto-enables
  if that character is the active one); added one-time cleanup of legacy
  `persona:` KBs (`cleanupLegacyPersonaKBs`, runs in `seedBuiltinKBs`).
- **Corpora** authored under `scripts/data/personas/<id>.jsonl` (one
  `{"title","text"}` per line). Built into `public/knowledge/persona-*.v1.{bin,json}`
  by **`scripts/build-persona-packs.sh`** (wraps `build-knowledge-pack.mjs`,
  which now skips malformed lines + dedupes titles). Rebuild: `bash
  scripts/build-persona-packs.sh` (or `… <persona-id>` for one).
- **Pack counts (v1):** Luigi 822 · Sherlock 884 · Nemo 530 · Alice 624 ·
  Mowgli 1011 · Elizabeth 535 · Merlin 647 · Fogg 1049 (~5,500 entries, ~4.1 MB
  total, 0.3–0.8 MB each). Luigi was topped up from an initial 248 (a second
  authoring pass added 574 deduped entries).

### Verified
- `svelte-check` 0 errors/warnings; `npm run build` green (all 8 pack manifests
  land in `dist/knowledge/`).
- Mobile preview: all 8 cards show correct sizes; download→install→"on-device",
  select→"active", switch-away→deactivates, packs stay out of the generic KB
  list; no console errors. (Retrieval grounding itself not re-run — identical
  mechanism to the existing wine/wiki packs.)

### Deploy state
- Committed to local `main`; web rebuilt (`npm run build`) + `npx cap sync ios`.
  Covers this whole session: unified Knowledge/characters list, per-character
  packs, confidence bar + provenance badge + double-check, "References" pill.
  **Not pushed** — run `/signoff` (or `git push`) to publish. Owner builds/runs
  in Xcode (`App` scheme).

## Update — 2026-07-05 (Welcome-gate character grid: horizontal-fit fix + copy)

Small UI polish pass on the first-run `WelcomeGate` character picker, all in
`src/lib/components/WelcomeGate.svelte`.

### Character grid overflowed the card horizontally on phones (`.personas`)
- The 2-col `grid-template-columns: repeat(2, 1fr)` grid was spilling ~106px
  past the card's right edge on a 375px viewport — the right column
  (Luigi/Captain Nemo/Mowgli/Merlin) was clipped, with a horizontal scrollbar.
- Root cause: the `.persona` grid items kept the default `min-width: auto`, so
  each `1fr` track (`minmax(auto, 1fr)`) refused to shrink below the button's
  min-content — driven by the non-wrapping `.p-name` text. Tracks resolved to
  182px + 195px instead of an even split.
- Fix: `min-width: 0` on `.persona` (lets the tracks actually constrain the
  buttons) + `.p-name` now wraps (`overflow-wrap: anywhere`, dropped the
  `nowrap`/ellipsis) so no character name gets clipped. Verified in mobile
  preview: overflow 0px, columns even at 136px each, names wrap to 2 lines.

### Copy
- Step-2 label "Pick your first character" → **"Pick your expert helper"**.
- (No reorder needed — Luigi the Chef is already first after the plain
  assistant via `ALL_PERSONAS = [DEFAULT_PERSONA, ...PERSONAS]` in
  `personas.ts`; confirmed in preview.)

### Deploy state
- Web rebuilt (`npm run build`) + `npx cap sync ios`; iOS Xcode build
  (`App` scheme, iPhone 17 Pro simulator) **BUILD SUCCEEDED**.
- Committed and merged to local `main`. **Not pushed** — run `/signoff` (or
  `git push`) when ready to publish.

## Update — 2026-07-05 (Generation-crash recovery + 0.5B model + light-mode contrast)

Owner re-tested on iPhone after yesterday's fixes: model now LOADS, but typing a
message → "thinking" → page dies mid-generation, chat wiped, model auto-reloads
from cache. Root cause unchanged (WKWebView memory ceiling; 1B on WASM is
marginal — generation working memory tips it over). This session: recover
gracefully + give phones a model that actually fits, plus a light-mode pass.

### Chat survives page death (`stores.ts`)
- `messages` now persists to `localStorage['universal-ai:messages']` via a
  400ms trailing-throttle subscriber, restored at module init.
- Restore marks all messages `streaming: false`; if the LAST message was
  persisted mid-stream, the page died generating → its content becomes (or gets
  appended) an OOM notice: "ran out of memory while answering… try a shorter
  question or a smaller model".
- Privacy semantics preserved: `clearChat()` now ALSO clears the persisted copy
  synchronously (pagehide-safe — the throttle timer would never fire there).
  Clear-on-close wipes on intentional close/reload; a real crash fires no
  pagehide, so the chat survives exactly when we want it to. NOTE: testing
  restore in a browser requires clearOnClose OFF (a manual reload fires
  pagehide and wipes — that confused verification twice).

### Qwen2.5 0.5B model (`models.ts`, `stores.ts`)
- New first list entry `qwen2.5-0.5b` (~0.4GB): webllm
  `Qwen2.5-0.5B-Instruct-q4f16_1-MLC` (verified in web-llm 0.2.79 prebuilts) +
  wllama `bartowski/Qwen2.5-0.5B-Instruct-GGUF / …Q4_K_M.gguf` (filename
  verified via HF API).
- `DEFAULT_MODEL_ID` now explicitly `'llama-3.2-1b'` (no longer `MODELS[0]`).
  `detectCapabilities()` overrides the default *selection* to the lightest
  (`ramMB`) model on the wllama backend only — WebGPU devices keep 1B.
- **If 0.5B still crashes on the owner's phone during generation**, next
  levers: `n_ctx` 2048→1024 on wllama, and/or `flash_attn: true` +
  `cache_type_v: 'q8_0'` (untested on the wasm build — test on device first).

### Light-mode contrast (`app.css` + components)
- New `--on-accent` var: `#07101f` (dark theme, pale accent) / `#fff` (light
  theme, saturated `#2563eb` accent). Replaced all hardcoded `#07101f`
  on-accent text: `button.primary`, tab count badge (App.svelte), theme
  segmented control (CustomiseView), KnowledgeView toggle knob; also
  MessageBubble `.cite` hover was `#fff`-on-accent (bad in dark) → on-accent.

### State
- Committed to main + pushed; built + `cap sync ios` done (owner builds in
  Xcode). Browser-verified: light-mode white-on-blue, restore + OOM notice,
  4-model dropdown with 0.5B first. svelte-check 0/0.

## Update — 2026-07-04 (Fix on-device OOM: load-crash loop + RAG "no available backend found")

Owner reported two on-device (iPhone/WASM) failures: (1) page crash right after
"Download & load"; (2) after a few chat messages, the reply was replaced by
`no available backend found. ERR: [wasm] RangeError: Out of memory`.

### Diagnosis
- Symptom 2 is **onnxruntime-web** (the MiniLM RAG embedder), NOT the chat
  model: with a KB/pack enabled, `send()` → `retrieve()` → `embedOne()` inits
  ORT **lazily mid-chat** — at peak memory, after wllama's heap + KV cache have
  grown — and its WASM heap allocation fails. `send()` treated that as fatal,
  and `embeddings.ts` cached the rejected pipeline promise forever.
- Symptom 1: loading copies ~1GB of weights into the WASM heap; WKWebView
  jettisons the page on the spike. On relaunch, startup **auto-loaded the same
  model again → crash loop**. Also no error UI in Customise on load failure.

### Fixes (all in this commit)
- `stores.ts send()`: retrieval wrapped in try/catch — embedder failure now
  degrades to an ungrounded answer instead of erroring the whole turn.
- `rag/embeddings.ts`: rejected `extractorPromise` no longer cached (retry
  works); new `warmEmbeddings()` (never throws).
- Warm the embedder BEFORE the LLM eats memory: at startup when any KB is
  enabled (awaited, ahead of auto-load), on `toggleKB` enable, and after
  `installBuiltinPack` (also browser-caches weights while online).
- `stores.ts loadModel()`: re-entrancy guard (status 'loading' → return) +
  crash sentinel `localStorage['universal-ai:loading-model']` set before
  `engine.load`, cleared on success/handled error. `consumeInterruptedLoad()`
  reads+clears it at startup; `App.svelte` then **skips auto-load** and shows
  "Loading X didn't finish last time — may have run out of memory…" instead of
  crash-looping. Also `loadProgress` reset on load error.
- `engine/wllama.ts`: `n_batch: 256` (default 2048 — compute buffers scale
  with it; big peak-memory cut at load) and `cache_type_k: 'q8_0'` (K-cache
  quant is safe without flash-attn; V stays f16). Both verified forwarded by
  wllama 2.4.0.
- `CustomiseView.svelte`: shows `$engineError` under the model section (was
  silent on failure since model mgmt moved there).

### State / verify
- `svelte-check` 0/0, build green. Browser-verified: sentinel → skip auto-load
  + error copy in Customise; clean relaunch auto-loads normally.
- **Owner-to-verify on iPhone:** download → load no longer dies (n_batch cut),
  and a KB-enabled chat survives past a few messages (or at worst answers
  without sources). If load still dies, next lever: drop `n_ctx` to 1536.

## Update — 2026-07-04 (Long-press Retry on your own messages)

Small UI addition. `svelte-check` 0 errors; dev server loads clean. Not exercised
end-to-end in preview (needs a loaded on-device model), logic reuses `send()`.

- **`MessageBubble.svelte`**: the long-press / right-click menu (previously
  assistant-only, gated by `canSave`) now also opens on **user** bubbles.
  - New deriveds: `canRetry` (non-empty user message) and `hasMenu = canSave ||
    canRetry`; the press-timer + `contextmenu` handlers and the callout-suppressing
    `.saveable` class now key off `hasMenu`.
  - New `retry()` → closes menu, calls `send(msg.content)` (which already no-ops if a
    turn is generating or the engine isn't ready). It appends a fresh user turn +
    reply at the bottom — it does **not** edit in place or regenerate the prior reply.
  - Menu items: **↻ Retry** on user messages, **Save response** on assistant, **Copy
    text** on both. User bubbles anchor the popup to the right (`.bubble.user .pop`)
    so it doesn't spill off-screen.
- Possible follow-ups if desired: edit-and-resend, or regenerate-the-reply instead
  of re-appending.

## Update — 2026-07-04 (Saved tab + model management moved to Customise + delete)

Four UI/UX changes. `svelte-check` 0 errors, web build green; browser-verified.
Landed on top of the Universal ID work below (shared `CustomiseView.svelte`).

### Model management is now Customise-only
- **Removed the homepage `ModelBar`** entirely (file deleted) — it no longer sits
  under the header on the Chat screen. Load/switch/download now live solely in the
  Customise "AI model" section. `ChatView` composer placeholder reflects state
  ("Loading model…" / "Load a model in the Customise tab"); empty-state copy points
  to Customise.
- Auto-load on launch no longer keys off `modelEverLoaded`; it now loads a model
  that is actually **downloaded** (see below), picking the selected one or the
  first downloaded one.

### Delete a downloaded model
- `LLMEngine` gained `isDownloaded(model)` + `deleteModel(model)`.
  - `webllm.ts`: `hasModelInCache` / `deleteModelAllInfoInCache` from `@mlc-ai/web-llm`.
  - `wllama.ts`: reuses the live instance's `cacheManager` (or a throwaway `new
    Wllama` that downloads nothing) — `list()` / `deleteMany()` matched on the GGUF
    filename.
- `stores.ts`: new `loadedModelId` + `downloadedModels` (Record<id,bool>, probed at
  startup by `detectDownloadedModels()` — cache is source of truth, copes with iOS
  clearing storage). `loadModel()` marks the model downloaded; new `deleteModel(id)`
  frees the cache, and if it was the loaded one, drops the engine to idle.
- `CustomiseView.svelte`: downloaded-models list with a 🗑 → "Delete download?"
  inline confirm, and an "active" chip on the loaded one.

### Long-press to save + Saved tab
- `MessageBubble.svelte`: long-press (pointerdown 450ms; also right-click /
  contextmenu) on an assistant bubble opens a Save / Copy menu; ★ badge when saved.
  Assistant bubbles set `-webkit-touch-callout/user-select: none` so the gesture is
  clean (Copy compensates). `a11y_no_static_element_interactions` intentionally
  ignored (progressive-enhancement gesture on a non-control).
- `stores.ts`: `saved` store (persisted to `localStorage['universal-ai:saved']`,
  survives clear-on-close by design) + `saveResponse()` / `unsaveResponse()`.
- New **`SavedView.svelte`** and a **Saved tab between Chat and Knowledge** (count
  badge). Empty copy: "Tap and hold a response to save it here."

### Verified / owner-to-verify
- Browser: tab order Chat→Saved→Knowledge→Customise, no homepage model bar, exact
  empty-state copy, saved-card render → badge → Copy/Remove cycle. `svelte-check` 0,
  build green.
- **Owner-to-verify on device:** the long-press gesture itself (touch timing in
  WKWebView) and model **delete** actually evicting weights on-device (cache APIs
  differ from the browser). Deleting the active model leaves the composer disabled
  until another model loads — intended.

## Update — 2026-07-04 (Universal ID settings backup at the bottom of Customise)

Opt-in "back up your settings with your Universal ID" shipped (commit
`a72cd9a`, pushed to main). New section at the bottom of the Customise tab.

### How it works
- **`src/lib/universalId.ts`** — the app's own `@supabase/supabase-js` client
  against the SHARED suite Supabase project (baked publishable URL + anon key,
  env-overridable; same values as Polling/Risk). **Deliberately NOT cookie
  SSO** — this app isn't served under `.unisim.co.uk` (PWA / Capacitor), so it
  follows Universal Polling's email-OTP pattern: `signInWithOtp` →
  `verifyOtp(type:'email')` against the same `auth.users` the hub uses — the
  session IS a Universal ID. **Log-in ONLY** (`552e98f`):
  `shouldCreateUser:false`, so accounts can't be created in the app — unknown
  emails get a friendly "create one at app.unisim.co.uk" message, and the
  panel is framed as a log-in form headed by the UNI·SIM globe mark
  (`src/lib/assets/unisim-icon.png`, imported `?inline` so it works offline).
  Isolated `storageKey:
  'universal-ai:universal-id-auth'`. Exposes `universalIdUser` + `lastBackupAt`
  stores and `backUpSettings()` / `restoreSettings()` (upsert/select on
  `app_settings_backups`, app code **'ai'**, one row per user).
- **`src/lib/components/UniversalIdBackup.svelte`** — the panel (email → code →
  signed-in Back up / Restore, offline-disabled buttons, friendly error
  fallback for supabase-js's raw "{}" messages). Mounted at the bottom of
  `CustomiseView.svelte`; Private-mode hint copy updated to name the two
  opt-in network uses (web search, Universal ID backup).
- **Privacy contract:** no network until the user signs in; only the Settings
  object is uploaded — never chats/documents/models.

### The rest of the wiring (other repos)
- **universal-platform `94dff3d`** — migration `0050_app_settings_backups.sql`
  (per-user × per-app jsonb, owner + platform-admin RLS, 64KB cap).
  ✅ **PUSHED TO PROD** (owner OK'd same session; `migration list` shows 0050
  Local=Remote). Back up/Restore are live server-side.
- **unisim-central PR #34** — ✅ squash-merged (`fc45166`; Pages auto-deploys
  app.unisim.co.uk): god-mode gains an "Apps" view tab with a Settings-backups
  card (email lookup → per-app rows → confirm-gated delete).
- Suite changelog `2026.07.04.13`.

### Verified / owner-to-verify
- `svelte-check` 0 errors, `vite build` green; panel exercised in browser
  preview (renders at page bottom; a bad address round-trips to prod auth and
  shows the friendly error). **Owner-to-verify:** real end-to-end pass after
  the db push — send code to a real inbox → verify → Back up → Restore on a
  second device; check the row appears in god-mode → Apps.
- ⚠️ A parallel session was editing this checkout (Saved-chats feature) while
  this shipped; commit `a72cd9a` was surgically staged to carry ONLY the
  backup work.

## Update — 2026-07-04 (WSET-style wine knowledge pack + multi-pack support)

Added a second built-in knowledge pack and generalised the built-in-pack system
(it was hardwired to the single Simple Wikipedia pack).

### New pack
- `scripts/data/wset-wine.jsonl` — 112 **original** factual wine entries covering
  WSET-syllabus topics (tasting/structure, ~30 grapes, regions, winemaking,
  service, faults, label/classification). **IP note:** written from scratch as
  general wine facts — deliberately NOT WSET's copyrighted materials or their
  Systematic Approach to Tasting® text. KB display name: "Wine knowledge
  (WSET-style)".
- Built with `node scripts/build-knowledge-pack.mjs --source=jsonl
  --input=scripts/data/wset-wine.jsonl --id=builtin:wset-wine --out=wset-wine
  --name="Wine knowledge (WSET-style)" --unit=topics --desc="..."` →
  `public/knowledge/wset-wine.v1.{bin,json}` (0.1 MB, LFS-tracked like simplewiki).
- Retrieval sanity-checked offline: wine queries (Chablis grape, tannin, noble
  rot, Champagne bubbles, serving temp) all return the correct topic as top hit
  (scores 0.63–0.78).

### Multi-pack generalisation (was single-pack)
- `scripts/build-knowledge-pack.mjs`: new `--id/--name/--out/--unit/--desc` args
  (defaults reproduce the simplewiki pack); manifest now carries `unit` +
  optional `description`.
- `src/lib/rag/pack.ts`: replaced the single `pack`/`MANIFEST_URL` with a
  `BUILTIN_PACKS` registry and per-id maps; `fetchManifest/loadPack/
  ensurePackLoaded/unloadPack/searchPack/isPackLoaded` now all take a pack `id`.
- `src/lib/rag/index.ts` `retrieve()`: loops over every enabled `builtin:` id and
  merges results (was: one pack for any builtin id).
- `src/lib/stores.ts`: `builtinInstalled`/`builtinDownloadProgress` are now
  `Record<packId, …>`; `seedBuiltinKBs()` / `loadPacksIntoMemory()` /
  `installBuiltinPack(id)` / `uninstallBuiltinPack(id)` iterate the registry.
  Removed `BUILTIN_SIMPLEWIKI_ID`.
- `KnowledgeView.svelte`: renders any `builtin:` KB from its manifest (name, unit,
  description, size), per-pack download/progress/error state.
- `App.svelte`: calls `seedBuiltinKBs()` / `loadPacksIntoMemory()`.

### Verified
- `svelte-check` 0 errors; web build + `cap sync` + `xcodebuild` simulator all
  green. In-browser: both pack cards list, the wine pack downloads → "on-device"
  → toggles on → install flag persists, console clean.
- **Owner-to-verify:** end-to-end grounded answer on-device (needs the LLM loaded
  + wine pack enabled). Adding more entries = append to the .jsonl and rebuild
  (bump `--version` and the filename in `BUILTIN_PACKS` if the schema changes).

## Update — 2026-07-04 (Top-bar scroll + model "randomly unloads" fix)

Two device-reported issues after the app launched successfully on iOS.

### Top bar overflowing off-page → now scrollable
- `src/App.svelte`: the `.topbar` used `justify-content: space-between`, so on a
  narrow phone the brand + tabs exceeded the width and "Customise" was clipped
  off-page. Now: brand `flex: 0 0 auto`, `.tabs` gets `margin-left: auto` +
  `min-width: 0` + `overflow-x: auto` (scrollbar hidden), buttons `flex: 0 0 auto;
  white-space: nowrap`. Verified in browser preview at 375px: page no longer
  overflows horizontally and the tab row scrolls to reveal Customise.

### Model "randomly unloads" during chat → root cause + fixes
- **Root cause:** nothing in the code unloads the engine mid-chat. The engine and
  all stores are module-level, so the only thing that nulls them is a **JS-context
  reset** — i.e. the iOS WKWebView reloading the page (memory pressure during
  CPU/WASM inference, or the app being backgrounded). After a reload `engine` is
  null and `engineStatus` reverts to `idle`, so the model looks "unloaded". The
  app also **never auto-loaded on startup**, so returning users always landed on
  "Load model" — same symptom.
- **Fixes:**
  1. `src/App.svelte` onMount now **auto-reloads the last model** when
     `modelEverLoaded && engineStatus === 'idle'` (weights are cached, so it
     re-inits without re-downloading). This self-heals any reload/background.
  2. `src/lib/engine/wllama.ts`: `n_ctx` 4096 → **2048** — the KV cache is the
     dominant CPU/WASM allocation; halving it cuts peak memory that triggers the
     iOS jettison.
  3. `src/lib/stores.ts` `send()`: cap replayed history to the **last 8 messages**
     (`MAX_HISTORY`). It previously sent the entire conversation every turn →
     unbounded prompt/KV growth.
- Also fixed a latent bug surfaced by `svelte-check`: `onMount` was `async` and
  returned a cleanup fn, which Svelte ignores (the `pagehide` listener leaked).
  onMount is now synchronous with an inner async init task.
- **Still owner-to-verify on a real device:** whether the memory fixes actually
  stop the WKWebView reload under sustained CPU inference. The auto-reload makes
  any remaining reload transparent (model comes back by itself). `svelte-check`
  0 errors; simulator launches clean.

## Update — 2026-07-04 (iOS black-screen fix + bundle id)

First launch of the Capacitor build showed a **black screen**. Root-caused and
fixed; the app now renders on the iOS Simulator (iPhone 17 Pro, iOS 26.3).

### The bug (TDZ / engine difference)
- `src/lib/settings.ts` created the `settings` store and immediately
  `settings.subscribe(...)`, whose callback fires **synchronously** and calls
  `applyTheme()` → reads the module-level `let mediaQuery`. That `let` was
  declared *after* the subscribe, so the first (sync) call read it inside its
  temporal dead zone. **V8 (Chrome/desktop PWA) tolerates this; JavaScriptCore
  (Safari / iOS WKWebView) throws** `ReferenceError: Cannot access 'mediaQuery'
  before initialization`, aborting module eval → nothing mounts → black screen.
- **Fix:** hoisted `let mediaQuery` above the `settings.subscribe` block. General
  lesson for this app: anything a synchronous store subscription touches must be
  initialized before the subscribe runs, or iOS will diverge from desktop.

### Also fixed
- **Bundle id** in `ios/App/App.xcodeproj/project.pbxproj` was the malformed
  `.com.universal-ai.app` (leading dot); set to `ltd.universalsimulation.ai` to
  match `capacitor.config.ts` (both Debug + Release).

### Verified (Simulator)
- Production build (minify on) → `cap sync` → `xcodebuild` → install → launch:
  no startup JS error, welcome screen renders. Screenshot confirmed.
- **WebGPU confirmed absent in WKWebView** — the app detects this and shows
  "CPU mode (no WebGPU on this device)", falling back to the wllama CPU backend.
  So the earlier WebGPU caveat is real but handled by existing fallback. Actual
  model download + on-device inference (~0.9GB Llama 3.2 1B, CPU) is still
  owner-to-verify — expect it to be slow but functional.

### Debug-loop notes (how the black screen was found)
- Captured the WKWebView console via `xcrun simctl launch --console-pty <udid>
  <bundleid>`; Capacitor prints a "STARTUP JS ERROR" block there. A temporary
  `build: { minify: false }` (+ bumped workbox precache limit) made the minified
  `ol`/`mediaQuery` name readable; both reverted after.

## Update — 2026-07-04 (Capacitor iOS wrap for Xcode testing)

Wrapped the PWA in Capacitor to get a native iOS shell / Xcode project so the app
can be tested and deployed via Xcode. All merged to `main` in this commit.

### What shipped
- **Capacitor added** — `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`
  (devDeps). `capacitor.config.ts`: appId `ltd.universalsimulation.ai`, appName
  "Universal AI", `webDir: 'dist'`. **appId is a placeholder** — change it if a
  real bundle ID / Apple Team is used for device signing.
- **`ios/` platform generated** — `ios/App/App.xcodeproj`. Capacitor 7 uses
  **Swift Package Manager** for plugins (`Package.swift`), so there is **no
  `.xcworkspace`**; open `App.xcodeproj`. Capacitor's `ios/.gitignore` excludes the
  regenerable bits (`App/App/public`, build, Pods, `capacitor.config.json`), so
  only the source project is tracked.
- **App icon set** — replaced Capacitor's default `AppIcon-512@2x.png` (1024×1024,
  no alpha) with the Universal AI brand glyph (rendered from
  `public/icons/icon.svg` via `sharp`, full-bleed square, no rounded corners since
  iOS masks its own). To regenerate: render the glyph SVG to a 1024² PNG and
  overwrite that file.
- **Fixed a pre-existing build break** in `src/lib/stores.ts` — `SYSTEM_BASE` /
  `SAFE_MODE_ADDON` had smart-quotes (`‘ ’`) instead of straight quotes; `main`
  did not build until this fix.
- **CocoaPods 1.16.2** installed via Homebrew (local toolchain, not a repo change).

### Verified
- `npm run build` green; `xcodebuild -sdk iphonesimulator ... build` → **BUILD
  SUCCEEDED**. Native shell compiles cleanly.

### Not yet verified / the real risk
- **Whether the LLM engine runs inside WKWebView is UNCONFIRMED.** WebGPU (WebLLM)
  has historically been gated off in WKWebView, and the wllama WASM-threads path
  needs cross-origin isolation that `vite.config.ts` intentionally disables. Expect
  the UI to load but the model may fail to initialize on-device. First launch on a
  simulator/device is owner-to-verify. If the model fails: try forcing wllama
  single-thread, or investigate a WebGPU entitlement.

### Rebuild/sync workflow
- After web changes: `npm run build && npx cap sync ios` (needs
  `PATH=/opt/homebrew/bin:$PATH` and `LANG=en_US.UTF-8` for CocoaPods), then Run in
  Xcode. `npx cap open ios` reopens the project.

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
