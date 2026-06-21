import { dayVibe } from '../lib/game'

type Props = {
  score: number
  max: number
  questsDone: number
  questsTotal: number
  level: number
  xpToNext: number
  isToday: boolean
}

/** Jauge circulaire "Puissance du jour" + mini-récap motivant. */
export function PowerGauge({ score, max, questsDone, questsTotal, level, xpToNext, isToday }: Props) {
  const ratio = max > 0 ? Math.min(score / max, 1) : 0
  const vibe = dayVibe(ratio)
  const size = 140
  const stroke = 12
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c * (1 - ratio)
  const questsLeft = Math.max(questsTotal - questsDone, 0)

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
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
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-extrabold leading-none">{score}</span>
          <span className="text-xs text-slate-400 mt-1">/ {max} XP</span>
        </div>
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{vibe.emoji}</span>
          <span className="text-xl font-bold leading-tight">{vibe.label}</span>
        </div>
        <div className="text-sm text-slate-400 mt-1">
          {Math.round(ratio * 100)}% {isToday ? 'de ta puissance du jour' : 'de cette journée'}
        </div>

        {/* mini-récap */}
        <div className="mt-3 space-y-1.5 text-sm">
          {isToday ? (
            <RecapRow
              icon="🎯"
              text={
                questsLeft === 0
                  ? questsTotal > 0
                    ? 'Toutes les quêtes accomplies !'
                    : 'Ajoute des quêtes pour démarrer'
                  : `${questsLeft} quête${questsLeft > 1 ? 's' : ''} restante${questsLeft > 1 ? 's' : ''} aujourd'hui`
              }
            />
          ) : (
            <RecapRow
              icon="✅"
              text={`${questsDone}/${questsTotal} quêtes accomplies ce jour-là`}
            />
          )}
          <RecapRow
            icon="⚡"
            text={`${xpToNext} XP avant le niveau ${level + 1}`}
          />
        </div>
      </div>
    </div>
  )
}

function RecapRow({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-2 text-slate-300">
      <span className="w-5 text-center">{icon}</span>
      <span>{text}</span>
    </div>
  )
}
