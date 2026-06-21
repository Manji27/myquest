import { useMemo, useRef, useState } from 'react'
import { usePersistentState } from './lib/storage'
import { dayScore, levelFromXp, maxDayScore, totalXp } from './lib/game'
import { todayKey } from './lib/date'
import type { DayLog } from './types'
import { Header } from './components/Header'
import { Memories } from './components/Memories'
import { DayNavigator } from './components/DayNavigator'
import { PowerGauge } from './components/PowerGauge'
import { QuestCard } from './components/QuestCard'
import { ScoreCurve } from './components/ScoreCurve'
import { PositiveEvent } from './components/PositiveEvent'
import { QuestEditor } from './components/QuestEditor'
import { Confetti } from './components/Confetti'

const EMPTY_LOG = (date: string): DayLog => ({ date, completed: [], positiveEvent: '' })

export default function App() {
  const [state, setState] = usePersistentState()
  const [editorMode, setEditorMode] = useState<null | 'list' | 'new'>(null)
  const [view, setView] = useState<'jour' | 'souvenirs'>('jour')
  const [confetti, setConfetti] = useState(0)
  const goalHit = useRef(false)

  const today = todayKey()
  const [selectedDate, setSelectedDate] = useState(today)
  const isToday = selectedDate === today
  const log = state.logs[selectedDate] ?? EMPTY_LOG(selectedDate)
  const max = maxDayScore(state.quests)
  const score = useMemo(() => dayScore(log, state.quests), [log, state.quests])
  const lvl = useMemo(() => levelFromXp(totalXp(state)), [state])

  function patchLog(patch: Partial<DayLog>) {
    setState((s) => {
      const prev = s.logs[selectedDate] ?? EMPTY_LOG(selectedDate)
      return { ...s, logs: { ...s.logs, [selectedDate]: { ...prev, ...patch } } }
    })
  }

  function toggleQuest(id: string) {
    const done = log.completed.includes(id)
    const completed = done
      ? log.completed.filter((x) => x !== id)
      : [...log.completed, id]
    patchLog({ completed })

    // confettis quand on franchit la barre des 80% (l'objectif), uniquement aujourd'hui
    if (!isToday) return
    const newScore = dayScore({ ...log, completed }, state.quests)
    const ratio = max > 0 ? newScore / max : 0
    if (!done && ratio >= 0.8 && !goalHit.current) {
      goalHit.current = true
      setConfetti((c) => c + 1)
    } else if (done && ratio < 0.8) {
      goalHit.current = false
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 md:px-6 lg:px-8 pb-10">
      <Confetti trigger={confetti} />

      <Header state={state} onOpenSettings={() => setEditorMode('list')} />

      {/* onglets */}
      <div className="mt-4 glass rounded-2xl p-1 flex gap-1 max-w-xs mx-auto">
        {([
          ['jour', '📅 Journal'],
          ['souvenirs', '📖 Souvenirs'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setView(key)}
            className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${
              view === key ? 'bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {view === 'souvenirs' ? (
        <Memories
          state={state}
          onOpenDay={(key) => {
            setSelectedDate(key)
            setView('jour')
          }}
        />
      ) : (
       <>
      <div className="mt-4">
        <DayNavigator value={selectedDate} today={today} state={state} onChange={setSelectedDate} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-12 lg:items-start">
        {/* —— Colonne gauche : puissance + quêtes —— */}
        <div className="lg:col-span-7 space-y-4">
          {/* Puissance du jour */}
          <section className="glass rounded-3xl p-5 sm:p-6 flex justify-center sm:justify-start">
            <PowerGauge
              score={score}
              max={max}
              questsDone={log.completed.length}
              questsTotal={state.quests.length}
              level={lvl.level}
              xpToNext={lvl.needed - lvl.current}
              isToday={isToday}
            />
          </section>

          {/* Quêtes du jour */}
          <section>
            <div className="flex items-center justify-between mb-2 px-1">
              <h2 className="text-sm font-semibold text-slate-300">
                {isToday ? 'Tes quêtes du jour' : 'Tes quêtes ce jour-là'}
              </h2>
              <span className="text-xs text-slate-500">
                {log.completed.length}/{state.quests.length}
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {state.quests.map((q) => (
                <QuestCard
                  key={q.id}
                  quest={q}
                  done={log.completed.includes(q.id)}
                  onToggle={() => toggleQuest(q.id)}
                />
              ))}
              {/* carte rapide d'ajout de quête */}
              <button
                onClick={() => setEditorMode('new')}
                className="w-full rounded-2xl p-3 flex items-center gap-3 text-left text-slate-400 border border-dashed border-white/15 hover:border-indigo-400/50 hover:text-slate-200 hover:bg-white/5 active:scale-[0.98] transition"
              >
                <span className="grid place-items-center w-12 h-12 rounded-xl bg-white/5 text-2xl shrink-0">
                  +
                </span>
                <span className="font-semibold">
                  {state.quests.length === 0 ? 'Crée ta première quête ⚔️' : 'Ajouter une quête'}
                </span>
              </button>
            </div>
          </section>
        </div>

        {/* —— Colonne droite : courbe + journal —— */}
        <div className="lg:col-span-5 space-y-4">
          <ScoreCurve
            state={state}
            days={14}
            selected={selectedDate}
            onSelectDay={setSelectedDate}
          />

          <PositiveEvent
            key={selectedDate}
            value={log.positiveEvent}
            onChange={(text) => patchLog({ positiveEvent: text })}
          />
        </div>
      </div>
       </>
      )}

      <p className="text-center text-[11px] text-slate-600 pt-6">
        Tout est stocké en privé sur ton appareil 🔒
      </p>

      {editorMode && (
        <QuestEditor
          state={state}
          setState={setState}
          startInNew={editorMode === 'new'}
          onClose={() => setEditorMode(null)}
        />
      )}
    </div>
  )
}
