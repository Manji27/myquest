import { useMemo } from 'react'
import type { AppState } from '../types'
import { dayScore, maxDayScore } from '../lib/game'
import { lastNDays, weekdayShort, todayKey } from '../lib/date'

type Props = {
  state: AppState
  days?: number
  selected?: string
  onSelectDay?: (key: string) => void
}

/** Convertit une liste de points en chemin SVG lissé (Catmull-Rom → Bézier). */
function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return ''
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? p2
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
  }
  return d
}

export function ScoreCurve({ state, days = 14, selected, onSelectDay }: Props) {
  const keys = useMemo(() => lastNDays(days), [days])
  const max = Math.max(maxDayScore(state.quests), 1)
  const scores = keys.map((k) => dayScore(state.logs[k], state.quests))
  const today = todayKey()

  const W = 320
  const H = 150
  const padX = 6
  const padTop = 14
  const padBottom = 22
  const innerW = W - padX * 2
  const innerH = H - padTop - padBottom

  const points = scores.map((s, i) => ({
    x: padX + (innerW * i) / (keys.length - 1),
    y: padTop + innerH * (1 - s / max),
  }))

  const line = smoothPath(points)
  const area = `${line} L ${points[points.length - 1].x} ${padTop + innerH} L ${points[0].x} ${padTop + innerH} Z`

  const best = Math.max(...scores)
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length
  const goalY = padTop + innerH * (1 - 0.8) // ligne objectif à 80%

  return (
    <div className="glass rounded-3xl p-4">
      <div className="flex items-baseline justify-between mb-1">
        <h2 className="text-sm font-semibold text-slate-300">Ta courbe de productivité</h2>
        <span className="text-xs text-slate-500">{days} derniers jours</span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="curveFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="curveStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#f472b6" />
          </linearGradient>
        </defs>

        {/* ligne objectif */}
        <line
          x1={padX} y1={goalY} x2={W - padX} y2={goalY}
          stroke="#fbbf24" strokeOpacity="0.35" strokeWidth="1" strokeDasharray="4 4"
        />
        <text x={W - padX} y={goalY - 4} textAnchor="end" fontSize="8" fill="#fbbf24" fillOpacity="0.7">
          objectif
        </text>

        <path d={area} fill="url(#curveFill)" />
        <path
          d={line}
          fill="none"
          stroke="url(#curveStroke)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="1000"
          strokeDashoffset="1000"
          style={{ animation: 'drawLine 1.1s ease-out forwards' }}
        />

        {/* points */}
        {points.map((p, i) => {
          const isToday = keys[i] === today
          const isSelected = keys[i] === selected
          const v = scores[i]
          return (
            <g
              key={keys[i]}
              onClick={() => onSelectDay?.(keys[i])}
              style={{ cursor: onSelectDay ? 'pointer' : 'default' }}
            >
              {/* cible de clic élargie (invisible) */}
              <rect x={p.x - 9} y={padTop - 6} width={18} height={innerH + 12} fill="transparent" />
              {isSelected && (
                <circle cx={p.x} cy={p.y} r={8} fill="none" stroke="#f472b6" strokeWidth="1.5" opacity="0.7" />
              )}
              <circle
                cx={p.x} cy={p.y} r={isSelected ? 4.5 : isToday ? 3.5 : 2.5}
                fill={isSelected ? '#fff' : isToday ? '#f9a8d4' : '#a78bfa'}
                stroke={isSelected ? '#f472b6' : 'none'}
                strokeWidth="2"
              />
              {(isSelected || isToday) && v > 0 && (
                <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="9" fontWeight="700" fill="#fff">
                  {v}
                </text>
              )}
            </g>
          )
        })}

        {/* étiquettes jours (1 sur 2 pour ne pas surcharger) */}
        {keys.map((k, i) =>
          i % 2 === keys.length % 2 ? (
            <text
              key={k}
              x={points[i].x}
              y={H - 6}
              textAnchor="middle"
              fontSize="7.5"
              fill={k === today ? '#f472b6' : '#64748b'}
              fontWeight={k === today ? 700 : 400}
            >
              {weekdayShort(k)}
            </text>
          ) : null,
        )}
      </svg>

      <div className="flex gap-2 mt-1 text-center">
        <Stat label="Aujourd'hui" value={scores[scores.length - 1]} accent="#f472b6" />
        <Stat label="Record" value={best} accent="#fbbf24" />
        <Stat label="Moyenne" value={Math.round(avg)} accent="#818cf8" />
      </div>
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="flex-1 rounded-2xl bg-white/5 py-2">
      <div className="text-lg font-bold" style={{ color: accent }}>{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
    </div>
  )
}
