<script lang="ts">
  // The app's own knowledge base — explainers ("What actually is a language
  // model?") beside how Universal AI itself works (what leaves the device,
  // what is stored). The other Universal Apps read theirs in @unisim/sdk's
  // React <KnowledgeBaseDialog>; this is its Svelte twin, with the same
  // behaviour: cards grouped and coloured by heading → an article with its
  // guide PDF and research beside it (owner ask, 2026-09-29: "more like the
  // knowledge base on Ergo Assess … cards to click through and downloads
  // available in PDFs. Research papers are the best"), Escape steps back out
  // of an article before it closes, and bodies are rendered as elements from
  // a closed mini-markdown (see src/knowledge/body.ts), never as HTML.
  //
  // Every download is an https link into opensource.unisim.co.uk/kb/, never a
  // bundled file — a relative PDF link would navigate the phone app's webview
  // with no way back. Hosted papers are only those whose licence allows it.
  //
  // One difference: the app's interface is English-only, so there is no app
  // language to follow. The reader has its own picker, defaulting to the
  // device's language and remembered on this device.
  import { tick } from 'svelte'
  import {
    GUIDES_BASE,
    LANGUAGES,
    LIBRARY_URL,
    UI,
    detectLanguage,
    loadArticles,
    type Article,
    type KbLanguage,
  } from '../../knowledge'
  import { parseArticleBody, inlineRuns } from '../../knowledge/body'

  let { open, onclose }: { open: boolean; onclose: () => void } = $props()

  const LANG_KEY = 'universal-ai:kb-language'

  function initialLanguage(): KbLanguage {
    try {
      const saved = localStorage.getItem(LANG_KEY)
      if (saved && LANGUAGES.some((l) => l.code === saved)) return saved as KbLanguage
    } catch {
      // storage unavailable — fall through to the device language
    }
    return detectLanguage(typeof navigator !== 'undefined' ? navigator.languages ?? [navigator.language] : [])
  }

  let language = $state<KbLanguage>(initialLanguage())
  let list = $state<Article[] | null>(null)
  let failed = $state(false)
  let current = $state<string | null>(null)
  let card: HTMLDivElement | undefined = $state()

  let ui = $derived(UI[language])
  let index = $derived(current && list ? list.findIndex((a) => a.id === current) : -1)
  let article = $derived(index >= 0 && list ? list[index] : null)
  let prev = $derived(index > 0 && list ? list[index - 1] : null)
  let next = $derived(index >= 0 && list ? (list[index + 1] ?? null) : null)
  let blocks = $derived(article ? parseArticleBody(article.body) : [])

  // Each group takes the next hue in turn, so cards in one section match.
  const HUES = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#f43f5e']
  function hueOf(a: Article): string {
    const order: string[] = []
    for (const x of list ?? []) if (!order.includes(x.group ?? '')) order.push(x.group ?? '')
    return HUES[Math.max(0, order.indexOf(a.group ?? '')) % HUES.length]
  }
  const paperUrl = (path: string) => (/^https?:\/\//.test(path) ? path : `${LIBRARY_URL}/${path.replace(/^\//, '')}`)
  const count = (n: number) => (n === 1 ? ui.sourcesCountOne : ui.sourcesCount.replace('{n}', String(n)))

  // Consecutive runs of the same group, in the order the articles are given.
  let runs = $derived.by(() => {
    const out: { group?: string; items: Article[] }[] = []
    for (const a of list ?? []) {
      const last = out[out.length - 1]
      if (last && last.group === a.group) last.items.push(a)
      else out.push({ group: a.group, items: [a] })
    }
    return out
  })

  function setLanguage(code: KbLanguage) {
    language = code
    try {
      localStorage.setItem(LANG_KEY, code)
    } catch {
      // storage unavailable — the choice lasts for this visit only
    }
  }

  // Resolve the articles whenever the dialog opens or the language changes.
  // Translations are separate chunks; the stale-request guard stops a slow
  // earlier language from landing over a later choice.
  $effect(() => {
    if (!open) return
    const lang = language
    let live = true
    failed = false
    loadArticles(lang)
      .then((a) => { if (live) list = a })
      .catch(() => { if (live) failed = true })
    return () => { live = false }
  })

  // Every open starts on the list, with focus in the dialog.
  $effect(() => {
    if (!open) return
    current = null
    void tick().then(() => card?.focus())
  })

  // Moving between the list and an article starts at the top, as turning a page would.
  $effect(() => {
    void current
    card?.scrollTo?.({ top: 0 })
  })

  function onKeydown(e: KeyboardEvent) {
    if (!open || e.key !== 'Escape') return
    e.preventDefault()
    // Escape steps back out of an article before it closes the dialog, the
    // same as the back button.
    if (current) current = null
    else onclose()
  }
</script>

<svelte:document onkeydown={onKeydown} />

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div class="scrim" role="presentation" onclick={onclose}>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
      class="card"
      role="dialog"
      aria-modal="true"
      aria-label="{ui.title} — Universal AI"
      tabindex="-1"
      bind:this={card}
      onclick={(e) => e.stopPropagation()}
    >
      <button type="button" class="close" aria-label={ui.close} title={ui.close} onclick={onclose}>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>

      {#if article}
        <button type="button" class="back" onclick={() => (current = null)}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          {ui.back}
        </button>
        <div class="hero" style="--hue: {hueOf(article)}">
          {#if article.group}<p class="eyebrow">{article.group}</p>{/if}
          <h2 class="article-title">{article.title}</h2>
          {#if article.summary}<p class="lede">{article.summary}</p>{/if}
        </div>
        <div class="layout" lang={language}>
        <div class="body">
          {#each blocks as b}
            {#if b.kind === 'h'}
              <h3>{#each inlineRuns(b.text) as r}{#if r.bold}<strong>{r.text}</strong>{:else}{r.text}{/if}{/each}</h3>
            {:else if b.kind === 'p'}
              <p>{#each inlineRuns(b.text) as r}{#if r.bold}<strong>{r.text}</strong>{:else}{r.text}{/if}{/each}</p>
            {:else if b.kind === 'ul'}
              <ul>
                {#each b.items as item}
                  <li>{#each inlineRuns(item) as r}{#if r.bold}<strong>{r.text}</strong>{:else}{r.text}{/if}{/each}</li>
                {/each}
              </ul>
            {:else}
              <ol>
                {#each b.items as item}
                  <li>{#each inlineRuns(item) as r}{#if r.bold}<strong>{r.text}</strong>{:else}{r.text}{/if}{/each}</li>
                {/each}
              </ol>
            {/if}
          {/each}
        </div>
        <aside>
          <a class="guide" style="--hue: {hueOf(article)}" href="{GUIDES_BASE}/{language}/{article.id}.pdf" target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></svg>
            {ui.downloadGuide}
          </a>
          {#if article.sources?.length}
            <div class="sources">
              <p class="group">{ui.sources}</p>
              {#each article.sources as s (s.href)}
                <div class="source">
                  <span class="kind">{ui.kinds[s.kind]}</span>
                  <a class="source-title" href={s.href} target="_blank" rel="noopener noreferrer">{s.title}</a>
                  {#if s.authors || s.publisher || s.year}
                    <span class="byline">{[s.authors, s.publisher, s.year].filter(Boolean).join(' · ')}</span>
                  {/if}
                  <span class="pills">
                    {#if s.pdf}<a class="pill primary" href={paperUrl(s.pdf)} target="_blank" rel="noopener noreferrer">↓ PDF</a>{/if}
                    <a class="pill" href={s.href} target="_blank" rel="noopener noreferrer">{s.pdf ? ui.publisher : ui.readSource} ↗</a>
                  </span>
                  {#if s.pdf && s.licence}<span class="licence">{s.licence}</span>{/if}
                </div>
              {/each}
            </div>
          {/if}
        </aside>
        </div>
        {#if prev || next}
          <nav class="pager">
            {#if prev}<button type="button" onclick={() => (current = prev!.id)}><small>← {ui.previous}</small>{prev.title}</button>{:else}<span></span>{/if}
            {#if next}<button type="button" class="right" onclick={() => (current = next!.id)}><small>{ui.next} →</small>{next.title}</button>{:else}<span></span>{/if}
          </nav>
        {/if}
      {:else}
        <div class="identity">
          <span class="mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
              <path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5" />
              <path d="M8 7h8M8 11h6" />
            </svg>
          </span>
          <div class="names">
            <h2>{ui.title}</h2>
            <p>Universal AI</p>
          </div>
        </div>

        <label class="lang">
          <span>{ui.language}</span>
          <select
            value={language}
            onchange={(e) => setLanguage((e.currentTarget as HTMLSelectElement).value as KbLanguage)}
          >
            {#each LANGUAGES as l}
              <option value={l.code} lang={l.code}>{l.label}</option>
            {/each}
          </select>
        </label>

        {#if failed}
          <p class="status">{ui.failed}</p>
        {:else if !list}
          <p class="status faint">{ui.loading}</p>
        {:else}
          <p class="intro">{ui.intro}</p>
          <div class="groups" lang={language}>
            {#each runs as run, i (`${run.group ?? ''}-${i}`)}
              <section>
                {#if run.group}<p class="group">{run.group}</p>{/if}
                <div class="cards">
                  {#each run.items as a (a.id)}
                    <button type="button" class="kb-card" style="--hue: {hueOf(a)}" onclick={() => (current = a.id)}>
                      <span class="card-title">{a.title}</span>
                      {#if a.summary}<span class="card-summary">{a.summary}</span>{/if}
                      <span class="card-foot">
                        <span>{a.sources?.length ? count(a.sources.length) : ''}</span>
                        <span class="read">{ui.read} →</span>
                      </span>
                    </button>
                  {/each}
                </div>
              </section>
            {/each}
          </div>
        {/if}
      {/if}
    </div>
  </div>
{/if}

<style>
  /* The same shell as the welcome card (WelcomeGate.svelte): a blurred scrim
     that carries the safe-area insets, and a surface card on the theme's
     tokens, so light and dark both follow app.css. Wider than that card
     (61rem ≈ 980px, as in the SDK's reader): three columns of cards, or an
     article beside its sources. */
  .scrim {
    position: fixed;
    inset: 0;
    z-index: 110;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: max(1rem, var(--safe-top)) 1rem max(1rem, var(--safe-bottom));
    background: color-mix(in srgb, var(--frame) 82%, transparent);
    backdrop-filter: blur(4px);
  }
  .card {
    position: relative;
    width: 100%;
    max-width: 61rem;
    height: 100%;
    max-height: 56rem;
    overflow-y: auto;
    overscroll-behavior: contain;
    background: var(--surface);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
    padding: 1.3rem 1.4rem 1.4rem;
    outline: none;
  }
  .close {
    position: absolute;
    top: 0.7rem;
    right: 0.7rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    padding: 0;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: var(--text-dim);
  }
  .close:hover { color: var(--text); }
  .back {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.4rem 0.25rem 0.1rem;
    margin: -0.25rem 0 0 -0.1rem;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: var(--accent);
    font-size: 0.8rem;
    font-weight: 600;
  }
  .article-title,
  .names h2 {
    margin: 0;
    font-size: 1.07rem;
    font-weight: 700;
    letter-spacing: -0.01em;
    line-height: 1.3;
    color: var(--text);
  }
  .article-title { margin: 0.6rem 2.2rem 0.75rem 0; }
  .identity {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin: 0 2.2rem 0.9rem 0;
  }
  .mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: color-mix(in srgb, var(--accent) 14%, transparent);
    color: var(--accent);
  }
  .names { min-width: 0; }
  .names p { margin: 0.15rem 0 0; font-size: 0.75rem; color: var(--text-dim); }
  .lang {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0 0 1rem;
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--text-dim);
  }
  .lang select {
    font: inherit;
    font-weight: 400;
    color: var(--text);
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 0.3rem 0.45rem;
  }
  .status { margin: 0; font-size: 0.85rem; line-height: 1.6; color: var(--text-dim); }
  .groups { display: grid; gap: 0.9rem; }
  .group {
    margin: 0 0 0.25rem;
    font-size: 0.66rem;
    font-weight: 700;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: var(--text-dim);
  }
  .intro { margin: 0 0 1rem; font-size: 0.85rem; line-height: 1.55; color: var(--text-dim); }
  .groups { gap: 1.25rem; }
  .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr)); gap: 0.6rem; }
  .kb-card {
    display: flex;
    flex-direction: column;
    min-height: 8.25rem;
    padding: 0.85rem 0.85rem 0.75rem 1rem;
    border: 1px solid var(--border);
    border-left: 4px solid var(--hue);
    border-radius: 12px;
    background: transparent;
    text-align: left;
    transition: border-color 0.12s ease, transform 0.12s ease;
  }
  .kb-card:hover { border-color: var(--hue); transform: translateY(-1px); }
  .card-title { font-size: 0.88rem; font-weight: 700; line-height: 1.35; color: var(--text); }
  .card-summary { margin-top: 0.35rem; font-size: 0.78rem; line-height: 1.45; color: var(--text-dim); }
  .card-foot { display: flex; justify-content: space-between; gap: 0.5rem; margin-top: auto; padding-top: 0.75rem; font-size: 0.72rem; color: var(--text-dim); }
  .read { color: var(--hue); font-weight: 650; }
  .hero {
    margin: 0.6rem 0 1.25rem;
    padding: 1rem 1.1rem;
    border-left: 4px solid var(--hue);
    border-radius: 12px;
    background: color-mix(in srgb, var(--hue) 12%, transparent);
  }
  .hero .article-title { margin: 0 2.2rem 0 0; font-size: 1.25rem; }
  .eyebrow { margin: 0 0 0.35rem; font-size: 0.66rem; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; color: var(--hue); }
  .lede { margin: 0.4rem 0 0; font-size: 0.85rem; color: var(--text-dim); }
  .layout { display: grid; grid-template-columns: minmax(0, 1fr) 16.25rem; gap: 1.5rem; align-items: start; }
  @media (max-width: 760px) { .layout { grid-template-columns: minmax(0, 1fr); } }
  .layout .body { max-width: 40rem; }
  aside { display: grid; gap: 0.9rem; }
  .guide {
    display: flex; align-items: center; justify-content: center; gap: 0.5rem;
    padding: 0.62rem 0.75rem; border-radius: 10px;
    background: var(--hue); color: #fff; font-size: 0.8rem; font-weight: 650; text-decoration: none;
  }
  .sources { padding: 0.85rem 0.85rem 1rem; border: 1px solid var(--border); border-radius: 12px; display: grid; gap: 0.75rem; }
  .sources .group { margin: 0; }
  .source { display: grid; justify-items: start; }
  .kind { margin-bottom: 0.25rem; padding: 0.05rem 0.45rem; border-radius: 999px; background: var(--surface-2); color: var(--text-dim); font-size: 0.63rem; font-weight: 650; }
  .source-title { font-size: 0.78rem; font-weight: 650; line-height: 1.4; color: var(--text); text-decoration: none; }
  .byline { margin-top: 0.12rem; font-size: 0.72rem; line-height: 1.4; color: var(--text-dim); }
  .pills { display: flex; flex-wrap: wrap; gap: 0.375rem; margin-top: 0.375rem; }
  .pill { padding: 0.19rem 0.56rem; border: 1px solid var(--border); border-radius: 999px; color: var(--text-dim); font-size: 0.69rem; font-weight: 650; text-decoration: none; white-space: nowrap; }
  .pill.primary { border-color: color-mix(in srgb, var(--accent) 40%, transparent); background: color-mix(in srgb, var(--accent) 12%, transparent); color: var(--accent); }
  .licence { margin-top: 0.25rem; font-size: 0.66rem; line-height: 1.35; color: var(--text-dim); }
  .pager { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; margin-top: 1.6rem; padding-top: 1rem; border-top: 1px solid var(--border); }
  .pager button { display: grid; gap: 0.12rem; padding: 0.6rem 0.75rem; border: 1px solid var(--border); border-radius: 8px; background: transparent; color: var(--text); font-size: 0.8rem; font-weight: 600; text-align: left; }
  .pager button.right { text-align: right; }
  .pager small { font-size: 0.69rem; font-weight: 400; color: var(--text-dim); }
  .body { display: grid; gap: 0.65rem; }
  .body h3 { margin: 0.35rem 0 0; font-size: 0.85rem; font-weight: 700; color: var(--text); }
  .body p,
  .body ul,
  .body ol {
    margin: 0;
    font-size: 0.85rem;
    line-height: 1.6;
    color: var(--text);
  }
  .body ul,
  .body ol { padding-left: 1.25rem; line-height: 1.55; }
  .body li + li { margin-top: 0.25rem; }
  .body strong { font-weight: 650; }
</style>
