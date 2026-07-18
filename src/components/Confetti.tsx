import { useEffect, useState } from 'react'

const COLORS = ['#38bdf8', '#a78bfa', '#f472b6', '#fbbf24', '#22c55e', '#fb7185']

type Piece = { id: number; left: number; color: string; delay: number; size: number }

/** Petite explosion de confettis, déclenchée par un changement de `trigger`. */
export function Confetti({ trigger }: { trigger: number }) {
  const [pieces, setPieces] = useState<Piece[]>([])

  useEffect(() => {
    if (trigger === 0) return
    const next: Piece[] = Array.from({ length: 28 }, (_, i) => ({
      id: trigger * 100 + i,
      left: 50 + (i - 14) * 3.2,
      color: COLORS[i % COLORS.length],
      delay: (i % 7) * 0.04,
      size: 6 + (i % 4) * 2,
    }))
    setPieces(next)
    const t = setTimeout(() => setPieces([]), 1300)
    return () => clearTimeout(t)
  }, [trigger])

  if (pieces.length === 0) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="animate-confetti absolute top-[30%] rounded-sm"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 1.6,
            background: p.color,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  )
}
