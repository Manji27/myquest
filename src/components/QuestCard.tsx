import { useRef, useState } from 'react'
import type { QuestDef } from '../types'
import { DIFFICULTY } from '../data/defaultQuests'
import { QuestGlyph } from './PixelIcon'

type Props = {
  quest: QuestDef
  done: boolean
  streak?: number
  onToggle: () => void
  /** appui long (mobile) → proposer la suppression */
  onLongPress?: () => void
}

const LONG_PRESS_MS = 500

export function QuestCard({ quest, done, streak = 0, onToggle, onLongPress }: Props) {
  const [floating, setFloating] = useState(false)
  const [pressing, setPressing] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const longFired = useRef(false)
  const startPos = useRef<{ x: number; y: number } | null>(null)

  function clearTimer() {
    clearTimeout(timer.current)
    setPressing(false)
    startPos.current = null
  }

  function onPointerDown(e: React.PointerEvent) {
    if (!onLongPress) return
    longFired.current = false
    startPos.current = { x: e.clientX, y: e.clientY }
    setPressing(true)
    timer.current = setTimeout(() => {
      longFired.current = true
      setPressing(false)
      navigator.vibrate?.(40)
      onLongPress()
    }, LONG_PRESS_MS)
  }

  function onPointerMove(e: React.PointerEvent) {
    // annule l'appui long si on scrolle/bouge le doigt
    if (!startPos.current) return
    const dx = Math.abs(e.clientX - startPos.current.x)
    const dy = Math.abs(e.clientY - startPos.current.y)
    if (dx > 10 || dy > 10) clearTimer()
  }

  function handle() {
    // un appui long vient de déclencher → on n'exécute pas le toggle
    if (longFired.current) {
      longFired.current = false
      return
    }
    if (!done) {
      setFloating(true)
      setTimeout(() => setFloating(false), 1000)
    }
    onToggle()
  }

  return (
    <button
      onClick={handle}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={clearTimer}
      onPointerCancel={clearTimer}
      onPointerLeave={clearTimer}
      onContextMenu={(e) => e.preventDefault()}
      className={`relative w-full flex items-center gap-3 rounded-2xl p-3 text-left transition active:scale-[0.98] glass ${pressing ? 'animate-pressHold' : ''}`}
      style={{
        borderColor: done ? quest.color + '88' : undefined,
        background: done ? quest.color + '1f' : undefined,
        touchAction: 'pan-y',
      }}
    >
      {/* icône */}
      <div
        className={`grid place-items-center w-12 h-12 text-2xl shrink-0 transition ${done ? 'animate-pop' : ''}`}
        style={{ background: quest.color + '26', boxShadow: `inset 0 0 0 2px ${quest.color}55` }}
      >
        <QuestGlyph icon={quest.icon} size={34} />
      </div>

      {/* libellé */}
      <div className="flex-1 min-w-0">
        <div className={`font-semibold truncate ${done ? 'text-white' : 'text-slate-200'}`}>
          {quest.label}
        </div>
        <div className="text-xs font-medium flex items-center gap-1.5 flex-wrap">
          <span style={{ color: quest.color }}>+{quest.xp} XP</span>
          <span className="text-slate-500">
            {DIFFICULTY[quest.difficulty].dot} {DIFFICULTY[quest.difficulty].label}
          </span>
          {streak >= 2 && (
            <span className="text-orange-400 font-bold">🔥{streak}</span>
          )}
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
