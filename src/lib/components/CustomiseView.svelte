<script lang="ts">
  import { modelsFor, MODELS } from '../engine'
  import {
    engineStatus,
    loadProgress,
    modelId,
    backend,
    loadModel,
    online,
  } from '../stores'
  import { settings, setTheme, setAiName, setUserName, setWebSearch, setSafeMode, setClearOnClose, type ThemePref } from '../settings'

  let models = $derived(modelsFor($backend))
  let pct = $derived(Math.round(($loadProgress?.progress ?? 0) * 100))
  let loading = $derived($engineStatus === 'loading')

  const THEMES: { id: ThemePref; label: string; icon: string }[] = [
    { id: 'light', label: 'Light', icon: '☀️' },
    { id: 'dark', label: 'Dark', icon: '🌙' },
    { id: 'system', label: 'System', icon: '🖥️' },
  ]

  // The model the engine is currently running (may differ from the dropdown
  // selection until the user loads it).
  let activeModel = $derived(MODELS.find((m) => m.id === $modelId))
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
        <option value={m.id}>{m.label} · {(m.sizeMB / 1000).toFixed(1)}GB</option>
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
    {#if activeModel?.note}<p class="note">{activeModel.note}</p>{/if}
  </section>

  <!-- Personalisation -->
  <section>
    <h3>Names</h3>
    <p class="hint">Optional — set what the assistant calls itself and how it addresses you in chat.</p>
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
    <p class="hint">Everything runs entirely on your device. No data is ever sent to a server.</p>

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
    color: #07101f;
    font-weight: 600;
  }
  select { width: 100%; font: inherit; color: var(--text); background: var(--surface-2);
    border: 1px solid var(--border); border-radius: var(--radius); padding: 0.6rem 0.7rem; }
  .note { margin: 0; font-size: 0.78rem; color: var(--text-dim); }
  .progress { display: flex; flex-direction: column; gap: 0.35rem; }
  .track { height: 6px; background: var(--surface-2); border-radius: 6px; overflow: hidden; }
  .fill { height: 100%; background: var(--accent); transition: width 0.2s ease; }
  .status { font-size: 0.8rem; color: var(--text-dim); }
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
