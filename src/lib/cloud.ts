import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { AppState } from '../types'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** La synchro cloud n'est active que si Supabase est configuré (variables d'env présentes). */
export const cloudEnabled = Boolean(url && anon)

const supabase: SupabaseClient | null = cloudEnabled ? createClient(url!, anon!) : null

/** Utilisateur connecté, abstrait du backend. */
export type CloudUser = { id: string; email: string | null }

export function onAuthChange(cb: (u: CloudUser | null) => void) {
  if (!supabase) return () => {}
  // onAuthStateChange émet aussi la session initiale (event INITIAL_SESSION)
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    cb(session?.user ? { id: session.user.id, email: session.user.email ?? null } : null)
  })
  return () => data.subscription.unsubscribe()
}

/** Envoie un lien de connexion par email (« magic link »). */
export async function sendMagicLink(email: string) {
  if (!supabase) throw new Error('Cloud non configuré')
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  })
  if (error) throw error
}

export async function signOutCloud() {
  if (supabase) await supabase.auth.signOut()
}

export async function pullState(uid: string): Promise<AppState | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('states')
    .select('state')
    .eq('user_id', uid)
    .maybeSingle()
  if (error) throw error
  return (data?.state as AppState) ?? null
}

export async function pushState(uid: string, state: AppState) {
  if (!supabase) return
  const { error } = await supabase
    .from('states')
    .upsert({ user_id: uid, state, updated_at: new Date().toISOString() })
  if (error) throw error
}

type PushSubJSON = { endpoint?: string; keys?: { p256dh?: string; auth?: string } }

/** Enregistre (ou met à jour) l'abonnement push de l'utilisateur. */
export async function saveSubscription(uid: string, sub: PushSubJSON) {
  if (!supabase || !sub.endpoint) return
  const { error } = await supabase.from('push_subscriptions').upsert(
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
  if (!supabase) return
  await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
}
