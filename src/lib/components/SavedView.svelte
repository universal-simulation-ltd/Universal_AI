<script lang="ts">
  import { saved, unsaveResponse } from '../stores'

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // clipboard blocked — ignore
    }
  }
</script>

<div class="saved">
  {#if $saved.length === 0}
    <div class="empty">
      <div class="star" aria-hidden="true">★</div>
      <p>Tap and hold a response to save it here.</p>
    </div>
  {:else}
    {#each $saved as item (item.id)}
      <div class="card">
        <div class="body">{item.content}</div>
        {#if item.sources?.length}
          <div class="srcs">
            Sources: {item.sources.map((s) => s.source).join(', ')}
          </div>
        {/if}
        <div class="actions">
          <button class="ghost" onclick={() => copy(item.content)}>⧉ Copy</button>
          <button class="ghost del" onclick={() => unsaveResponse(item.id)}>🗑 Remove</button>
        </div>
      </div>
    {/each}
  {/if}
</div>

<style>
  .saved {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 0.9rem 0.9rem calc(var(--safe-bottom) + 1.2rem);
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
  }
  .empty {
    margin: auto;
    max-width: 30ch;
    text-align: center;
    color: var(--text-dim);
    padding-top: 14vh;
  }
  .star { font-size: 2rem; color: var(--accent); opacity: 0.5; margin-bottom: 0.4rem; }
  .empty p { margin: 0; line-height: 1.5; }
  .card {
    background: var(--bot-bubble);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 0.7rem 0.8rem;
  }
  .body { white-space: pre-wrap; word-break: break-word; line-height: 1.45; }
  .srcs {
    margin-top: 0.5rem;
    font-size: 0.76rem;
    color: var(--text-dim);
    border-top: 1px dashed var(--border);
    padding-top: 0.4rem;
  }
  .actions { display: flex; gap: 0.5rem; margin-top: 0.6rem; }
  .actions button {
    font-size: 0.78rem;
    padding: 0.3rem 0.6rem;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text);
  }
  .del { color: var(--danger); }
</style>
