import { useState } from 'react'
import type { AppState, Difficulty, QuestDef } from '../types'
import { DIFFICULTY } from '../data/defaultQuests'
import { QuestForm } from './QuestForm'

type Props = {
  state: AppState
  setState: (updater: (s: AppState) => AppState) => void
  onClose: () => void
}

function uid() {
  return 'q' + Math.random().toString(36).slice(2, 9)
}

type Editing = { mode: 'new' } | { mode: 'edit'; quest: QuestDef } | null

export function QuestEditor({ state, setState, onClose }: Props) {
  const [editing, setEditing] = useState<Editing>(null)

  function saveNew(data: { label: string; icon: string; color: string; difficulty: Difficulty }) {
    const q: QuestDef = { id: uid(), xp: DIFFICULTY[data.difficulty].xp, ...data }
    setState((s) => ({ ...s, quests: [...s.quests, q] }))
    setEditing(null)
  }

  function saveEdit(id: string, data: { label: string; icon: string; color: string; difficulty: Difficulty }) {
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
    <div className="fixed inset-0 z-40 overflow-y-auto bg-[#0b1020]/95 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-lg min-h-full flex flex-col p-4">
        <div className="flex items-center justify-between mb-4 pt-1">
          <h2 className="text-xl font-extrabold">
            {editing ? (editing.mode === 'new' ? 'Nouvelle quête' : 'Modifier la quête') : 'Mes quêtes'}
          </h2>
          <button
            onClick={() => (editing ? setEditing(null) : onClose())}
            className="glass rounded-full w-10 h-10 grid place-items-center text-lg active:scale-90 transition"
          >
            ✕
          </button>
        </div>

        {editing ? (
          <div className="glass rounded-2xl p-4">
            {editing.mode === 'new' ? (
              <QuestForm onSave={saveNew} onCancel={() => setEditing(null)} />
            ) : (
              <QuestForm
                initial={editing.quest}
                onSave={(data) => saveEdit(editing.quest.id, data)}
                onCancel={() => setEditing(null)}
                onDelete={() => removeQuest(editing.quest.id)}
              />
            )}
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-2">
              {state.quests.map((q) => {
                const cfg = DIFFICULTY[q.difficulty]
                return (
                  <button
                    key={q.id}
                    onClick={() => setEditing({ mode: 'edit', quest: q })}
                    className="w-full glass rounded-2xl p-3 flex items-center gap-3 text-left active:scale-[0.99] transition hover:bg-white/8"
                  >
                    <div
                      className="grid place-items-center w-11 h-11 rounded-xl text-xl shrink-0"
                      style={{ background: q.color + '26' }}
                    >
                      {q.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{q.label}</div>
                      <div className="flex items-center gap-2 text-xs mt-0.5">
                        <span style={{ color: cfg.color }}>{cfg.dot} {cfg.label}</span>
                        <span className="text-slate-500">·</span>
                        <span className="font-bold" style={{ color: q.color }}>+{q.xp} XP</span>
                      </div>
                    </div>
                    <span className="text-slate-500 text-lg shrink-0">✎</span>
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
              className="mt-3 w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 py-3.5 font-semibold active:scale-[0.98] transition"
            >
              + Nouvelle quête
            </button>
          </>
        )}
      </div>
    </div>
  )
}
