import { useState } from 'react'
import type { AppState, Difficulty, QuestDef } from '../types'
import { DIFFICULTY } from '../data/defaultQuests'
import { formatRecurrence } from '../lib/game'
import { QuestForm } from './QuestForm'
import { QuestGlyph } from './PixelIcon'
import { CYBERPUNK_ICON_BY_EMOJI } from './cyberpunk/questIcons'

type Props = {
  state: AppState
  setState: (updater: (s: AppState) => AppState) => void
  onClose: () => void
  /** ouvre directement le formulaire de création */
  startInNew?: boolean
  theme?: 'default' | 'cyberpunk'
}

function uid() {
  return 'q' + Math.random().toString(36).slice(2, 9)
}

type Editing = { mode: 'new' } | { mode: 'edit'; quest: QuestDef } | null

export function QuestEditor({ state, setState, onClose, startInNew, theme = 'default' }: Props) {
  const [editing, setEditing] = useState<Editing>(startInNew ? { mode: 'new' } : null)
  const cyberpunk = theme === 'cyberpunk'

  // depuis l'ajout rapide, on revient au tableau de bord ; sinon on revient à la liste
  function leaveNew() {
    if (startInNew) onClose()
    else setEditing(null)
  }

  type FormData = { label: string; icon: string; color: string; difficulty: Difficulty; days: number[] }

  function saveNew(data: FormData) {
    const q: QuestDef = { id: uid(), xp: DIFFICULTY[data.difficulty].xp, ...data }
    setState((s) => ({ ...s, quests: [...s.quests, q] }))
    leaveNew()
  }

  function saveEdit(id: string, data: FormData) {
    setState((s) => ({
      ...s,
      quests: s.quests.map((q) =>
        q.id === id ? { ...q, ...data, xp: DIFFICULTY[data.difficulty].xp } : q,
      ),
    }))
    setEditing(null)
  }

  function removeQuest(id: string) {
    setState((s) => ({ ...s, quests: s.quests.filter((q) => q.id !== id) }))
    setEditing(null)
  }

  return (
    <div
      className={`quest-editor-backdrop fixed inset-0 z-40 flex items-center justify-center p-4 bg-[#0b1020]/80 backdrop-blur-sm ${cyberpunk ? 'quest-editor-cyberpunk' : ''}`}
      onClick={onClose}
    >
      <div
        className="quest-editor-shell glass rounded-3xl w-full max-w-lg max-h-[88vh] flex flex-col p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="quest-editor-header flex items-center justify-between mb-4 shrink-0">
          <div>
            {cyberpunk && <span className="quest-editor-kicker">Quest database // config</span>}
            <h2 className="text-xl font-extrabold">
            {editing ? (editing.mode === 'new' ? 'Nouvelle quête' : 'Modifier la quête') : 'Mes quêtes'}
            </h2>
          </div>
          <button
            onClick={() => (editing ? setEditing(null) : onClose())}
            aria-label="Fermer"
            className="quest-editor-close rounded-full w-9 h-9 grid place-items-center text-lg bg-white/5 hover:bg-white/10 active:scale-90 transition"
          >
            ✕
          </button>
        </div>

        {editing ? (
          editing.mode === 'new' ? (
            <QuestForm onSave={saveNew} onCancel={leaveNew} theme={theme} />
          ) : (
            <QuestForm
              initial={editing.quest}
              onSave={(data) => saveEdit(editing.quest.id, data)}
              onCancel={() => setEditing(null)}
              onDelete={() => removeQuest(editing.quest.id)}
              theme={theme}
            />
          )
        ) : (
          <>
            <div className="quest-editor-list flex-1 overflow-y-auto space-y-2 -mr-1 pr-1">
              {state.quests.map((q) => {
                const cfg = DIFFICULTY[q.difficulty]
                const iconImage = CYBERPUNK_ICON_BY_EMOJI[q.icon]
                return (
                  <button
                    key={q.id}
                    onClick={() => setEditing({ mode: 'edit', quest: q })}
                    className="quest-editor-row w-full rounded-2xl p-3 flex items-center gap-3 text-left bg-white/5 hover:bg-white/10 active:scale-[0.99] transition"
                  >
                    <div
                      className="quest-editor-icon grid place-items-center w-11 h-11 text-xl shrink-0"
                      style={{ background: q.color + '26', boxShadow: `inset 0 0 0 2px ${q.color}55` }}
                    >
                      {cyberpunk && iconImage ? (
                        <img src={iconImage} alt="" />
                      ) : (
                        <QuestGlyph icon={q.icon} size={30} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{q.label}</div>
                      <div className="flex items-center gap-2 text-xs mt-0.5 flex-wrap">
                        <span style={{ color: cfg.color }}>
                          {cyberpunk ? <span className="quest-difficulty-dot" style={{ background: cfg.color }} /> : cfg.dot} {cfg.label}
                        </span>
                        <span className="text-slate-500">·</span>
                        <span className="font-bold" style={{ color: q.color }}>+{q.xp} XP</span>
                        {q.days && q.days.length < 7 && (
                          <>
                            <span className="text-slate-500">·</span>
                            <span className="text-indigo-300">{cyberpunk ? 'CAL' : '🗓'} {formatRecurrence(q.days)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <span className="quest-editor-edit flex items-center gap-1 text-xs text-slate-400 shrink-0">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                        <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Modifier
                    </span>
                  </button>
                )
              })}
              {state.quests.length === 0 && (
                <p className="text-center text-slate-500 text-sm py-8">
                  Aucune quête. Crées-en une 👇
                </p>
              )}
            </div>

            <button
              onClick={() => setEditing({ mode: 'new' })}
              className="quest-editor-new mt-3 shrink-0 w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 py-3.5 font-semibold active:scale-[0.98] transition"
            >
              + Nouvelle quête
            </button>
          </>
        )}
      </div>
    </div>
  )
}
