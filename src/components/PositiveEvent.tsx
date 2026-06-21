type Props = {
  value: string
  mood?: number
  onChange: (text: string) => void
  onMood: (m: number) => void
}

const MOODS = ['😞', '😕', '😐', '🙂', '😄']

/** Carte journal : l'évènement positif marquant + l'humeur du jour. */
export function PositiveEvent({ value, mood, onChange, onMood }: Props) {
  return (
    <div className="glass rounded-3xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">✨</span>
        <h2 className="text-sm font-semibold text-slate-200">
          Le moment positif du jour
        </h2>
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
    </div>
  )
}
