import { useState } from 'react'
import type { Difficulty, QuestDef } from '../types'
import {
  DIFFICULTIES,
  DIFFICULTY,
  QUEST_COLORS,
  QUEST_ICONS,
} from '../data/defaultQuests'

type Props = {
  /** quête à éditer, ou undefined pour une création */
  initial?: QuestDef
  onSave: (data: { label: string; icon: string; color: string; difficulty: Difficulty }) => void
  onCancel: () => void
  onDelete?: () => void
}

/** Formulaire complet d'une quête : nom, icône, couleur, difficulté. Partagé création/édition. */
export function QuestForm({ initial, onSave, onCancel, onDelete }: Props) {
  const [label, setLabel] = useState(initial?.label ?? '')
  const [icon, setIcon] = useState(initial?.icon ?? QUEST_ICONS[0])
  const [color, setColor] = useState(initial?.color ?? QUEST_COLORS[0])
  const [difficulty, setDifficulty] = useState<Difficulty>(initial?.difficulty ?? 'moyen')

  const canSave = label.trim().length > 0

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div
          className="grid place-items-center w-14 h-14 rounded-2xl text-2xl shrink-0"
          style={{ background: color + '26' }}
        >
          {icon}
        </div>
        <input
          autoFocus
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && canSave && submit()}
          placeholder="Nom de la quête (ex : Sortir marcher)"
          className="flex-1 rounded-xl bg-white/5 p-3 text-base outline-none focus:ring-2 focus:ring-indigo-400/40"
        />
      </div>

      {/* Difficulté */}
      <div>
        <label className="text-xs text-slate-400 mb-1.5 block">Difficulté — plus c'est dur, plus tu gagnes d'XP</label>
        <div className="grid grid-cols-3 gap-2">
          {DIFFICULTIES.map((d) => {
            const cfg = DIFFICULTY[d]
            const active = difficulty === d
            return (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className="rounded-2xl p-3 text-center transition active:scale-[0.97]"
                style={{
                  background: active ? cfg.color + '26' : 'rgba(255,255,255,0.04)',
                  outline: active ? `2px solid ${cfg.color}` : '1px solid rgba(255,255,255,0.08)',
                  outlineOffset: -1,
                }}
              >
                <div className="text-lg">{cfg.dot}</div>
                <div className="text-sm font-semibold mt-0.5">{cfg.label}</div>
                <div className="text-xs font-bold mt-0.5" style={{ color: cfg.color }}>
                  +{cfg.xp} XP
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Icône */}
      <div>
        <label className="text-xs text-slate-400 mb-1.5 block">Icône</label>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {QUEST_ICONS.map((ic) => (
            <button
              key={ic}
              onClick={() => setIcon(ic)}
              className={`shrink-0 w-10 h-10 rounded-lg text-xl grid place-items-center transition ${
                icon === ic ? 'bg-indigo-500/40 scale-110' : 'bg-white/5'
              }`}
            >
              {ic}
            </button>
          ))}
        </div>
      </div>

      {/* Couleur */}
      <div>
        <label className="text-xs text-slate-400 mb-1.5 block">Couleur</label>
        <div className="flex gap-2">
          {QUEST_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className="w-8 h-8 rounded-full transition"
              style={{
                background: c,
                outline: color === c ? '2px solid white' : 'none',
                outlineOffset: 2,
              }}
            />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        {onDelete && (
          <button
            onClick={onDelete}
            className="rounded-xl px-4 py-3 font-semibold bg-red-500/15 text-red-300 active:scale-[0.97] transition"
          >
            Supprimer
          </button>
        )}
        <button
          onClick={onCancel}
          className="rounded-xl px-4 py-3 font-semibold bg-white/5 text-slate-300 active:scale-[0.97] transition"
        >
          Annuler
        </button>
        <button
          onClick={submit}
          disabled={!canSave}
          className="flex-1 rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 py-3 font-semibold disabled:opacity-40 active:scale-[0.98] transition"
        >
          {initial ? 'Enregistrer' : '+ Créer la quête'}
        </button>
      </div>
    </div>
  )

  function submit() {
    if (!canSave) return
    onSave({ label: label.trim(), icon, color, difficulty })
  }
}
