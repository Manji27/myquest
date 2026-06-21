import { useState } from 'react'
import type { QuestDef } from '../types'
import { DIFFICULTY } from '../data/defaultQuests'

type Props = {
  quest: QuestDef
  done: boolean
  onToggle: () => void
}

export function QuestCard({ quest, done, onToggle }: Props) {
  const [floating, setFloating] = useState(false)

  function handle() {
    if (!done) {
      setFloating(true)
      setTimeout(() => setFloating(false), 1000)
    }
    onToggle()
  }

  return (
    <button
      onClick={handle}
      className="relative w-full flex items-center gap-3 rounded-2xl p-3 text-left transition active:scale-[0.98] glass"
      style={{
        borderColor: done ? quest.color + '88' : undefined,
        background: done ? quest.color + '1f' : undefined,
      }}
    >
      {/* icône */}
      <div
        className={`grid place-items-center w-12 h-12 rounded-xl text-2xl shrink-0 transition ${done ? 'animate-pop' : ''}`}
        style={{ background: quest.color + '26' }}
      >
        {quest.icon}
      </div>

      {/* libellé */}
      <div className="flex-1 min-w-0">
        <div className={`font-semibold truncate ${done ? 'text-white' : 'text-slate-200'}`}>
          {quest.label}
        </div>
        <div className="text-xs font-medium flex items-center gap-1.5">
          <span style={{ color: quest.color }}>+{quest.xp} XP</span>
          <span className="text-slate-500">
            {DIFFICULTY[quest.difficulty].dot} {DIFFICULTY[quest.difficulty].label}
          </span>
        </div>
      </div>

      {/* checkbox */}
      <div
        className="grid place-items-center w-8 h-8 rounded-full border-2 shrink-0 transition"
        style={{
          borderColor: done ? quest.color : 'rgba(255,255,255,0.25)',
          background: done ? quest.color : 'transparent',
        }}
      >
        {done && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="animate-pop">
            <path d="M5 13l4 4L19 7" stroke="#0b1020" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      {floating && (
        <span
          className="animate-floatUp pointer-events-none absolute right-10 top-2 font-extrabold text-sm"
          style={{ color: quest.color }}
        >
          +{quest.xp}
        </span>
      )}
    </button>
  )
}
