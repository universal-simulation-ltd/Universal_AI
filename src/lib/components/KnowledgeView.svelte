<script lang="ts">
  import { onMount } from 'svelte'
  import { ingestDocument, fetchManifest } from '../rag'
  import {
    kbs,
    refreshKBs,
    toggleKB,
    removeKB,
    BUILTIN_SIMPLEWIKI_ID,
    builtinInstalled,
    builtinDownloadProgress,
    installBuiltinPack,
  } from '../stores'

  let name = $state('')
  let text = $state('')
  let busy = $state(false)
  let progress = $state<{ done: number; total: number } | null>(null)
  let error = $state<string | null>(null)

  let packMB = $state<number | null>(null)
  let packError = $state<string | null>(null)

  onMount(() => {
    fetchManifest()
      .then((m) => (packMB = m.approxMB))
      .catch(() => {}) // pack not built/available — card just won't show a size
  })

  async function downloadPack() {
    packError = null
    try {
      await installBuiltinPack()
    } catch (err) {
      packError = err instanceof Error ? err.message : String(err)
    }
  }

  async function onFiles(e: Event) {
    const input = e.target as HTMLInputElement
    const files = Array.from(input.files ?? [])
    for (const f of files) {
      const content = await f.text()
      await ingest(f.name.replace(/\.[^.]+$/, ''), content, f.name)
    }
    input.value = ''
  }

  async function addPasted() {
    if (!text.trim()) return
    await ingest(name.trim() || 'Pasted text', text, name.trim() || 'pasted')
  }

  async function ingest(kbName: string, content: string, source: string) {
    if (busy) return
    busy = true
    error = null
    progress = { done: 0, total: 0 }
    try {
      await ingestDocument(kbName, content, source, (done, total) => {
        progress = { done, total }
      })
      await refreshKBs()
      name = ''
      text = ''
    } catch (err) {
      error = err instanceof Error ? err.message : String(err)
    } finally {
      busy = false
      progress = null
    }
  }
</script>

<div class="kv">
  <section class="add">
    <h3>Add knowledge</h3>
    <p class="muted">
      Paste text or upload <code>.txt</code> / <code>.md</code> files. They’re
      chunked, embedded, and stored on-device — no upload anywhere.
    </p>

    <input type="text" placeholder="Name (optional)" bind:value={name} disabled={busy} />
    <textarea
      rows="5"
      placeholder="Paste reference text here…"
      bind:value={text}
      disabled={busy}
    ></textarea>

    <div class="actions">
      <label class="filebtn" class:disabled={busy}>
        Upload files
        <input type="file" accept=".txt,.md,.markdown,text/*" multiple onchange={onFiles} disabled={busy} />
      </label>
      <button class="primary" onclick={addPasted} disabled={busy || !text.trim()}>
        Add text
      </button>
    </div>

    {#if progress}
      <p class="muted">Embedding {progress.done}/{progress.total} chunks…</p>
    {/if}
    {#if error}<p class="err">{error}</p>{/if}
  </section>

  <section class="list">
    <h3>Knowledge bases</h3>
    {#if $kbs.length === 0}
      <p class="muted">None yet. Add some above to ground answers.</p>
    {:else}
      {#each $kbs as kb (kb.id)}
        {#if kb.id === BUILTIN_SIMPLEWIKI_ID}
          <div class="kb builtin" class:on={kb.enabled && $builtinInstalled}>
            {#if $builtinInstalled && $builtinDownloadProgress === null}
              <label class="toggle">
                <input type="checkbox" checked={kb.enabled} onchange={() => toggleKB(kb)} />
                <span></span>
              </label>
            {/if}
            <div class="meta">
              <div class="kbname">📚 {kb.name}</div>
              {#if $builtinDownloadProgress !== null}
                <div class="muted small">
                  Downloading… {Math.round($builtinDownloadProgress * 100)}%
                </div>
                <progress max="1" value={$builtinDownloadProgress}></progress>
              {:else if $builtinInstalled}
                <div class="muted small">{kb.chunkCount.toLocaleString()} articles · on-device</div>
              {:else}
                <div class="muted small">
                  {kb.chunkCount.toLocaleString()} articles · cite general knowledge offline
                </div>
              {/if}
            </div>
            {#if $builtinDownloadProgress !== null}
              <!-- controls hidden while downloading -->
            {:else if $builtinInstalled}
              <button class="del" title="Remove download" onclick={() => removeKB(kb)}>🗑</button>
            {:else}
              <button class="primary dl" onclick={downloadPack}>
                Download{#if packMB}&nbsp;(~{packMB}&nbsp;MB){/if}
              </button>
            {/if}
          </div>
          {#if packError}<p class="err">{packError}</p>{/if}
        {:else}
          <div class="kb" class:on={kb.enabled}>
            <label class="toggle">
              <input type="checkbox" checked={kb.enabled} onchange={() => toggleKB(kb)} />
              <span></span>
            </label>
            <div class="meta">
              <div class="kbname">{kb.name}</div>
              <div class="muted small">{kb.chunkCount} chunks</div>
            </div>
            <button class="del" title="Delete" onclick={() => removeKB(kb)}>🗑</button>
          </div>
        {/if}
      {/each}
    {/if}
  </section>
</div>

<style>
  .kv { flex: 1; min-height: 0; overflow-y: auto; padding: 0.9rem; padding-bottom: calc(var(--safe-bottom) + 1rem); }
  section { margin-bottom: 1.4rem; }
  h3 { margin: 0 0 0.5rem; }
  .muted { color: var(--text-dim); font-size: 0.85rem; margin: 0.3rem 0; }
  .small { font-size: 0.78rem; }
  code { background: var(--surface-2); padding: 0 0.3rem; border-radius: 5px; }
  .add input[type='text'], .add textarea { margin-bottom: 0.5rem; }
  .actions { display: flex; gap: 0.5rem; }
  .filebtn {
    flex: 1;
    text-align: center;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 0.6rem 0.9rem;
  }
  .filebtn.disabled { opacity: 0.45; }
  .filebtn input { display: none; }
  .err { color: var(--danger); font-size: 0.85rem; }
  .kb {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    padding: 0.6rem 0.7rem;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    margin-bottom: 0.5rem;
    opacity: 0.6;
  }
  .kb.on { opacity: 1; border-color: var(--accent); }
  .kb.builtin { opacity: 1; }
  .dl { white-space: nowrap; flex: 0 0 auto; padding: 0.45rem 0.7rem; }
  .meta progress { width: 100%; height: 6px; margin-top: 0.35rem; }
  .meta { flex: 1; min-width: 0; }
  .kbname { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .del { background: transparent; border-color: transparent; padding: 0.3rem 0.4rem; }
  .toggle { position: relative; width: 42px; height: 24px; flex: 0 0 auto; }
  .toggle input { opacity: 0; width: 0; height: 0; }
  .toggle span {
    position: absolute; inset: 0;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 999px;
    transition: background 0.15s;
  }
  .toggle span::before {
    content: '';
    position: absolute; left: 2px; top: 2px;
    width: 18px; height: 18px; border-radius: 50%;
    background: var(--text-dim);
    transition: transform 0.15s, background 0.15s;
  }
  .toggle input:checked + span { background: var(--accent); border-color: var(--accent); }
  .toggle input:checked + span::before { transform: translateX(18px); background: #07101f; }
</style>
