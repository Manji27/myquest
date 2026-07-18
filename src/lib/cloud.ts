import { createClient, SupabaseAuthAdapter } from '@neondatabase/neon-js'
import type { AppState } from '../types'

// Neon Auth (magic link / code email) + Neon Data API (PostgREST).
// L'adaptateur Supabase expose une API compatible : signInWithOtp / verifyOtp /
// onAuthStateChange / from().select().upsert()… → la logique reste inchangée.
const authUrl = import.meta.env.VITE_NEON_AUTH_URL as string | undefined
const dataApiUrl = import.meta.env.VITE_NEON_DATA_API_URL as string | undefined

/** La synchro cloud n'est active que si Neon est configuré (variables d'env présentes). */
export const cloudEnabled = Boolean(authUrl && dataApiUrl)

const client = cloudEnabled
  ? createClient({
      auth: { adapter: SupabaseAuthAdapter(), url: authUrl! },
      dataApi: { url: dataApiUrl! },
    })
  : null

/** Utilisateur connecté, abstrait du backend. */
export type CloudUser = { id: string; email: string | null }
export type CloudSnapshot = { state: AppState; revision: number; updatedAt: string }

export class CloudConflictError extends Error {
  constructor() {
    super('La sauvegarde distante a changé pendant la synchronisation.')
    this.name = 'CloudConflictError'
  }
}

export function onAuthChange(cb: (u: CloudUser | null) => void) {
  if (!client) return () => {}
  // onAuthStateChange émet aussi la session initiale (event INITIAL_SESSION)
  const { data } = client.auth.onAuthStateChange((_event, session) => {
    cb(session?.user ? { id: session.user.id, email: session.user.email ?? null } : null)
  })
  return () => data.subscription.unsubscribe()
}

/** Lit explicitement la session courante, y compris après un rechargement. */
export async function getCurrentCloudUser(): Promise<CloudUser | null> {
  if (!client) return null
  const { data, error } = await client.auth.getSession({ forceFetch: true })
  if (error) throw error
  const session = data.session
  return session?.user
    ? { id: session.user.id, email: session.user.email ?? null }
    : null
}

/** Jeton court terme transmis uniquement au Worker pour authentifier les API privées. */
export async function getCloudAccessToken(): Promise<string> {
  if (!client) throw new Error('Cloud non configuré')
  const { data, error } = await client.auth.getSession({ forceFetch: true })
  if (error) throw error
  const token = data.session?.access_token
  if (!token) throw new Error('Session expirée. Reconnecte-toi pour continuer.')
  return token
}

/**
 * Envoie un code de connexion par email (« magic link » Neon = code à saisir).
 * L'utilisateur reçoit un code qu'il valide ensuite via `verifyCode`.
 */
export async function sendMagicLink(email: string) {
  if (!client) throw new Error('Cloud non configuré')
  const { error } = await client.auth.signInWithOtp({ email })
  if (error) throw error
}

/** Vérifie le code reçu par email et ouvre la session. */
export async function verifyCode(email: string, code: string): Promise<CloudUser> {
  if (!client) throw new Error('Cloud non configuré')
  const { data, error } = await client.auth.verifyOtp({ email, token: code.trim(), type: 'email' })
  if (error) throw error
  const sessionUser = data.session?.user
  if (sessionUser) {
    return { id: sessionUser.id, email: sessionUser.email ?? null }
  }

  const currentUser = await getCurrentCloudUser()
  if (!currentUser) {
    throw new Error('Le code a été accepté, mais la session Neon n’a pas pu être ouverte.')
  }
  return currentUser
}

export async function signOutCloud() {
  if (client) await client.auth.signOut()
}

export async function pullState(uid: string): Promise<CloudSnapshot | null> {
  if (!client) return null
  const { data, error } = await client
    .from('states')
    .select('state, revision, updated_at')
    .eq('user_id', uid)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return {
    state: data.state as AppState,
    revision: Number(data.revision ?? 0),
    updatedAt: String(data.updated_at),
  }
}

/**
 * Écriture atomique par révision (compare-and-swap).
 * Si un autre appareil a écrit entre le pull et le push, l'appelant refait une
 * fusion au lieu d'écraser silencieusement sa version.
 */
export async function pushState(
  uid: string,
  state: AppState,
  expectedRevision: number | null,
  previousState?: AppState,
): Promise<number> {
  if (!client) return expectedRevision ?? 0
  const updatedAt = new Date().toISOString()

  if (expectedRevision === null) {
    const { data, error } = await client
      .from('states')
      .insert({ user_id: uid, state, revision: 1, updated_at: updatedAt })
      .select('revision')
      .maybeSingle()
    if (error) {
      // Une création concurrente se résout comme n'importe quel conflit.
      if ((error as { code?: string }).code === '23505') throw new CloudConflictError()
      throw error
    }
    if (!data) throw new CloudConflictError()
    return Number(data.revision)
  }

  if (previousState) await archiveState(uid, previousState, expectedRevision)

  const nextRevision = expectedRevision + 1
  const { data, error } = await client
    .from('states')
    .update({ state, revision: nextRevision, updated_at: updatedAt })
    .eq('user_id', uid)
    .eq('revision', expectedRevision)
    .select('revision')
    .maybeSingle()
  if (error) throw error
  if (!data) throw new CloudConflictError()
  return Number(data.revision)
}

/**
 * Conserve au plus un état de récupération toutes les 12 h et élague les
 * versions au-delà des 120 plus récentes. La RLS empêche tout accès croisé.
 */
async function archiveState(uid: string, state: AppState, revision: number) {
  if (!client) return
  const { data: latest, error: readError } = await client
    .from('state_history')
    .select('captured_at')
    .eq('user_id', uid)
    .order('captured_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (readError) throw readError

  const twelveHours = 12 * 60 * 60 * 1000
  if (latest && Date.now() - new Date(String(latest.captured_at)).getTime() < twelveHours) return

  const { error: insertError } = await client
    .from('state_history')
    .insert({ user_id: uid, state, revision, captured_at: new Date().toISOString() })
  if (insertError) throw insertError

  const { data: stale, error: staleError } = await client
    .from('state_history')
    .select('id')
    .eq('user_id', uid)
    .order('captured_at', { ascending: false })
    .range(120, 500)
  if (staleError) throw staleError
  const staleIds = (stale ?? []).map((row) => Number(row.id))
  if (staleIds.length > 0) {
    const { error: deleteError } = await client
      .from('state_history')
      .delete()
      .in('id', staleIds)
    if (deleteError) throw deleteError
  }
}

type PushSubJSON = { endpoint?: string; keys?: { p256dh?: string; auth?: string } }

/** Enregistre (ou met à jour) l'abonnement push de l'utilisateur. */
export async function saveSubscription(uid: string, sub: PushSubJSON) {
  if (!client || !sub.endpoint) return
  const { error } = await client.from('push_subscriptions').upsert(
    {
      user_id: uid,
      endpoint: sub.endpoint,
      p256dh: sub.keys?.p256dh,
      auth: sub.keys?.auth,
    },
    { onConflict: 'endpoint' },
  )
  if (error) throw error
}

export async function removeSubscription(endpoint: string) {
  if (!client) return
  await client.from('push_subscriptions').delete().eq('endpoint', endpoint)
}
