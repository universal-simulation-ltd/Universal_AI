<script lang="ts">
  import { modelsFor, MODELS } from '../engine'
  import {
    engineStatus,
    engineError,
    loadProgress,
    modelId,
    backend,
    loadModel,
    deleteModel,
    downloadedModels,
    loadedModelId,
    online,
    applyPersonaKnowledge,
    personaKnowledgeStatus,
  } from '../stores'
  import { settings, setTheme, setAiName, setUserName, setPersona, setWebSearch, setSafeMode, setClearOnClose, type ThemePref } from '../settings'
  import { ALL_PERSONAS, getPersona } from '../personas'
  import { hasPersonaKnowledge } from '../personaKnowledge'
  import UniversalIdBackup from './UniversalIdBackup.svelte'

  // Choosing a character both sets the personality and loads its subject
  // knowledge onto the device (embedding it the first time, then retrieving from
  // it while chatting).
  function choosePersona(id: string) {
    setPersona(id)
    void applyPersonaKnowledge(id)
  }

  let models = $derived(modelsFor($backend))
  let pct = $derived(Math.round(($loadProgress?.progress ?? 0) * 100))
  let loading = $derived($engineStatus === 'loading')

  // Models whose weights are already downloaded on this device (probed at startup,
  // kept current on load/delete) — listed here with a delete option.
  let downloadedList = $derived(models.filter((m) => $downloadedModels[m.id]))
  let pendingDelete = $state<string | null>(null)
  async function confirmDelete(id: string) {
    pendingDelete = null
    await deleteModel(id)
  }

  const THEMES: { id: ThemePref; label: string; icon: string }[] = [
    { id: 'light', label: 'Light', icon: '☀️' },
    { id: 'dark', label: 'Dark', icon: '🌙' },
    { id: 'system', label: 'System', icon: '🖥️' },
  ]

  // The model the engine is currently running (may differ from the dropdown
  // selection until the user loads it).
  let activeModel = $derived(MODELS.find((m) => m.id === $modelId))

  // The currently chosen character ("Knowledge") persona.
  let selectedPersona = $derived(getPersona($settings.personaId))
</script>

<div class="customise">
  <!-- Appearance -->
  <section>
    <h3>Appearance</h3>
    <p class="hint">Choose a colour theme. System follows your device setting.</p>
    <div class="segmented" role="group" aria-label="Theme">
      {#each THEMES as t}
        <button
          class:active={$settings.theme === t.id}
          aria-pressed={$settings.theme === t.id}
          onclick={() => setTheme(t.id)}
        >
          <span aria-hidden="true">{t.icon}</span> {t.label}
        </button>
      {/each}
    </div>
  </section>

  <!-- Model -->
  <section>
    <h3>AI model</h3>
    <p class="hint">
      Switch between models or download another. Each downloads once, then runs
      offline.
    </p>
    <select bind:value={$modelId} disabled={loading}>
      {#each models as m}
        <option value={m.id}>{m.tier} — {m.label} · {(m.sizeMB / 1000).toFixed(1)}GB</option>
      {/each}
    </select>
    {#if loading}
      <div class="progress">
        <div class="track"><div class="fill" style="width:{pct}%"></div></div>
        <span class="status">Downloading… {pct}%</span>
      </div>
    {:else}
      <button class="primary" onclick={() => loadModel()}>
        {$engineStatus === 'ready' ? 'Switch / download model' : 'Download & load model'}
      </button>
    {/if}
    {#if $engineStatus === 'error' && $engineError}
      <p class="err" role="alert">{$engineError}</p>
    {/if}
    {#if activeModel?.note}<p class="note">{activeModel.note}</p>{/if}

    {#if downloadedList.length}
      <div class="dl-list">
        {#each downloadedList as m (m.id)}
          <div class="dl-row">
            <div class="dl-info">
              <span class="dl-name">{m.label}</span>
              {#if $loadedModelId === m.id}<span class="dl-active">active</span>{/if}
            </div>
            {#if pendingDelete === m.id}
              <div class="dl-confirm">
                <span class="dl-q">Delete download?</span>
                <button class="del-yes" onclick={() => confirmDelete(m.id)}>Delete</button>
                <button class="del-no" onclick={() => (pendingDelete = null)}>Cancel</button>
              </div>
            {:else}
              <button
                class="del-btn"
                title="Delete this download"
                aria-label="Delete {m.label} download"
                disabled={loading}
                onclick={() => (pendingDelete = m.id)}
              >🗑</button>
            {/if}
          </div>
        {/each}
      </div>
      <p class="hint">Downloaded on this device. Deleting frees storage — you can re-download anytime.</p>
    {/if}
  </section>

  <!-- Character / "Knowledge" persona -->
  <section>
    <h3>Character</h3>
    <p class="hint">
      Give the assistant a personality and real knowledge of a subject. Tap a
      character to choose it — its knowledge downloads and loads onto your device
      the first time, then it answers from that subject while you chat.
    </p>
    <div class="personas" role="radiogroup" aria-label="Choose a character">
      {#each ALL_PERSONAS as p}
        <button
          type="button"
          class="persona"
          class:selected={($settings.personaId ?? '') === p.id}
          role="radio"
          aria-checked={($settings.personaId ?? '') === p.id}
          onclick={() => choosePersona(p.id)}
        >
          <span class="p-emoji" aria-hidden="true">{p.emoji}</span>
          <span class="p-text">
            <span class="p-name">{p.name}</span>
            <span class="p-domain">{p.domain}</span>
          </span>
          {#if $personaKnowledgeStatus?.id === p.id}
            <span class="p-load" title="Loading knowledge…" aria-label="Loading knowledge">
              <span class="spinner" aria-hidden="true"></span>
            </span>
          {:else if hasPersonaKnowledge(p.id)}
            <span class="p-book" title="Comes with subject knowledge" aria-hidden="true">📚</span>
          {/if}
        </button>
      {/each}
    </div>
    {#if $personaKnowledgeStatus}
      <p class="persona-loading" aria-live="polite">
        Loading {getPersona($personaKnowledgeStatus.id).name}'s knowledge onto your
        device… <b>{Math.round(($personaKnowledgeStatus.done / Math.max(1, $personaKnowledgeStatus.total)) * 100)}%</b>
      </p>
    {/if}
    {#if selectedPersona.about}
      <p class="persona-about" aria-live="polite">
        <span class="about-emoji" aria-hidden="true">{selectedPersona.emoji}</span>
        {selectedPersona.about}
      </p>
    {/if}
  </section>

  <!-- Personalisation -->
  <section>
    <h3>Names</h3>
    <p class="hint">Optional — set what the assistant calls itself and how it addresses you in chat. A name here overrides the character's name.</p>
    <label class="sublabel" for="ai-name">My name <span class="muted">(the assistant)</span></label>
    <input
      id="ai-name"
      type="text"
      placeholder="e.g. Universal AI"
      maxlength="40"
      value={$settings.aiName}
      oninput={(e) => setAiName((e.currentTarget as HTMLInputElement).value)}
    />
    <label class="sublabel" for="user-name">Your name <span class="muted">(you)</span></label>
    <input
      id="user-name"
      type="text"
      placeholder="e.g. Alex"
      maxlength="40"
      value={$settings.userName}
      oninput={(e) => setUserName((e.currentTarget as HTMLInputElement).value)}
    />
  </section>

  <!-- Web search -->
  <section>
    <h3>Online web search <span class="tag">opt-in</span></h3>
    <p class="hint">
      Off keeps the app fully offline and private. When on (and connected), chats
      can also cite real web links alongside your documents.
    </p>
    <label class="toggle">
      <input
        type="checkbox"
        checked={$settings.webSearch}
        onchange={(e) => setWebSearch((e.currentTarget as HTMLInputElement).checked)}
      />
      <span class="switch" aria-hidden="true"></span>
      <span class="toggle-label">
        {$settings.webSearch ? 'Web search on' : 'Web search off'}
        {#if $settings.webSearch && !$online}
          <span class="warn">— offline, will use local sources only</span>
        {/if}
      </span>
    </label>
  </section>

  <!-- Privacy & Safety -->
  <section>
    <h3>Privacy &amp; Safety</h3>

    <!-- Private mode — always on, shown locked for user confidence -->
    <div class="locked-row">
      <label class="toggle locked">
        <input type="checkbox" checked disabled aria-disabled="true" />
        <span class="switch" aria-hidden="true"></span>
        <span class="toggle-label">Private mode</span>
      </label>
      <span class="locked-badge">Always on</span>
    </div>
    <p class="hint">Chats and documents run entirely on your device and are never sent to a server. The only network use is what you opt into — web search or Universal ID backup.</p>

    <!-- Safe mode -->
    <label class="toggle" style="margin-top:0.6rem">
      <input
        type="checkbox"
        checked={$settings.safeMode !== false}
        onchange={(e) => setSafeMode((e.currentTarget as HTMLInputElement).checked)}
      />
      <span class="switch" aria-hidden="true"></span>
      <span class="toggle-label">Safe mode {$settings.safeMode !== false ? 'on' : 'off'}</span>
    </label>
    <p class="hint">
      When on, the assistant refuses topics like adult content, gambling, and harmful material.
      Recommended for shared or family devices.
    </p>

    <!-- Clear on close -->
    <label class="toggle" style="margin-top:0.6rem">
      <input
        type="checkbox"
        checked={$settings.clearOnClose !== false}
        onchange={(e) => setClearOnClose((e.currentTarget as HTMLInputElement).checked)}
      />
      <span class="switch" aria-hidden="true"></span>
      <span class="toggle-label">Clear on close {$settings.clearOnClose !== false ? 'on' : 'off'}</span>
    </label>
    <p class="hint">
      Automatically clears your chat history when you close the app so no conversation lingers between sessions.
    </p>
  </section>

  <!-- Universal ID settings backup -->
  <UniversalIdBackup />
</div>

<style>
  .customise {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 0.9rem 0.9rem calc(var(--safe-bottom) + 1.2rem);
    display: flex;
    flex-direction: column;
    gap: 1.3rem;
  }
  section { display: flex; flex-direction: column; gap: 0.5rem; }
  h3 {
    margin: 0;
    font-size: 0.95rem;
    color: var(--text);
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .hint { margin: 0; font-size: 0.82rem; color: var(--text-dim); line-height: 1.45; }
  .sublabel { font-size: 0.8rem; font-weight: 600; color: var(--text); margin-top: 0.2rem; }
  .sublabel .muted { font-weight: 400; color: var(--text-dim); }
  .tag {
    font-size: 0.68rem;
    font-weight: 700;
    color: var(--accent);
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 0.05rem 0.45rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .segmented { display: flex; gap: 0.4rem; }
  .segmented button { flex: 1; }
  .segmented button.active {
    background: var(--accent);
    border-color: var(--accent);
    color: var(--on-accent);
    font-weight: 600;
  }
  select { width: 100%; font: inherit; color: var(--text); background: var(--surface-2);
    border: 1px solid var(--border); border-radius: var(--radius); padding: 0.6rem 0.7rem; }
  .note { margin: 0; font-size: 0.78rem; color: var(--text-dim); }
  .err { margin: 0; font-size: 0.82rem; color: var(--danger); line-height: 1.4; }
  .personas {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }
  .persona {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    text-align: left;
    padding: 0.55rem 0.6rem;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
  }
  .persona.selected {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 14%, var(--surface-2));
  }
  .p-emoji { font-size: 1.5rem; line-height: 1; flex: 0 0 auto; }
  .p-text { display: flex; flex-direction: column; min-width: 0; gap: 0.1rem; flex: 1 1 auto; }
  .p-name {
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .p-domain {
    font-size: 0.7rem;
    color: var(--text-dim);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .p-book { flex: 0 0 auto; font-size: 0.9rem; opacity: 0.75; }
  .p-load { flex: 0 0 auto; display: inline-flex; }
  .spinner {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 2px solid var(--border);
    border-top-color: var(--accent);
    animation: persona-spin 0.7s linear infinite;
  }
  @keyframes persona-spin { to { transform: rotate(360deg); } }
  .persona-loading {
    margin: 0.5rem 0 0;
    font-size: 0.78rem;
    color: var(--text-dim);
    line-height: 1.45;
  }
  .persona-about {
    display: flex;
    gap: 0.45rem;
    margin: 0.2rem 0 0;
    padding: 0.5rem 0.6rem;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    font-size: 0.8rem;
    line-height: 1.45;
    color: var(--text-dim);
  }
  .about-emoji { flex: 0 0 auto; font-size: 1rem; line-height: 1.35; }
  .progress { display: flex; flex-direction: column; gap: 0.35rem; }
  .track { height: 6px; background: var(--surface-2); border-radius: 6px; overflow: hidden; }
  .fill { height: 100%; background: var(--accent); transition: width 0.2s ease; }
  .status { font-size: 0.8rem; color: var(--text-dim); }
  .dl-list { display: flex; flex-direction: column; gap: 0.4rem; margin-top: 0.2rem; }
  .dl-row {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.45rem 0.6rem;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
  }
  .dl-info { flex: 1; min-width: 0; display: flex; align-items: center; gap: 0.5rem; }
  .dl-name { font-size: 0.85rem; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .dl-active {
    flex: 0 0 auto;
    font-size: 0.64rem;
    font-weight: 700;
    color: var(--ok);
    border: 1px solid color-mix(in srgb, var(--ok) 45%, var(--border));
    border-radius: 999px;
    padding: 0.05rem 0.4rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .del-btn { flex: 0 0 auto; background: transparent; border-color: transparent; padding: 0.3rem 0.45rem; }
  .del-btn:active:not(:disabled) { color: var(--danger); }
  .dl-confirm { display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; }
  .dl-q { font-size: 0.78rem; color: var(--text-dim); }
  .del-yes, .del-no { font-size: 0.76rem; padding: 0.25rem 0.6rem; border-radius: 8px; }
  .del-yes { background: var(--danger); border-color: var(--danger); color: #fff; }
  .toggle { display: flex; align-items: center; gap: 0.6rem; cursor: pointer; }
  .toggle input { position: absolute; opacity: 0; width: 0; height: 0; }
  .switch {
    position: relative;
    flex: 0 0 auto;
    width: 44px;
    height: 26px;
    border-radius: 999px;
    background: var(--surface-2);
    border: 1px solid var(--border);
    transition: background 0.15s ease;
  }
  .switch::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--text-dim);
    transition: transform 0.15s ease, background 0.15s ease;
  }
  .toggle input:checked + .switch { background: var(--accent); border-color: var(--accent); }
  .toggle input:checked + .switch::after { transform: translateX(18px); background: #fff; }
  .toggle input:focus-visible + .switch { outline: 2px solid var(--accent); outline-offset: 2px; }
  .toggle-label { font-size: 0.86rem; color: var(--text); }
  .warn { color: var(--danger); font-size: 0.78rem; }
  .locked-row { display: flex; align-items: center; gap: 0.6rem; }
  .locked { opacity: 0.65; cursor: default; pointer-events: none; }
  .locked-badge {
    font-size: 0.68rem;
    font-weight: 700;
    color: var(--ok);
    border: 1px solid var(--ok);
    border-radius: 999px;
    padding: 0.05rem 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    white-space: nowrap;
  }
  .toggle input:disabled + .switch { background: var(--accent); border-color: var(--accent); }
  .toggle input:disabled + .switch::after { transform: translateX(18px); background: #fff; }
</style>
