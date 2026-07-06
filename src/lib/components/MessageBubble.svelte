<script lang="ts">
  import { saved, saveResponse, unsaveResponse, send, doubleCheckOnline, type UIMessage, type Confidence } from '../stores'
  let { msg }: { msg: UIMessage } = $props()

  // --- Long-press menu -----------------------------------------------------
  let menuOpen = $state(false)
  let pressTimer: ReturnType<typeof setTimeout> | null = null
  let startX = 0
  let startY = 0

  let isSaved = $derived($saved.some((s) => s.id === msg.id))
  let canSave = $derived(msg.role === 'assistant' && !!msg.content && !msg.streaming)
  // Your own turns can be resent — long-press → Retry submits them again.
  let canRetry = $derived(msg.role === 'user' && !!msg.content)
  let hasMenu = $derived(canSave || canRetry)

  function cancelPress() {
    if (pressTimer) {
      clearTimeout(pressTimer)
      pressTimer = null
    }
  }
  function startPress(e: PointerEvent) {
    if (!hasMenu) return
    // Don't hijack presses on the interactive bits (citations, source links).
    if ((e.target as HTMLElement).closest('button, a')) return
    startX = e.clientX
    startY = e.clientY
    cancelPress()
    pressTimer = setTimeout(() => {
      menuOpen = true
      navigator.vibrate?.(10)
    }, 450)
  }
  function maybeCancel(e: PointerEvent) {
    // A real press stays roughly put; treat movement (a scroll) as a cancel.
    if (pressTimer && (Math.abs(e.clientX - startX) > 10 || Math.abs(e.clientY - startY) > 10)) {
      cancelPress()
    }
  }
  function openMenu(e: Event) {
    if (!hasMenu) return
    e.preventDefault() // right-click / iOS callout → our menu instead
    menuOpen = true
  }
  function toggleSave() {
    if (isSaved) unsaveResponse(msg.id)
    else saveResponse(msg)
    menuOpen = false
  }
  function retry() {
    menuOpen = false
    // send() no-ops if a turn is already generating or the engine isn't ready.
    send(msg.content)
  }
  async function copyText() {
    try {
      await navigator.clipboard.writeText(msg.content)
    } catch {
      // clipboard blocked — nothing else to do
    }
    menuOpen = false
  }

  type Seg = { t: 'text'; v: string } | { t: 'cite'; n: number }

  /** Split content into text runs and valid [n] citation markers. */
  function parse(content: string, max: number): Seg[] {
    if (!max) return [{ t: 'text', v: content }]
    const segs: Seg[] = []
    const re = /\[(\d+)\]/g
    let last = 0
    let m: RegExpExecArray | null
    while ((m = re.exec(content))) {
      const n = parseInt(m[1], 10)
      if (n < 1 || n > max) continue // ignore out-of-range / hallucinated refs
      if (m.index > last) segs.push({ t: 'text', v: content.slice(last, m.index) })
      segs.push({ t: 'cite', n })
      last = m.index + m[0].length
    }
    if (last < content.length) segs.push({ t: 'text', v: content.slice(last) })
    return segs
  }

  let active = $state<number | null>(null)
  let sourcesOpen = $state(false)
  // URL awaiting the "open in your browser?" confirmation, or null.
  let pendingUrl = $state<string | null>(null)

  let segs = $derived(parse(msg.content, msg.sources?.length ?? 0))
  // Footnotes list only the sources actually cited inline — a retrieved-but-
  // unused chunk (just over the relevance threshold) shouldn't show as a source.
  let citedNums = $derived(
    new Set(segs.filter((s) => s.t === 'cite').map((s) => (s as { n: number }).n)),
  )
  let citedSources = $derived((msg.sources ?? []).filter((s) => citedNums.has(s.n)))

  const CONF_LABEL: Record<Confidence, string> = {
    high: 'High confidence',
    medium: 'Medium confidence',
    low: 'Low confidence',
  }

  // Bar fill: proportional to the raw top source-match score when we have it
  // (cosine ~0.8 reads as full), else a sensible fill for the band alone. Floored
  // so even a low bar is visible.
  let confFill = $derived(
    msg.confidenceScore != null
      ? Math.max(8, Math.min(100, Math.round((msg.confidenceScore / 0.8) * 100)))
      : msg.confidence === 'high'
        ? 100
        : msg.confidence === 'medium'
          ? 62
          : 30,
  )
  // "Web-checked" when at least one cited source is a live web link (opt-in web
  // search) or an online double-check has attached web sources; otherwise the
  // answer is grounded purely in on-device knowledge.
  let webVerified = $derived(citedSources.some((s) => !!s.url) || (msg.webSources?.length ?? 0) > 0)
  let hasSources = $derived(citedSources.length > 0 || (msg.webSources?.length ?? 0) > 0)
  // Footer (confidence / provenance / double-check) shows on any finished answer.
  let showFooter = $derived(msg.role === 'assistant' && !msg.streaming && !!msg.content)

  function askOpen(url: string) {
    pendingUrl = url
  }
  function confirmOpen() {
    if (pendingUrl) window.open(pendingUrl, '_blank', 'noopener,noreferrer')
    pendingUrl = null
  }
</script>

<div class="row {msg.role}">
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="bubble {msg.role}"
    class:saveable={hasMenu}
    onpointerdown={startPress}
    onpointerup={cancelPress}
    onpointermove={maybeCancel}
    onpointercancel={cancelPress}
    onpointerleave={cancelPress}
    oncontextmenu={openMenu}
  >
    {#if isSaved}<span class="saved-badge" title="Saved" aria-label="Saved">★</span>{/if}
    {#if msg.content}
      <span class="text">{#each segs as s}{#if s.t === 'text'}{s.v}{:else}<button
            class="cite"
            class:active={active === s.n}
            title="Show source {s.n}"
            onclick={() => { active = s.n; sourcesOpen = true }}>{s.n}</button>{/if}{/each}</span>{#if msg.streaming}<span class="caret"></span>{/if}
    {:else if msg.streaming}
      <span class="typing"><i></i><i></i><i></i></span>
    {/if}

    {#if showFooter}
      <div class="meta">
        {#if msg.confidence}
          <div
            class="conf {msg.confidence}"
            title="How closely the cited sources match your question — a measure of how well-supported the answer is, not a guarantee of factual accuracy."
          >
            <span class="conf-label">{CONF_LABEL[msg.confidence]}</span>
            <span class="conf-track"><span class="conf-fill" style="width:{confFill}%"></span></span>
          </div>
        {/if}
        <div class="meta-row">
          {#if hasSources}
            <span
              class="prov"
              class:web={webVerified}
              title={webVerified
                ? 'At least one source is a live web link you can open and verify.'
                : 'Answered from knowledge stored on your device.'}
            >
              {webVerified ? '🌐 Web-checked' : '📚 On-device'}
            </span>
          {/if}
          <div class="foot-actions">
            {#if msg.webChecking}
              <span class="dc-status"><span class="dc-spin" aria-hidden="true"></span> Checking the web…</span>
            {:else if msg.query && !msg.webSources}
              <button class="dc-btn" onclick={() => doubleCheckOnline(msg.id)} title="Search the web to corroborate this answer">
                🌐 Double-check online
              </button>
            {/if}
            {#if citedSources.length}
              <button class="src-toggle" class:open={sourcesOpen} aria-expanded={sourcesOpen} onclick={() => (sourcesOpen = !sourcesOpen)}>
                References ({citedSources.length})
                <span class="chev" class:open={sourcesOpen} aria-hidden="true">▾</span>
              </button>
            {/if}
          </div>
        </div>
        {#if msg.webCheckNote}<p class="dc-note">{msg.webCheckNote}</p>{/if}
      </div>

      {#if sourcesOpen && citedSources.length}
        <ol class="sources">
          {#each citedSources as src}
            <li class:active={active === src.n}>
              <div class="src-head"><span class="num">[{src.n}]</span> {src.source}</div>
              {#if src.snippet}<p class="snippet">{src.snippet}{src.snippet.length >= 320 ? '…' : ''}</p>{/if}
              {#if src.url}
                {#if pendingUrl === src.url}
                  <div class="confirm">
                    <span>Open this link in your web browser?</span>
                    <div class="confirm-actions">
                      <button class="primary tiny" onclick={confirmOpen}>Open</button>
                      <button class="tiny" onclick={() => (pendingUrl = null)}>Cancel</button>
                    </div>
                  </div>
                {:else}
                  <button class="link" onclick={() => askOpen(src.url!)}>
                    🔗 {src.url}
                  </button>
                {/if}
              {/if}
            </li>
          {/each}
        </ol>
      {/if}

      {#if msg.webSources?.length}
        <div class="webcheck">
          <div class="wc-head">🌐 Web double-check — corroborating sources</div>
          <ol class="sources">
            {#each msg.webSources as src}
              <li>
                <div class="src-head">{src.source}</div>
                {#if src.snippet}<p class="snippet">{src.snippet}{src.snippet.length >= 320 ? '…' : ''}</p>{/if}
                {#if src.url}
                  {#if pendingUrl === src.url}
                    <div class="confirm">
                      <span>Open this link in your web browser?</span>
                      <div class="confirm-actions">
                        <button class="primary tiny" onclick={confirmOpen}>Open</button>
                        <button class="tiny" onclick={() => (pendingUrl = null)}>Cancel</button>
                      </div>
                    </div>
                  {:else}
                    <button class="link" onclick={() => askOpen(src.url!)}>🔗 {src.url}</button>
                  {/if}
                {/if}
              </li>
            {/each}
          </ol>
        </div>
      {/if}
    {/if}

    {#if menuOpen}
      <button class="menu-backdrop" aria-label="Close menu" onclick={() => (menuOpen = false)}></button>
      <div class="pop" role="menu">
        {#if canRetry}
          <button role="menuitem" onclick={retry}>↻ Retry</button>
        {/if}
        {#if canSave}
          <button role="menuitem" onclick={toggleSave}>
            {isSaved ? '★ Remove from saved' : '☆ Save response'}
          </button>
        {/if}
        <button role="menuitem" onclick={copyText}>⧉ Copy text</button>
      </div>
    {/if}
  </div>
</div>

<style>
  .row { display: flex; margin: 0.35rem 0; }
  .row.user { justify-content: flex-end; }
  .row.assistant { justify-content: flex-start; }
  .bubble {
    position: relative;
    max-width: 85%;
    padding: 0.6rem 0.8rem;
    border-radius: var(--radius);
    white-space: pre-wrap;
    word-break: break-word;
    line-height: 1.45;
  }
  /* Long-pressable bubbles suppress the iOS text-selection callout so the press
     reliably opens our own menu (Copy is offered instead). */
  .bubble.saveable {
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    user-select: none;
  }
  .saved-badge {
    position: absolute;
    top: -6px;
    right: -6px;
    font-size: 0.7rem;
    line-height: 1;
    color: var(--accent);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 2px 4px;
  }
  .menu-backdrop {
    position: fixed;
    inset: 0;
    z-index: 20;
    background: transparent;
    border: 0;
    padding: 0;
  }
  .pop {
    position: absolute;
    z-index: 21;
    top: calc(100% + 4px);
    left: 0;
    display: flex;
    flex-direction: column;
    min-width: 190px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
    overflow: hidden;
  }
  /* User bubbles hug the right edge — anchor their menu there so it doesn't
     spill off-screen. */
  .bubble.user .pop { left: auto; right: 0; }
  .pop button {
    text-align: left;
    background: transparent;
    border: 0;
    border-radius: 0;
    padding: 0.6rem 0.8rem;
    font-size: 0.85rem;
    color: var(--text);
  }
  .pop button:hover,
  .pop button:active {
    background: var(--surface-2);
  }
  .pop button + button {
    border-top: 1px solid var(--border);
  }
  .bubble.user { background: var(--user-bubble); border-bottom-right-radius: 4px; }
  .bubble.assistant {
    background: var(--bot-bubble);
    border: 1px solid var(--border);
    border-bottom-left-radius: 4px;
  }
  .caret {
    display: inline-block;
    width: 7px; height: 1.05em;
    margin-left: 1px;
    vertical-align: text-bottom;
    background: var(--accent);
    animation: blink 1s steps(2) infinite;
  }
  @keyframes blink { 50% { opacity: 0; } }
  .cite {
    font: inherit; font-size: 0.7em;
    vertical-align: super; line-height: 0;
    margin: 0 1px; padding: 0 4px;
    border: 1px solid var(--border);
    border-radius: 999px;
    background: var(--bot-bubble);
    color: var(--accent);
    cursor: pointer;
  }
  .cite:hover, .cite.active { background: var(--accent); color: var(--on-accent); border-color: var(--accent); }

  .meta {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    margin-top: 0.55rem;
    padding-top: 0.4rem;
    border-top: 1px dashed var(--border);
  }
  /* Confidence bar */
  .conf { display: flex; align-items: center; gap: 0.5rem; }
  .conf-label { font-size: 0.68rem; font-weight: 700; white-space: nowrap; }
  .conf-track {
    flex: 1 1 auto;
    height: 6px;
    border-radius: 999px;
    background: var(--surface-2);
    border: 1px solid var(--border);
    overflow: hidden;
  }
  .conf-fill { display: block; height: 100%; border-radius: 999px; transition: width 0.35s ease; }
  .conf.high .conf-label { color: var(--ok); }
  .conf.high .conf-fill { background: var(--ok); }
  .conf.medium .conf-label { color: #d9a106; }
  .conf.medium .conf-fill { background: #d9a106; }
  .conf.low .conf-label { color: var(--danger); }
  .conf.low .conf-fill { background: var(--danger); }
  .meta-row { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
  .prov {
    font-size: 0.68rem;
    font-weight: 600;
    color: var(--text-dim);
    padding: 0.1rem 0.45rem;
    border: 1px solid var(--border);
    border-radius: 999px;
    white-space: nowrap;
  }
  .prov.web { color: var(--accent); border-color: color-mix(in srgb, var(--accent) 45%, var(--border)); }
  .foot-actions { margin-left: auto; display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; }
  .dc-btn {
    font-size: 0.72rem;
    padding: 0.2rem 0.5rem;
    background: transparent;
    color: var(--accent);
    border: 1px solid color-mix(in srgb, var(--accent) 45%, var(--border));
    border-radius: 999px;
    white-space: nowrap;
  }
  .dc-status {
    display: inline-flex; align-items: center; gap: 0.35rem;
    font-size: 0.72rem; color: var(--text-dim); white-space: nowrap;
  }
  .dc-spin {
    width: 11px; height: 11px; border-radius: 50%;
    border: 2px solid var(--border); border-top-color: var(--accent);
    animation: dc-spin 0.7s linear infinite;
  }
  @keyframes dc-spin { to { transform: rotate(360deg); } }
  .dc-note { margin: 0.1rem 0 0; font-size: 0.74rem; color: var(--text-dim); }
  .src-toggle {
    font-size: 0.72rem;
    font-weight: 600;
    padding: 0.2rem 0.55rem;
    background: var(--surface-2);
    color: var(--text-dim);
    border: 1px solid var(--border);
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    white-space: nowrap;
  }
  .src-toggle:hover { border-color: color-mix(in srgb, var(--accent) 45%, var(--border)); }
  .src-toggle.open { color: var(--accent); border-color: color-mix(in srgb, var(--accent) 55%, var(--border)); }
  .webcheck { margin-top: 0.5rem; }
  .wc-head {
    font-size: 0.72rem; font-weight: 700; color: var(--accent);
    margin-bottom: 0.35rem;
  }
  .chev { transition: transform 0.15s ease; display: inline-block; }
  .chev.open { transform: rotate(180deg); }

  .sources {
    margin: 0.4rem 0 0;
    padding: 0;
    list-style: none;
    font-size: 0.78rem;
    color: var(--text-dim);
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .sources li {
    padding: 0.4rem 0.5rem;
    border-radius: 8px;
    background: var(--surface);
    border: 1px solid var(--border);
  }
  .sources li.active { border-color: var(--accent); }
  .src-head { color: var(--text); font-weight: 600; }
  .num { color: var(--accent); font-variant-numeric: tabular-nums; }
  .snippet { margin: 0.25rem 0 0; line-height: 1.4; color: var(--text-dim); }
  .link {
    margin-top: 0.35rem;
    font-size: 0.74rem;
    padding: 0.25rem 0.5rem;
    background: var(--surface-2);
    color: var(--accent);
    border-radius: 8px;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: block;
    text-align: left;
  }
  .confirm {
    margin-top: 0.4rem;
    padding: 0.4rem 0.5rem;
    border: 1px solid var(--accent);
    border-radius: 8px;
    background: color-mix(in srgb, var(--accent) 8%, transparent);
    color: var(--text);
  }
  .confirm-actions { display: flex; gap: 0.4rem; margin-top: 0.4rem; }
  .tiny { font-size: 0.74rem; padding: 0.25rem 0.6rem; border-radius: 8px; }

  .typing { display: inline-flex; gap: 4px; padding: 0.15rem 0; }
  .typing i {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--text-dim);
    animation: bounce 1.2s infinite ease-in-out;
  }
  .typing i:nth-child(2) { animation-delay: 0.15s; }
  .typing i:nth-child(3) { animation-delay: 0.3s; }
  @keyframes bounce { 0%, 80%, 100% { opacity: 0.3; } 40% { opacity: 1; } }
</style>
