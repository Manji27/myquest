import { useCallback, useEffect, useState } from 'react'
import type { AppState } from '../types'
import { DIFFICULTY, defaultQuests, difficultyFromXp } from '../data/defaultQuests'

type Updater = AppState | ((prev: AppState) => AppState)

const KEY = 'questlog.state.v1'

function initialState(): AppState {
  return { quests: defaultQuests, logs: {}, version: 1 }
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return initialState()
    const parsed = JSON.parse(raw) as AppState
    if (!parsed.quests || !parsed.logs) return initialState()
    // migration : garantit qu'une quête a toujours une difficulté + un XP cohérent
    parsed.quests = parsed.quests.map((q) => {
      const difficulty = q.difficulty ?? difficultyFromXp(q.xp ?? 20)
      return { ...q, difficulty, xp: DIFFICULTY[difficulty].xp }
    })
    return parsed
  } catch {
    return initialState()
  }
}

/**
 * Hook d'état persistant. Renvoie :
 * - `state`
 * - `setState` : modification utilisateur (estampille `updatedAt` → déclenche la synchro)
 * - `applyRemote` : applique un état distant tel quel (sans ré-estampiller, pour la synchro cloud)
 */
export function usePersistentState() {
  const [state, applyRemote] = useState<AppState>(load)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      // quota plein ou mode privé : on ignore silencieusement
    }
  }, [state])

  const setState = useCallback((updater: Updater) => {
    applyRemote((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      return { ...next, updatedAt: Date.now() }
    })
  }, [])

  return [state, setState, applyRemote] as const
}

export function exportState(state: AppState): string {
  return JSON.stringify(state, null, 2)
}
