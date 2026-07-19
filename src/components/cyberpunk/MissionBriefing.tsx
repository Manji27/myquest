import { useMemo } from 'react'
import type { ReactNode } from 'react'
import type { AppState } from '../../types'
import { migrateContracts, monthKey, daysRemainingInMonth } from '../../lib/contracts'

/**
 * Bandeau « briefing » (Format A, ton Night City) affiché en tête du Journal :
 * rappelle l'état du contrat mensuel et renvoie vers l'onglet Missions d'un tap.
 * S'adapte à l'état (aucun contrat / en cours / deadline proche / bouclé).
 *
 * Ne couvre pour l'instant que le contrat MENSUEL (seul existant). La partie
 * « Hebdo x/y » viendra se glisser devant une fois les missions hebdomadaires
 * créées.
 */
export function MissionBriefing({
  state,
  onOpen,
}: {
  state: AppState
  onOpen: () => void
}) {
  const currentMonth = monthKey()
  const contract = useMemo(
    () => migrateContracts(state.contracts).monthly.find((c) => c.month === currentMonth),
    [state.contracts, currentMonth],
  )

  const daysLeft = daysRemainingInMonth(currentMonth)
  const done = contract?.steps.filter((s) => s.completed).length ?? 0
  const total = contract?.steps.length ?? 0
  const completed = Boolean(contract?.completedAt)
  const urgent = Boolean(contract) && !completed && daysLeft <= 3

  let ico = '◈'
  let structured = false
  let body: ReactNode
  if (!contract) {
    body = <>Aucun contrat ce mois — définis ta mission, choom</>
  } else if (completed) {
    ico = '✓'
    body = <>Contrat mensuel bouclé — rien à signaler, choom</>
  } else if (urgent) {
    ico = '⚠'
    // Titre insécable + méta fixe : tout tient sur une ligne, le titre se
    // tronque par « … » seulement s'il est très long.
    structured = true
    body = (
      <>
        <span className="b-main">{contract.title}</span>
        <span className="b-meta">
          plus que <span className="hot">{daysLeft} j</span> !
        </span>
      </>
    )
  } else {
    structured = true
    body = (
      <>
        <span className="b-main">{contract.title}</span>
        <span className="b-meta">
          <span className="sep">·</span>
          <span className="hot">{done}/{total}</span>
          <span className="sep">·</span>
          <span className="hot">{daysLeft} j</span>
        </span>
      </>
    )
  }

  return (
    <button
      type="button"
      className={`cp-mr-banner cp-briefing ${urgent ? 'warn' : ''}`}
      onClick={onOpen}
      aria-label="Voir mes missions"
    >
      <span className="ico">{ico}</span>
      <span className={`txt ${structured ? 'cp-brief-structured' : ''}`}>{body}</span>
      <span className="cta">Ouvrir ›</span>
    </button>
  )
}
