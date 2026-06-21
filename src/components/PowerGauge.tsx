import { dayVibe } from '../lib/game'

type Props = {
  score: number
  max: number
}

/** Jauge circulaire "Puissance du jour" — donne envie de remplir l'anneau. */
export function PowerGauge({ score, max }: Props) {
  const ratio = max > 0 ? Math.min(score / max, 1) : 0
  const vibe = dayVibe(ratio)
  const size = 132
  const stroke = 11
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c * (1 - ratio)

  return (
    <div className="flex items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <defs>
            <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#f472b6" />
            </linearGradient>
          </defs>
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke}
          />
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke="url(#gaugeGrad)" strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(0.34,1.56,0.64,1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
          <span className="text-3xl font-extrabold leading-none">{score}</span>
          <span className="text-[11px] text-slate-400 mt-0.5">/ {max} XP</span>
        </div>
      </div>

      <div>
        <div className="text-2xl mb-0.5">{vibe.emoji}</div>
        <div className="text-lg font-bold leading-tight">{vibe.label}</div>
        <div className="text-xs text-slate-400 mt-1">
          {Math.round(ratio * 100)}% de ta puissance du jour
        </div>
      </div>
    </div>
  )
}
