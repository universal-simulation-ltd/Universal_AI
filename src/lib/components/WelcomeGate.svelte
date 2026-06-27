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
      <span class="label">Choose a model</span>
      <select bind:value={$modelId} disabled={loading}>
        {#each models as m}
          <option value={m.id}>{m.label} · {(m.sizeMB / 1000).toFixed(1)}GB</option>
        {/each}
      </select>
    </label>

    {#if $backend === 'wllama'}
      <p class="note">
        ⚙️ CPU mode (no WebGPU on this device) — slower, but works everywhere.
      </p>
    {/if}

    {#if loading}
      <div class="progress">
        <div class="track"><div class="fill" style="width:{pct}%"></div></div>
        <span class="status">{statusText}</span>
      </div>
    {:else}
      <button class="primary load" onclick={() => loadModel()}>
        Download &amp; start
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
