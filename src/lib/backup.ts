import type { AppState } from '../types'
import { todayKey } from './date'

/** Télécharge l'état complet sous forme de fichier JSON. */
export function downloadBackup(state: AppState) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `questlog-sauvegarde-${todayKey()}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** Valide et parse un fichier de sauvegarde. Renvoie null si invalide. */
export function parseBackup(text: string): AppState | null {
  try {
    const data = JSON.parse(text)
    if (!data || typeof data !== 'object') return null
    if (!Array.isArray(data.quests) || typeof data.logs !== 'object') return null
    return data as AppState
  } catch {
    return null
  }
}
