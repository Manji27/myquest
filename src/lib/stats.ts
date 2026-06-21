import type { AppState, QuestDef } from '../types'
import { dayScore, maxDayScore, levelFromXp, currentStreak } from './game'
import { addDays, keyToDate, todayKey } from './date'

export type QuestStat = {
  quest: QuestDef
  completed: number // nb de jours où la quête a été cochée
  rate: number // 0..1 sur les jours suivis
}

export type Stats = {
  totalXp: number
  level: number
  totalQuestsCompleted: number
  daysActive: number
  daysJournaled: number
  currentStreak: number
  bestStreak: number
  perfectDays: number
  trackedDays: number
  perQuest: QuestStat[]
}

export function computeStats(state: AppState): Stats {
  const logs = Object.values(state.logs)
  const totalXp = logs.reduce((sum, l) => sum + dayScore(l, state.quests), 0)
  const max = maxDayScore(state.quests)

  const totalQuestsCompleted = logs.reduce((n, l) => n + l.completed.length, 0)
  const daysActive = logs.filter((l) => l.completed.length > 0).length
  const daysJournaled = logs.filter((l) => l.positiveEvent.trim().length > 0).length
  const perfectDays = max > 0 ? logs.filter((l) => dayScore(l, state.quests) >= max).length : 0

  // meilleure série de jours consécutifs avec au moins une quête
  const activeDates = logs
    .filter((l) => l.completed.length > 0)
    .map((l) => l.date)
    .sort()
  let bestStreak = 0
  let run = 0
  let prev: string | null = null
  for (const d of activeDates) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1
    bestStreak = Math.max(bestStreak, run)
    prev = d
  }

  // nombre de jours suivis (du premier log à aujourd'hui)
  const allDates = Object.keys(state.logs).sort()
  const today = todayKey()
  const first = allDates[0] ?? today
  const trackedDays = Math.max(
    1,
    Math.round((keyToDate(today).getTime() - keyToDate(first).getTime()) / 86_400_000) + 1,
  )

  const perQuest: QuestStat[] = state.quests.map((quest) => {
    const completed = logs.filter((l) => l.completed.includes(quest.id)).length
    return { quest, completed, rate: completed / trackedDays }
  })

  return {
    totalXp,
    level: levelFromXp(totalXp).level,
    totalQuestsCompleted,
    daysActive,
    daysJournaled,
    currentStreak: currentStreak(state),
    bestStreak,
    perfectDays,
    trackedDays,
    perQuest,
  }
}
