import { useMemo, useState } from 'react'
import type { AppState, ContractStep, MonthlyContract, WeeklyContract } from '../../types'
import {
  daysRemainingInMonth,
  daysRemainingInWeek,
  migrateContracts,
  monthKey,
  monthLabel,
  nextMonthKeys,
  nextWeekKeys,
  weekKey,
  weekLabel,
} from '../../lib/contracts'
import editContractIcon from '../../../references/cyberpunk-ui/cyberpunk-icons/quest-ecriture.png'
import viewStepsIcon from '../../../references/cyberpunk-ui/cyberpunk-icons/ui-memory-archive.png'
import validateMissionIcon from '../../../references/cyberpunk-ui/cyberpunk-icons/quest-objectif.png'

type Props = {
  state: AppState
  setState: (updater: (state: AppState) => AppState) => void
}

type ContractDraft = {
  period: string
  title: string
  description: string
  steps: string[]
}

/** Forme commune aux contrats mensuels et hebdomadaires. */
type ContractLike = {
  id: string
  title: string
  description: string
  steps: ContractStep[]
  completedAt?: string
}

/** Décrit une cadence (mensuelle ou hebdomadaire) pour le board générique. */
type Cadence<T extends ContractLike> = {
  currentKey: string
  keyOf: (contract: T) => string
  label: (key: string) => string
  daysRemaining: (key: string) => number
  upcoming: () => string[]
  read: (state: AppState) => T[]
  setList: (state: AppState, list: T[]) => AppState
  make: (args: {
    key: string
    id: string
    title: string
    description: string
    steps: ContractStep[]
    completedAt?: string
  }) => T
  newId: (key: string) => string
  kicker: string
  index: string
  emptyTitle: string
  emptyDesc: string
  editorTitle: string
  stepsLabel: string
  configureLabel: string
  planLabel: string
}

const EMPTY_STEPS = [
  'Définir la première étape',
  'Préparer le terrain',
  'Passer à l’action',
  'Finaliser la mission',
]

type Editing<T> = { mode: 'create' } | { mode: 'edit'; contract: T } | null

// ——————————————————— Board / gestionnaire générique ———————————————————

function ContractBoard<T extends ContractLike>({
  state,
  setState,
  cadence,
}: Props & { cadence: Cadence<T> }) {
  const contracts = useMemo(() => cadence.read(state), [state, cadence])
  const current = contracts.find((item) => cadence.keyOf(item) === cadence.currentKey)
  const upcoming = contracts
    .filter((item) => cadence.keyOf(item) > cadence.currentKey)
    .sort((a, b) => cadence.keyOf(a).localeCompare(cadence.keyOf(b)))
  const archived = contracts
    .filter((item) => item.completedAt || cadence.keyOf(item) < cadence.currentKey)
    .sort((a, b) => cadence.keyOf(b).localeCompare(cadence.keyOf(a)))

  const [editing, setEditing] = useState<Editing<T>>(null)
  const [protocolOpen, setProtocolOpen] = useState(false)
  const [draft, setDraft] = useState<ContractDraft>({
    period: cadence.currentKey,
    title: '',
    description: '',
    steps: [...EMPTY_STEPS],
  })

  /** Première période à venir encore libre (sinon la période courante). */
  function firstFreePeriod(): string {
    const taken = new Set(contracts.map((item) => cadence.keyOf(item)))
    return cadence.upcoming().find((key) => !taken.has(key)) ?? cadence.currentKey
  }

  function openCreate() {
    setDraft({ period: firstFreePeriod(), title: '', description: '', steps: [...EMPTY_STEPS] })
    setEditing({ mode: 'create' })
  }

  function openEdit(contract: T) {
    setDraft({
      period: cadence.keyOf(contract),
      title: contract.title,
      description: contract.description,
      steps: contract.steps.map((step) => step.label),
    })
    setEditing({ mode: 'edit', contract })
  }

  function updateContract(target: T, updater: (contract: T) => T) {
    setState((prev) =>
      cadence.setList(
        prev,
        cadence.read(prev).map((item) => (item.id === target.id ? updater(item) : item)),
      ),
    )
  }

  function toggleStep(stepId: string) {
    if (!current || current.completedAt) return
    updateContract(current, (item) => ({
      ...item,
      steps: item.steps.map((step) =>
        step.id === stepId ? { ...step, completed: !step.completed } : step,
      ),
    }))
  }

  function completeContract() {
    if (!current || current.completedAt || !current.steps.every((step) => step.completed)) return
    updateContract(current, (item) => ({ ...item, completedAt: new Date().toISOString() }))
  }

  function saveDraft() {
    const title = draft.title.trim()
    const description = draft.description.trim()
    const stepLabels = draft.steps.map((step) => step.trim()).filter(Boolean)
    if (!title || !description || stepLabels.length === 0) return
    const targetPeriod = draft.period
    const base = editing?.mode === 'edit' ? editing.contract : undefined

    setState((prev) => {
      const list = cadence.read(prev)
      const existing = base ?? list.find((item) => cadence.keyOf(item) === targetPeriod)
      const steps: ContractStep[] = stepLabels.map((label, index) => ({
        id: existing?.steps[index]?.id ?? `step-${index + 1}`,
        label,
        completed: existing?.steps[index]?.completed ?? false,
      }))
      const edited = cadence.make({
        key: targetPeriod,
        id: existing?.id ?? cadence.newId(targetPeriod),
        title,
        description,
        steps,
        completedAt: existing?.completedAt,
      })
      const without = list.filter(
        (item) => item.id !== existing?.id && cadence.keyOf(item) !== targetPeriod,
      )
      return cadence.setList(prev, [...without, edited])
    })
    setEditing(null)
  }

  function deleteContract(contract: T) {
    setState((prev) =>
      cadence.setList(
        prev,
        cadence.read(prev).filter((item) => item.id !== contract.id),
      ),
    )
    setEditing(null)
  }

  const completedSteps = current?.steps.filter((step) => step.completed).length ?? 0
  const ratio = current && current.steps.length > 0 ? completedSteps / current.steps.length : 0
  const nextStep = current?.steps.find((step) => !step.completed)
  const ready = Boolean(current && current.steps.length > 0 && current.steps.every((step) => step.completed))
  const remainingDays = current ? cadence.daysRemaining(cadence.keyOf(current)) : 0

  return (
    <div className="cp-contract-manager">
      {current ? (
        <section className={`cp-contract ${current.completedAt ? 'is-complete' : ''}`}>
          <span className="cp-contract-corner" />
          <div className="cp-contract-topline">
            <span className="cp-contract-kicker">
              {cadence.kicker} // {cadence.label(cadence.keyOf(current))}
            </span>
            <span className="cp-contract-status">
              <i />
              {current.completedAt ? 'Archivé' : 'Mission active'}
            </span>
          </div>

          <div
            className="cp-contract-brief cp-contract-brief-trigger"
            role="button"
            tabIndex={0}
            aria-label={`Ouvrir le protocole du contrat ${current.title}`}
            onClick={() => setProtocolOpen(true)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                setProtocolOpen(true)
              }
            }}
          >
            <span className="cp-contract-index">{cadence.index}</span>
            <h2>{current.title}</h2>
            <p>{current.description}</p>

            <div className="cp-contract-next">
              <span>Prochaine étape</span>
              <strong>
                {current.completedAt
                  ? 'Contrat accompli'
                  : nextStep?.label ?? 'Prêt pour validation finale'}
              </strong>
            </div>

            <div className="cp-contract-meta">
              <span><b>{completedSteps}</b>/{current.steps.length} étapes</span>
              <span><b>{Math.round(ratio * 100)}%</b> synchronisé</span>
              {!current.completedAt && (
                <span><b>{remainingDays}</b> jour{remainingDays > 1 ? 's' : ''} restant{remainingDays > 1 ? 's' : ''}</span>
              )}
            </div>
            <div className="cp-contract-progress" aria-label={`${completedSteps} étapes sur ${current.steps.length}`}>
              <i style={{ width: `${ratio * 100}%` }} />
            </div>
            <span className="cp-contract-open-hint">Ouvrir le protocole ↗</span>
          </div>

          <div className="cp-contract-actions">
            <button
              type="button"
              className="cp-contract-secondary cp-contract-icon-btn"
              onClick={() => openEdit(current)}
              aria-label="Modifier la mission"
              title="Modifier la mission"
            >
              <img src={editContractIcon} alt="" />
              <span className="cp-contract-icon-label">Modifier</span>
            </button>
            <button
              type="button"
              className="cp-contract-secondary cp-contract-icon-btn"
              onClick={() => setProtocolOpen(true)}
              aria-label="Voir les étapes"
              title="Voir les étapes"
            >
              <img src={viewStepsIcon} alt="" />
              <span className="cp-contract-icon-label">Étapes</span>
            </button>
            <button
              type="button"
              className="cp-contract-primary cp-contract-icon-btn"
              onClick={completeContract}
              disabled={!ready || Boolean(current.completedAt)}
              aria-label={current.completedAt ? 'Mission archivée' : 'Valider la mission'}
              title={current.completedAt ? 'Mission archivée' : 'Valider la mission'}
            >
              <img src={validateMissionIcon} alt="" />
              <span className="cp-contract-icon-label">
                {current.completedAt ? 'Archivée' : 'Valider'}
              </span>
            </button>
          </div>
        </section>
      ) : (
        <section className="cp-contract cp-contract-empty">
          <div>
            <span className="cp-contract-kicker">{cadence.kicker} // {cadence.label(cadence.currentKey)}</span>
            <h2>{cadence.emptyTitle}</h2>
            <p>{cadence.emptyDesc}</p>
          </div>
          <button type="button" className="cp-contract-primary" onClick={openCreate}>
            {cadence.configureLabel}
          </button>
        </section>
      )}

      {/* Missions préparées à l'avance (périodes futures) */}
      {(upcoming.length > 0 || current) && (
        <div className="cp-contract-plan">
          <div className="cp-contract-plan-head">
            <span>À venir · {upcoming.length}</span>
            <button type="button" className="cp-contract-plan-add" onClick={openCreate}>
              {cadence.planLabel}
            </button>
          </div>
          {upcoming.map((item) => (
            <div key={item.id} className="cp-contract-plan-row">
              <button
                type="button"
                className="cp-contract-plan-main"
                onClick={() => openEdit(item)}
                aria-label={`Modifier la mission ${item.title}`}
              >
                <span className="cp-contract-plan-period">{cadence.label(cadence.keyOf(item))}</span>
                <span className="cp-contract-plan-title">{item.title}</span>
              </button>
              <button
                type="button"
                className="cp-contract-plan-del"
                onClick={() => deleteContract(item)}
                aria-label={`Supprimer la mission ${item.title}`}
                title="Supprimer"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {archived.length > 0 && (
        <details className="cp-contract-archives">
          <summary>Archives · {archived.length}</summary>
          <div>
            {archived.map((item) => (
              <span key={item.id}>
                <b>{item.title}</b>
                <small>{cadence.label(cadence.keyOf(item))} · {item.completedAt ? 'accompli' : 'expiré'}</small>
              </span>
            ))}
          </div>
        </details>
      )}

      {editing && (
        <ContractEditor
          draft={draft}
          setDraft={setDraft}
          onCancel={() => setEditing(null)}
          onSave={saveDraft}
          onDelete={editing.mode === 'edit' ? () => deleteContract(editing.contract) : undefined}
          title={cadence.editorTitle}
          stepsLabel={cadence.stepsLabel}
          periods={editing.mode === 'create'
            ? cadence.upcoming().map((key) => ({
                key,
                label: cadence.label(key),
                taken: contracts.some((item) => cadence.keyOf(item) === key),
              }))
            : undefined}
          fixedPeriodLabel={editing.mode === 'edit' ? cadence.label(draft.period) : undefined}
        />
      )}
      {protocolOpen && current && (
        <ContractProtocol
          contract={current}
          completedSteps={completedSteps}
          onToggleStep={toggleStep}
          onComplete={completeContract}
          onClose={() => setProtocolOpen(false)}
          kicker={cadence.kicker}
          stepsLabel={cadence.stepsLabel}
        />
      )}
    </div>
  )
}

// ——————————————————— Configs de cadence ———————————————————

const monthlyCadence: Cadence<MonthlyContract> = {
  currentKey: monthKey(),
  keyOf: (c) => c.month,
  label: monthLabel,
  daysRemaining: daysRemainingInMonth,
  upcoming: () => nextMonthKeys(6),
  read: (state) => migrateContracts(state.contracts).monthly,
  setList: (state, list) => ({
    ...state,
    contracts: { ...migrateContracts(state.contracts), monthly: list },
  }),
  make: ({ key, id, title, description, steps, completedAt }) => ({
    id,
    month: key,
    title,
    description,
    steps,
    completedAt,
  }),
  newId: (key) => `monthly-${key}-${Date.now()}`,
  kicker: 'Contrat mensuel',
  index: 'OP-07',
  emptyTitle: 'Aucune mission active',
  emptyDesc: 'Définis le défi personnel qui donnera une direction à ce mois.',
  editorTitle: 'Mission du mois',
  stepsLabel: 'Étapes de la mission',
  configureLabel: '+ Configurer le contrat mensuel',
  planLabel: '+ Préparer un mois',
}

const weeklyCadence: Cadence<WeeklyContract> = {
  currentKey: weekKey(),
  keyOf: (c) => c.week,
  label: weekLabel,
  daysRemaining: daysRemainingInWeek,
  upcoming: () => nextWeekKeys(8),
  read: (state) => migrateContracts(state.contracts).weekly,
  setList: (state, list) => ({
    ...state,
    contracts: { ...migrateContracts(state.contracts), weekly: list },
  }),
  make: ({ key, id, title, description, steps, completedAt }) => ({
    id,
    week: key,
    title,
    description,
    steps,
    completedAt,
  }),
  newId: (key) => `weekly-${key}-${Date.now()}`,
  kicker: 'Mission hebdo',
  index: 'OP-W',
  emptyTitle: 'Aucune mission cette semaine',
  emptyDesc: 'Définis un défi exigeant à relever d’ici la fin de la semaine.',
  editorTitle: 'Mission de la semaine',
  stepsLabel: 'Étapes de la semaine',
  configureLabel: '+ Configurer la mission hebdo',
  planLabel: '+ Préparer une semaine',
}

export function MonthlyContractBoard({ state, setState }: Props) {
  return <ContractBoard state={state} setState={setState} cadence={monthlyCadence} />
}

export function WeeklyContractBoard({ state, setState }: Props) {
  return <ContractBoard state={state} setState={setState} cadence={weeklyCadence} />
}

// ——————————————————— Sous-modales partagées ———————————————————

function ContractProtocol({
  contract,
  completedSteps,
  onToggleStep,
  onComplete,
  onClose,
  kicker,
  stepsLabel,
}: {
  contract: ContractLike
  completedSteps: number
  onToggleStep: (stepId: string) => void
  onComplete: () => void
  onClose: () => void
  kicker: string
  stepsLabel: string
}) {
  const ready = contract.steps.length > 0 && contract.steps.every((step) => step.completed)

  return (
    <div className="cp-contract-editor-backdrop" role="presentation">
      <section className="cp-contract-protocol-modal" role="dialog" aria-modal="true" aria-labelledby="contract-protocol-title">
        <div className="cp-contract-editor-head">
          <div>
            <span>{kicker} // protocole</span>
            <h2 id="contract-protocol-title">{contract.title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer le protocole">×</button>
        </div>

        <div className="cp-contract-protocol-head">
          <span>{stepsLabel}</span>
          <span>{completedSteps}/{contract.steps.length}</span>
        </div>
        <div className="cp-contract-steps">
          {contract.steps.map((step, index) => (
            <button
              type="button"
              key={step.id}
              className={`cp-contract-step ${step.completed ? 'is-done' : ''}`}
              onClick={() => onToggleStep(step.id)}
              disabled={Boolean(contract.completedAt)}
            >
              <span className="cp-contract-step-num">{String(index + 1).padStart(2, '0')}</span>
              <span className="cp-contract-step-box">{step.completed ? '✓' : ''}</span>
              <span>{step.label}</span>
            </button>
          ))}
        </div>

        <div className="cp-contract-editor-actions">
          <button type="button" onClick={onClose}>Retour</button>
          <button
            type="button"
            onClick={onComplete}
            disabled={!ready || Boolean(contract.completedAt)}
          >
            {contract.completedAt ? 'Mission archivée' : 'Valider la mission'}
          </button>
        </div>
      </section>
    </div>
  )
}

function ContractEditor({
  draft,
  setDraft,
  onCancel,
  onSave,
  onDelete,
  title,
  stepsLabel,
  periods,
  fixedPeriodLabel,
}: {
  draft: ContractDraft
  setDraft: React.Dispatch<React.SetStateAction<ContractDraft>>
  onCancel: () => void
  onSave: () => void
  onDelete?: () => void
  title: string
  stepsLabel: string
  /** Liste des périodes sélectionnables (création) ; absente en édition. */
  periods?: { key: string; label: string; taken: boolean }[]
  /** Libellé de période figé (édition d'une mission existante). */
  fixedPeriodLabel?: string
}) {
  const valid = draft.title.trim() && draft.description.trim() && draft.steps.some((step) => step.trim())

  return (
    <div className="cp-contract-editor-backdrop" role="presentation">
      <section className="cp-contract-editor" role="dialog" aria-modal="true" aria-labelledby="contract-editor-title">
        <div className="cp-contract-editor-head">
          <div>
            <span>Contrat personnel // configuration</span>
            <h2 id="contract-editor-title">{title}</h2>
          </div>
          <button type="button" onClick={onCancel} aria-label="Fermer">×</button>
        </div>

        {periods ? (
          <div className="cp-contract-period">
            <span>Période</span>
            <div className="cp-contract-period-chips">
              {periods.map((p) => (
                <button
                  type="button"
                  key={p.key}
                  className={`cp-contract-period-chip ${draft.period === p.key ? 'is-active' : ''} ${p.taken ? 'is-taken' : ''}`}
                  onClick={() => setDraft((current) => ({ ...current, period: p.key }))}
                >
                  {p.label}{p.taken ? ' ·' : ''}
                </button>
              ))}
            </div>
          </div>
        ) : (
          fixedPeriodLabel && (
            <div className="cp-contract-period">
              <span>Période</span>
              <div className="cp-contract-period-fixed">{fixedPeriodLabel}</div>
            </div>
          )
        )}

        <label>
          Nom du contrat
          <input
            value={draft.title}
            onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
            placeholder="Ex. Premier contact"
          />
        </label>
        <label>
          Objectif
          <textarea
            rows={3}
            value={draft.description}
            onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
            placeholder="Décris le résultat concret à atteindre."
          />
        </label>

        <div className="cp-contract-editor-steps">
          <span>{stepsLabel}</span>
          {draft.steps.map((step, index) => (
            <label key={index}>
              <b>{String(index + 1).padStart(2, '0')}</b>
              <input
                value={step}
                onChange={(event) => setDraft((current) => ({
                  ...current,
                  steps: current.steps.map((value, stepIndex) =>
                    stepIndex === index ? event.target.value : value,
                  ),
                }))}
              />
            </label>
          ))}
        </div>

        <div className="cp-contract-editor-actions">
          {onDelete && (
            <button type="button" className="cp-contract-editor-del" onClick={onDelete}>Supprimer</button>
          )}
          <button type="button" onClick={onCancel}>Annuler</button>
          <button type="button" onClick={onSave} disabled={!valid}>Enregistrer le contrat</button>
        </div>
      </section>
    </div>
  )
}
