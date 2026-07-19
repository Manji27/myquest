import { useMemo } from 'react'
import type { ReactNode } from 'react'
import type { AppState } from '../../types'
import {
  migrateContracts,
  monthKey,
  weekKey,
  daysRemainingInMonth,
  daysRemainingInWeek,
} from '../../lib/contracts'

/**
 * Bandeau « briefing » (ton Night City) en tête du Journal : rappelle l'état
 * des missions hebdo & mensuelle et renvoie vers l'onglet Missions d'un tap.
 * S'adapte : deux missions actives / une seule / tout bouclé, avec alerte
 * lorsque la deadline approche.
 */
export function MissionBriefing({
  state,
  onOpen,
}: {
  state: AppState
  onOpen: () => void
}) {
  const { weekly, monthly } = useMemo(() => {
    const c = migrateContracts(state.contracts)
    return {
      weekly: c.weekly.find((x) => x.week === weekKey()),
      monthly: c.monthly.find((x) => x.month === monthKey()),
    }
  }, [state.contracts])

  const wActive = Boolean(weekly && !weekly.completedAt)
  const mActive = Boolean(monthly && !monthly.completedAt)
  const wDone = weekly?.steps.filter((s) => s.completed).length ?? 0
  const wTotal = weekly?.steps.length ?? 0
  const mDone = monthly?.steps.filter((s) => s.completed).length ?? 0
  const mTotal = monthly?.steps.length ?? 0
  const wDays = weekly ? daysRemainingInWeek(weekly.week) : 0
  const mDays = monthly ? daysRemainingInMonth(monthly.month) : 0
  const urgent = (wActive && wDays <= 2) || (mActive && mDays <= 3)
  const activeCount = (wActive ? 1 : 0) + (mActive ? 1 : 0)

  let ico = '◈'
  let structured = false
  let body: ReactNode

  if (activeCount === 0) {
    ico = '✓'
    body = <>Missions à jour — rien à signaler, choom</>
  } else if (activeCount === 2) {
    if (urgent) ico = '⚠'
    body = (
      <span className="b-compact">
        Hebdo <span className="hot">{wDone}/{wTotal}</span>
        <span className="sep">·</span>
        Mensuel <span className="hot">{mDone}/{mTotal}</span>
      </span>
    )
  } else {
    structured = true
    if (urgent) ico = '⚠'
    const active = wActive
      ? { title: weekly!.title, done: wDone, total: wTotal, days: wDays }
      : { title: monthly!.title, done: mDone, total: mTotal, days: mDays }
    body = (
      <>
        <span className="b-main">{active.title}</span>
        <span className="b-meta">
          <span className="sep">·</span>
          <span className="hot">{active.done}/{active.total}</span>
          <span className="sep">·</span>
          <span className="hot">{active.days} j</span>
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
