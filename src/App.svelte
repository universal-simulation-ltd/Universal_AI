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
    seedBuiltinKBs,
    loadPacksIntoMemory,
    loadModel,
    kbs,
    online,
    engineStatus,
    modelEverLoaded,
    clearChat,
  } from './lib/stores'
  import { get } from 'svelte/store'
  import { settings } from './lib/settings'

  let tab: 'chat' | 'knowledge' | 'customise' = $state('chat')

  onMount(() => {
    // Startup work runs in an inner async task so onMount stays synchronous and
    // can return a real cleanup (an async onMount's returned Promise is ignored
    // by Svelte, which would leak the listener below).
    void (async () => {
      // Apply the saved theme immediately (settings.ts also re-applies on change).
      void $settings
      await refreshKBs()
      await detectCapabilities()
      await seedBuiltinKBs()
      loadPacksIntoMemory() // best-effort warm any previously installed packs

      // Auto-reload the model if this device has loaded one before. The weights are
      // cached, so this re-initialises without re-downloading. Without it, anything
      // that resets the JS context — an iOS WKWebView reload under memory pressure,
      // or just backgrounding the app — leaves the engine null and the model looking
      // like it "randomly unloaded"; the user would have to tap Load model again.
      if (get(modelEverLoaded) && get(engineStatus) === 'idle') {
        void loadModel()
      }
    })()

    // Clear on close — wipe the conversation when the tab/window closes so no
    // chat history lingers between sessions (on by default).
    const handleUnload = () => {
      if ($settings.clearOnClose !== false) clearChat()
    }
    window.addEventListener('pagehide', handleUnload)
    return () => window.removeEventListener('pagehide', handleUnload)
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
    gap: 0.75rem;
    padding: calc(var(--safe-top) + 0.6rem) 0.9rem 0.6rem;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
  }
  .brand {
    flex: 0 0 auto;
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
    margin-left: auto; /* right-align while the tabs fit */
    min-width: 0; /* allow shrinking so overflow scrolls instead of clipping off-page */
    overflow-x: auto;
    overscroll-behavior-x: contain;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none; /* Firefox */
  }
  .tabs::-webkit-scrollbar {
    display: none; /* WebKit — keep the scroll but hide the bar */
  }
  .tabs button {
    flex: 0 0 auto; /* never shrink; scroll the row instead */
    white-space: nowrap;
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
