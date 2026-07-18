import { useState } from 'react'
import type { AppState } from '../types'
import { addDays, prettyDate } from '../lib/date'
import { Calendar } from './Calendar'
import { PixelIcon } from './PixelIcon'

type Props = {
  value: string // jour sélectionné (YYYY-MM-DD)
  today: string
  state: AppState
  onChange: (key: string) => void
  previousIcon?: string
  nextIcon?: string
  calendarIcon?: string
}

function relativeLabel(value: string, today: string): string {
  if (value === today) return "Aujourd'hui"
  if (value === addDays(today, -1)) return 'Hier'
  if (value === addDays(today, 1)) return 'Demain'
  return prettyDate(value).split(' ')[0] // le jour de la semaine
}

/** Barre de navigation jour précédent / suivant + ouverture du calendrier. */
export function DayNavigator({
  value,
  today,
  state,
  onChange,
  previousIcon,
  nextIcon,
  calendarIcon,
}: Props) {
  const [calOpen, setCalOpen] = useState(false)
  const isToday = value >= today

  return (
    <>
      <div className="glass flex items-center justify-between gap-2 p-1.5">
        <button
          onClick={() => onChange(addDays(value, -1))}
          aria-label="Jour précédent"
          className="w-11 h-11 grid place-items-center bg-white/5 active:scale-90 transition"
        >
          {previousIcon ? (
            <img
              src={previousIcon}
              width={32}
              height={32}
              className="day-nav-image"
              alt="précédent"
              draggable={false}
            />
          ) : (
            <PixelIcon name="arrow" size={26} className="-scale-x-100" alt="précédent" />
          )}
        </button>

        <button
          onClick={() => setCalOpen(true)}
          aria-label="Ouvrir le calendrier"
          className="flex-1 flex items-center justify-center gap-2.5 active:scale-[0.98] transition"
        >
          {calendarIcon ? (
            <img
              src={calendarIcon}
              width={36}
              height={36}
              className="day-nav-calendar-image"
              alt=""
              draggable={false}
            />
          ) : (
            <PixelIcon name="calendar" size={24} alt="" />
          )}
          <div className="text-left">
            <div className="text-[11px] uppercase tracking-wide text-indigo-300">
              {relativeLabel(value, today)}
            </div>
            <div className="font-semibold capitalize leading-tight">{prettyDate(value)}</div>
          </div>
        </button>

        <button
          onClick={() => !isToday && onChange(addDays(value, 1))}
          disabled={isToday}
          aria-label="Jour suivant"
          className="w-11 h-11 grid place-items-center bg-white/5 active:scale-90 transition disabled:opacity-25 disabled:active:scale-100"
        >
          {nextIcon ? (
            <img
              src={nextIcon}
              width={32}
              height={32}
              className="day-nav-image"
              alt="suivant"
              draggable={false}
            />
          ) : (
            <PixelIcon name="arrow" size={26} alt="suivant" />
          )}
        </button>
      </div>

      {calOpen && (
        <Calendar
          value={value}
          state={state}
          onSelect={onChange}
          onClose={() => setCalOpen(false)}
        />
      )}
    </>
  )
}
