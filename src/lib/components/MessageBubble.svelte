<script lang="ts">
  import type { UIMessage, Confidence } from '../stores'
  let { msg }: { msg: UIMessage } = $props()

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

  function askOpen(url: string) {
    pendingUrl = url
  }
  function confirmOpen() {
    if (pendingUrl) window.open(pendingUrl, '_blank', 'noopener,noreferrer')
    pendingUrl = null
  }
</script>

<div class="row {msg.role}">
  <div class="bubble {msg.role}">
    {#if msg.content}
      <span class="text">{#each segs as s}{#if s.t === 'text'}{s.v}{:else}<button
            class="cite"
            class:active={active === s.n}
            title="Show source {s.n}"
            onclick={() => { active = s.n; sourcesOpen = true }}>{s.n}</button>{/if}{/each}</span>{#if msg.streaming}<span class="caret"></span>{/if}
    {:else if msg.streaming}
      <span class="typing"><i></i><i></i><i></i></span>
    {/if}

    {#if citedSources.length}
      <div class="meta">
        {#if msg.confidence}
          <span class="conf {msg.confidence}" title="Based on how closely the cited sources match your question">
            {CONF_LABEL[msg.confidence]}
          </span>
        {/if}
        <button class="src-toggle" aria-expanded={sourcesOpen} onclick={() => (sourcesOpen = !sourcesOpen)}>
          Sources ({citedSources.length})
          <span class="chev" class:open={sourcesOpen} aria-hidden="true">▾</span>
        </button>
      </div>

      {#if sourcesOpen}
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
    {/if}
  </div>
</div>

<style>
  .row { display: flex; margin: 0.35rem 0; }
  .row.user { justify-content: flex-end; }
  .row.assistant { justify-content: flex-start; }
  .bubble {
    max-width: 85%;
    padding: 0.6rem 0.8rem;
    border-radius: var(--radius);
    white-space: pre-wrap;
    word-break: break-word;
    line-height: 1.45;
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
  .cite:hover, .cite.active { background: var(--accent); color: #fff; border-color: var(--accent); }

  .meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-top: 0.55rem;
    padding-top: 0.4rem;
    border-top: 1px dashed var(--border);
  }
  .conf {
    font-size: 0.68rem;
    font-weight: 700;
    padding: 0.1rem 0.45rem;
    border-radius: 999px;
    border: 1px solid var(--border);
    white-space: nowrap;
  }
  .conf.high { color: var(--ok); border-color: color-mix(in srgb, var(--ok) 45%, var(--border)); }
  .conf.medium { color: #d9a106; border-color: color-mix(in srgb, #d9a106 45%, var(--border)); }
  .conf.low { color: var(--danger); border-color: color-mix(in srgb, var(--danger) 45%, var(--border)); }
  .src-toggle {
    margin-left: auto;
    font-size: 0.74rem;
    padding: 0.2rem 0.5rem;
    background: transparent;
    color: var(--text-dim);
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
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
