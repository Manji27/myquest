import { useMemo, useState } from 'react'
import type { AppState } from '../../types'
import { computeStats } from '../../lib/stats'
import { ACHIEVEMENTS, isUnlocked } from '../../lib/achievements'
import { LifepathCard } from '../LifepathCard'
import { CYBERPUNK_ACHIEVEMENT_ART } from './achievementArt'
import { MonthlyContractBoard, WeeklyContractBoard } from './MonthlyContract'

type Tab = 'contrats' | 'succes'

const TABS: ReadonlyArray<{ id: Tab; label: string; tico: string; note: string }> = [
  { id: 'contrats', label: 'Contrats', tico: '◆', note: 'Objectifs actifs' },
  { id: 'succes', label: 'Succès', tico: '◇', note: 'Trophées débloqués' },
]

/**
 * Onglet « Missions » : hub des objectifs. Deux sous-onglets —
 * « Contrats » (le contrat mensuel, autrefois dans le Journal) et « Succès »
 * (les trophées, autrefois dupliqués dans Progression).
 */
export function MissionsBoard({
  state,
  setState,
  onTabChange,
}: {
  state: AppState
  setState: (updater: (s: AppState) => AppState) => void
  /** Son joué à chaque bascule de sous-onglet (optionnel). */
  onTabChange?: () => void
}) {
  const [tab, setTab] = useState<Tab>('contrats')
  const stats = useMemo(() => computeStats(state), [state])
  const unlocked = ACHIEVEMENTS.filter((a) => isUnlocked(a, stats)).length

  function switchTab(next: Tab) {
    if (next === tab) return
    onTabChange?.()
    setTab(next)
  }

  return (
    <div className="cp-missions">
      <nav className="cp-subtabs" aria-label="Catégories de missions">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`cp-subtab ${tab === t.id ? 'cp-subtab-active' : ''}`}
            aria-current={tab === t.id ? 'true' : undefined}
            onClick={() => switchTab(t.id)}
          >
            <span className="tico">{t.tico}</span>
            {t.label}
          </button>
        ))}
        <span className="cp-note cp-note-cyan cp-subtabs-note">
          {tab === 'succes'
            ? `${unlocked}/${ACHIEVEMENTS.length} débloqués`
            : TABS.find((t) => t.id === tab)?.note}
        </span>
      </nav>

      {tab === 'contrats' ? (
        <div className="cp-contract-stack">
          <WeeklyContractBoard state={state} setState={setState} />
          <MonthlyContractBoard state={state} setState={setState} />
        </div>
      ) : (
        <div className="cp-missions-grid">
          {ACHIEVEMENTS.map((a) => {
            const done = isUnlocked(a, stats)
            const value = a.value(stats)
            const art = CYBERPUNK_ACHIEVEMENT_ART[a.id]
            return (
              <LifepathCard
                key={a.id}
                title={a.title}
                desc={a.desc}
                unlocked={done}
                progress={[value, a.target]}
                art={
                  art ? (
                    <>
                      <img src={art} alt="" loading="lazy" decoding="async" />
                      {!done && <span className="hint">Verrouillé</span>}
                    </>
                  ) : (
                    <>
                      <span className="ico">{a.icon}</span>
                      {!done && <span className="hint">Verrouillé</span>}
                    </>
                  )
                }
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
