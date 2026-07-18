import { useMemo } from 'react'
import { usePersistentState } from '../../lib/storage'
import { dayScore, levelFromXp, questsForDate, totalXp, currentStreak } from '../../lib/game'
import { DIFFICULTY } from '../../data/defaultQuests'
import { lastNDays, todayKey } from '../../lib/date'
import './pragmata.css'

/**
 * Maquette alternative de la page d'accueil au style Pragmata (Capcom).
 * NASA-punk : panneaux navy à grille de points et chrome cyan, sélection
 * cobalt à crochets, objectifs orange, annotations mono, scanlines.
 * Design system : references/pragmata-ui/DESIGN-SYSTEM.md
 * Accessible via ?pragmata — n'altère pas l'app principale.
 */
export function PragmataDashboard() {
  const [state, setState] = usePersistentState()
  const today = todayKey()
  const log = state.logs[today] ?? { date: today, completed: [], positiveEvent: '' }

  /** Coche/décoche une quête (même state persistant que l'app principale). */
  function toggleQuest(id: string) {
    const completed = log.completed.includes(id)
      ? log.completed.filter((x) => x !== id)
      : [...log.completed, id]
    setState((prev) => ({
      ...prev,
      logs: { ...prev.logs, [today]: { ...log, completed } },
    }))
  }
  const dayQuests = useMemo(() => questsForDate(state.quests, today), [state.quests, today])
  const max = dayQuests.reduce((s, q) => s + q.xp, 0)
  const done = dayQuests.filter((q) => log.completed.includes(q.id))
  const score = done.reduce((s, q) => s + q.xp, 0)
  const ratio = max > 0 ? Math.min(score / max, 1) : 0
  const lvl = useMemo(() => levelFromXp(totalXp(state)), [state])
  const streak = currentStreak(state)
  const remaining = dayQuests.length - done.length

  const objective =
    remaining === 0 && dayQuests.length > 0
      ? 'Journée parfaite — secteur sécurisé'
      : remaining === dayQuests.length
        ? 'Lancer la routine du jour'
        : `Accomplir ${remaining} quête${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''}`

  return (
    <div className="prg-root">
      {/* cadre écran */}
      <div className="prg-frame"><i /><i /><i /><i /></div>

      <div className="prg-page">
        {/* ——— En-tête ——— */}
        <header className="prg-header">
          <div>
            <div className="prg-breadcrumb">
              <span className="prg-note">Shelter log</span>
              <span className="prg-note">{today}</span>
              <span className="prg-note">Signal: live</span>
            </div>
            <h1 className="prg-title">Quest<span>Log</span></h1>
          </div>
          <div className="prg-chips">
            <div className="prg-chip" title="Série de jours">
              <span className="prg-chip-icon">🔥</span>
              <span className="prg-chip-val">{streak}</span>
              <span className="prg-chip-unit">J</span>
            </div>
            <div className="prg-chip" title="Niveau">
              <span className="prg-chip-icon">◆</span>
              <span className="prg-chip-val">{lvl.level}</span>
              <span className="prg-chip-unit">LV</span>
            </div>
          </div>
        </header>

        {/* ——— HUD niveau ——— */}
        <div className="prg-hud">
          <div className="prg-hud-lv">
            <span className="lv">LV.</span>
            <span className="n">{lvl.level}</span>
          </div>
          <div className="prg-hud-bar">
            <div className="prg-hud-xp">
              <span>{lvl.current} / {lvl.needed} XP</span>
              <span className="prg-note">Next: LV.{lvl.level + 1}</span>
            </div>
            <div className="prg-track">
              <div className="prg-track-fill" style={{ width: `${Math.max(lvl.progress * 100, 2)}%` }} />
            </div>
          </div>
        </div>

        {/* ——— Onglets ——— */}
        <nav className="prg-tabs">
          <span className="prg-key">Q</span>
          <button className="prg-tab prg-tab-active">Journal</button>
          <button className="prg-tab">Progression</button>
          <button className="prg-tab">Souvenirs</button>
          <span className="prg-key">E</span>
        </nav>

        {/* ——— Bannière objectif ——— */}
        <div className="prg-objective">
          <div className="prg-objective-rule"><span className="prg-diamond" /></div>
          <div className="prg-objective-text">
            <span className="prg-chev">»&#8202;»&nbsp;&nbsp;</span>
            {objective}
            <span className="prg-chev">&nbsp;&nbsp;«&#8202;«</span>
          </div>
        </div>

        <div className="prg-grid">
          {/* ——— Colonne gauche ——— */}
          <div>
            {/* Puissance du jour */}
            <section className="prg-panel">
              <span className="prg-corner prg-corner-tl" /><span className="prg-corner prg-corner-tr" />
              <span className="prg-corner prg-corner-bl" /><span className="prg-corner prg-corner-br" />
              <span className="prg-note prg-panel-note-tl">Pwr · core status</span>
              <span className="prg-note prg-panel-note-br">109.42.890</span>
              <span className="prg-ghost">01</span>
              <div className="prg-power">
                <PrgGauge ratio={ratio} score={score} max={max} />
                <div className="prg-power-info">
                  <div className="prg-power-title">
                    {ratio >= 1 ? 'Journée parfaite' : ratio >= 0.75 ? 'En feu' : ratio >= 0.4 ? 'Belle lancée' : 'À toi de jouer'}
                  </div>
                  <div className="prg-power-sub">{Math.round(ratio * 100)} % de ta puissance du jour</div>
                  <ul className="prg-stat-lines">
                    <li>
                      <span className="prg-mini-diamond" />
                      <span className="v">{done.length}/{dayQuests.length}</span> quêtes accomplies
                    </li>
                    <li>
                      <span className="prg-mini-diamond orange" />
                      <span className="v">{lvl.needed - lvl.current}</span> XP avant le niveau {lvl.level + 1}
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Quêtes du jour */}
            <div className="prg-secbar">Quêtes du jour</div>
            <div className="prg-rows">
              {dayQuests.map((q, i) => {
                const isDone = log.completed.includes(q.id)
                const cfg = DIFFICULTY[q.difficulty]
                return (
                  <div
                    key={q.id}
                    className={`prg-row ${isDone ? 'prg-row-done' : ''}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleQuest(q.id)}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleQuest(q.id)}
                  >
                    {isDone && (
                      <>
                        <span className="prg-hook prg-hook-tl" /><span className="prg-hook prg-hook-tr" />
                        <span className="prg-hook prg-hook-bl" /><span className="prg-hook prg-hook-br" />
                      </>
                    )}
                    <span className="prg-row-num">{String(i + 1).padStart(2, '0')}</span>
                    <span className="prg-row-icon">{q.icon}</span>
                    <div>
                      <div className="prg-row-label">{q.label}</div>
                      <div className="prg-row-meta">
                        <span className="prg-row-xp">+{q.xp} XP</span>
                        <span className="prg-row-diff">{cfg.dot} {cfg.label}</span>
                      </div>
                    </div>
                    <span className="prg-row-check">{isDone ? '✓' : ''}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ——— Colonne droite ——— */}
          <div>
            <section className="prg-panel">
              <span className="prg-corner prg-corner-tl" /><span className="prg-corner prg-corner-tr" />
              <span className="prg-corner prg-corner-bl" /><span className="prg-corner prg-corner-br" />
              <span className="prg-ghost">02</span>
              <div className="prg-panel-head">
                <h3>Courbe de productivité</h3>
                <span className="sub">14 derniers jours</span>
              </div>
              <PrgCurve state={state} />
              <div className="prg-curve-stats">
                <div className="prg-statcell"><div className="val">{score}</div><div className="lbl">Aujourd'hui</div></div>
                <div className="prg-statcell"><div className="val">{recordScore(state)}</div><div className="lbl">Record</div></div>
                <div className="prg-statcell"><div className="val">{avgScore(state)}</div><div className="lbl">Moyenne</div></div>
              </div>
            </section>

            <section className="prg-panel">
              <span className="prg-corner prg-corner-tl" /><span className="prg-corner prg-corner-tr" />
              <span className="prg-corner prg-corner-bl" /><span className="prg-corner prg-corner-br" />
              <span className="prg-note prg-panel-note-br">REC · 002</span>
              <div className="prg-quote-title">Le moment positif du jour</div>
              {log.positiveEvent ? (
                <p className="prg-quote">{log.positiveEvent}</p>
              ) : (
                <p className="prg-quote empty">Qu'est-ce qui t'a fait du bien aujourd'hui ?</p>
              )}
            </section>

            <section className="prg-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <span className="prg-note">Cabin system · sync</span>
              <span className="prg-led-chip">
                <span className="prg-led prg-led-off" />
                OFFLINE
              </span>
            </section>
          </div>
        </div>

        <p className="prg-note" style={{ textAlign: 'center', marginTop: 8 }}>
          Maquette alternative · style Pragmata · V.2.4.1
        </p>
      </div>

      {/* ——— Pied : hints touches ——— */}
      <footer className="prg-foot">
        <span className="prg-note">Cradle operating system</span>
        <div style={{ pointerEvents: 'auto' }}>
          <div className="prg-foot-ctx" style={{ textAlign: 'right', marginBottom: 4 }}>
            {remaining > 0 ? 'Valide tes quêtes du jour.' : 'Secteur sécurisé.'}
          </div>
          <div className="prg-foot-keys">
            <span><span className="prg-key">F</span> Valider</span>
            <span><span className="prg-key">Q</span> Retour</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

/** Jauge radiale façon anneau de hacking : arcs cyan segmentés + anneaux décoratifs. */
function PrgGauge({ ratio, score, max }: { ratio: number; score: number; max: number }) {
  const size = 148
  const c = size / 2
  const rProg = 62
  const circ = 2 * Math.PI * rProg
  return (
    <div className="prg-gauge" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        {/* anneau extérieur pointillé */}
        <circle cx={c} cy={c} r={70} fill="none" stroke="rgba(87,200,255,0.3)" strokeWidth={1} strokeDasharray="2 5" />
        {/* piste */}
        <circle cx={c} cy={c} r={rProg} fill="none" stroke="rgba(87,200,255,0.15)" strokeWidth={8} strokeDasharray="14 3" />
        {/* progression (arcs segmentés) */}
        <circle
          cx={c} cy={c} r={rProg} fill="none"
          stroke="#57c8ff" strokeWidth={8}
          strokeDasharray={`${circ * ratio} ${circ}`}
          transform={`rotate(-90 ${c} ${c})`}
          style={{ filter: 'drop-shadow(0 0 6px rgba(87,200,255,0.7))', transition: 'stroke-dasharray 0.7s ease-out' }}
        />
        {/* segments de masque pour l'effet arc segmenté */}
        <circle cx={c} cy={c} r={rProg} fill="none" stroke="#030608" strokeWidth={10} strokeDasharray="2 22" />
        {/* anneau intérieur */}
        <circle cx={c} cy={c} r={48} fill="none" stroke="rgba(245,146,27,0.35)" strokeWidth={1} strokeDasharray="8 4" />
        {/* crochets d'arc (haut) */}
        <path d={`M ${c - 8} ${c - 74} h -6 v 5`} fill="none" stroke="#7fd4ff" strokeWidth={1.4} />
        <path d={`M ${c + 8} ${c - 74} h 6 v 5`} fill="none" stroke="#7fd4ff" strokeWidth={1.4} />
      </svg>
      <div className="prg-gauge-center">
        <span className="prg-gauge-score">{score}</span>
        <span className="prg-gauge-max">/ {max} XP</span>
        <span className="prg-gauge-mode">{ratio >= 1 ? 'Complete' : ratio > 0 ? 'Connecting' : 'Standby'}</span>
      </div>
    </div>
  )
}

/** Courbe wireframe cyan : grille pointillée, aires translucides, points carrés. */
function PrgCurve({ state }: { state: ReturnType<typeof usePersistentState>[0] }) {
  const keys = lastNDays(14)
  const maxScore = Math.max(state.quests.reduce((s, q) => s + q.xp, 0), 1)
  const scores = keys.map((k) => dayScore(state.logs[k], state.quests))
  const W = 340, H = 110, pad = 10
  const innerW = W - pad * 2
  const innerH = H - pad * 2
  const pts = scores.map((s, i) => ({
    x: pad + (innerW * i) / (keys.length - 1),
    y: pad + innerH * (1 - Math.min(s / maxScore, 1)),
  }))
  const line = pts.map((p) => `${p.x},${p.y}`).join(' ')
  const area = `${pad},${H - pad} ${line} ${W - pad},${H - pad}`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="prg-curve">
      {/* grille pointillée */}
      {[0.25, 0.5, 0.75].map((f) => (
        <line
          key={f}
          x1={pad} x2={W - pad}
          y1={pad + innerH * f} y2={pad + innerH * f}
          stroke="rgba(87,200,255,0.15)" strokeWidth={0.6} strokeDasharray="2 4"
        />
      ))}
      <polygon points={area} fill="rgba(36,86,232,0.18)" />
      <polyline
        points={line} fill="none" stroke="#57c8ff" strokeWidth={1.6}
        style={{ filter: 'drop-shadow(0 0 4px rgba(87,200,255,0.6))' }}
      />
      {pts.map((p, i) => (
        <rect
          key={i}
          x={p.x - 2} y={p.y - 2} width={4} height={4}
          fill={i === pts.length - 1 ? '#f5921b' : '#7fe3ff'}
          transform={`rotate(45 ${p.x} ${p.y})`}
        />
      ))}
    </svg>
  )
}

function recordScore(state: ReturnType<typeof usePersistentState>[0]): number {
  return Object.values(state.logs).reduce((m, l) => Math.max(m, dayScore(l, state.quests)), 0)
}

function avgScore(state: ReturnType<typeof usePersistentState>[0]): number {
  const keys = lastNDays(14)
  const scores = keys.map((k) => dayScore(state.logs[k], state.quests))
  return Math.round(scores.reduce((a, b) => a + b, 0) / keys.length)
}
