import { useMemo } from 'react'
import { usePersistentState } from '../../lib/storage'
import { dayScore, levelFromXp, questsForDate, totalXp, currentStreak } from '../../lib/game'
import { DIFFICULTY } from '../../data/defaultQuests'
import { lastNDays, prettyDate, todayKey, weekdayShort } from '../../lib/date'
import './p3r.css'

/**
 * Maquette alternative de la page d'accueil au style Persona 3 Reload
 * (bleu électrique, diagonales, typo géante inclinée, accents jaunes).
 * Accessible via ?p3 — n'altère pas l'app principale.
 */
export function P3RDashboard() {
  const [state] = usePersistentState()
  const today = todayKey()
  const log = state.logs[today] ?? { date: today, completed: [], positiveEvent: '' }
  const dayQuests = useMemo(() => questsForDate(state.quests, today), [state.quests, today])
  const max = dayQuests.reduce((s, q) => s + q.xp, 0)
  const done = dayQuests.filter((q) => log.completed.includes(q.id))
  const score = done.reduce((s, q) => s + q.xp, 0)
  const ratio = max > 0 ? Math.min(score / max, 1) : 0
  const lvl = useMemo(() => levelFromXp(totalXp(state)), [state])
  const streak = currentStreak(state)
  const pct = Math.round(ratio * 100)

  return (
    <div className="p3-root">
      <div className="p3-bg" />
      <div className="p3-speedlines" />
      <div className="p3-page">
        {/* ——— En-tête ——— */}
        <header className="p3-header">
          <div className="p3-headleft">
            <div className="p3-date">{prettyDate(today)}</div>
            <h1 className="p3-title">QUEST<span className="p3-title-accent">LOG</span></h1>
          </div>
          <div className="p3-headright">
            <div className="p3-streak"><span>{streak}</span><small>JOURS</small></div>
            <button className="p3-gear">⚙</button>
          </div>
        </header>

        {/* ——— Barre de niveau ——— */}
        <div className="p3-level">
          <div className="p3-level-num">LV<b>{lvl.level}</b></div>
          <div className="p3-level-track">
            <div className="p3-level-fill" style={{ width: `${Math.max(lvl.progress * 100, 4)}%` }} />
          </div>
          <div className="p3-level-xp">{lvl.current}<span>/{lvl.needed} XP</span></div>
        </div>

        {/* ——— Onglets ——— */}
        <nav className="p3-tabs">
          <button className="p3-tab p3-tab-active"><span>JOURNAL</span></button>
          <button className="p3-tab"><span>PROGRESSION</span></button>
          <button className="p3-tab"><span>SOUVENIRS</span></button>
        </nav>

        {/* ——— Navigation date ——— */}
        <div className="p3-daynav">
          <button className="p3-chevron">‹‹</button>
          <div className="p3-daynav-center">
            <span className="p3-daynav-tag">AUJOURD'HUI</span>
            <b>{prettyDate(today)}</b>
          </div>
          <button className="p3-chevron p3-chevron-dim">››</button>
        </div>

        <div className="p3-grid">
          {/* ——— Colonne gauche ——— */}
          <div className="p3-col">
            {/* Puissance du jour — chiffre géant */}
            <section className="p3-power">
              <div className="p3-power-ghost">{pct}</div>
              <div className="p3-power-main">
                <div className="p3-power-score">{score}<small>/{max} XP</small></div>
                <div className="p3-power-title">
                  {ratio >= 1 ? 'PARFAIT !' : ratio >= 0.75 ? 'EN FEU' : ratio >= 0.4 ? 'BELLE LANCÉE' : 'À TOI DE JOUER'}
                </div>
                <div className="p3-power-bar"><div style={{ width: `${pct}%` }} /></div>
                <div className="p3-power-sub">
                  <b>{done.length}</b>/{dayQuests.length} quêtes · {pct}% de ta puissance
                </div>
              </div>
            </section>

            {/* Quêtes */}
            <h2 className="p3-section">TES QUÊTES DU JOUR</h2>
            <div className="p3-quests">
              {dayQuests.map((q) => {
                const isDone = log.completed.includes(q.id)
                const cfg = DIFFICULTY[q.difficulty]
                return (
                  <div key={q.id} className={`p3-quest ${isDone ? 'p3-quest-done' : ''}`}>
                    <div className="p3-quest-in">
                      <span className="p3-quest-icon">{q.icon}</span>
                      <div className="p3-quest-body">
                        <div className="p3-quest-label">{q.label}</div>
                        <div className="p3-quest-meta">+{q.xp} XP · {cfg.dot} {cfg.label}</div>
                      </div>
                      <span className="p3-quest-check">{isDone ? '✓' : ''}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ——— Colonne droite ——— */}
          <div className="p3-col">
            <section className="p3-panel">
              <div className="p3-panel-head"><span>TA COURBE</span><small>14 JOURS</small></div>
              <P3Curve state={state} />
              <div className="p3-curve-stats">
                <Stat label="AUJOURD'HUI" value={score} hot />
                <Stat label="RECORD" value={recordScore(state)} />
                <Stat label="MOYENNE" value={avgScore(state)} />
              </div>
            </section>

            <section className="p3-panel">
              <div className="p3-panel-head"><span>MOMENT POSITIF</span><small className="p3-ok">✓ OK</small></div>
              <div className="p3-dialogue">
                {log.positiveEvent || <span className="p3-dim">Qu'est-ce qui t'a fait du bien aujourd'hui ?</span>}
              </div>
            </section>
          </div>
        </div>

        <p className="p3-foot">MAQUETTE ALTERNATIVE · STYLE PERSONA 3 RELOAD</p>
      </div>
    </div>
  )
}

function Stat({ label, value, hot }: { label: string; value: number; hot?: boolean }) {
  return (
    <div className={`p3-statcell ${hot ? 'p3-statcell-hot' : ''}`}>
      <div className="p3-statval">{value}</div>
      <div className="p3-statlabel">{label}</div>
    </div>
  )
}

function P3Curve({ state }: { state: ReturnType<typeof usePersistentState>[0] }) {
  const keys = lastNDays(14)
  const max = Math.max(state.quests.reduce((s, q) => s + q.xp, 0), 1)
  const scores = keys.map((k) => dayScore(state.logs[k], state.quests))
  const W = 320, H = 120, pad = 8
  const innerW = W - pad * 2, innerH = H - pad * 2 - 14
  const pts = scores.map((s, i) => ({ x: pad + (innerW * i) / (keys.length - 1), y: pad + innerH * (1 - s / max) }))
  const line = pts.map((p, i) => (i ? `L ${p.x} ${p.y}` : `M ${p.x} ${p.y}`)).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="p3-curve">
      <path d={`${line} L ${pts[pts.length - 1].x} ${pad + innerH} L ${pts[0].x} ${pad + innerH} Z`} fill="rgba(49,165,247,0.2)" />
      <path d={line} fill="none" stroke="#31A5F7" strokeWidth="3" strokeLinecap="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={i === pts.length - 1 ? 4.5 : 2} fill={i === pts.length - 1 ? '#FAEE45' : '#31A5F7'} />
      ))}
      {keys.map((k, i) => i % 2 === 0 && (
        <text key={k} x={pts[i].x} y={H - 2} textAnchor="middle" fontSize="7.5" fill="#ABD5F6">{weekdayShort(k).toUpperCase()}</text>
      ))}
    </svg>
  )
}

function recordScore(state: ReturnType<typeof usePersistentState>[0]): number {
  return Math.max(0, ...lastNDays(14).map((k) => dayScore(state.logs[k], state.quests)))
}
function avgScore(state: ReturnType<typeof usePersistentState>[0]): number {
  const v = lastNDays(14).map((k) => dayScore(state.logs[k], state.quests))
  return Math.round(v.reduce((a, b) => a + b, 0) / v.length)
}
