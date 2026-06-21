import type { AppState, DayLog, QuestDef } from '../types'
import { addDays, todayKey } from './date'

/** Score d'un jour = somme des XP des quêtes accomplies. */
export function dayScore(log: DayLog | undefined, quests: QuestDef[]): number {
  if (!log) return 0
  const byId = new Map(quests.map((q) => [q.id, q.xp]))
  return log.completed.reduce((sum, id) => sum + (byId.get(id) ?? 0), 0)
}

/** Score maximal atteignable un jour (toutes les quêtes cochées). */
export function maxDayScore(quests: QuestDef[]): number {
  return quests.reduce((s, q) => s + q.xp, 0)
}

/** XP total cumulé sur tout l'historique. */
export function totalXp(state: AppState): number {
  return Object.values(state.logs).reduce(
    (sum, log) => sum + dayScore(log, state.quests),
    0,
  )
}

/**
 * Niveau basé sur l'XP total. Courbe douce : chaque niveau coûte un peu plus.
 * Niveau n nécessite 50 * n * (n+1) XP cumulés.
 */
export function levelFromXp(xp: number): {
  level: number
  current: number // xp dans le niveau courant
  needed: number // xp requis pour le prochain niveau
  progress: number // 0..1
} {
  let level = 1
  while (xp >= xpForLevel(level + 1)) level++
  const base = xpForLevel(level)
  const next = xpForLevel(level + 1)
  const current = xp - base
  const needed = next - base
  return { level, current, needed, progress: needed > 0 ? current / needed : 1 }
}

function xpForLevel(level: number): number {
  // niveau 1 = 0 xp ; niveau 2 = 100 ; niveau 3 = 300 ; etc.
  const n = level - 1
  return 50 * n * (n + 1)
}

/** Série de jours consécutifs (en finissant aujourd'hui) avec au moins une quête. */
export function currentStreak(state: AppState): number {
  let streak = 0
  let key = todayKey()
  // si rien fait aujourd'hui, la série peut quand même tenir jusqu'à hier
  if (!hasActivity(state, key)) key = addDays(key, -1)
  while (hasActivity(state, key)) {
    streak++
    key = addDays(key, -1)
  }
  return streak
}

function hasActivity(state: AppState, key: string): boolean {
  const log = state.logs[key]
  return !!log && log.completed.length > 0
}

/** Petit message d'encouragement selon le ratio du jour. */
export function dayVibe(ratio: number): { label: string; emoji: string } {
  if (ratio >= 1) return { label: 'Journée parfaite !', emoji: '🏆' }
  if (ratio >= 0.75) return { label: 'En feu !', emoji: '🔥' }
  if (ratio >= 0.5) return { label: 'Belle lancée', emoji: '⚡' }
  if (ratio >= 0.25) return { label: 'C\'est parti', emoji: '🌱' }
  if (ratio > 0) return { label: 'Premier pas', emoji: '✨' }
  return { label: 'À toi de jouer', emoji: '🎯' }
}
