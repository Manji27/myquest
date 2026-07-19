import { useEffect, useMemo, useRef, useState } from 'react'
import { usePersistentState } from '../../lib/storage'
import { dayScore, levelFromXp, questsForDate, totalXp } from '../../lib/game'
import { DIFFICULTY } from '../../data/defaultQuests'
import { lastNDays, todayKey } from '../../lib/date'
import { useCloudSync } from '../../lib/useCloudSync'
import { Progression } from '../Progression'
import { Memories } from '../Memories'
import { DayNavigator } from '../DayNavigator'
import { SettingsModal } from './SettingsModal'
import { CYBERPUNK_ICON_BY_EMOJI, CYBERPUNK_QUEST_ICONS } from './questIcons'
import { MissionsBoard } from './MissionsBoard'
import { MissionBriefing } from './MissionBriefing'
import { useCyberpunkSounds } from './useCyberpunkSounds'
import previousDayIcon from '../../../references/cyberpunk-ui/cyberpunk-icons/nav-arrow-previous.png'
import nextDayIcon from '../../../references/cyberpunk-ui/cyberpunk-icons/nav-arrow-next.png'
import calendarIcon from '../../../references/cyberpunk-ui/cyberpunk-icons/ui-calendar.png'
import './cyberpunk.css'

/**
 * Maquette alternative de la page d'accueil au style Cyberpunk 2077.
 * Tech-noir Night City : rouge par défaut, cyan actif, jaune acide,
 * coins coupés, curseur cyan, annotations mono partout.
 * Design system : references/cyberpunk-ui/DESIGN-SYSTEM.md
 * Expérience principale de QuestLog.
 */
export function CyberpunkDashboard() {
  const rootRef = useRef<HTMLDivElement>(null)
  const [state, setState, applyRemote] = usePersistentState()
  const cloud = useCloudSync(state, applyRemote)
  const [view, setView] = useState<'jour' | 'missions' | 'stats' | 'souvenirs'>('jour')
  const [editorOpen, setEditorOpen] = useState(false)
  const [shardSaved, setShardSaved] = useState(false)
  const shardSavedTimer = useRef<number | undefined>(undefined)
  const shardInputRef = useRef<HTMLTextAreaElement>(null)
  const today = todayKey()
  const [selectedDate, setSelectedDate] = useState(today)
  const log = state.logs[selectedDate] ?? { date: selectedDate, completed: [], positiveEvent: '' }
  const dayQuests = useMemo(
    () => questsForDate(state.quests, selectedDate),
    [state.quests, selectedDate],
  )
  const questIconImages = useMemo(
    () => Object.fromEntries(
      state.quests.flatMap((quest) => {
        const src = CYBERPUNK_QUEST_ICONS[quest.id] ?? CYBERPUNK_ICON_BY_EMOJI[quest.icon]
        return src ? [[quest.id, src]] : []
      }),
    ),
    [state.quests],
  )
  const max = dayQuests.reduce((s, q) => s + q.xp, 0)
  const done = dayQuests.filter((q) => log.completed.includes(q.id))
  const score = done.reduce((s, q) => s + q.xp, 0)
  const ratio = max > 0 ? Math.min(score / max, 1) : 0
  const lvl = useMemo(() => levelFromXp(totalXp(state)), [state])
  const previousLevel = useRef(lvl.level)
  const { playTab, playValidation, playHover, playLevelUp } = useCyberpunkSounds()

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    function handlePointerOver(event: PointerEvent) {
      if (event.pointerType !== 'mouse' || !(event.target instanceof Element)) return

      const interactive = event.target.closest<HTMLElement>('button, [role="button"]')
      if (!interactive || !root?.contains(interactive)) return
      if (
        (interactive instanceof HTMLButtonElement && interactive.disabled)
        || interactive.getAttribute('aria-disabled') === 'true'
      ) return

      if (event.relatedTarget instanceof Node && interactive.contains(event.relatedTarget)) return
      playHover()
    }

    root.addEventListener('pointerover', handlePointerOver)
    return () => root.removeEventListener('pointerover', handlePointerOver)
  }, [playHover])

  useEffect(() => {
    if (lvl.level > previousLevel.current) playLevelUp()
    previousLevel.current = lvl.level
  }, [lvl.level, playLevelUp])

  /** Coche/décoche une quête (même state persistant que l'app principale). */
  function toggleQuest(id: string) {
    const wasCompleted = log.completed.includes(id)
    const completed = wasCompleted
      ? log.completed.filter((x) => x !== id)
      : [...log.completed, id]
    if (!wasCompleted) playValidation()
    setState((prev) => ({
      ...prev,
      logs: { ...prev.logs, [selectedDate]: { ...log, completed } },
    }))
  }

  function updatePositiveEvent(positiveEvent: string) {
    setState((prev) => ({
      ...prev,
      logs: { ...prev.logs, [selectedDate]: { ...log, positiveEvent } },
    }))
  }

  /**
   * Le moment positif est déjà sauvegardé à chaque frappe ; ce bouton donne un
   * retour explicite (son + confirmation) et referme le clavier sur mobile.
   */
  function confirmPositiveEvent() {
    playValidation()
    shardInputRef.current?.blur()
    setShardSaved(true)
    window.clearTimeout(shardSavedTimer.current)
    shardSavedTimer.current = window.setTimeout(() => setShardSaved(false), 1800)
  }

  function openJournalDay(key: string) {
    setSelectedDate(key)
    if (view !== 'jour') playTab()
    setView('jour')
  }

  function changeView(nextView: typeof view) {
    if (nextView === view) return
    playTab()
    setView(nextView)
  }

  return (
    <div className="cp-root" ref={rootRef}>
      {/* colonne de binaire en marge */}
      <div className="cp-binary">{'1001\n0011\n1101\n0001\n1111\n1010\n0110\n1001\n0011\n1011'}</div>

      <div className="cp-page">
        {/* ——— Barre du haut ——— */}
        <header className="cp-topbar">
          <div className="cp-stat cp-stat-cyan">
            <span className="n">{lvl.level}</span>
            <span className="lbl">Level</span>
            <span className="bar"><i style={{ width: `${Math.max(lvl.progress * 100, 3)}%` }} /></span>
          </div>
          <div className="cp-chips">
            <span className="cp-chip"><span className="ico">⚖</span>{done.length}/{dayQuests.length}</span>
            <button
              className="cp-settings"
              onClick={() => setEditorOpen(true)}
              aria-label="Réglages"
              title="Réglages"
            >
              ⚙
            </button>
          </div>
        </header>

        {/* ——— Nav ——— */}
        <nav className="cp-tabs">
          <span className="cp-tab-num">1</span>
          <button
            className={`cp-tab ${view === 'jour' ? 'cp-tab-active' : ''}`}
            aria-current={view === 'jour' ? 'page' : undefined}
            onClick={() => changeView('jour')}
          >
            <span className="tico">◆</span>Journal
          </button>
          <button
            className={`cp-tab ${view === 'missions' ? 'cp-tab-active' : ''}`}
            aria-current={view === 'missions' ? 'page' : undefined}
            onClick={() => changeView('missions')}
          >
            <span className="tico">◈</span>Missions
          </button>
          <button
            className={`cp-tab ${view === 'stats' ? 'cp-tab-active' : ''}`}
            aria-current={view === 'stats' ? 'page' : undefined}
            onClick={() => changeView('stats')}
          >
            <span className="tico">◇</span>Stats
          </button>
          <button
            className={`cp-tab ${view === 'souvenirs' ? 'cp-tab-active' : ''}`}
            aria-current={view === 'souvenirs' ? 'page' : undefined}
            onClick={() => changeView('souvenirs')}
          >
            <span className="tico">▣</span>Souvenirs
          </button>
          <span className="cp-tab-num">4</span>
        </nav>

        {view === 'missions' ? (
          <div className="cp-base-view cp-missions-view">
            <div className="cp-view-heading">
              <span className="cp-fold" />
              <div>
                <span className="cp-view-kicker">Registre des objectifs</span>
                <h2>Missions</h2>
              </div>
              <span className="cp-note cp-note-cyan">Contracts // objectives</span>
            </div>
            <MissionsBoard state={state} setState={setState} onTabChange={playTab} />
          </div>
        ) : view === 'stats' ? (
          <div className="cp-base-view cp-progression-view">
            <div className="cp-view-heading">
              <span className="cp-fold" />
              <div>
                <span className="cp-view-kicker">Données mercenaire</span>
                <h2>Stats</h2>
              </div>
              <span className="cp-note cp-note-cyan">Analytics // live feed</span>
            </div>
            <section className="cp-panel" style={{ marginTop: 14 }}>
              <span className="cp-fold" />
              <div className="cp-panel-head">
                <h3>Puissance · 14 jours</h3>
                <span className="sub">Tendance récente</span>
              </div>
              <CpCurve state={state} />
              <div className="cp-curve-stats">
                <div className="cp-statcell"><div className="val">{score}</div><div className="lbl">Aujourd'hui</div></div>
                <div className="cp-statcell"><div className="val">{recordScore(state)}</div><div className="lbl">Record</div></div>
                <div className="cp-statcell"><div className="val">{avgScore(state)}</div><div className="lbl">Moyenne</div></div>
              </div>
            </section>
            <Progression
              state={state}
              setState={setState}
              cloud={cloud}
              onOpenDay={openJournalDay}
              cyberpunkUi
              variant="stats"
              questIconImages={questIconImages}
            />
          </div>
        ) : view === 'souvenirs' ? (
          <div className="cp-base-view cp-memories-view">
            <div className="cp-view-heading">
              <span className="cp-fold" />
              <div>
                <span className="cp-view-kicker">Archives datashard</span>
                <h2>Souvenirs</h2>
              </div>
              <span className="cp-note cp-note-cyan">Memory bank // indexed</span>
            </div>
            <Memories state={state} onOpenDay={openJournalDay} cyberpunkUi />
          </div>
        ) : (
          <>
        <div className="cp-day-nav">
          <DayNavigator
            value={selectedDate}
            today={today}
            state={state}
            onChange={setSelectedDate}
            previousIcon={previousDayIcon}
            nextIcon={nextDayIcon}
            calendarIcon={calendarIcon}
          />
        </div>

        <MissionBriefing state={state} onOpen={() => changeView('missions')} />

        <div className="cp-grid">
          {/* ——— Colonne gauche ——— */}
          <div>
            {/* Puissance du jour */}
            <section className="cp-panel">
              <span className="cp-fold" />
              <div className="cp-panel-head">
                <h3>Skill progression</h3>
                <span className="sub">Puissance du jour</span>
              </div>
              <div className="cp-power">
                <div className="cp-power-num">
                  {Math.round(ratio * 100)}<span className="pct">%</span>
                </div>
                <div className="cp-power-body">
                  <div className={`cp-ticks ${ratio >= 1 ? 'cp-ticks-full' : ''}`}>
                    <i style={{ width: `${Math.max(ratio * 100, 2)}%` }} />
                  </div>
                  <div className="cp-power-meta">
                    <span><span className="c">{score}</span>/{max} XP</span>
                    <span><span className="r">{lvl.needed - lvl.current}</span> XP → LVL {lvl.level + 1}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Quêtes du jour */}
            <section className="cp-panel">
              <span className="cp-fold" />
              <div className="cp-panel-head">
                <h3>◆ Quêtes du jour</h3>
                <span className="sub">{done.length}/{dayQuests.length} accomplies</span>
              </div>
              <div className="cp-rows">
                {dayQuests.map((q) => {
                  const isDone = log.completed.includes(q.id)
                  const cfg = DIFFICULTY[q.difficulty]
                  const iconImage = questIconImages[q.id]
                  return (
                    <div
                      key={q.id}
                      className={`cp-row ${isDone ? 'cp-row-done' : ''}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleQuest(q.id)}
                      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleQuest(q.id)}
                    >
                      <span className="cp-row-icon">
                        {iconImage ? <img src={iconImage} alt="" /> : q.icon}
                      </span>
                      <div>
                        <div className="cp-row-label">{q.label}</div>
                        <div className="cp-row-meta">
                          <span className="cp-row-xp">{q.xp} XP</span>
                          <span>{cfg.label}</span>
                        </div>
                      </div>
                      {isDone && <span className="cp-cursor" />}
                      <span className="cp-row-check">{isDone ? '✓' : ''}</span>
                    </div>
                  )
                })}
              </div>
            </section>
          </div>

          {/* ——— Colonne droite ——— */}
          <div>
            {/* Moment positif — datashard */}
            <div className="cp-shard">
              <div className="cp-shard-title"><span className="ico">▮</span>Datashard · moment positif</div>
              <textarea
                ref={shardInputRef}
                className="cp-shard-input"
                value={log.positiveEvent}
                onChange={(event) => updatePositiveEvent(event.target.value)}
                rows={4}
                placeholder="Qu'est-ce qui t'a fait du bien aujourd'hui, choom ?"
                aria-label="Moment positif du jour"
              />
              <div className="cp-shard-actions">
                <span className={`cp-shard-saved ${shardSaved ? 'is-visible' : ''}`} aria-live="polite">
                  ✓ Enregistré
                </span>
                <button
                  type="button"
                  className="cp-shard-save"
                  onClick={confirmPositiveEvent}
                  disabled={!log.positiveEvent.trim()}
                >
                  Valider
                </button>
              </div>
              <div className="cp-note" style={{ marginTop: 8 }}>2394823.234423.PORT://4324 database report 23002CA_3478</div>
            </div>

            {/* Sync */}
            <div className="cp-sync">
              <span className="cp-note">Connection 201.89.43</span>
              <span className="cp-sync-status cp-sync-off"><span className="cp-led" />OFFLINE</span>
            </div>
          </div>
        </div>

        <p className="cp-note" style={{ textAlign: 'center' }}>
          NC 4884 0252 5584 0415 · interface principale · protocole QuestLog
        </p>
          </>
        )}
      </div>

      {/* ——— Pied : hints touches ——— */}
      <footer className="cp-foot">
        <span className="cp-note">Protocol 6520-A44 // Kiroshi optics</span>
        <div className="cp-keys">
          <span><span className="cp-key">F</span> Valider</span>
          <span><span className="cp-key">ESC</span> Retour</span>
        </div>
      </footer>

      {editorOpen && (
        <SettingsModal
          state={state}
          setState={setState}
          cloud={cloud}
          questIconImages={questIconImages}
          onClose={() => setEditorOpen(false)}
        />
      )}
    </div>
  )
}

/** Courbe cyan sur grille rouge : points carrés, dernier jour en jaune. */
function CpCurve({ state }: { state: ReturnType<typeof usePersistentState>[0] }) {
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
    <svg viewBox={`0 0 ${W} ${H}`} className="cp-curve">
      {[0.25, 0.5, 0.75].map((f) => (
        <line
          key={f}
          x1={pad} x2={W - pad}
          y1={pad + innerH * f} y2={pad + innerH * f}
          stroke="rgba(198,62,57,0.28)" strokeWidth={0.6} strokeDasharray="2 4"
        />
      ))}
      <polygon points={area} fill="rgba(73,216,230,0.13)" />
      <polyline
        points={line} fill="none" stroke="#49d8e6" strokeWidth={1.6}
        style={{ filter: 'drop-shadow(0 0 4px rgba(94,242,255,0.55))' }}
      />
      {pts.map((p, i) => (
        <rect
          key={i}
          x={p.x - 2} y={p.y - 2} width={4} height={4}
          fill={i === pts.length - 1 ? '#ffd640' : '#56e2ea'}
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
