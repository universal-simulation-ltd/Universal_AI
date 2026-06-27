<script lang="ts">
  import type { UIMessage } from '../stores'
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
  let segs = $derived(parse(msg.content, msg.sources?.length ?? 0))
  // Footnotes list only the sources actually cited inline — a retrieved-but-
  // unused chunk (just over the relevance threshold) shouldn't show as a source.
  let citedNums = $derived(
    new Set(segs.filter((s) => s.t === 'cite').map((s) => (s as { n: number }).n)),
  )
  let citedSources = $derived((msg.sources ?? []).filter((s) => citedNums.has(s.n)))
</script>

<div class="row {msg.role}">
  <div class="bubble {msg.role}">
    {#if msg.content}
      <span class="text">{#each segs as s}{#if s.t === 'text'}{s.v}{:else}<button
            class="cite"
            class:active={active === s.n}
            title="Jump to source {s.n}"
            onclick={() => (active = s.n)}>{s.n}</button>{/if}{/each}</span>{#if msg.streaming}<span class="caret"></span>{/if}
    {:else if msg.streaming}
      <span class="typing"><i></i><i></i><i></i></span>
    {/if}
    {#if citedSources.length}
      <ol class="sources">
        {#each citedSources as src}
          <li class:active={active === src.n}>
            <span class="num">[{src.n}]</span> {src.source}
          </li>
        {/each}
      </ol>
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
  .bubble.user {
    background: var(--user-bubble);
    border-bottom-right-radius: 4px;
  }
  .bubble.assistant {
    background: var(--bot-bubble);
    border: 1px solid var(--border);
    border-bottom-left-radius: 4px;
  }
  .caret {
    display: inline-block;
    width: 7px;
    height: 1.05em;
    margin-left: 1px;
    vertical-align: text-bottom;
    background: var(--accent);
    animation: blink 1s steps(2) infinite;
  }
  @keyframes blink { 50% { opacity: 0; } }
  .cite {
    font: inherit;
    font-size: 0.7em;
    vertical-align: super;
    line-height: 0;
    margin: 0 1px;
    padding: 0 4px;
    border: 1px solid var(--border);
    border-radius: 999px;
    background: var(--bot-bubble);
    color: var(--accent);
    cursor: pointer;
  }
  .cite:hover, .cite.active {
    background: var(--accent);
    color: #fff;
    border-color: var(--accent);
  }
  .sources {
    margin: 0.5rem 0 0;
    padding: 0.35rem 0 0;
    list-style: none;
    font-size: 0.75rem;
    color: var(--text-dim);
    border-top: 1px dashed var(--border);
  }
  .sources li {
    padding: 0.1rem 0.3rem;
    border-radius: 4px;
    transition: background 0.15s;
  }
  .sources li.active { background: color-mix(in srgb, var(--accent) 18%, transparent); }
  .sources .num { color: var(--accent); font-variant-numeric: tabular-nums; }
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
