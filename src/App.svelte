<script lang="ts">
  import { onMount } from 'svelte'
  import ModelBar from './lib/components/ModelBar.svelte'
  import ChatView from './lib/components/ChatView.svelte'
  import KnowledgeView from './lib/components/KnowledgeView.svelte'
  import { refreshKBs, kbs } from './lib/stores'

  let tab: 'chat' | 'knowledge' = $state('chat')

  onMount(() => {
    refreshKBs()
  })

  let enabledCount = $derived($kbs.filter((k) => k.enabled).length)
</script>

<header class="topbar">
  <div class="brand">
    <span class="dot"></span>
    Universal&nbsp;AI
  </div>
  <nav class="tabs">
    <button class:active={tab === 'chat'} onclick={() => (tab = 'chat')}>Chat</button>
    <button class:active={tab === 'knowledge'} onclick={() => (tab = 'knowledge')}>
      Knowledge{#if enabledCount > 0}<span class="badge">{enabledCount}</span>{/if}
    </button>
  </nav>
</header>

<ModelBar />

<main>
  {#if tab === 'chat'}
    <ChatView />
  {:else}
    <KnowledgeView />
  {/if}
</main>

<style>
  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: calc(var(--safe-top) + 0.6rem) 0.9rem 0.6rem;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
  }
  .brand {
    font-weight: 700;
    letter-spacing: 0.2px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--ok);
    box-shadow: 0 0 8px var(--ok);
  }
  .tabs {
    display: flex;
    gap: 0.35rem;
  }
  .tabs button {
    padding: 0.4rem 0.7rem;
    background: transparent;
    border-color: transparent;
  }
  .tabs button.active {
    background: var(--surface-2);
    border-color: var(--border);
  }
  .badge {
    margin-left: 0.35rem;
    background: var(--accent);
    color: #07101f;
    border-radius: 999px;
    padding: 0 0.4rem;
    font-size: 0.75rem;
    font-weight: 700;
  }
  main {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
</style>
