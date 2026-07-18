import { useCallback, useEffect, useRef, useState } from 'react'
import type { AppState } from '../types'
import {
  CloudConflictError,
  cloudEnabled,
  getCurrentCloudUser,
  onAuthChange,
  pullState,
  pushState,
  sendMagicLink,
  signOutCloud,
  verifyCode,
  type CloudUser,
} from './cloud'
import { mergeStates } from './merge'

export type CloudStatus = 'disabled' | 'signedOut' | 'syncing' | 'synced' | 'offline' | 'error'

export type CloudSync = {
  cloudEnabled: boolean
  user: CloudUser | null
  status: CloudStatus
  lastSync: number | null
  error: string | null
  sync: () => Promise<void>
  sendLink: (email: string) => Promise<boolean>
  verify: (email: string, code: string) => Promise<boolean>
  signOut: () => Promise<void>
}

/** Signature complète : les horloges font partie des données à synchroniser. */
function sig(state: AppState): string {
  return JSON.stringify(state)
}

/**
 * Synchronisation multi-appareils :
 * - pull + fusion avant chaque push ;
 * - écriture atomique par révision ;
 * - nouvelle tentative si un autre appareil gagne la course ;
 * - reprise au retour en ligne ou au premier plan.
 */
export function useCloudSync(state: AppState, applyRemote: (s: AppState) => void): CloudSync {
  const [user, setUser] = useState<CloudUser | null>(null)
  const [status, setStatus] = useState<CloudStatus>(cloudEnabled ? 'signedOut' : 'disabled')
  const [lastSync, setLastSync] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const stateRef = useRef(state)
  stateRef.current = state
  const syncedUserId = useRef<string | null>(null)
  const lastSyncedSig = useRef('')
  const pushTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const running = useRef<Promise<void> | null>(null)
  const pending = useRef(false)

  const setStableUser = useCallback((nextUser: CloudUser | null) => {
    setUser((current) => {
      if (current?.id === nextUser?.id && current?.email === nextUser?.email) return current
      return nextUser
    })
  }, [])

  const reconcile = useCallback(async () => {
    if (!cloudEnabled || !user) return
    if (!navigator.onLine) {
      setStatus('offline')
      return
    }
    if (running.current) {
      pending.current = true
      return running.current
    }

    const operation = (async () => {
      setStatus('syncing')
      setError(null)
      for (let attempt = 0; attempt < 4; attempt += 1) {
        try {
          const remote = await pullState(user.id)
          const local = stateRef.current
          const merged = remote ? mergeStates(local, remote.state) : local
          const mergedSig = sig(merged)
          const remoteSig = remote ? sig(remote.state) : ''

          if (sig(local) !== mergedSig) {
            stateRef.current = merged
            applyRemote(merged)
          }

          if (remote && mergedSig === remoteSig) {
            lastSyncedSig.current = mergedSig
            setStatus('synced')
            setLastSync(Date.now())
            return
          }

          await pushState(user.id, merged, remote?.revision ?? null, remote?.state)
          lastSyncedSig.current = mergedSig
          setStatus('synced')
          setLastSync(Date.now())
          return
        } catch (cause) {
          if (cause instanceof CloudConflictError && attempt < 3) continue
          throw cause
        }
      }
    })()
      .catch((cause) => {
        if (!navigator.onLine) setStatus('offline')
        else setStatus('error')
        setError(humanError(cause))
      })
      .finally(() => {
        running.current = null
        if (pending.current) {
          pending.current = false
          queueMicrotask(() => void reconcile())
        }
      })

    running.current = operation
    return operation
  }, [applyRemote, user])

  useEffect(() => {
    if (!cloudEnabled) return
    let active = true
    const unsubscribe = onAuthChange((nextUser) => {
      if (!active) return
      setStableUser(nextUser)
      if (!nextUser) {
        setStatus('signedOut')
        syncedUserId.current = null
        lastSyncedSig.current = ''
      }
    })
    void getCurrentCloudUser()
      .then((nextUser) => {
        if (!active) return
        setStableUser(nextUser)
        setStatus(nextUser ? 'syncing' : 'signedOut')
      })
      .catch((cause) => {
        if (!active) return
        setStatus('error')
        setError(humanError(cause))
      })
    return () => {
      active = false
      unsubscribe()
    }
  }, [setStableUser])

  // Première synchronisation de la session.
  useEffect(() => {
    if (!user || syncedUserId.current === user.id) return
    syncedUserId.current = user.id
    void reconcile()
  }, [user, reconcile])

  // Toute modification locale est réconciliée après un court délai.
  useEffect(() => {
    if (!user || syncedUserId.current !== user.id) return
    if (sig(state) === lastSyncedSig.current) return
    clearTimeout(pushTimer.current)
    setStatus(navigator.onLine ? 'syncing' : 'offline')
    pushTimer.current = setTimeout(() => void reconcile(), 1500)
    return () => clearTimeout(pushTimer.current)
  }, [state, user, reconcile])

  // Un appareil reprend les nouveautés dès que l'app revient au premier plan.
  useEffect(() => {
    if (!user) return
    const resume = () => {
      if (document.visibilityState === 'visible') void reconcile()
    }
    const online = () => void reconcile()
    window.addEventListener('focus', resume)
    window.addEventListener('online', online)
    document.addEventListener('visibilitychange', resume)
    return () => {
      window.removeEventListener('focus', resume)
      window.removeEventListener('online', online)
      document.removeEventListener('visibilitychange', resume)
    }
  }, [user, reconcile])

  const sendLink = useCallback(async (email: string) => {
    try {
      setError(null)
      await sendMagicLink(email.trim())
      return true
    } catch (cause) {
      setError(humanError(cause))
      return false
    }
  }, [])

  const verify = useCallback(async (email: string, code: string) => {
    try {
      setError(null)
      const nextUser = await verifyCode(email.trim(), code)
      setStableUser(nextUser)
      setStatus('syncing')
      return true
    } catch (cause) {
      setError(humanError(cause))
      return false
    }
  }, [setStableUser])

  const signOut = useCallback(async () => {
    try {
      await signOutCloud()
      setUser(null)
      setStatus('signedOut')
      setLastSync(null)
      setError(null)
      syncedUserId.current = null
      lastSyncedSig.current = ''
    } catch (cause) {
      setStatus('error')
      setError(humanError(cause))
    }
  }, [])

  return {
    cloudEnabled,
    user,
    status,
    lastSync,
    error,
    sync: reconcile,
    sendLink,
    verify,
    signOut,
  }
}

function humanError(error: unknown): string {
  const message = (error as Error)?.message ?? String(error)
  if (message.toLowerCase().includes('network')) return 'Problème de réseau.'
  if (message.includes('rate limit') || message.includes('60 seconds')) {
    return 'Trop de tentatives, réessaie dans une minute.'
  }
  return message
}
