<script lang="ts">
  import { modelsFor } from '../engine'
  import {
    engineStatus,
    loadProgress,
    engineError,
    modelId,
    backend,
    loadModel,
  } from '../stores'
  import { settings, setPersona } from '../settings'
  import { ALL_PERSONAS, getPersona } from '../personas'
  import { hasPersonaPack } from '../rag'

  // First-run welcome + model gate. Shown (by App.svelte) until a model has been
  // downloaded on this device. It cannot be dismissed without picking + loading a
  // model — there's no close button, no backdrop-click handler — so it doubles as
  // the onboarding tutorial and the "you need a model to start" hard gate.
  let models = $derived(modelsFor($backend))
  let pct = $derived(Math.round(($loadProgress?.progress ?? 0) * 100))
  let statusText = $derived(
    ($loadProgress?.text ?? 'Loading…').replace(/\s*It can take a while[\s\S]*$/i, '').trim(),
  )
  let loading = $derived($engineStatus === 'loading')
  // The tapped character — its "who they are / where from" is shown below the grid.
  let selectedPersona = $derived(getPersona($settings.personaId))
</script>

<div class="scrim" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
  <div class="card">
    <div class="hero" aria-hidden="true">🤖</div>
    <h1 id="welcome-title">Hello there! Welcome to Universal&nbsp;AI</h1>
    <p class="lede">
      This is your offline AI chatbot which no one can track — it runs entirely on
      your device, with no account and no servers. To get started you need to
      download an AI model.
    </p>

    <label class="field">
      <span class="label">1. Choose a model for your phone</span>
      <select bind:value={$modelId} disabled={loading}>
        {#each models as m}
          <option value={m.id}>
            {m.tier} — {m.label} · {(m.sizeMB / 1000).toFixed(1)}GB
          </option>
        {/each}
      </select>
    </label>

    {#if $backend === 'wllama'}
      <p class="note">
        ⚙️ CPU mode (no WebGPU on this device) — slower, but works everywhere.
      </p>
    {/if}

    <div class="field">
      <span class="label">2. Pick your expert helper</span>
      <p class="sub">
        Each has their own personality, plus a downloadable pack of real subject
        knowledge you can add later from the Knowledge tab. Tap one to choose it —
        you can switch anytime.
      </p>
      <div class="personas" role="radiogroup" aria-label="Choose a character">
        {#each ALL_PERSONAS as p}
          <button
            type="button"
            class="persona"
            class:selected={($settings.personaId ?? '') === p.id}
            role="radio"
            aria-checked={($settings.personaId ?? '') === p.id}
            disabled={loading}
            onclick={() => setPersona(p.id)}
          >
            <span class="p-emoji" aria-hidden="true">{p.emoji}</span>
            <span class="p-text">
              <span class="p-name">{p.name}</span>
              <span class="p-domain">{p.domain}</span>
            </span>
            {#if hasPersonaPack(p.id)}
              <span class="p-book" title="Has a downloadable knowledge pack" aria-hidden="true">📚</span>
            {/if}
          </button>
        {/each}
      </div>
      <p class="about" aria-live="polite">
        <span class="about-emoji" aria-hidden="true">{selectedPersona.emoji}</span>
        {selectedPersona.about}
      </p>
    </div>

    {#if loading}
      <div class="progress">
        <div class="track"><div class="fill" style="width:{pct}%"></div></div>
        <span class="status">{statusText}</span>
      </div>
    {:else}
      <button class="primary load" onclick={() => loadModel()}>
        3. Download &amp; start
      </button>
      <p class="fineprint">
        The model downloads once (~1–2&nbsp;GB), is cached on your device, then runs
        fully offline. Best on Wi-Fi.
      </p>
    {/if}

    {#if $engineStatus === 'error' && $engineError}
      <p class="err">{$engineError}</p>
    {/if}
  </div>
</div>

<style>
  .scrim {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    background: color-mix(in srgb, var(--frame) 82%, transparent);
    backdrop-filter: blur(4px);
  }
  .card {
    width: 100%;
    max-width: 30rem;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 1.4rem 1.3rem calc(var(--safe-bottom) + 1.3rem);
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5);
    text-align: center;
    max-height: 92dvh;
    overflow-y: auto;
  }
  .hero { font-size: 2.6rem; line-height: 1; margin-bottom: 0.4rem; }
  h1 { font-size: 1.25rem; margin: 0 0 0.6rem; color: var(--text); }
  .lede { margin: 0 0 1.1rem; color: var(--text-dim); font-size: 0.92rem; line-height: 1.5; }
  .field { display: block; text-align: left; margin-bottom: 0.8rem; }
  .label {
    display: block;
    font-size: 0.78rem;
    color: var(--text-dim);
    margin-bottom: 0.35rem;
    font-weight: 600;
  }
  select {
    width: 100%;
    font: inherit;
    color: var(--text);
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 0.6rem 0.7rem;
  }
  .note { margin: 0 0 0.8rem; color: var(--text-dim); font-size: 0.82rem; }
  .sub { margin: 0 0 0.6rem; color: var(--text-dim); font-size: 0.78rem; line-height: 1.45; }
  .personas {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
    max-height: 15rem;
    overflow-y: auto;
    padding: 0.1rem;
    margin-bottom: 0.4rem;
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
    /* Let the 1fr grid tracks shrink instead of the button forcing its
       non-wrapping content width and overflowing the card horizontally. */
    min-width: 0;
  }
  .persona.selected {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 14%, var(--surface-2));
  }
  .persona:disabled { opacity: 0.55; }
  .p-emoji { font-size: 1.5rem; line-height: 1; flex: 0 0 auto; }
  .p-text { display: flex; flex-direction: column; min-width: 0; gap: 0.1rem; flex: 1 1 auto; }
  .p-book { flex: 0 0 auto; font-size: 0.85rem; opacity: 0.75; }
  .p-name {
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--text);
    overflow-wrap: anywhere;
  }
  .p-domain {
    font-size: 0.7rem;
    color: var(--text-dim);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .about {
    display: flex;
    gap: 0.45rem;
    text-align: left;
    margin: 0 0 0.2rem;
    padding: 0.5rem 0.6rem;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    font-size: 0.78rem;
    line-height: 1.45;
    color: var(--text-dim);
  }
  .about-emoji { flex: 0 0 auto; font-size: 1rem; line-height: 1.35; }
  .load { width: 100%; }
  .fineprint { margin: 0.7rem 0 0; color: var(--text-dim); font-size: 0.78rem; line-height: 1.45; }
  .progress { display: flex; flex-direction: column; gap: 0.4rem; }
  .track { height: 8px; background: var(--surface-2); border-radius: 8px; overflow: hidden; }
  .fill { height: 100%; background: var(--accent); transition: width 0.2s ease; }
  .status {
    font-size: 0.82rem;
    color: var(--text-dim);
    overflow-wrap: anywhere;
    line-height: 1.35;
  }
  .err { margin: 0.8rem 0 0; color: var(--danger); font-size: 0.85rem; }
</style>
