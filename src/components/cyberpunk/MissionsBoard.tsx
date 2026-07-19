import { useMemo, useState } from 'react'
import type { AppState } from '../../types'
import { computeStats } from '../../lib/stats'
import { ACHIEVEMENTS, isUnlocked } from '../../lib/achievements'
import { LifepathCard } from '../LifepathCard'
import { CYBERPUNK_ACHIEVEMENT_ART } from './achievementArt'

type Scope = 'hebdo' | 'mensuel'

const SCOPES: ReadonlyArray<{ id: Scope; label: string; tico: string; note: string }> = [
  { id: 'hebdo', label: 'Hebdomadaire', tico: '◆', note: 'Reset // 7 jours' },
  { id: 'mensuel', label: 'Mensuel', tico: '◇', note: 'Reset // 30 jours' },
]

/**
 * Onglet « Missions » : deux catégories switchables (hebdomadaire / mensuel).
 * Premier jet : chaque catégorie affiche la même grille de contrats que la
 * vitrine des succès (cartes Lifepath). Le contenu propre à chaque cadence
 * sera branché ensuite ; ici on met en place la structure et la bascule.
 */
export function MissionsBoard({
  state,
  onScopeChange,
}: {
  state: AppState
  /** Son joué à chaque bascule de sous-onglet (optionnel). */
  onScopeChange?: () => void
}) {
  const [scope, setScope] = useState<Scope>('hebdo')
  const stats = useMemo(() => computeStats(state), [state])

  function switchScope(next: Scope) {
    if (next === scope) return
    onScopeChange?.()
    setScope(next)
  }

  return (
    <div className="cp-missions">
      <nav className="cp-subtabs" aria-label="Catégories de missions">
        {SCOPES.map((s) => (
          <button
            key={s.id}
            className={`cp-subtab ${scope === s.id ? 'cp-subtab-active' : ''}`}
            aria-current={scope === s.id ? 'true' : undefined}
            onClick={() => switchScope(s.id)}
          >
            <span className="tico">{s.tico}</span>
            {s.label}
          </button>
        ))}
        <span className="cp-note cp-note-cyan cp-subtabs-note">
          {SCOPES.find((s) => s.id === scope)?.note}
        </span>
      </nav>

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
                    <img src={art} alt="" />
                    <span className="hint">{done ? 'Débloqué' : 'Verrouillé'}</span>
                  </>
                ) : (
                  <>
                    <span className="ico">{a.icon}</span>
                    <span className="hint">{done ? 'Débloqué' : 'Verrouillé'}</span>
                  </>
                )
              }
            />
          )
        })}
      </div>
    </div>
  )
}
