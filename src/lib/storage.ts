import { useEffect, useState } from 'react'
import type { AppState } from '../types'
import { defaultQuests } from '../data/defaultQuests'

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
    return parsed
  } catch {
    return initialState()
  }
}

/** Hook d'état persistant : toute modif est sauvegardée en local automatiquement. */
export function usePersistentState() {
  const [state, setState] = useState<AppState>(load)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      // quota plein ou mode privé : on ignore silencieusement
    }
  }, [state])

  return [state, setState] as const
}

export function exportState(state: AppState): string {
  return JSON.stringify(state, null, 2)
}
