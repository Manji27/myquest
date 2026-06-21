import type { AppState } from '../types'
import { keyToDate, prettyDate, toKey } from '../lib/date'

type Props = {
  state: AppState
  dateKey: string
  onOpenDay: (key: string) => void
}

/** Ressort les moments positifs écrits le même jour, un mois et un an plus tôt. */
export function OnThisDay({ state, dateKey, onOpenDay }: Props) {
  const ref = keyToDate(dateKey)
  const candidates: { key: string; label: string }[] = [
    { key: toKey(new Date(ref.getFullYear(), ref.getMonth() - 1, ref.getDate())), label: 'Il y a un mois' },
    { key: toKey(new Date(ref.getFullYear() - 1, ref.getMonth(), ref.getDate())), label: 'Il y a un an' },
  ]

  const found = candidates
    .map((c) => ({ ...c, log: state.logs[c.key] }))
    .filter((c) => c.log && c.log.positiveEvent.trim().length > 0)

  if (found.length === 0) return null

  return (
    <div className="glass rounded-3xl p-4">
      <h2 className="text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2">
        <span className="text-lg">🕰️</span> Souvenir du jour
      </h2>
      <div className="space-y-2">
        {found.map((c) => (
          <button
            key={c.key}
            onClick={() => onOpenDay(c.key)}
            className="w-full text-left rounded-2xl bg-white/5 hover:bg-white/8 p-3 active:scale-[0.99] transition"
          >
            <div className="text-[11px] font-medium text-indigo-300 mb-0.5">
              {c.label} · <span className="text-slate-400 capitalize">{prettyDate(c.key)}</span>
            </div>
            <p className="text-sm text-slate-100 line-clamp-3 whitespace-pre-wrap">{c.log!.positiveEvent}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
