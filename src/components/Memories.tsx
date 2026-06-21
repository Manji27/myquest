import { useMemo } from 'react'
import type { AppState } from '../types'
import { MONTHS, keyToDate, prettyDate } from '../lib/date'

type Props = {
  state: AppState
  onOpenDay: (key: string) => void
}

type MonthGroup = { label: string; ym: string; entries: { key: string; text: string }[] }

/** Récap de tous les moments positifs, regroupés par mois (du plus récent au plus ancien). */
export function Memories({ state, onOpenDay }: Props) {
  const groups = useMemo<MonthGroup[]>(() => {
    const entries = Object.values(state.logs)
      .filter((l) => l.positiveEvent.trim().length > 0)
      .sort((a, b) => (a.date < b.date ? 1 : -1)) // récent d'abord

    const map = new Map<string, MonthGroup>()
    for (const l of entries) {
      const d = keyToDate(l.date)
      const ym = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`
      if (!map.has(ym)) {
        map.set(ym, { ym, label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`, entries: [] })
      }
      map.get(ym)!.entries.push({ key: l.date, text: l.positiveEvent })
    }
    return [...map.values()]
  }, [state.logs])

  const total = groups.reduce((n, g) => n + g.entries.length, 0)

  if (total === 0) {
    return (
      <div className="glass rounded-3xl p-8 text-center text-slate-400 mt-4 max-w-md mx-auto">
        <div className="text-4xl mb-3">📖</div>
        <p className="font-semibold text-slate-200 mb-1">Aucun souvenir pour l'instant</p>
        <p className="text-sm">
          Note un moment positif dans ton journal du jour, il apparaîtra ici.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-4 space-y-6">
      <p className="text-sm text-slate-400 px-1">
        {total} moment{total > 1 ? 's' : ''} positif{total > 1 ? 's' : ''} enregistré{total > 1 ? 's' : ''} ✨
      </p>

      {groups.map((g) => (
        <section key={g.ym}>
          <h3 className="text-sm font-bold text-indigo-300 capitalize mb-2 px-1">
            {g.label}
            <span className="text-slate-500 font-normal"> · {g.entries.length}</span>
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 items-start">
            {g.entries.map((e) => (
              <button
                key={e.key}
                onClick={() => onOpenDay(e.key)}
                className="glass rounded-2xl p-4 text-left active:scale-[0.99] transition hover:bg-white/8"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-sm">✨</span>
                  <span className="text-xs font-medium text-slate-400 capitalize">
                    {prettyDate(e.key)}
                  </span>
                </div>
                <p className="text-sm text-slate-100 whitespace-pre-wrap break-words">{e.text}</p>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
