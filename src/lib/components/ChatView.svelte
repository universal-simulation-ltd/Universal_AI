<script lang="ts">
  import { tick } from 'svelte'
  import MessageBubble from './MessageBubble.svelte'
  import {
    messages,
    generating,
    engineStatus,
    send,
    stop,
    clearChat,
  } from '../stores'

  let draft = $state('')
  let scroller: HTMLElement
  let textarea: HTMLTextAreaElement

  $effect(() => {
    // Re-run when messages change; pin to bottom.
    void $messages
    tick().then(() => {
      if (scroller) scroller.scrollTop = scroller.scrollHeight
    })
  })

  async function submit() {
    const text = draft
    draft = ''
    autosize()
    await send(text)
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  function autosize() {
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 140) + 'px'
  }

  let ready = $derived($engineStatus === 'ready')
</script>

<div class="chat">
  <div class="scroll" bind:this={scroller}>
    {#if $messages.length === 0}
      <div class="empty">
        <h2>Offline &amp; private</h2>
        <p>
          Everything runs on your device. Load a model above, then chat. Add
          documents under <b>Knowledge</b> to ground answers with RAG.
        </p>
      </div>
    {:else}
      {#each $messages as msg (msg.id)}
        <MessageBubble {msg} />
      {/each}
    {/if}
  </div>

  <div class="composer">
    {#if $messages.length > 0}
      <button class="ghost" title="Clear chat" onclick={clearChat} disabled={$generating}>
        ⌫
      </button>
    {/if}
    <textarea
      bind:this={textarea}
      bind:value={draft}
      oninput={autosize}
      onkeydown={onKeydown}
      placeholder={ready ? 'Message…' : 'Load a model to start'}
      disabled={!ready}
      rows="1"
    ></textarea>
    {#if $generating}
      <button class="primary stop" onclick={stop}>■</button>
    {:else}
      <button class="primary" onclick={submit} disabled={!ready || !draft.trim()}>↑</button>
    {/if}
  </div>
</div>

<style>
  .chat { flex: 1; min-height: 0; display: flex; flex-direction: column; }
  .scroll {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 0.8rem 0.9rem;
    -webkit-overflow-scrolling: touch;
  }
  .empty {
    margin: auto;
    max-width: 28ch;
    text-align: center;
    color: var(--text-dim);
    padding-top: 18vh;
  }
  .empty h2 { color: var(--text); margin: 0 0 0.4rem; }
  .composer {
    display: flex;
    align-items: flex-end;
    gap: 0.5rem;
    padding: 0.6rem 0.9rem calc(var(--safe-bottom) + 0.6rem);
    background: var(--surface);
    border-top: 1px solid var(--border);
  }
  .composer textarea { line-height: 1.4; max-height: 140px; }
  .composer button {
    width: 44px;
    height: 44px;
    flex: 0 0 auto;
    padding: 0;
    font-size: 1.2rem;
    border-radius: 50%;
  }
  .ghost { background: transparent; }
  .stop { background: var(--danger); border-color: var(--danger); }
</style>
