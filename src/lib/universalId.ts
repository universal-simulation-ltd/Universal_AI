import { writable, get } from 'svelte/store'
import { createClient } from '@supabase/supabase-js'
import { settings, type Settings } from './settings'

// Universal ID — the shared UNI·SIM suite account (app.unisim.co.uk).
//
// Universal AI is local-first and is NOT served under .unisim.co.uk (it runs as
// a PWA / Capacitor iOS app), so the suite's cross-subdomain cookie SSO can't
// reach it. Instead we follow Universal Polling's pattern: the app owns its own
// @supabase/supabase-js client against the SAME suite Supabase project, signs
// the user in with an email one-time code (which is their Universal ID — same
// auth.users row the hub uses), and keeps the session on an app-specific
// storageKey so nothing else can clobber it.
//
// Privacy contract: this module makes NO network calls until the user opts in
// by signing in on the Customise tab. The only thing ever uploaded is the
// Settings object (theme, names, toggles) — never chats, documents, or models.

// The anon key is a PUBLISHABLE key — it ships in every suite web bundle by
// design; Row-Level Security is the real boundary (app_settings_backups rows
// are readable/writable only by their owner). An env var still overrides for
// local dev / self-hosting.
const FALLBACK_URL = 'https://rygfxgalojojppxmhddo.supabase.co'
const FALLBACK_ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5Z2Z4Z2Fsb2pvanBweG1oZGRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NTY4MjUsImV4cCI6MjA5NDMzMjgyNX0.hLy_vt9vY_rdPKF3nL32yAuMCD604E3CH5VM7D7CaNE'

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || FALLBACK_URL
const anon = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || FALLBACK_ANON

/** Product code for this app in the shared `app_settings_backups` table. */
const APP_ID = 'ai'

const supabase = createClient(url, anon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'universal-ai:universal-id-auth',
  },
})

export interface UniversalIdUser {
  id: string
  email: string | null
}

/** The signed-in Universal ID, or null. Restored from storage on startup. */
export const universalIdUser = writable<UniversalIdUser | null>(null)

/** ISO timestamp of the user's last settings backup on the server (null = none). */
export const lastBackupAt = writable<string | null>(null)

// Restore any persisted session (local storage read; network only happens on
// token refresh, which presupposes the user already opted in by signing in).
void supabase.auth.getSession().then(({ data }) => {
  const u = data.session?.user
  universalIdUser.set(u ? { id: u.id, email: u.email ?? null } : null)
  if (u) void refreshBackupInfo()
})
supabase.auth.onAuthStateChange((_event, session) => {
  const u = session?.user
  universalIdUser.set(u ? { id: u.id, email: u.email ?? null } : null)
  if (!u) lastBackupAt.set(null)
})

/**
 * Email the user a 6-digit one-time code. LOG IN ONLY — this never creates an
 * account: Universal IDs are created on the hub (app.unisim.co.uk), not in
 * the app, so a typo'd email can't mint a stray account here.
 */
export async function sendCode(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: { shouldCreateUser: false },
  })
  if (error) {
    // With shouldCreateUser:false, an unknown email comes back as a
    // "Signups not allowed for otp" API error — translate it.
    if (/signups? not allowed/i.test(error.message)) {
      throw new Error(
        'No Universal ID exists for that email. Create one free at app.unisim.co.uk, then log in here.',
      )
    }
    throw error
  }
}

/** Verify the emailed code and start the session. */
export async function verifyCode(email: string, token: string): Promise<void> {
  const { data, error } = await supabase.auth.verifyOtp({
    email: email.trim(),
    token: token.trim(),
    type: 'email',
  })
  if (error) throw error
  if (!data.user) throw new Error('Verification failed — please try again.')
  await refreshBackupInfo()
}

export async function signOutUniversalId(): Promise<void> {
  await supabase.auth.signOut()
}

/** Re-read when (if ever) this user last backed up. RLS scopes to the caller. */
export async function refreshBackupInfo(): Promise<void> {
  const { data, error } = await supabase
    .from('app_settings_backups')
    .select('updated_at')
    .eq('app', APP_ID)
    .maybeSingle()
  if (error) throw error
  lastBackupAt.set(data?.updated_at ?? null)
}

/** Upload the current Settings object as this user's backup (one row per user). */
export async function backUpSettings(): Promise<void> {
  const user = get(universalIdUser)
  if (!user) throw new Error('Sign in with your Universal ID first.')
  const { data, error } = await supabase
    .from('app_settings_backups')
    .upsert(
      { user_id: user.id, app: APP_ID, data: get(settings) },
      { onConflict: 'user_id,app' },
    )
    .select('updated_at')
    .single()
  if (error) throw error
  lastBackupAt.set(data.updated_at)
}

/**
 * Fetch the backup and apply it over the current settings. Unknown keys from a
 * newer app version are dropped by the merge, same as the localStorage loader.
 */
export async function restoreSettings(): Promise<void> {
  const { data, error } = await supabase
    .from('app_settings_backups')
    .select('data, updated_at')
    .eq('app', APP_ID)
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error('No backup found for this Universal ID yet.')
  const backup = data.data as Partial<Settings>
  settings.update((s) => ({ ...s, ...backup }))
  lastBackupAt.set(data.updated_at)
}
