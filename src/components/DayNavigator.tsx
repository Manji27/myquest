import { addDays, prettyDate } from '../lib/date'

type Props = {
  value: string // jour sélectionné (YYYY-MM-DD)
  today: string
  onChange: (key: string) => void
}

function relativeLabel(value: string, today: string): string {
  if (value === today) return "Aujourd'hui"
  if (value === addDays(today, -1)) return 'Hier'
  if (value === addDays(today, 1)) return 'Demain'
  return prettyDate(value).split(' ')[0] // le jour de la semaine
}

/** Barre de navigation jour précédent / suivant. Pas de futur au-delà d'aujourd'hui. */
export function DayNavigator({ value, today, onChange }: Props) {
  const isToday = value >= today

  return (
    <div className="glass rounded-2xl flex items-center justify-between gap-2 p-1.5">
      <button
        onClick={() => onChange(addDays(value, -1))}
        aria-label="Jour précédent"
        className="w-11 h-11 grid place-items-center rounded-xl bg-white/5 text-lg active:scale-90 transition"
      >
        ‹
      </button>

      <button
        onClick={() => onChange(today)}
        className="flex-1 text-center active:scale-[0.98] transition"
      >
        <div className="text-[11px] uppercase tracking-wide text-indigo-300">
          {relativeLabel(value, today)}
        </div>
        <div className="font-semibold capitalize leading-tight">{prettyDate(value)}</div>
      </button>

      <button
        onClick={() => !isToday && onChange(addDays(value, 1))}
        disabled={isToday}
        aria-label="Jour suivant"
        className="w-11 h-11 grid place-items-center rounded-xl bg-white/5 text-lg active:scale-90 transition disabled:opacity-25 disabled:active:scale-100"
      >
        ›
      </button>
    </div>
  )
}
