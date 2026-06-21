import type { AppState, DayLog } from '../types'

/** Fusionne deux ensembles de journaux sans jamais perdre de donnée (union). */
function mergeLogs(
  a: Record<string, DayLog>,
  b: Record<string, DayLog>,
): Record<string, DayLog> {
  const out: Record<string, DayLog> = { ...a }
  for (const [date, lb] of Object.entries(b)) {
    const la = out[date]
    if (!la) {
      out[date] = lb
      continue
    }
    out[date] = {
      date,
      // union des quêtes cochées (on ne « décoche » jamais via la synchro)
      completed: Array.from(new Set([...la.completed, ...lb.completed])),
      // on garde le texte le plus long (le plus complet)
      positiveEvent:
        lb.positiveEvent.trim().length > la.positiveEvent.trim().length
          ? lb.positiveEvent
          : la.positiveEvent,
      mood: la.mood ?? lb.mood,
    }
  }
  return out
}

/**
 * Fusionne l'état local et l'état distant. Les journaux sont unionnés (zéro perte) ;
 * la liste des quêtes et les métadonnées proviennent de l'état le plus récent.
 */
export function mergeStates(a: AppState, b: AppState): AppState {
  const newer = (b.updatedAt ?? 0) >= (a.updatedAt ?? 0) ? b : a
  return {
    ...newer,
    logs: mergeLogs(a.logs, b.logs),
    seenAchievements: Array.from(
      new Set([...(a.seenAchievements ?? []), ...(b.seenAchievements ?? [])]),
    ),
    updatedAt: Math.max(a.updatedAt ?? 0, b.updatedAt ?? 0),
  }
}
