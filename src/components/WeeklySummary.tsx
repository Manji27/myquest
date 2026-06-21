import { useMemo } from 'react'
import type { AppState } from '../types'
import { dayScore, maxScoreForDate } from '../lib/game'
import { lastNDays } from '../lib/date'

/** Carte récap des 7 derniers jours. */
export function WeeklySummary({ state }: { state: AppState }) {
  const data = useMemo(() => {
    const days = lastNDays(7)
    let activeDays = 0
    let xp = 0
    const ratios: number[] = []
    const counts: Record<string, number> = {}

    for (const key of days) {
      const log = state.logs[key]
      xp += dayScore(log, state.quests)
      const max = maxScoreForDate(state.quests, key)
      if (log && log.completed.length > 0) activeDays++
      if (max > 0) ratios.push(Math.min(dayScore(log, state.quests) / max, 1))
      log?.completed.forEach((id) => (counts[id] = (counts[id] ?? 0) + 1))
    }

    const avgRatio = ratios.length ? ratios.reduce((a, b) => a + b, 0) / ratios.length : 0
    const bestId = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0]
    const bestQuest = state.quests.find((q) => q.id === bestId)

    return { activeDays, xp, avgRatio, bestQuest }
  }, [state])

  return (
    <section>
      <h3 className="text-sm font-bold text-indigo-300 mb-2 px-1">Ta semaine</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat value={`${data.activeDays}/7`} label="Jours actifs" accent="#fb923c" />
        <Stat value={data.xp} label="XP gagnés" accent="#f472b6" />
        <Stat value={`${Math.round(data.avgRatio * 100)}%`} label="Complétion" accent="#22c55e" />
        <Stat
          value={data.bestQuest ? data.bestQuest.icon : '—'}
          label={data.bestQuest ? data.bestQuest.label : 'Top quête'}
          accent="#818cf8"
        />
      </div>
    </section>
  )
}

function Stat({ value, label, accent }: { value: string | number; label: string; accent: string }) {
  return (
    <div className="glass rounded-2xl p-3 text-center">
      <div className="text-xl font-extrabold truncate" style={{ color: accent }}>{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-slate-500 mt-0.5 truncate">{label}</div>
    </div>
  )
}
