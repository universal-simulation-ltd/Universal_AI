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

  let pct = $derived(Math.round(($loadProgress?.progress ?? 0) * 100))
  let models = $derived(modelsFor($backend))
</script>

<div class="bar" class:error={$engineStatus === 'error'}>
  {#if $engineStatus === 'ready'}
    <span class="status ok">● Ready</span>
    <select bind:value={$modelId} onchange={() => loadModel()}>
      {#each models as m}
        <option value={m.id}>{m.label}</option>
      {/each}
    </select>
  {:else if $engineStatus === 'loading'}
    <div class="loading">
      <div class="track"><div class="fill" style="width:{pct}%"></div></div>
      <span class="status">{$loadProgress?.text ?? 'Loading…'} {pct}%</span>
    </div>
  {:else}
    <select bind:value={$modelId}>
      {#each models as m}
        <option value={m.id}>{m.label} · {(m.sizeMB / 1000).toFixed(1)}GB</option>
      {/each}
    </select>
    <button class="primary" onclick={() => loadModel()}>Load model</button>
  {/if}
</div>

{#if $engineStatus === 'error' && $engineError}
  <p class="err">{$engineError}</p>
{:else if $engineStatus === 'idle'}
  <p class="hint">
    {#if $backend === 'wllama'}
      ⚙️ CPU mode (no WebGPU on this device) — slower, but works. First load
      downloads the model (cached afterwards, runs fully offline). Best on Wi-Fi.
    {:else}
      First load downloads the model (cached afterwards, runs fully offline).
      Best on Wi-Fi.
    {/if}
  </p>
{/if}

<style>
  .bar {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.55rem 0.9rem;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
  }
  select {
    flex: 1;
    min-width: 0;
    font: inherit;
    color: var(--text);
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 0.5rem 0.6rem;
  }
  .status { font-size: 0.85rem; color: var(--text-dim); white-space: nowrap; }
  .status.ok { color: var(--ok); }
  .loading { flex: 1; display: flex; flex-direction: column; gap: 0.3rem; }
  .track {
    height: 6px;
    background: var(--surface-2);
    border-radius: 6px;
    overflow: hidden;
  }
  .fill { height: 100%; background: var(--accent); transition: width 0.2s ease; }
  .err {
    margin: 0;
    padding: 0.6rem 0.9rem;
    color: var(--danger);
    font-size: 0.85rem;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
  }
  .hint {
    margin: 0;
    padding: 0.5rem 0.9rem;
    color: var(--text-dim);
    font-size: 0.8rem;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
  }
</style>
