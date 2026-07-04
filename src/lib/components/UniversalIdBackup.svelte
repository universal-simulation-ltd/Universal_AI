<script lang="ts">
  import { online } from '../stores'
  import {
    universalIdUser,
    lastBackupAt,
    sendCode,
    verifyCode,
    signOutUniversalId,
    backUpSettings,
    restoreSettings,
  } from '../universalId'

  // Sign-in flow state (email → emailed 6-digit code → session).
  let step: 'email' | 'code' = $state('email')
  let email = $state('')
  let code = $state('')
  let busy = $state(false)
  let error = $state('')
  let notice = $state('')

  async function run(action: () => Promise<void>, done = '') {
    busy = true
    error = ''
    notice = ''
    try {
      await action()
      notice = done
    } catch (e) {
      // supabase-js sometimes throws errors whose message is an unhelpful raw
      // body ("{}") — fall back to a friendly line rather than showing that.
      const msg = e instanceof Error ? e.message : String(e)
      error =
        msg && msg !== '{}' && msg !== '[object Object]'
          ? msg
          : 'Something went wrong — please check your connection and try again.'
    } finally {
      busy = false
    }
  }

  const onSendCode = () =>
    run(async () => {
      await sendCode(email)
      step = 'code'
    }, 'Code sent — check your email.')

  const onVerify = () =>
    run(async () => {
      await verifyCode(email, code)
      step = 'email'
      code = ''
    })

  const onBackUp = () => run(() => backUpSettings(), 'Settings backed up.')
  const onRestore = () => run(() => restoreSettings(), 'Settings restored on this device.')
  const onSignOut = () =>
    run(async () => {
      await signOutUniversalId()
      step = 'email'
      email = ''
      code = ''
    })

  let lastBackupLabel = $derived(
    $lastBackupAt
      ? new Date($lastBackupAt).toLocaleString(undefined, {
          dateStyle: 'medium',
          timeStyle: 'short',
        })
      : null,
  )
</script>

<section>
  <h3>Universal ID <span class="tag">opt-in</span></h3>
  <p class="hint">
    Back up the settings on this page to a free
    <a href="https://www.unisim.co.uk" target="_blank" rel="noopener">UNI·SIM</a>
    Universal ID and restore them on any device. Only these settings are sent —
    never your chats, documents, or models.
  </p>

  {#if $universalIdUser}
    <div class="account">
      <span class="who" title={$universalIdUser.email ?? undefined}>
        Signed in as <strong>{$universalIdUser.email ?? 'your Universal ID'}</strong>
      </span>
      <button class="linkish" onclick={onSignOut} disabled={busy}>Sign out</button>
    </div>
    <p class="hint">
      {#if lastBackupLabel}
        Last backup: {lastBackupLabel}.
      {:else}
        No backup yet for this Universal ID.
      {/if}
      Manage your account at
      <a href="https://app.unisim.co.uk" target="_blank" rel="noopener">app.unisim.co.uk</a>.
    </p>
    <div class="row">
      <button class="primary" onclick={onBackUp} disabled={busy || !$online}>
        Back up settings
      </button>
      <button onclick={onRestore} disabled={busy || !$online || !$lastBackupAt}>
        Restore backup
      </button>
    </div>
    {#if !$online}
      <p class="hint warn-line">You're offline — connect to back up or restore.</p>
    {/if}
  {:else if step === 'email'}
    <label class="sublabel" for="uid-email">Email <span class="muted">(your Universal ID)</span></label>
    <div class="row">
      <input
        id="uid-email"
        type="email"
        placeholder="you@example.com"
        autocomplete="email"
        bind:value={email}
        onkeydown={(e) => e.key === 'Enter' && email.includes('@') && !busy && $online && onSendCode()}
      />
      <button
        class="primary"
        onclick={onSendCode}
        disabled={busy || !$online || !email.includes('@')}
      >
        Send code
      </button>
    </div>
    {#if !$online}
      <p class="hint warn-line">You're offline — connect to sign in.</p>
    {/if}
  {:else}
    <label class="sublabel" for="uid-code">Enter the 6-digit code sent to {email}</label>
    <div class="row">
      <input
        id="uid-code"
        type="text"
        inputmode="numeric"
        autocomplete="one-time-code"
        placeholder="123456"
        maxlength="6"
        bind:value={code}
        onkeydown={(e) => e.key === 'Enter' && code.trim().length >= 6 && !busy && onVerify()}
      />
      <button class="primary" onclick={onVerify} disabled={busy || code.trim().length < 6}>
        Verify
      </button>
    </div>
    <button class="linkish start-over" onclick={() => { step = 'email'; code = ''; error = ''; notice = '' }} disabled={busy}>
      Use a different email
    </button>
  {/if}

  {#if error}<p class="msg error" role="alert">{error}</p>{/if}
  {#if notice}<p class="msg ok" role="status">{notice}</p>{/if}
</section>

<style>
  section { display: flex; flex-direction: column; gap: 0.5rem; }
  h3 {
    margin: 0;
    font-size: 0.95rem;
    color: var(--text);
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .hint { margin: 0; font-size: 0.82rem; color: var(--text-dim); line-height: 1.45; }
  .hint a { color: var(--accent); }
  .tag {
    font-size: 0.68rem;
    font-weight: 700;
    color: var(--accent);
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 0.05rem 0.45rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .sublabel { font-size: 0.8rem; font-weight: 600; color: var(--text); margin-top: 0.2rem; }
  .sublabel .muted { font-weight: 400; color: var(--text-dim); }
  .row { display: flex; gap: 0.4rem; align-items: stretch; }
  .row input { flex: 1; min-width: 0; }
  .row button { flex: 0 0 auto; }
  input {
    font: inherit;
    color: var(--text);
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 0.6rem 0.7rem;
  }
  .account { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; }
  .who { font-size: 0.86rem; color: var(--text); min-width: 0; overflow-wrap: anywhere; }
  .linkish {
    background: transparent;
    border: none;
    color: var(--accent);
    font-size: 0.82rem;
    padding: 0;
    cursor: pointer;
    text-decoration: underline;
  }
  .start-over { align-self: flex-start; }
  .warn-line { color: var(--danger); }
  .msg { margin: 0; font-size: 0.82rem; }
  .msg.error { color: var(--danger); }
  .msg.ok { color: var(--ok); }
</style>
