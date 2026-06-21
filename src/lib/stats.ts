import type { AppState, QuestDef } from '../types'
import { dayScore, levelFromXp, currentStreak, isQuestActiveOnWeekday, maxScoreForDate } from './game'
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

  const totalQuestsCompleted = logs.reduce((n, l) => n + l.completed.length, 0)
  const daysActive = logs.filter((l) => l.completed.length > 0).length
  const daysJournaled = logs.filter((l) => l.positiveEvent.trim().length > 0).length
  // journée parfaite = toutes les quêtes PRÉVUES ce jour-là sont accomplies
  const perfectDays = logs.filter((l) => {
    const dayMax = maxScoreForDate(state.quests, l.date)
    return dayMax > 0 && dayScore(l, state.quests) >= dayMax
  }).length

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

  // toutes les dates du premier jour suivi à aujourd'hui
  const rangeDates: string[] = []
  for (let k = first; k <= today; k = addDays(k, 1)) rangeDates.push(k)

  // taux par quête = jours accomplis / jours où elle était PRÉVUE (récurrence)
  const perQuest: QuestStat[] = state.quests.map((quest) => {
    let scheduled = 0
    let completed = 0
    for (const key of rangeDates) {
      if (!isQuestActiveOnWeekday(quest, keyToDate(key).getDay())) continue
      scheduled++
      if (state.logs[key]?.completed.includes(quest.id)) completed++
    }
    return { quest, completed, rate: scheduled > 0 ? completed / scheduled : 0 }
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
