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

  // Scroll behaviour: when a new turn starts we bring the question to the top of
  // the viewport so the answer streams in below it — we deliberately do NOT
  // follow the text as it grows. The user reads from the top and scrolls down at
  // their own pace, or taps the jump-to-latest arrow.
  let prevCount = 0
  let mounted = false
  let showJump = $state(false)

  function nearBottom() {
    if (!scroller) return true
    return scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 40
  }

  function refreshJump() {
    showJump = !nearBottom()
  }

  function scrollToBottom(smooth = true) {
    if (!scroller) return
    scroller.scrollTo({ top: scroller.scrollHeight, behavior: smooth ? 'smooth' : 'auto' })
  }

  // Align the most recent question to the top of the scroll area.
  function pinLatestQuestionTop() {
    if (!scroller) return
    const userRows = scroller.querySelectorAll<HTMLElement>('.row.user')
    const target = userRows[userRows.length - 1]
    if (!target) return
    scroller.scrollTop +=
      target.getBoundingClientRect().top - scroller.getBoundingClientRect().top - 8
  }

  $effect(() => {
    const count = $messages.length
    tick().then(() => {
      if (!scroller) return
      if (!mounted) {
        // First render (may reopen an existing conversation) → show the latest.
        mounted = true
        scrollToBottom(false)
      } else if (count > prevCount) {
        // A new turn began: put the question at the top, don't chase the stream.
        pinLatestQuestionTop()
      }
      prevCount = count
      refreshJump()
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
  let loading = $derived($engineStatus === 'loading')
  let placeholder = $derived(
    ready ? 'Message…' : loading ? 'Loading model…' : 'Load a model in the Customise tab',
  )
</script>

<div class="chat">
  <div class="stream">
    <div class="scroll" bind:this={scroller} onscroll={refreshJump}>
    {#if $messages.length === 0}
      <div class="empty">
        <h2>Offline &amp; private</h2>
        <p>Everything runs on your device. Load a model in the <b>Customise</b> tab, then chat.</p>

        <div class="rag-card">
          <h3>Answer from your own documents</h3>
          <p>
            Add files under <b>Knowledge</b> and the AI answers from them — with
            sources — instead of answering from training memory.
            <span class="tag">This is called RAG<br />(Retrieval-Augmented Generation)</span>
          </p>
        </div>
      </div>
    {:else}
      {#each $messages as msg (msg.id)}
        <MessageBubble {msg} />
      {/each}
    {/if}
    </div>

    {#if showJump}
      <button
        class="jump"
        title="Scroll to latest"
        aria-label="Scroll to latest"
        onclick={() => scrollToBottom(true)}
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 5v14" />
          <path d="M19 12l-7 7-7-7" />
        </svg>
      </button>
    {/if}
  </div>

  <div class="composer">
    <button
      class="ghost bin"
      title="Delete all messages and start again"
      aria-label="Delete all messages and start again"
      onclick={clearChat}
      disabled={$messages.length === 0 || $generating}
    >
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M3 6h18" />
        <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        <path d="M10 11v6M14 11v6" />
      </svg>
    </button>
    <textarea
      bind:this={textarea}
      bind:value={draft}
      oninput={autosize}
      onkeydown={onKeydown}
      {placeholder}
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
  .stream {
    position: relative;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
  .scroll {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 0.8rem 0.9rem;
    -webkit-overflow-scrolling: touch;
  }
  .jump {
    position: absolute;
    right: 14px;
    bottom: 14px;
    width: 40px;
    height: 40px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    color: var(--text);
    background: var(--surface);
    border: 1px solid var(--border);
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.22);
    z-index: 10;
  }
  .jump:active { background: var(--surface-2); }
  .empty {
    margin: auto;
    max-width: 34ch;
    text-align: center;
    color: var(--text-dim);
    padding-top: 12vh;
  }
  .empty h2 { color: var(--text); margin: 0 0 0.4rem; }
  .rag-card {
    margin-top: 1.4rem;
    padding: 0.9rem 1rem;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    text-align: left;
  }
  .rag-card h3 {
    margin: 0 0 0.4rem;
    color: var(--text);
    font-size: 0.98rem;
  }
  .rag-card p { margin: 0; font-size: 0.88rem; line-height: 1.5; }
  .tag {
    display: inline-block;
    margin-top: 0.5rem;
    color: var(--accent);
    font-weight: 600;
    font-size: 0.8rem;
  }
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
  .bin {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-dim);
  }
  .bin:active:not(:disabled) { color: var(--danger); }
  .stop { background: var(--danger); border-color: var(--danger); }
</style>
