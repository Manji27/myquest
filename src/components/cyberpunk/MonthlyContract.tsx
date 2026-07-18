import { useMemo, useState } from 'react'
import type { AppState, MonthlyContract } from '../../types'
import {
  daysRemainingInMonth,
  migrateContracts,
  monthKey,
  monthLabel,
} from '../../lib/contracts'

type Props = {
  state: AppState
  setState: (updater: (state: AppState) => AppState) => void
}

type ContractDraft = {
  title: string
  description: string
  steps: string[]
}

const EMPTY_STEPS = [
  'Définir la première étape',
  'Préparer le terrain',
  'Passer à l’action',
  'Finaliser la mission',
]

function toDraft(contract?: MonthlyContract): ContractDraft {
  return {
    title: contract?.title ?? '',
    description: contract?.description ?? '',
    steps: contract?.steps.map((step) => step.label) ?? EMPTY_STEPS,
  }
}

export function MonthlyContractBoard({ state, setState }: Props) {
  const currentMonth = monthKey()
  const contracts = useMemo(
    () => migrateContracts(state.contracts).monthly,
    [state.contracts],
  )
  const contract = contracts.find((item) => item.month === currentMonth)
  const archived = contracts.filter(
    (item) => item.completedAt || item.month < currentMonth,
  )
  const [editorOpen, setEditorOpen] = useState(false)
  const [protocolOpen, setProtocolOpen] = useState(false)
  const [draft, setDraft] = useState<ContractDraft>(() => toDraft(contract))

  function openEditor() {
    setDraft(toDraft(contract))
    setEditorOpen(true)
  }

  function updateContract(updater: (contract: MonthlyContract) => MonthlyContract) {
    if (!contract) return
    setState((previous) => {
      const next = migrateContracts(previous.contracts)
      return {
        ...previous,
        contracts: {
          monthly: next.monthly.map((item) =>
            item.id === contract.id ? updater(item) : item,
          ),
        },
      }
    })
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
    const steps = draft.steps.map((step) => step.trim()).filter(Boolean)
    if (!title || !description || steps.length === 0) return

    setState((previous) => {
      const next = migrateContracts(previous.contracts)
      const current = next.monthly.find((item) => item.month === currentMonth)
      const edited: MonthlyContract = {
        id: current?.id ?? `monthly-${currentMonth}-${Date.now()}`,
        month: currentMonth,
        title,
        description,
        completedAt: current?.completedAt,
        steps: steps.map((label, index) => ({
          id: current?.steps[index]?.id ?? `step-${index + 1}`,
          label,
          completed: current?.steps[index]?.completed ?? false,
        })),
      }
      return {
        ...previous,
        contracts: {
          monthly: current
            ? next.monthly.map((item) => (item.id === current.id ? edited : item))
            : [...next.monthly, edited],
        },
      }
    })
    setEditorOpen(false)
  }

  if (!contract) {
    return (
      <>
        <section className="cp-contract cp-contract-empty">
          <div>
            <span className="cp-contract-kicker">Contrat mensuel // {monthLabel(currentMonth)}</span>
            <h2>Aucune mission active</h2>
            <p>Définis le défi personnel qui donnera une direction à ce mois.</p>
          </div>
          <button type="button" className="cp-contract-primary" onClick={openEditor}>
            + Configurer le contrat
          </button>
        </section>
        {editorOpen && (
          <ContractEditor
            draft={draft}
            setDraft={setDraft}
            onCancel={() => setEditorOpen(false)}
            onSave={saveDraft}
          />
        )}
      </>
    )
  }

  const completedSteps = contract.steps.filter((step) => step.completed).length
  const ratio = contract.steps.length > 0 ? completedSteps / contract.steps.length : 0
  const nextStep = contract.steps.find((step) => !step.completed)
  const ready = contract.steps.length > 0 && contract.steps.every((step) => step.completed)
  const remainingDays = daysRemainingInMonth(contract.month)

  return (
    <>
      <section className={`cp-contract ${contract.completedAt ? 'is-complete' : ''}`}>
        <span className="cp-contract-corner" />
        <div className="cp-contract-topline">
          <span className="cp-contract-kicker">
            Contrat mensuel // {monthLabel(contract.month)}
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
          <span className="cp-contract-index">OP-07</span>
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
          <button type="button" className="cp-contract-secondary" onClick={openEditor}>
            Modifier le contrat
          </button>
          <button type="button" className="cp-contract-secondary" onClick={() => setProtocolOpen(true)}>
            Voir les étapes
          </button>
          <button
            type="button"
            className="cp-contract-primary"
            onClick={completeContract}
            disabled={!ready || Boolean(contract.completedAt)}
          >
            {contract.completedAt ? '✓ Mission archivée' : 'Valider la mission'}
          </button>
        </div>

        {archived.length > 0 && (
          <details className="cp-contract-archives">
            <summary>Archives des contrats · {archived.length}</summary>
            <div>
              {archived.map((item) => (
                <span key={item.id}>
                  <b>{item.title}</b>
                  <small>{monthLabel(item.month)} · {item.completedAt ? 'accompli' : 'expiré'}</small>
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
        />
      )}
      {protocolOpen && (
        <ContractProtocol
          contract={contract}
          completedSteps={completedSteps}
          onToggleStep={toggleStep}
          onComplete={completeContract}
          onClose={() => setProtocolOpen(false)}
        />
      )}
    </>
  )
}

function ContractProtocol({
  contract,
  completedSteps,
  onToggleStep,
  onComplete,
  onClose,
}: {
  contract: MonthlyContract
  completedSteps: number
  onToggleStep: (stepId: string) => void
  onComplete: () => void
  onClose: () => void
}) {
  const ready = contract.steps.length > 0 && contract.steps.every((step) => step.completed)

  return (
    <div className="cp-contract-editor-backdrop" role="presentation">
      <section className="cp-contract-protocol-modal" role="dialog" aria-modal="true" aria-labelledby="contract-protocol-title">
        <div className="cp-contract-editor-head">
          <div>
            <span>Contrat mensuel // protocole</span>
            <h2 id="contract-protocol-title">{contract.title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer le protocole">×</button>
        </div>

        <div className="cp-contract-protocol-head">
          <span>Étapes hebdomadaires</span>
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
}: {
  draft: ContractDraft
  setDraft: React.Dispatch<React.SetStateAction<ContractDraft>>
  onCancel: () => void
  onSave: () => void
}) {
  const valid = draft.title.trim() && draft.description.trim() && draft.steps.some((step) => step.trim())

  return (
    <div className="cp-contract-editor-backdrop" role="presentation">
      <section className="cp-contract-editor" role="dialog" aria-modal="true" aria-labelledby="contract-editor-title">
        <div className="cp-contract-editor-head">
          <div>
            <span>Contrat personnel // configuration</span>
            <h2 id="contract-editor-title">Mission du mois</h2>
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
          <span>Étapes hebdomadaires</span>
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
