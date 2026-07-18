import { useMemo } from 'react'
import { usePersistentState } from '../../lib/storage'
import { dayScore, levelFromXp, questsForDate, totalXp, currentStreak } from '../../lib/game'
import { DIFFICULTY } from '../../data/defaultQuests'
import { lastNDays, prettyDate, todayKey, weekdayShort } from '../../lib/date'
import { ffxAssets } from '../../assets/ffx'
import './ffx.css'

/**
 * Maquette alternative de la page d'accueil au style Final Fantasy X
 * (verre bleu translucide, barres-pilules à dégradé, perles de valeur, accents or).
 * Accessible via ?ffx — n'altère pas l'app principale.
 */
export function FFXDashboard() {
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

  return (
    <div className="ffx-root">
      <div className="ffx-watermark" />
      <div className="ffx-page">
        {/* ——— En-tête ——— */}
        <header className="ffx-header">
          <div>
            <div className="ffx-date">{prettyDate(today)}</div>
            <h1 className="ffx-title">QuestLog</h1>
          </div>
          <div className="ffx-header-right">
            <div className="ffx-pill ffx-streak">
              <span className="ffx-streak-icon">✦</span>
              <b>{streak}</b>
              <span className="ffx-dim">j</span>
            </div>
            <button className="ffx-bead ffx-iconbtn" title="Réglages">⚙</button>
          </div>
        </header>

        {/* ——— Barre de niveau (pilule) ——— */}
        <div className="ffx-bar ffx-level">
          <span className="ffx-bead ffx-level-bead">{lvl.level}</span>
          <span className="ffx-level-label">Niveau {lvl.level}</span>
          <div className="ffx-level-track">
            <div className="ffx-level-fill" style={{ width: `${Math.max(lvl.progress * 100, 4)}%` }} />
          </div>
          <span className="ffx-level-xp">{lvl.current} / {lvl.needed} XP</span>
        </div>

        {/* ——— Onglets ——— */}
        <nav className="ffx-tabs">
          <button className="ffx-tab ffx-tab-active">
            <img src={ffxAssets.tabJournal} alt="" className="ffx-tab-icon" />Journal
          </button>
          <button className="ffx-tab">
            <img src={ffxAssets.tabProgression} alt="" className="ffx-tab-icon" />Progression
          </button>
          <button className="ffx-tab">
            <img src={ffxAssets.tabSouvenirs} alt="" className="ffx-tab-icon" />Souvenirs
          </button>
        </nav>

        {/* ——— Navigation date ——— */}
        <div className="ffx-bar ffx-daynav">
          <button className="ffx-navarrow">‹</button>
          <div className="ffx-daynav-center">
            <span className="ffx-dim">AUJOURD'HUI</span>
            <b>{prettyDate(today)}</b>
          </div>
          <button className="ffx-navarrow">›</button>
        </div>

        <div className="ffx-grid">
          {/* ——— Colonne gauche ——— */}
          <div className="ffx-col">
            {/* Puissance du jour */}
            <section className="ffx-panel ffx-power">
              <FFXGauge ratio={ratio} score={score} max={max} />
              <div className="ffx-power-info">
                <div className="ffx-power-title">
                  {ratio >= 1 ? 'Journée parfaite' : ratio >= 0.75 ? 'En feu' : ratio >= 0.4 ? 'Belle lancée' : 'À toi de jouer'}
                </div>
                <div className="ffx-dim">{Math.round(ratio * 100)}% de ta puissance du jour</div>
                <ul className="ffx-power-stats">
                  <li><span className="ffx-bead ffx-mini">{done.length}</span> / {dayQuests.length} quêtes accomplies</li>
                  <li><span className="ffx-bead ffx-mini">{lvl.needed - lvl.current}</span> XP avant le niveau {lvl.level + 1}</li>
                </ul>
              </div>
            </section>

            {/* Quêtes */}
            <h2 className="ffx-section-title">Tes quêtes du jour</h2>
            <div className="ffx-quests">
              {dayQuests.map((q) => {
                const isDone = log.completed.includes(q.id)
                const cfg = DIFFICULTY[q.difficulty]
                return (
                  <div key={q.id} className={`ffx-bar ffx-quest ${isDone ? 'ffx-quest-done' : ''}`}>
                    <span className="ffx-quest-icon">{q.icon}</span>
                    <div className="ffx-quest-body">
                      <div className="ffx-quest-label">{q.label}</div>
                      <div className="ffx-quest-meta">
                        <span style={{ color: 'var(--ffx-gold)' }}>+{q.xp} XP</span>
                        <span className="ffx-dim">{cfg.dot} {cfg.label}</span>
                      </div>
                    </div>
                    <span className={`ffx-check ${isDone ? 'ffx-check-on' : ''}`}>{isDone ? '✓' : ''}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ——— Colonne droite ——— */}
          <div className="ffx-col">
            <section className="ffx-panel">
              <div className="ffx-panel-head">
                <span>Ta courbe de productivité</span>
                <span className="ffx-dim">14 derniers jours</span>
              </div>
              <FFXCurve state={state} />
              <div className="ffx-curve-stats">
                <Stat label="Aujourd'hui" value={score} />
                <Stat label="Record" value={recordScore(state)} />
                <Stat label="Moyenne" value={avgScore(state)} />
              </div>
            </section>

            <section className="ffx-panel">
              <div className="ffx-panel-head">
                <span>📜 Le moment positif du jour</span>
                <span className="ffx-ok">✓ Enregistré</span>
              </div>
              <div className="ffx-dialogue">
                {log.positiveEvent || <span className="ffx-dim">Qu'est-ce qui t'a fait du bien aujourd'hui ?</span>}
              </div>
            </section>
          </div>
        </div>

        <p className="ffx-foot">Maquette alternative · style Final Fantasy X</p>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="ffx-statcell">
      <div className="ffx-statval">{value}</div>
      <div className="ffx-dim ffx-statlabel">{label}</div>
    </div>
  )
}

/** Jauge circulaire façon FFX (anneau froid, or quand plein). */
function FFXGauge({ ratio, score, max }: { ratio: number; score: number; max: number }) {
  const size = 132
  const stroke = 12
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const high = ratio >= 0.8
  return (
    <div className="ffx-gauge" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="ffx-gauge-svg">
        <defs>
          <linearGradient id="ffxg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={high ? '#F0C24C' : '#7482A1'} />
            <stop offset="100%" stopColor={high ? '#F0A020' : '#3AA0E0'} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#ffxg)" strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - ratio)}
          style={{ transition: 'stroke-dashoffset 0.7s ease-out' }}
        />
      </svg>
      <div className="ffx-gauge-center">
        <span className="ffx-gauge-score">{score}</span>
        <span className="ffx-dim">/ {max} XP</span>
      </div>
    </div>
  )
}

function FFXCurve({ state }: { state: ReturnType<typeof usePersistentState>[0] }) {
  const keys = lastNDays(14)
  const max = Math.max(state.quests.reduce((s, q) => s + q.xp, 0), 1)
  const scores = keys.map((k) => dayScore(state.logs[k], state.quests))
  const W = 320, H = 120, pad = 8
  const innerW = W - pad * 2, innerH = H - pad * 2 - 14
  const pts = scores.map((s, i) => ({
    x: pad + (innerW * i) / (keys.length - 1),
    y: pad + innerH * (1 - s / max),
  }))
  const line = pts.map((p, i) => (i ? `L ${p.x} ${p.y}` : `M ${p.x} ${p.y}`)).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="ffx-curve">
      <line x1={pad} y1={pad + innerH * 0.2} x2={W - pad} y2={pad + innerH * 0.2} stroke="#F0C24C" strokeOpacity="0.35" strokeDasharray="4 4" />
      <path d={`${line} L ${pts[pts.length - 1].x} ${pad + innerH} L ${pts[0].x} ${pad + innerH} Z`} fill="rgba(58,160,224,0.18)" />
      <path d={line} fill="none" stroke="#9fd0f0" strokeWidth="2.5" strokeLinecap="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={i === pts.length - 1 ? 4 : 2} fill={i === pts.length - 1 ? '#F0C24C' : '#9fd0f0'} />
      ))}
      {keys.map((k, i) => i % 2 === 0 && (
        <text key={k} x={pts[i].x} y={H - 2} textAnchor="middle" fontSize="7.5" fill="#AAB5C8">{weekdayShort(k)}</text>
      ))}
    </svg>
  )
}

function recordScore(state: ReturnType<typeof usePersistentState>[0]): number {
  const vals = lastNDays(14).map((k) => dayScore(state.logs[k], state.quests))
  return Math.max(0, ...vals)
}
function avgScore(state: ReturnType<typeof usePersistentState>[0]): number {
  const vals = lastNDays(14).map((k) => dayScore(state.logs[k], state.quests))
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
}
