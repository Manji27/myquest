import { useEffect, useRef, useState } from 'react'

type Props = {
  value: string
  onChange: (text: string) => void
}

/** Carte journal : l'évènement positif marquant, avec validation explicite. */
export function PositiveEvent({ value, onChange }: Props) {
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
    <div className="glass rounded-3xl p-4 flex flex-col">
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
          <span className="flex items-center gap-1 text-xs font-medium text-emerald-400 shrink-0">
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
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') validate()
        }}
        rows={4}
        placeholder="Qu'est-ce qui t'a fait du bien aujourd'hui ? Une rencontre, une réussite, un fou rire…"
        className="w-full flex-1 resize-none rounded-2xl bg-white/5 p-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:bg-white/8 focus:ring-2 focus:ring-indigo-400/40 transition"
      />

      {/* le bouton n'apparaît que s'il y a quelque chose à valider */}
      {(dirty || justSaved) && (
        <button
          onClick={validate}
          disabled={!dirty}
          className={`mt-3 w-full rounded-xl py-3 font-semibold transition active:scale-[0.98] disabled:active:scale-100 ${
            dirty
              ? 'bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white'
              : 'bg-emerald-500/20 text-emerald-300 animate-pop'
          }`}
        >
          {dirty ? 'Valider le moment' : '✓ Moment enregistré !'}
        </button>
      )}
    </div>
  )
}
