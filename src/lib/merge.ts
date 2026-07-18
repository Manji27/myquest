import type {
  AppState,
  ContractState,
  DayLog,
  MonthlyContract,
  QuestDef,
} from '../types'

type Clocks = Record<string, string>

function clock(state: AppState, key: string): string {
  return state.sync?.clocks[key] ?? ''
}

function preferBForKey(a: AppState, b: AppState, key: string): boolean {
  const ac = clock(a, key)
  const bc = clock(b, key)
  if (ac || bc) return bc >= ac
  return (b.updatedAt ?? 0) >= (a.updatedAt ?? 0)
}

function mergeClocks(a: Clocks = {}, b: Clocks = {}): Clocks {
  const merged = { ...a }
  for (const [key, value] of Object.entries(b)) {
    if (!merged[key] || value > merged[key]) merged[key] = value
  }
  return merged
}

function mergeQuests(a: AppState, b: AppState): QuestDef[] {
  const ids = new Set([...a.quests.map((q) => q.id), ...b.quests.map((q) => q.id)])
  const merged: QuestDef[] = []
  for (const id of ids) {
    const qa = a.quests.find((q) => q.id === id)
    const qb = b.quests.find((q) => q.id === id)
    const chosen = preferBForKey(a, b, `quest:${id}`) ? qb : qa
    if (chosen) merged.push(chosen)
  }
  return merged
}

function completedValue(
  a: AppState,
  b: AppState,
  date: string,
  questId: string,
  la?: DayLog,
  lb?: DayLog,
): boolean {
  const key = `log:${date}:completed:${questId}`
  const ac = clock(a, key)
  const bc = clock(b, key)
  if (ac || bc) {
    return (bc >= ac ? lb : la)?.completed.includes(questId) ?? false
  }
  // Compatibilité avec les sauvegardes créées avant les horloges de champ.
  return Boolean(la?.completed.includes(questId) || lb?.completed.includes(questId))
}

function mergeLogs(a: AppState, b: AppState): Record<string, DayLog> {
  const out: Record<string, DayLog> = {}
  for (const date of new Set([...Object.keys(a.logs), ...Object.keys(b.logs)])) {
    const la = a.logs[date]
    const lb = b.logs[date]
    if (!la || !lb) {
      const chosen = preferBForKey(a, b, `log:${date}`) ? lb : la
      if (chosen) out[date] = chosen
      continue
    }

    const questIds = new Set([...la.completed, ...lb.completed])
    const preferPositiveB = preferBForKey(a, b, `log:${date}:positiveEvent`)
    const preferMoodB = preferBForKey(a, b, `log:${date}:mood`)
    out[date] = {
      date,
      completed: Array.from(questIds).filter((id) => completedValue(a, b, date, id, la, lb)),
      positiveEvent: preferPositiveB ? lb.positiveEvent : la.positiveEvent,
      mood: preferMoodB ? lb.mood : la.mood,
    }
  }
  return out
}

function mergeContracts(a: AppState, b: AppState): ContractState | undefined {
  const aa = a.contracts?.monthly ?? []
  const bb = b.contracts?.monthly ?? []
  if (aa.length === 0 && bb.length === 0) return undefined
  const ids = new Set([...aa.map((item) => item.id), ...bb.map((item) => item.id)])
  const monthly: MonthlyContract[] = []

  for (const id of ids) {
    const ca = aa.find((item) => item.id === id)
    const cb = bb.find((item) => item.id === id)
    const preferred = preferBForKey(a, b, `contract:${id}`) ? cb : ca
    if (!preferred) continue
    const other = preferred === cb ? ca : cb
    const stepIds = new Set([
      ...(ca?.steps.map((step) => step.id) ?? []),
      ...(cb?.steps.map((step) => step.id) ?? []),
    ])
    const steps = Array.from(stepIds).flatMap((stepId) => {
      const sa = ca?.steps.find((step) => step.id === stepId)
      const sb = cb?.steps.find((step) => step.id === stepId)
      const chosen = preferBForKey(a, b, `contract:${id}:step:${stepId}`) ? sb : sa
      return chosen ? [chosen] : []
    })
    monthly.push({
      ...preferred,
      completedAt: preferred.completedAt ?? other?.completedAt,
      steps,
    })
  }
  return { monthly }
}

/** Fusion déterministe et compatible avec les anciennes sauvegardes. */
export function mergeStates(a: AppState, b: AppState): AppState {
  const preferB = (b.updatedAt ?? 0) >= (a.updatedAt ?? 0)
  const newer = preferB ? b : a
  return {
    ...newer,
    quests: mergeQuests(a, b),
    logs: mergeLogs(a, b),
    contracts: mergeContracts(a, b),
    settings: preferBForKey(a, b, 'settings') ? b.settings : a.settings,
    seenAchievements: Array.from(
      new Set([...(a.seenAchievements ?? []), ...(b.seenAchievements ?? [])]),
    ),
    sync: { clocks: mergeClocks(a.sync?.clocks, b.sync?.clocks) },
    updatedAt: Math.max(a.updatedAt ?? 0, b.updatedAt ?? 0),
  }
}
