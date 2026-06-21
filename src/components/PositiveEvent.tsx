import { useEffect, useRef, useState } from 'react'

type Props = {
  value: string
  mood?: number
  onChange: (text: string) => void
  onMood: (m: number) => void
}

const MOODS = ['😞', '😕', '😐', '🙂', '😄']

type SaveStatus = 'idle' | 'saving' | 'saved'

/** Carte journal : l'évènement positif marquant + l'humeur du jour. */
export function PositiveEvent({ value, mood, onChange, onMood }: Props) {
  // au montage : si du texte existe déjà, il est déjà enregistré
  const [status, setStatus] = useState<SaveStatus>(value.trim() ? 'saved' : 'idle')
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  function handleText(text: string) {
    onChange(text)
    setStatus(text.trim() ? 'saving' : 'idle')
    clearTimeout(timer.current)
    if (text.trim()) {
      timer.current = setTimeout(() => setStatus('saved'), 500)
    }
  }

  function handleMood(m: number) {
    onMood(m)
    // l'humeur compte aussi comme une sauvegarde
    setStatus('saving')
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setStatus('saved'), 500)
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
        <SaveBadge status={status} />
      </div>

      <textarea
        value={value}
        onChange={(e) => handleText(e.target.value)}
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
                onClick={() => handleMood(i + 1)}
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

      <p className="text-[11px] text-slate-600 mt-3 text-center">
        Enregistrement automatique sur ton appareil — pas besoin de valider 🔒
      </p>
    </div>
  )
}

function SaveBadge({ status }: { status: SaveStatus }) {
  if (status === 'idle') return null
  if (status === 'saving') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
        Enregistrement…
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 text-xs font-medium text-emerald-400 shrink-0 animate-pop">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Enregistré
    </span>
  )
}
