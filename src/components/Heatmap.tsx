import { useMemo } from 'react'
import type { AppState } from '../types'
import { dayScore, maxScoreForDate } from '../lib/game'
import { MONTHS, addDays, keyToDate, prettyDate, todayKey } from '../lib/date'

type Props = {
  state: AppState
  onSelectDay?: (key: string) => void
}

const DOW_LABELS = ['L', '', 'M', '', 'V', '', 'D'] // lundi → dimanche (un sur deux)

/** Heatmap annuelle façon « contributions » : une case par jour, colorée selon le score. */
export function Heatmap({ state, onSelectDay }: Props) {
  const today = todayKey()

  const { weeks, monthCols } = useMemo(() => {
    // début : 52 semaines en arrière, aligné au lundi
    const startRaw = addDays(today, -7 * 52)
    const dow = (keyToDate(startRaw).getDay() + 6) % 7 // 0 = lundi
    const start = addDays(startRaw, -dow)
    // fin : dimanche de la semaine courante
    const endDow = (keyToDate(today).getDay() + 6) % 7
    const end = addDays(today, 6 - endDow)

    const days: string[] = []
    for (let k = start; k <= end; k = addDays(k, 1)) days.push(k)

    const weeks: string[][] = []
    for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))

    // étiquettes de mois : à la première semaine de chaque mois
    const monthCols: { col: number; label: string }[] = []
    let lastMonth = -1
    weeks.forEach((w, col) => {
      const m = keyToDate(w[0]).getMonth()
      if (m !== lastMonth) {
        monthCols.push({ col, label: MONTHS[m].slice(0, 3) })
        lastMonth = m
      }
    })
    return { weeks, monthCols }
  }, [today])

  function cellStyle(key: string): React.CSSProperties {
    if (key > today) return { background: 'transparent' }
    const max = maxScoreForDate(state.quests, key)
    const ratio = max > 0 ? Math.min(dayScore(state.logs[key], state.quests) / max, 1) : 0
    if (ratio <= 0) return { background: 'rgba(255,255,255,0.05)' }
    if (ratio >= 1) return { background: '#f472b6' } // journée parfaite = rose vif
    return { background: `rgba(129,140,248,${0.25 + ratio * 0.6})` }
  }

  const activeDays = Object.values(state.logs).filter((l) => l.completed.length > 0).length

  return (
    <section className="glass rounded-2xl p-4">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-sm font-bold text-indigo-300">Ton année</h3>
        <span className="text-xs text-slate-500">{activeDays} jours actifs</span>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="inline-block">
          {/* étiquettes de mois */}
          <div className="flex gap-[3px] mb-1 ml-5 text-[9px] text-slate-500 relative h-3">
            {monthCols.map(({ col, label }) => (
              <span key={col} className="absolute" style={{ left: col * 15 }}>{label}</span>
            ))}
          </div>
          <div className="flex">
            {/* étiquettes jours */}
            <div className="flex flex-col gap-[3px] mr-1.5 text-[9px] text-slate-500">
              {DOW_LABELS.map((l, i) => (
                <span key={i} className="h-3 leading-3 w-3 text-right">{l}</span>
              ))}
            </div>
            {/* grille */}
            <div className="flex gap-[3px]">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  {week.map((key) => {
                    const isFuture = key > today
                    const isToday = key === today
                    return (
                      <button
                        key={key}
                        disabled={isFuture}
                        onClick={() => !isFuture && onSelectDay?.(key)}
                        title={isFuture ? '' : `${prettyDate(key)} — ${dayScore(state.logs[key], state.quests)} XP`}
                        className="w-3 h-3 rounded-[3px] transition hover:scale-125"
                        style={{
                          ...cellStyle(key),
                          outline: isToday ? '1.5px solid #fff' : 'none',
                          outlineOffset: -1,
                          cursor: isFuture ? 'default' : 'pointer',
                        }}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* légende */}
      <div className="flex items-center justify-end gap-1.5 mt-2 text-[10px] text-slate-500">
        <span>moins</span>
        <span className="w-3 h-3 rounded-[3px]" style={{ background: 'rgba(255,255,255,0.05)' }} />
        <span className="w-3 h-3 rounded-[3px]" style={{ background: 'rgba(129,140,248,0.4)' }} />
        <span className="w-3 h-3 rounded-[3px]" style={{ background: 'rgba(129,140,248,0.7)' }} />
        <span className="w-3 h-3 rounded-[3px]" style={{ background: '#f472b6' }} />
        <span>plus</span>
      </div>
    </section>
  )
}
