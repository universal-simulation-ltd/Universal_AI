<script lang="ts">
  import { onMount } from 'svelte'
  import ModelBar from './lib/components/ModelBar.svelte'
  import ChatView from './lib/components/ChatView.svelte'
  import KnowledgeView from './lib/components/KnowledgeView.svelte'
  import CustomiseView from './lib/components/CustomiseView.svelte'
  import WelcomeGate from './lib/components/WelcomeGate.svelte'
  import {
    refreshKBs,
    detectCapabilities,
    seedBuiltinKB,
    loadPackIntoMemory,
    kbs,
    online,
    modelEverLoaded,
  } from './lib/stores'
  import { settings } from './lib/settings'

  let tab: 'chat' | 'knowledge' | 'customise' = $state('chat')

  onMount(async () => {
    // Apply the saved theme immediately (settings.ts also re-applies on change).
    void $settings
    await refreshKBs()
    detectCapabilities()
    await seedBuiltinKB()
    loadPackIntoMemory() // best-effort warm if previously installed
  })

  let enabledCount = $derived($kbs.filter((k) => k.enabled).length)
</script>

<header class="topbar">
  <div class="brand">
    <!-- Connection indicator: green = offline (private, the desired state),
         red = online. Reflects reachability only; the app makes no network
         calls unless web search is opted in. -->
    <span
      class="dot"
      class:offline={!$online}
      class:onlinedot={$online}
      title={$online
        ? 'Connected to the internet'
        : 'Offline — fully private, no network access'}
    ></span>
    Universal&nbsp;AI
  </div>
  <nav class="tabs">
    <button class:active={tab === 'chat'} onclick={() => (tab = 'chat')}>Chat</button>
    <button class:active={tab === 'knowledge'} onclick={() => (tab = 'knowledge')}>
      Knowledge{#if enabledCount > 0}<span class="badge">{enabledCount}</span>{/if}
    </button>
    <button class:active={tab === 'customise'} onclick={() => (tab = 'customise')}>Customise</button>
  </nav>
</header>

<ModelBar />

<main>
  {#if tab === 'chat'}
    <ChatView />
  {:else if tab === 'knowledge'}
    <KnowledgeView />
  {:else}
    <CustomiseView />
  {/if}
</main>

{#if !$modelEverLoaded}
  <WelcomeGate />
{/if}

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
    transition: background 0.2s ease, box-shadow 0.2s ease;
  }
  /* Green = offline (private). Red = connected. */
  .dot.offline { background: var(--ok); box-shadow: 0 0 8px var(--ok); }
  .dot.onlinedot { background: var(--danger); box-shadow: 0 0 8px var(--danger); }
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
