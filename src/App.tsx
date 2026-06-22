import { useEffect, useMemo, useRef, useState } from 'react'
import { usePersistentState } from './lib/storage'
import { levelFromXp, questsForDate, questStreak, totalXp } from './lib/game'
import { computeStats } from './lib/stats'
import { ACHIEVEMENTS, unlockedIds, type Achievement } from './lib/achievements'
import { useCloudSync } from './lib/useCloudSync'
import { todayKey } from './lib/date'
import type { DayLog, QuestDef } from './types'
import { Header } from './components/Header'
import { Memories } from './components/Memories'
import { Progression } from './components/Progression'
import { OnThisDay } from './components/OnThisDay'
import { DayNavigator } from './components/DayNavigator'
import { PowerGauge } from './components/PowerGauge'
import { QuestCard } from './components/QuestCard'
import { ScoreCurve } from './components/ScoreCurve'
import { PositiveEvent } from './components/PositiveEvent'
import { QuestEditor } from './components/QuestEditor'
import { Confetti } from './components/Confetti'
import { AchievementToast } from './components/AchievementToast'
import { PixelIcon } from './components/PixelIcon'

const EMPTY_LOG = (date: string): DayLog => ({ date, completed: [], positiveEvent: '' })

export default function App() {
  const [state, setState, applyRemote] = usePersistentState()
  const cloud = useCloudSync(state, applyRemote)
  const [editorMode, setEditorMode] = useState<null | 'list' | 'new'>(null)
  const [view, setView] = useState<'jour' | 'progression' | 'souvenirs'>('jour')
  const [confetti, setConfetti] = useState(0)
  const [toast, setToast] = useState<Achievement | null>(null)
  const [pendingDelete, setPendingDelete] = useState<QuestDef | null>(null)
  const goalHit = useRef(false)

  const today = todayKey()
  const [selectedDate, setSelectedDate] = useState(today)
  const isToday = selectedDate === today
  const log = state.logs[selectedDate] ?? EMPTY_LOG(selectedDate)
  // seulement les quêtes prévues pour le jour sélectionné
  const dayQuests = useMemo(() => questsForDate(state.quests, selectedDate), [state.quests, selectedDate])
  const max = useMemo(() => dayQuests.reduce((s, q) => s + q.xp, 0), [dayQuests])
  // score & compteur basés sur les quêtes prévues ce jour-là (cohérent avec max)
  const doneToday = useMemo(
    () => dayQuests.filter((q) => log.completed.includes(q.id)),
    [dayQuests, log],
  )
  const score = doneToday.reduce((s, q) => s + q.xp, 0)
  const questsDoneCount = doneToday.length
  const lvl = useMemo(() => levelFromXp(totalXp(state)), [state])

  // détecte les succès nouvellement débloqués → toast + confettis
  useEffect(() => {
    const unlocked = unlockedIds(computeStats(state))
    if (state.seenAchievements === undefined) {
      // première visite après l'ajout : on marque l'existant comme déjà vu (pas de notif rétroactive)
      setState((s) => ({ ...s, seenAchievements: unlocked }))
      return
    }
    const fresh = unlocked.filter((id) => !state.seenAchievements!.includes(id))
    if (fresh.length > 0) {
      setState((s) => ({
        ...s,
        seenAchievements: [...new Set([...(s.seenAchievements ?? []), ...unlocked])],
      }))
      setToast(ACHIEVEMENTS.find((a) => a.id === fresh[0]) ?? null)
      setConfetti((c) => c + 1)
    }
  }, [state, setState])

  // efface le toast après quelques secondes
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(t)
  }, [toast])

  function deleteQuest(id: string) {
    setState((s) => ({ ...s, quests: s.quests.filter((q) => q.id !== id) }))
    setPendingDelete(null)
  }

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
    const newScore = dayQuests.filter((q) => completed.includes(q.id)).reduce((s, q) => s + q.xp, 0)
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
      {toast && <AchievementToast achievement={toast} onClose={() => setToast(null)} />}

      <Header state={state} onOpenSettings={() => setEditorMode('list')} />

      {/* onglets */}
      <div className="mt-4 glass p-1 flex gap-1 max-w-lg mx-auto">
        {([
          ['jour', 'Journal', 'calendar'],
          ['progression', 'Progression', 'trophy'],
          ['souvenirs', 'Souvenirs', 'book'],
        ] as const).map(([key, label, icon]) => (
          <button
            key={key}
            onClick={() => setView(key)}
            className={`flex-1 py-2 text-sm font-semibold transition flex items-center justify-center gap-1.5 ${
              view === key ? 'bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PixelIcon name={icon} size={20} alt="" />
            <span>{label}</span>
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
      ) : view === 'progression' ? (
        <Progression
          state={state}
          setState={setState}
          cloud={cloud}
          onOpenDay={(key) => {
            setSelectedDate(key)
            setView('jour')
          }}
        />
      ) : (
       <>
      <div className="mt-3 max-w-md mx-auto">
        <DayNavigator value={selectedDate} today={today} state={state} onChange={setSelectedDate} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-12 lg:items-start">
        {/* —— Colonne gauche : puissance + quêtes —— */}
        <div className="lg:col-span-7 space-y-4">
          {/* Puissance du jour */}
          <section className="glass rounded-3xl p-5 sm:p-6 flex justify-center">
            <PowerGauge
              score={score}
              max={max}
              questsDone={questsDoneCount}
              questsTotal={dayQuests.length}
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
                {questsDoneCount}/{dayQuests.length}
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {dayQuests.map((q) => (
                <QuestCard
                  key={q.id}
                  quest={q}
                  done={log.completed.includes(q.id)}
                  streak={questStreak(state, q)}
                  onToggle={() => toggleQuest(q.id)}
                  onLongPress={() => setPendingDelete(q)}
                />
              ))}
              {/* jour de repos : des quêtes existent mais aucune n'est prévue ce jour-là */}
              {dayQuests.length === 0 && state.quests.length > 0 && (
                <div className="sm:col-span-2 glass rounded-2xl p-5 text-center text-slate-400 text-sm">
                  🌴 Aucune quête prévue {isToday ? "aujourd'hui" : 'ce jour-là'} — jour de repos !
                </div>
              )}
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

          <OnThisDay state={state} dateKey={selectedDate} onOpenDay={setSelectedDate} />
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

      {/* confirmation de suppression (déclenchée par appui long sur une quête) */}
      {pendingDelete && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-[#0b1020]/80 backdrop-blur-sm"
          onClick={() => setPendingDelete(null)}
        >
          <div
            className="glass rounded-3xl w-full max-w-sm p-5 animate-pop"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-2">
              <span
                className="grid place-items-center w-12 h-12 rounded-xl text-2xl shrink-0"
                style={{ background: pendingDelete.color + '26' }}
              >
                {pendingDelete.icon}
              </span>
              <div className="min-w-0">
                <h2 className="font-extrabold truncate">Supprimer la quête ?</h2>
                <p className="text-sm text-slate-400 truncate">{pendingDelete.label}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              La quête sera retirée de tes journées à venir. Ton historique passé reste intact.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPendingDelete(null)}
                className="flex-1 rounded-xl bg-white/5 hover:bg-white/10 py-3 font-semibold active:scale-[0.98] transition"
              >
                Annuler
              </button>
              <button
                onClick={() => deleteQuest(pendingDelete.id)}
                className="flex-1 rounded-xl bg-red-500/20 text-red-300 hover:bg-red-500/30 py-3 font-semibold active:scale-[0.98] transition"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
