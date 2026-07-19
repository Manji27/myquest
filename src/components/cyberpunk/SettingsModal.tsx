import { useState } from 'react'
import type { AppState } from '../../types'
import type { CloudSync } from '../../lib/useCloudSync'
import { QuestManager } from '../QuestManager'
import { Progression } from '../Progression'

type Tab = 'quetes' | 'compte'

/**
 * Modale « Réglages » unifiée (ouverte par l'engrenage). Regroupe ce qui était
 * éparpillé : la gestion des quêtes (ex-« Mes quêtes ») et les réglages de
 * compte/données (sync cloud, rappels, sauvegarde) auparavant noyés dans la
 * page Progression.
 */
export function SettingsModal({
  state,
  setState,
  cloud,
  questIconImages,
  onClose,
}: {
  state: AppState
  setState: (updater: (s: AppState) => AppState) => void
  cloud: CloudSync
  questIconImages?: Readonly<Record<string, string>>
  onClose: () => void
}) {
  const [tab, setTab] = useState<Tab>('quetes')

  return (
    <div
      className="quest-editor-backdrop quest-editor-cyberpunk fixed inset-0 z-40 flex items-center justify-center p-4 bg-[#0b1020]/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="quest-editor-shell glass rounded-3xl w-full max-w-lg max-h-[88vh] flex flex-col p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="quest-editor-header flex items-center justify-between mb-3 shrink-0">
          <div>
            <span className="quest-editor-kicker">System // config</span>
            <h2 className="text-xl font-extrabold">Réglages</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="quest-editor-close rounded-full w-9 h-9 grid place-items-center text-lg bg-white/5 hover:bg-white/10 active:scale-90 transition"
          >
            ✕
          </button>
        </div>

        <div className="cp-settings-tabs shrink-0">
          <button
            className={`cp-settings-tab ${tab === 'quetes' ? 'cp-settings-tab-active' : ''}`}
            aria-current={tab === 'quetes' ? 'true' : undefined}
            onClick={() => setTab('quetes')}
          >
            Quêtes
          </button>
          <button
            className={`cp-settings-tab ${tab === 'compte' ? 'cp-settings-tab-active' : ''}`}
            aria-current={tab === 'compte' ? 'true' : undefined}
            onClick={() => setTab('compte')}
          >
            Compte & données
          </button>
        </div>

        <div className="cp-settings-body flex-1 overflow-y-auto -mr-1 pr-1">
          {tab === 'quetes' ? (
            <QuestManager state={state} setState={setState} theme="cyberpunk" />
          ) : (
            <div className="cp-base-view cp-progression-view">
              <Progression
                state={state}
                setState={setState}
                cloud={cloud}
                onOpenDay={() => {}}
                cyberpunkUi
                variant="settings"
                questIconImages={questIconImages}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
