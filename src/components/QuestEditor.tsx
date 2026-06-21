import { useState } from 'react'
import type { AppState, QuestDef } from '../types'
import { QUEST_COLORS, QUEST_ICONS } from '../data/defaultQuests'

type Props = {
  state: AppState
  setState: (updater: (s: AppState) => AppState) => void
  onClose: () => void
}

function uid() {
  return 'q' + Math.random().toString(36).slice(2, 9)
}

export function QuestEditor({ state, setState, onClose }: Props) {
  const [draft, setDraft] = useState('')
  const [icon, setIcon] = useState(QUEST_ICONS[0])
  const [xp, setXp] = useState(20)
  const [color, setColor] = useState(QUEST_COLORS[0])

  function addQuest() {
    const label = draft.trim()
    if (!label) return
    const q: QuestDef = { id: uid(), label, icon, xp, color }
    setState((s) => ({ ...s, quests: [...s.quests, q] }))
    setDraft('')
  }

  function removeQuest(id: string) {
    setState((s) => ({ ...s, quests: s.quests.filter((q) => q.id !== id) }))
  }

  function updateXp(id: string, value: number) {
    setState((s) => ({
      ...s,
      quests: s.quests.map((q) => (q.id === id ? { ...q, xp: value } : q)),
    }))
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-[#0b1020]/95 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-md flex flex-col h-full p-4">
        <div className="flex items-center justify-between mb-4 pt-1">
          <h2 className="text-xl font-extrabold">Mes quêtes</h2>
          <button
            onClick={onClose}
            className="glass rounded-full w-10 h-10 grid place-items-center text-lg active:scale-90 transition"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pb-4">
          {state.quests.map((q) => (
            <div key={q.id} className="glass rounded-2xl p-3 flex items-center gap-3">
              <div
                className="grid place-items-center w-10 h-10 rounded-xl text-xl shrink-0"
                style={{ background: q.color + '26' }}
              >
                {q.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{q.label}</div>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="range" min={5} max={50} step={5} value={q.xp}
                    onChange={(e) => updateXp(q.id, Number(e.target.value))}
                    className="flex-1 accent-indigo-400"
                  />
                  <span className="text-xs font-bold w-12 text-right" style={{ color: q.color }}>
                    {q.xp} XP
                  </span>
                </div>
              </div>
              <button
                onClick={() => removeQuest(q.id)}
                className="text-slate-500 hover:text-red-400 transition text-xl px-1 shrink-0"
                aria-label="Supprimer"
              >
                ✕
              </button>
            </div>
          ))}
          {state.quests.length === 0 && (
            <p className="text-center text-slate-500 text-sm py-8">
              Aucune quête. Ajoute-en une ci-dessous 👇
            </p>
          )}
        </div>

        {/* formulaire d'ajout */}
        <div className="glass rounded-2xl p-3 space-y-3">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addQuest()}
            placeholder="Nouvelle quête (ex : Sortir marcher)"
            className="w-full rounded-xl bg-white/5 p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-400/40"
          />
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {QUEST_ICONS.map((ic) => (
              <button
                key={ic}
                onClick={() => setIcon(ic)}
                className={`shrink-0 w-9 h-9 rounded-lg text-lg grid place-items-center transition ${
                  icon === ic ? 'bg-indigo-500/40 scale-110' : 'bg-white/5'
                }`}
              >
                {ic}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5">
            {QUEST_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className="w-7 h-7 rounded-full transition"
                style={{
                  background: c,
                  outline: color === c ? '2px solid white' : 'none',
                  outlineOffset: 2,
                }}
              />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 shrink-0">Récompense</span>
            <input
              type="range" min={5} max={50} step={5} value={xp}
              onChange={(e) => setXp(Number(e.target.value))}
              className="flex-1 accent-indigo-400"
            />
            <span className="text-xs font-bold w-12 text-right" style={{ color }}>{xp} XP</span>
          </div>
          <button
            onClick={addQuest}
            disabled={!draft.trim()}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 py-2.5 font-semibold disabled:opacity-40 active:scale-[0.98] transition"
          >
            + Ajouter la quête
          </button>
        </div>
      </div>
    </div>
  )
}
