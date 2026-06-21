import { useEffect, useRef, useState } from 'react'
import { MOODS } from '../lib/moods'

type Props = {
  value: string
  mood?: number
  onChange: (text: string) => void
  onMood: (m: number) => void
}

/** Carte journal : l'évènement positif marquant + l'humeur, avec validation explicite. */
export function PositiveEvent({ value, mood, onChange, onMood }: Props) {
  const [draft, setDraft] = useState(value)
  const [justSaved, setJustSaved] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  const dirty = draft.trim() !== value.trim()
  const hasContent = value.trim().length > 0

  function validate() {
    if (!dirty) return
    onChange(draft.trim())
    setJustSaved(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setJustSaved(false), 2200)
  }

  return (
    <div className="glass rounded-3xl p-4">
      <div className="flex items-center justify-between mb-2 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg">✨</span>
          <h2 className="text-sm font-semibold text-slate-200 truncate">
            Le moment positif du jour
          </h2>
        </div>
        {dirty ? (
          <span className="flex items-center gap-1.5 text-xs text-amber-400 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Non enregistré
          </span>
        ) : hasContent ? (
          <span
            className={`flex items-center gap-1 text-xs font-medium text-emerald-400 shrink-0 ${justSaved ? 'animate-pop' : ''}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Enregistré
          </span>
        ) : null}
      </div>

      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          // Cmd/Ctrl + Entrée valide
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') validate()
        }}
        rows={3}
        placeholder="Qu'est-ce qui t'a fait du bien aujourd'hui ? Une rencontre, une réussite, un fou rire…"
        className="w-full resize-none rounded-2xl bg-white/5 p-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:bg-white/8 focus:ring-2 focus:ring-indigo-400/40 transition"
      />

      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-slate-400">Humeur</span>
        <div className="flex gap-1.5">
          {MOODS.map((m, i) => {
            const active = mood === i + 1
            return (
              <button
                key={i}
                onClick={() => onMood(i + 1)}
                className={`w-9 h-9 rounded-full text-lg grid place-items-center transition ${
                  active ? 'bg-indigo-500/30 scale-110' : 'opacity-50 hover:opacity-100'
                }`}
              >
                {m}
              </button>
            )
          })}
        </div>
      </div>

      <button
        onClick={validate}
        disabled={!dirty}
        className={`mt-3 w-full rounded-xl py-3 font-semibold transition active:scale-[0.98] disabled:active:scale-100 ${
          dirty
            ? 'bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white'
            : justSaved
              ? 'bg-emerald-500/20 text-emerald-300'
              : 'bg-white/5 text-slate-500'
        }`}
      >
        {dirty ? 'Valider le moment' : justSaved ? '✓ Moment enregistré !' : hasContent ? 'Enregistré ✓' : 'Rien à valider'}
      </button>
    </div>
  )
}
