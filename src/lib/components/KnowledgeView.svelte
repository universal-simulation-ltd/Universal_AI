<script lang="ts">
  import { onMount } from 'svelte'
  import {
    ingestDocument,
    fetchManifest,
    BUILTIN_PACKS,
    BUILTIN_PREFIX,
    isPersonaPackId,
    personaIdForPackId,
    type PackManifest,
  } from '../rag'
  import {
    kbs,
    refreshKBs,
    toggleKB,
    removeKB,
    builtinInstalled,
    builtinDownloadProgress,
    installBuiltinPack,
    uninstallBuiltinPack,
    applyPersonaKnowledge,
  } from '../stores'
  import { settings, setPersona } from '../settings'
  import { getPersona, type Persona } from '../personas'
  import type { KnowledgeBase } from '../rag'

  // The active character (persona). A character IS its knowledge pack: turning a
  // character on gives the assistant that personality AND its subject knowledge,
  // and only one character is active at a time.
  let selectedPersonaId = $derived($settings.personaId ?? '')
  // Which character's (i) "about" panel is currently expanded (keyed by persona id).
  let infoFor = $state<string | null>(null)
  function toggleInfo(id: string) {
    infoFor = infoFor === id ? null : id
  }

  // The persona a character-pack row represents.
  const personaOf = (kbId: string): Persona => getPersona(personaIdForPackId(kbId))

  // Turn a character on/off. On = become that character (personality + its
  // knowledge) and switch off any other character; off = plain assistant.
  function toggleCharacter(personaId: string) {
    const next = selectedPersonaId === personaId ? '' : personaId
    setPersona(next)
    void applyPersonaKnowledge(next)
  }

  // Downloading a character's knowledge is the same act as becoming that
  // character — there's no separate "select" step.
  async function downloadCharacter(personaId: string, packId: string) {
    setPersona(personaId)
    void applyPersonaKnowledge(personaId) // switch off any other character now
    await downloadPack(packId) // installs, then enables (this persona is active)
  }

  async function removeCharacter(personaId: string, packId: string) {
    if (selectedPersonaId === personaId) {
      setPersona('')
      await applyPersonaKnowledge('')
    }
    await removePack(packId)
  }

  let name = $state('')
  let text = $state('')
  let busy = $state(false)
  let progress = $state<{ done: number; total: number } | null>(null)
  let error = $state<string | null>(null)

  // Manifests + per-pack download errors, keyed by built-in pack id.
  let manifests = $state<Record<string, PackManifest>>({})
  let packError = $state<Record<string, string | null>>({})

  // Canonical character order = order in BUILTIN_PACKS (Luigi first, as in
  // personas.ts), so the list doesn't depend on IndexedDB insertion order.
  const packOrder = (id: string) => {
    const i = BUILTIN_PACKS.findIndex((p) => p.id === id)
    return i === -1 ? Number.MAX_SAFE_INTEGER : i
  }

  // One unified list, ordered: characters first (they're the headline), then the
  // general knowledge packs, then the user's own knowledge bases.
  let orderedKbs = $derived([
    ...$kbs.filter((k) => isPersonaPackId(k.id)).sort((a, b) => packOrder(a.id) - packOrder(b.id)),
    ...$kbs.filter((k) => k.id.startsWith(BUILTIN_PREFIX) && !isPersonaPackId(k.id)),
    ...$kbs.filter((k) => !k.id.startsWith(BUILTIN_PREFIX)),
  ])

  onMount(() => {
    for (const def of BUILTIN_PACKS) {
      fetchManifest(def.id)
        .then((m) => (manifests = { ...manifests, [def.id]: m }))
        .catch(() => {}) // pack not built/available — its row just won't show a size
    }
  })

  async function downloadPack(id: string) {
    packError = { ...packError, [id]: null }
    try {
      await installBuiltinPack(id)
    } catch (err) {
      packError = { ...packError, [id]: err instanceof Error ? err.message : String(err) }
    }
  }

  async function removePack(id: string) {
    packError = { ...packError, [id]: null }
    await uninstallBuiltinPack(id)
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

{#snippet characterRow(kb: KnowledgeBase)}
  {@const p = personaOf(kb.id)}
  {@const m = manifests[kb.id]}
  {@const installed = $builtinInstalled[kb.id]}
  {@const prog = $builtinDownloadProgress[kb.id]}
  {@const active = selectedPersonaId === p.id}
  <div class="kb character" class:on={active}>
    <div class="kb-row">
      <span class="lead-emoji" aria-hidden="true">{p.emoji}</span>
      <div class="meta">
        <div class="kbname">{p.name}</div>
        {#if prog != null}
          <div class="muted small">Downloading knowledge… {Math.round(prog * 100)}%</div>
          <progress max="1" value={prog}></progress>
        {:else if installed}
          <div class="muted small">
            {p.domain} · {m ? m.count.toLocaleString() : ''} {m?.unit ?? 'entries'}{#if active}&nbsp;· <b class="on-text">active</b>{/if}
          </div>
        {:else}
          <div class="muted small">{p.domain}{#if m?.approxMB}&nbsp;· ~{m.approxMB}&nbsp;MB{/if}</div>
        {/if}
      </div>
      <button
        type="button"
        class="info-btn"
        class:open={infoFor === p.id}
        aria-label="About {p.name}"
        aria-expanded={infoFor === p.id}
        onclick={() => toggleInfo(p.id)}
      >i</button>
      {#if prog != null}
        <!-- controls hidden while downloading -->
      {:else}
        {#if installed || active}
          <label class="toggle" title={active ? 'Turn character off' : 'Become this character'}>
            <input type="checkbox" checked={active} onchange={() => toggleCharacter(p.id)} />
            <span></span>
          </label>
        {/if}
        {#if installed}
          <button class="del" title="Remove downloaded knowledge" onclick={() => removeCharacter(p.id, kb.id)}>🗑</button>
        {:else}
          <button class="primary dl" onclick={() => downloadCharacter(p.id, kb.id)}>Download</button>
        {/if}
      {/if}
    </div>
    {#if infoFor === p.id}
      <div class="about">
        <p>{p.about}</p>
        <p class="knows"><b>Knows about:</b> {p.domain}</p>
      </div>
    {/if}
    {#if packError[kb.id]}<p class="err">{packError[kb.id]}</p>{/if}
  </div>
{/snippet}

<div class="kv">
  <section class="list">
    <h3>Knowledge bases</h3>
    <p class="muted">
      Turn on a <b>character</b> to give the assistant its personality and real
      subject knowledge — recipes, world capitals, marine science and more.
      Downloading a character's knowledge is what makes the assistant that
      character; only one is active at a time. You can also add general packs or
      your own documents below. Everything stays on your device.
    </p>
    {#each orderedKbs as kb (kb.id)}
      {#if isPersonaPackId(kb.id)}
        {@render characterRow(kb)}
      {:else if kb.id.startsWith(BUILTIN_PREFIX)}
        {@const prog = $builtinDownloadProgress[kb.id]}
        {@const installed = $builtinInstalled[kb.id]}
        {@const m = manifests[kb.id]}
        {@const unit = m?.unit ?? 'entries'}
        <div class="kb builtin" class:on={kb.enabled && installed}>
          <div class="kb-row">
            {#if installed && prog == null}
              <label class="toggle">
                <input type="checkbox" checked={kb.enabled} onchange={() => toggleKB(kb)} />
                <span></span>
              </label>
            {/if}
            <div class="meta">
              <div class="kbname">📚 {kb.name}</div>
              {#if prog != null}
                <div class="muted small">Downloading… {Math.round(prog * 100)}%</div>
                <progress max="1" value={prog}></progress>
              {:else if installed}
                <div class="muted small">{kb.chunkCount.toLocaleString()} {unit} · on-device</div>
              {:else}
                <div class="muted small">
                  {kb.chunkCount.toLocaleString()} {unit} · {m?.description ?? 'cite offline'}
                </div>
              {/if}
            </div>
            {#if prog != null}
              <!-- controls hidden while downloading -->
            {:else if installed}
              <button class="del" title="Remove download" onclick={() => removeKB(kb)}>🗑</button>
            {:else}
              <button class="primary dl" onclick={() => downloadPack(kb.id)}>
                Download{#if m?.approxMB}&nbsp;(~{m.approxMB}&nbsp;MB){/if}
              </button>
            {/if}
          </div>
          {#if packError[kb.id]}<p class="err">{packError[kb.id]}</p>{/if}
        </div>
      {:else}
        <div class="kb" class:on={kb.enabled}>
          <div class="kb-row">
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
        </div>
      {/if}
    {/each}
  </section>

  <section class="add">
    <h3>Add your own knowledge</h3>
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
</div>

<style>
  .kv { flex: 1; min-height: 0; overflow-y: auto; padding: 0.9rem; padding-bottom: calc(var(--safe-bottom) + 1rem); }
  section { margin-bottom: 1.4rem; }
  h3 { margin: 0 0 0.5rem; }
  .muted { color: var(--text-dim); font-size: 0.85rem; margin: 0.3rem 0; }

  code { background: var(--surface-2); padding: 0 0.3rem; border-radius: 5px; }
  .small { font-size: 0.78rem; }
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
  .err { color: var(--danger); font-size: 0.85rem; margin: 0.35rem 0 0; }

  /* Unified knowledge-base rows (characters, general packs, user docs) */
  .kb {
    display: flex;
    flex-direction: column;
    padding: 0.6rem 0.7rem;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    margin-bottom: 0.5rem;
    opacity: 0.6;
  }
  .kb.on { opacity: 1; border-color: var(--accent); }
  .kb.builtin, .kb.character { opacity: 1; }
  .kb.character.on { background: color-mix(in srgb, var(--accent) 10%, var(--surface)); }
  .kb-row { display: flex; align-items: center; gap: 0.55rem; }
  .lead-emoji { font-size: 1.4rem; line-height: 1; flex: 0 0 auto; width: 1.7rem; text-align: center; }
  .dl { white-space: nowrap; flex: 0 0 auto; font-size: 0.8rem; padding: 0.4rem 0.7rem; }
  .meta { flex: 1; min-width: 0; }
  .meta .small { overflow: hidden; text-overflow: ellipsis; }
  .meta progress { width: 100%; height: 6px; margin-top: 0.35rem; }
  .kbname { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .on-text { color: var(--ok); font-weight: 700; }
  .del { background: transparent; border-color: transparent; padding: 0.3rem 0.4rem; flex: 0 0 auto; }
  .info-btn {
    flex: 0 0 auto;
    display: inline-flex; align-items: center; justify-content: center;
    width: 1.55rem; height: 1.55rem; border-radius: 50%;
    font-size: 0.8rem; font-weight: 700; font-style: italic;
    font-family: Georgia, 'Times New Roman', serif; line-height: 1;
    background: var(--surface-2); border: 1px solid var(--border); color: var(--text-dim);
  }
  .info-btn.open { background: var(--accent); border-color: var(--accent); color: var(--on-accent); }
  .about {
    margin: 0.55rem 0 0.1rem;
    padding: 0.55rem 0.7rem;
    background: var(--surface-2); border: 1px solid var(--border);
    border-radius: var(--radius);
    font-size: 0.82rem; line-height: 1.5; color: var(--text-dim);
  }
  .about p { margin: 0; }
  .about .knows { margin-top: 0.4rem; }
  .about .knows b { color: var(--text); }
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
  .toggle input:checked + span::before { transform: translateX(18px); background: var(--on-accent); }
</style>
