import type { AppState } from '../types'
import { currentStreakWithFreeze, levelFromXp, totalXp } from '../lib/game'
import { prettyDate, todayKey } from '../lib/date'

export function Header({ state, onOpenSettings }: { state: AppState; onOpenSettings: () => void }) {
  const xp = totalXp(state)
  const lvl = levelFromXp(xp)
  const { streak, usedFreeze } = currentStreakWithFreeze(state)

  return (
    <header className="pt-2">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-xs text-slate-400 capitalize">{prettyDate(todayKey())}</div>
          <h1 className="text-lg sm:text-xl font-display">
            <span style={{ color: '#f2c24c', textShadow: '2px 2px 0 #5a3d0a' }}>Quest</span>
            <span style={{ color: '#a78bfa', textShadow: '2px 2px 0 #2a1a5a' }}>Log</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="glass flex items-center gap-1.5 rounded-full px-3 py-1.5" title={usedFreeze ? 'Joker de série utilisé (1 jour manqué gelé)' : 'Série en cours'}>
            <span className={streak > 0 ? 'animate-flame text-lg' : 'text-lg opacity-40'}>🔥</span>
            <span className="font-bold">{streak}</span>
            <span className="text-xs text-slate-400">j</span>
            {usedFreeze && <span className="text-sm" title="Joker utilisé">❄️</span>}
          </div>
          <button
            onClick={onOpenSettings}
            aria-label="Réglages"
            className="glass rounded-full w-10 h-10 grid place-items-center text-lg active:scale-90 transition"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* barre de niveau */}
      <div className="glass rounded-2xl px-4 py-3">
        <div className="flex items-center justify-between text-sm mb-1.5">
          <span className="font-bold flex items-center gap-1.5">
            <span className="grid place-items-center w-6 h-6 rounded-lg bg-indigo-500/30 text-indigo-300 text-xs font-extrabold">
              {lvl.level}
            </span>
            Niveau {lvl.level}
          </span>
          <span className="text-xs text-slate-400">
            {lvl.current} / {lvl.needed} XP
          </span>
        </div>
        <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-400 via-indigo-400 to-fuchsia-400"
            style={{ width: `${Math.max(lvl.progress * 100, 3)}%`, transition: 'width 0.7s ease-out' }}
          />
        </div>
      </div>
    </header>
  )
}
