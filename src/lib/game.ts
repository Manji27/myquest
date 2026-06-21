import type { AppState, DayLog, QuestDef } from '../types'
import { addDays, keyToDate, todayKey } from './date'

/** Une quête est-elle prévue ce jour de la semaine ? (0=dim..6=sam ; days absent = tous les jours) */
export function isQuestActiveOnWeekday(q: QuestDef, weekday: number): boolean {
  return !q.days || q.days.length === 0 || q.days.includes(weekday)
}

/** Quêtes prévues pour une date donnée. */
export function questsForDate(quests: QuestDef[], dateKey: string): QuestDef[] {
  const weekday = keyToDate(dateKey).getDay()
  return quests.filter((q) => isQuestActiveOnWeekday(q, weekday))
}

const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] // lundi → dimanche

/** Libellé court de récurrence : « Tous les jours » ou « Lun·Mer·Ven ». */
export function formatRecurrence(days?: number[]): string {
  if (!days || days.length === 0 || days.length >= 7) return 'Tous les jours'
  return WEEK_ORDER.filter((d) => days.includes(d)).map((d) => DAY_LABELS[d]).join('·')
}

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

/** Score maximal pour une date précise (seulement les quêtes prévues ce jour-là). */
export function maxScoreForDate(quests: QuestDef[], dateKey: string): number {
  return questsForDate(quests, dateKey).reduce((s, q) => s + q.xp, 0)
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

/**
 * Série avec « joker » : tolère UN jour manqué dans la série en cours
 * (à condition qu'un jour actif le précède). Renvoie aussi si le joker a servi.
 */
export function currentStreakWithFreeze(state: AppState): { streak: number; usedFreeze: boolean } {
  let streak = 0
  let usedFreeze = false
  let key = todayKey()
  if (!hasActivity(state, key)) key = addDays(key, -1)
  for (let guard = 0; guard < 3650; guard++) {
    if (hasActivity(state, key)) {
      streak++
      key = addDays(key, -1)
      continue
    }
    // jour manqué : on le « gèle » une seule fois si un jour actif le précède
    if (!usedFreeze && streak > 0 && hasActivity(state, addDays(key, -1))) {
      usedFreeze = true
      key = addDays(key, -1)
      continue
    }
    break
  }
  return { streak, usedFreeze }
}

/** Série propre à une quête : jours consécutifs PRÉVUS où elle a été accomplie. */
export function questStreak(state: AppState, quest: QuestDef): number {
  let streak = 0
  let key = todayKey()
  let isToday = true
  for (let guard = 0; guard < 3650; guard++) {
    const weekday = keyToDate(key).getDay()
    if (!isQuestActiveOnWeekday(quest, weekday)) {
      key = addDays(key, -1) // jour non prévu → on saute sans casser
      isToday = false
      continue
    }
    const done = state.logs[key]?.completed.includes(quest.id) ?? false
    if (done) {
      streak++
    } else if (isToday) {
      // aujourd'hui pas encore fait → ne casse pas la série
    } else {
      break
    }
    key = addDays(key, -1)
    isToday = false
  }
  return streak
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
