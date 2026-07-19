import { useMemo, useState } from 'react'
import type { AppState, ContractStep, MonthlyContract, WeeklyContract } from '../../types'
import {
  daysRemainingInMonth,
  daysRemainingInWeek,
  migrateContracts,
  monthKey,
  monthLabel,
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
}

const EMPTY_STEPS = [
  'Définir la première étape',
  'Préparer le terrain',
  'Passer à l’action',
  'Finaliser la mission',
]

function toDraft(contract?: ContractLike): ContractDraft {
  return {
    title: contract?.title ?? '',
    description: contract?.description ?? '',
    steps: contract?.steps.map((step) => step.label) ?? EMPTY_STEPS,
  }
}

// ——————————————————— Board générique ———————————————————

function ContractBoard<T extends ContractLike>({
  state,
  setState,
  cadence,
}: Props & { cadence: Cadence<T> }) {
  const contracts = useMemo(() => cadence.read(state), [state, cadence])
  const contract = contracts.find((item) => cadence.keyOf(item) === cadence.currentKey)
  const archived = contracts.filter(
    (item) => item.completedAt || cadence.keyOf(item) < cadence.currentKey,
  )
  const [editorOpen, setEditorOpen] = useState(false)
  const [protocolOpen, setProtocolOpen] = useState(false)
  const [draft, setDraft] = useState<ContractDraft>(() => toDraft(contract))

  function openEditor() {
    setDraft(toDraft(contract))
    setEditorOpen(true)
  }

  function updateContract(updater: (contract: T) => T) {
    if (!contract) return
    setState((prev) =>
      cadence.setList(
        prev,
        cadence.read(prev).map((item) => (item.id === contract.id ? updater(item) : item)),
      ),
    )
  }

  function toggleStep(stepId: string) {
    if (contract?.completedAt) return
    updateContract((item) => ({
      ...item,
      steps: item.steps.map((step) =>
        step.id === stepId ? { ...step, completed: !step.completed } : step,
      ),
    }))
  }

  function completeContract() {
    if (!contract || contract.completedAt || !contract.steps.every((step) => step.completed)) return
    updateContract((item) => ({ ...item, completedAt: new Date().toISOString() }))
  }

  function saveDraft() {
    const title = draft.title.trim()
    const description = draft.description.trim()
    const stepLabels = draft.steps.map((step) => step.trim()).filter(Boolean)
    if (!title || !description || stepLabels.length === 0) return

    setState((prev) => {
      const list = cadence.read(prev)
      const current = list.find((item) => cadence.keyOf(item) === cadence.currentKey)
      const steps: ContractStep[] = stepLabels.map((label, index) => ({
        id: current?.steps[index]?.id ?? `step-${index + 1}`,
        label,
        completed: current?.steps[index]?.completed ?? false,
      }))
      const edited = cadence.make({
        key: cadence.currentKey,
        id: current?.id ?? cadence.newId(cadence.currentKey),
        title,
        description,
        steps,
        completedAt: current?.completedAt,
      })
      return cadence.setList(
        prev,
        current ? list.map((item) => (item.id === current.id ? edited : item)) : [...list, edited],
      )
    })
    setEditorOpen(false)
  }

  if (!contract) {
    return (
      <>
        <section className="cp-contract cp-contract-empty">
          <div>
            <span className="cp-contract-kicker">{cadence.kicker} // {cadence.label(cadence.currentKey)}</span>
            <h2>{cadence.emptyTitle}</h2>
            <p>{cadence.emptyDesc}</p>
          </div>
          <button type="button" className="cp-contract-primary" onClick={openEditor}>
            {cadence.configureLabel}
          </button>
        </section>
        {editorOpen && (
          <ContractEditor
            draft={draft}
            setDraft={setDraft}
            onCancel={() => setEditorOpen(false)}
            onSave={saveDraft}
            title={cadence.editorTitle}
            stepsLabel={cadence.stepsLabel}
          />
        )}
      </>
    )
  }

  const completedSteps = contract.steps.filter((step) => step.completed).length
  const ratio = contract.steps.length > 0 ? completedSteps / contract.steps.length : 0
  const nextStep = contract.steps.find((step) => !step.completed)
  const ready = contract.steps.length > 0 && contract.steps.every((step) => step.completed)
  const remainingDays = cadence.daysRemaining(cadence.keyOf(contract))

  return (
    <>
      <section className={`cp-contract ${contract.completedAt ? 'is-complete' : ''}`}>
        <span className="cp-contract-corner" />
        <div className="cp-contract-topline">
          <span className="cp-contract-kicker">
            {cadence.kicker} // {cadence.label(cadence.keyOf(contract))}
          </span>
          <span className="cp-contract-status">
            <i />
            {contract.completedAt ? 'Archivé' : 'Mission active'}
          </span>
        </div>

        <div
          className="cp-contract-brief cp-contract-brief-trigger"
          role="button"
          tabIndex={0}
          aria-label={`Ouvrir le protocole du contrat ${contract.title}`}
          onClick={() => setProtocolOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              setProtocolOpen(true)
            }
          }}
        >
          <span className="cp-contract-index">{cadence.index}</span>
          <h2>{contract.title}</h2>
          <p>{contract.description}</p>

          <div className="cp-contract-next">
            <span>Prochaine étape</span>
            <strong>
              {contract.completedAt
                ? 'Contrat accompli'
                : nextStep?.label ?? 'Prêt pour validation finale'}
            </strong>
          </div>

          <div className="cp-contract-meta">
            <span><b>{completedSteps}</b>/{contract.steps.length} étapes</span>
            <span><b>{Math.round(ratio * 100)}%</b> synchronisé</span>
            {!contract.completedAt && (
              <span><b>{remainingDays}</b> jour{remainingDays > 1 ? 's' : ''} restant{remainingDays > 1 ? 's' : ''}</span>
            )}
          </div>
          <div className="cp-contract-progress" aria-label={`${completedSteps} étapes sur ${contract.steps.length}`}>
            <i style={{ width: `${ratio * 100}%` }} />
          </div>
          <span className="cp-contract-open-hint">Ouvrir le protocole ↗</span>
        </div>

        <div className="cp-contract-actions">
          <button
            type="button"
            className="cp-contract-secondary cp-contract-icon-btn"
            onClick={openEditor}
            aria-label="Modifier le contrat"
            title="Modifier le contrat"
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
            disabled={!ready || Boolean(contract.completedAt)}
            aria-label={contract.completedAt ? 'Mission archivée' : 'Valider la mission'}
            title={contract.completedAt ? 'Mission archivée' : 'Valider la mission'}
          >
            <img src={validateMissionIcon} alt="" />
            <span className="cp-contract-icon-label">
              {contract.completedAt ? 'Archivée' : 'Valider'}
            </span>
          </button>
        </div>

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
      </section>

      {editorOpen && (
        <ContractEditor
          draft={draft}
          setDraft={setDraft}
          onCancel={() => setEditorOpen(false)}
          onSave={saveDraft}
          title={cadence.editorTitle}
          stepsLabel={cadence.stepsLabel}
        />
      )}
      {protocolOpen && (
        <ContractProtocol
          contract={contract}
          completedSteps={completedSteps}
          onToggleStep={toggleStep}
          onComplete={completeContract}
          onClose={() => setProtocolOpen(false)}
          kicker={cadence.kicker}
          stepsLabel={cadence.stepsLabel}
        />
      )}
    </>
  )
}

// ——————————————————— Configs de cadence ———————————————————

const monthlyCadence: Cadence<MonthlyContract> = {
  currentKey: monthKey(),
  keyOf: (c) => c.month,
  label: monthLabel,
  daysRemaining: daysRemainingInMonth,
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
}

const weeklyCadence: Cadence<WeeklyContract> = {
  currentKey: weekKey(),
  keyOf: (c) => c.week,
  label: weekLabel,
  daysRemaining: daysRemainingInWeek,
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
  title,
  stepsLabel,
}: {
  draft: ContractDraft
  setDraft: React.Dispatch<React.SetStateAction<ContractDraft>>
  onCancel: () => void
  onSave: () => void
  title: string
  stepsLabel: string
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
          <button type="button" onClick={onCancel}>Annuler</button>
          <button type="button" onClick={onSave} disabled={!valid}>Enregistrer le contrat</button>
        </div>
      </section>
    </div>
  )
}
