<script lang="ts">
  import type { UIMessage } from '../stores'
  let { msg }: { msg: UIMessage } = $props()
</script>

<div class="row {msg.role}">
  <div class="bubble {msg.role}">
    {#if msg.content}
      <span class="text">{msg.content}</span>{#if msg.streaming}<span class="caret"></span>{/if}
    {:else if msg.streaming}
      <span class="typing"><i></i><i></i><i></i></span>
    {/if}
    {#if msg.sources && msg.sources.length}
      <div class="sources">
        📚 {msg.sources.join(', ')}
      </div>
    {/if}
  </div>
</div>

<style>
  .row { display: flex; margin: 0.35rem 0; }
  .row.user { justify-content: flex-end; }
  .row.assistant { justify-content: flex-start; }
  .bubble {
    max-width: 85%;
    padding: 0.6rem 0.8rem;
    border-radius: var(--radius);
    white-space: pre-wrap;
    word-break: break-word;
    line-height: 1.45;
  }
  .bubble.user {
    background: var(--user-bubble);
    border-bottom-right-radius: 4px;
  }
  .bubble.assistant {
    background: var(--bot-bubble);
    border: 1px solid var(--border);
    border-bottom-left-radius: 4px;
  }
  .caret {
    display: inline-block;
    width: 7px;
    height: 1.05em;
    margin-left: 1px;
    vertical-align: text-bottom;
    background: var(--accent);
    animation: blink 1s steps(2) infinite;
  }
  @keyframes blink { 50% { opacity: 0; } }
  .sources {
    margin-top: 0.45rem;
    font-size: 0.75rem;
    color: var(--text-dim);
    border-top: 1px dashed var(--border);
    padding-top: 0.35rem;
  }
  .typing { display: inline-flex; gap: 4px; padding: 0.15rem 0; }
  .typing i {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--text-dim);
    animation: bounce 1.2s infinite ease-in-out;
  }
  .typing i:nth-child(2) { animation-delay: 0.15s; }
  .typing i:nth-child(3) { animation-delay: 0.3s; }
  @keyframes bounce { 0%, 80%, 100% { opacity: 0.3; } 40% { opacity: 1; } }
</style>
