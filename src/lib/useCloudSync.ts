import { useCallback, useEffect, useRef, useState } from 'react'
import type { AppState } from '../types'
import {
  cloudEnabled,
  onAuthChange,
  pullState,
  pushState,
  sendMagicLink,
  signOutCloud,
  type CloudUser,
} from './cloud'
import { mergeStates } from './merge'

export type CloudStatus = 'disabled' | 'signedOut' | 'syncing' | 'synced' | 'error'

export type CloudSync = {
  cloudEnabled: boolean
  user: CloudUser | null
  status: CloudStatus
  lastSync: number | null
  error: string | null
  sendLink: (email: string) => Promise<boolean>
  signOut: () => Promise<void>
}

/** Signature de contenu : sert à éviter les push redondants (et les boucles d'écho). */
function sig(s: AppState): string {
  return JSON.stringify([s.logs, s.quests.length, s.seenAchievements ?? []])
}

/**
 * Synchro cloud « ouverte → fusion → push automatique ».
 * - À la connexion : on récupère le distant, on FUSIONNE avec le local (aucune perte), on applique et on renvoie.
 * - À chaque modification : push automatique (débattu de 1,5 s).
 * @param applyRemote applique un état distant sans le ré-estampiller (setter brut)
 */
export function useCloudSync(state: AppState, applyRemote: (s: AppState) => void): CloudSync {
  const [user, setUser] = useState<CloudUser | null>(null)
  const [status, setStatus] = useState<CloudStatus>(cloudEnabled ? 'signedOut' : 'disabled')
  const [lastSync, setLastSync] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const stateRef = useRef(state)
  stateRef.current = state
  const syncedUserId = useRef<string | null>(null)
  const lastPushedSig = useRef<string>('')
  const pushTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  // écoute l'état de connexion
  useEffect(() => {
    if (!cloudEnabled) return
    return onAuthChange((u) => {
      setUser(u)
      if (!u) {
        setStatus('signedOut')
        syncedUserId.current = null
      }
    })
  }, [])

  // synchro initiale à la connexion
  useEffect(() => {
    if (!cloudEnabled || !user) return
    if (syncedUserId.current === user.id) return
    syncedUserId.current = user.id
    setStatus('syncing')
    setError(null)
    ;(async () => {
      try {
        const remote = await pullState(user.id)
        const local = stateRef.current
        const merged = remote ? mergeStates(local, remote) : local
        if (remote) applyRemote(merged)
        await pushState(user.id, merged)
        lastPushedSig.current = sig(merged)
        setStatus('synced')
        setLastSync(Date.now())
      } catch (e) {
        setStatus('error')
        setError(humanError(e))
      }
    })()
  }, [user, applyRemote])

  // push automatique débattu à chaque modification locale
  useEffect(() => {
    if (!cloudEnabled || !user || syncedUserId.current !== user.id) return
    if (sig(state) === lastPushedSig.current) return
    clearTimeout(pushTimer.current)
    setStatus('syncing')
    pushTimer.current = setTimeout(async () => {
      try {
        const snapshot = stateRef.current
        await pushState(user.id, snapshot)
        lastPushedSig.current = sig(snapshot)
        setStatus('synced')
        setLastSync(Date.now())
      } catch (e) {
        setStatus('error')
        setError(humanError(e))
      }
    }, 1500)
    return () => clearTimeout(pushTimer.current)
  }, [state, user])

  /** Envoie le lien de connexion. Renvoie true si l'email est parti. */
  const sendLink = useCallback(async (email: string) => {
    try {
      setError(null)
      await sendMagicLink(email.trim())
      return true
    } catch (e) {
      setError(humanError(e))
      return false
    }
  }, [])

  return { cloudEnabled, user, status, lastSync, error, sendLink, signOut: signOutCloud }
}

function humanError(e: unknown): string {
  const msg = (e as Error)?.message ?? String(e)
  if (msg.toLowerCase().includes('network')) return 'Problème de réseau.'
  if (msg.includes('rate limit') || msg.includes('60 seconds')) return 'Trop de tentatives, réessaie dans une minute.'
  return msg
}
