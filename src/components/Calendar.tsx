import { useState } from 'react'
import type { AppState } from '../types'
import { dayScore, maxDayScore } from '../lib/game'
import { MONTHS, WEEKDAY_LETTERS, keyToDate, todayKey, ymdKey } from '../lib/date'

type Props = {
  value: string // jour sélectionné
  state: AppState
  onSelect: (key: string) => void
  onClose: () => void
}

export function Calendar({ value, state, onSelect, onClose }: Props) {
  const sel = keyToDate(value)
  const today = todayKey()
  const [year, setYear] = useState(sel.getFullYear())
  const [month, setMonth] = useState(sel.getMonth()) // 0-11
  const [mode, setMode] = useState<'days' | 'years'>('days')

  const max = Math.max(maxDayScore(state.quests), 1)

  function shiftMonth(delta: number) {
    const d = new Date(year, month + delta, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
  }

  // grille du mois, semaine commençant le lundi
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass rounded-3xl p-4 w-full max-w-xs"
        onClick={(e) => e.stopPropagation()}
      >
        {/* en-tête : navigation mois + bascule année */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => shiftMonth(-1)}
            aria-label="Mois précédent"
            className="w-9 h-9 grid place-items-center rounded-lg bg-white/5 active:scale-90 transition"
          >
            ‹
          </button>
          <button
            onClick={() => setMode(mode === 'days' ? 'years' : 'days')}
            className="font-semibold capitalize px-3 py-1 rounded-lg hover:bg-white/5 transition"
          >
            {mode === 'days' ? `${MONTHS[month]} ${year}` : year}
          </button>
          <button
            onClick={() => shiftMonth(1)}
            aria-label="Mois suivant"
            className="w-9 h-9 grid place-items-center rounded-lg bg-white/5 active:scale-90 transition"
          >
            ›
          </button>
        </div>

        {mode === 'years' ? (
          <div className="grid grid-cols-4 gap-1.5">
            {Array.from({ length: 12 }, (_, i) => year - 6 + i).map((y) => (
              <button
                key={y}
                onClick={() => {
                  setYear(y)
                  setMode('days')
                }}
                className={`py-2.5 rounded-lg text-sm transition ${
                  y === year ? 'bg-indigo-500/40 font-bold' : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-7 gap-1 mb-1">
              {WEEKDAY_LETTERS.map((l, i) => (
                <div key={i} className="text-center text-[11px] text-slate-500 font-medium">
                  {l}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, i) => {
                if (day === null) return <div key={`e${i}`} />
                const key = ymdKey(year, month, day)
                const isFuture = key > today
                const isToday = key === today
                const isSelected = key === value
                const score = dayScore(state.logs[key], state.quests)
                const ratio = Math.min(score / max, 1)
                return (
                  <button
                    key={key}
                    disabled={isFuture}
                    onClick={() => {
                      onSelect(key)
                      onClose()
                    }}
                    className="relative aspect-square rounded-lg grid place-items-center text-sm transition disabled:opacity-25 disabled:cursor-not-allowed hover:bg-white/10"
                    style={{
                      background: isSelected
                        ? '#a78bfa'
                        : ratio > 0
                          ? `rgba(129,140,248,${0.15 + ratio * 0.55})`
                          : 'rgba(255,255,255,0.04)',
                      outline: isToday && !isSelected ? '1.5px solid #f472b6' : 'none',
                      outlineOffset: -1.5,
                      color: isSelected ? '#0b1020' : undefined,
                      fontWeight: isSelected || isToday ? 700 : 400,
                    }}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
          </>
        )}

        <button
          onClick={() => {
            onSelect(today)
            onClose()
          }}
          className="mt-3 w-full rounded-xl bg-white/5 py-2.5 text-sm font-semibold active:scale-[0.98] transition"
        >
          Aujourd'hui
        </button>
      </div>
    </div>
  )
}
