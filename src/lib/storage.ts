import { useCallback, useEffect, useState } from 'react'
import type { AppState } from '../types'
import { DIFFICULTY, defaultQuests, difficultyFromXp } from '../data/defaultQuests'
import { initialContracts, migrateContracts } from './contracts'

type Updater = AppState | ((prev: AppState) => AppState)

const KEY = 'questlog.state.v1'
const DEVICE_KEY = 'questlog.device.v1'
const BACKUP_DB = 'questlog-local-backup'
const BACKUP_STORE = 'states'

function initialState(): AppState {
  return { quests: defaultQuests, logs: {}, contracts: initialContracts(), version: 1 }
}

function normalize(parsed: AppState): AppState {
  if (!parsed.quests || !parsed.logs) return initialState()
    // migration : garantit qu'une quête a toujours une difficulté + un XP cohérent
  parsed.quests = parsed.quests.map((q) => {
    const difficulty = q.difficulty ?? difficultyFromXp(q.xp ?? 20)
    // quêtes existantes : « tous les jours » par défaut
    const days = q.days ?? [0, 1, 2, 3, 4, 5, 6]
    return { ...q, difficulty, xp: DIFFICULTY[difficulty].xp, days }
  })
  parsed.contracts = migrateContracts(parsed.contracts)
  return parsed
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return initialState()
    return normalize(JSON.parse(raw) as AppState)
  } catch {
    return initialState()
  }
}

function openBackupDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(BACKUP_DB, 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(BACKUP_STORE)) {
        request.result.createObjectStore(BACKUP_STORE)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function readDeviceBackup(): Promise<AppState | null> {
  const db = await openBackupDb()
  return new Promise((resolve, reject) => {
    const request = db.transaction(BACKUP_STORE, 'readonly').objectStore(BACKUP_STORE).get('latest')
    request.onsuccess = () => {
      db.close()
      resolve(request.result ? normalize(request.result as AppState) : null)
    }
    request.onerror = () => {
      db.close()
      reject(request.error)
    }
  })
}

async function writeDeviceBackup(state: AppState): Promise<void> {
  const db = await openBackupDb()
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(BACKUP_STORE, 'readwrite')
    transaction.objectStore(BACKUP_STORE).put(state, 'latest')
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
  db.close()
}

function deviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY)
  if (!id) {
    id = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)
    localStorage.setItem(DEVICE_KEY, id)
  }
  return id
}

function same(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

function ids<T extends { id: string }>(a: T[] = [], b: T[] = []): string[] {
  return Array.from(new Set([...a.map((item) => item.id), ...b.map((item) => item.id)]))
}

/** Marque uniquement les éléments réellement modifiés par cette action locale. */
function stampChanges(previous: AppState, next: AppState, now: number): AppState {
  const clocks = { ...(previous.sync?.clocks ?? {}), ...(next.sync?.clocks ?? {}) }
  const stamp = `${String(now).padStart(13, '0')}:${deviceId()}`
  const touch = (key: string) => { clocks[key] = stamp }

  for (const id of ids(previous.quests, next.quests)) {
    if (!same(previous.quests.find((q) => q.id === id), next.quests.find((q) => q.id === id))) {
      touch(`quest:${id}`)
    }
  }

  for (const date of new Set([...Object.keys(previous.logs), ...Object.keys(next.logs)])) {
    const before = previous.logs[date]
    const after = next.logs[date]
    if (!before || !after) {
      touch(`log:${date}`)
      continue
    }
    if (before.positiveEvent !== after.positiveEvent) touch(`log:${date}:positiveEvent`)
    if (before.mood !== after.mood) touch(`log:${date}:mood`)
    for (const questId of new Set([...before.completed, ...after.completed])) {
      if (before.completed.includes(questId) !== after.completed.includes(questId)) {
        touch(`log:${date}:completed:${questId}`)
      }
    }
  }

  // Estampille les deux cadences de contrats (mensuel ET hebdo).
  type StampContract = { id: string; steps: { id: string }[] }
  const contractSlices: Array<readonly [StampContract[] | undefined, StampContract[] | undefined]> = [
    [previous.contracts?.monthly, next.contracts?.monthly],
    [previous.contracts?.weekly, next.contracts?.weekly],
  ]
  for (const [prevList, nextList] of contractSlices) {
    for (const id of ids(prevList, nextList)) {
      const before = prevList?.find((item) => item.id === id)
      const after = nextList?.find((item) => item.id === id)
      if (!before || !after) {
        touch(`contract:${id}`)
        continue
      }
      const beforeBase = { ...before, steps: undefined }
      const afterBase = { ...after, steps: undefined }
      if (!same(beforeBase, afterBase)) touch(`contract:${id}`)
      for (const stepId of ids(before.steps, after.steps)) {
        if (!same(before.steps.find((step) => step.id === stepId), after.steps.find((step) => step.id === stepId))) {
          touch(`contract:${id}:step:${stepId}`)
        }
      }
    }
  }

  if (!same(previous.settings, next.settings)) touch('settings')
  for (const id of new Set([...(previous.seenAchievements ?? []), ...(next.seenAchievements ?? [])])) {
    if ((previous.seenAchievements ?? []).includes(id) !== (next.seenAchievements ?? []).includes(id)) {
      touch(`seen:${id}`)
    }
  }

  return { ...next, updatedAt: now, sync: { clocks } }
}

/**
 * Hook d'état persistant. Renvoie :
 * - `state`
 * - `setState` : modification utilisateur (estampille `updatedAt` → déclenche la synchro)
 * - `applyRemote` : applique un état distant tel quel (sans ré-estampiller, pour la synchro cloud)
 */
export function usePersistentState() {
  const hadLocalCopy = useState(() => Boolean(localStorage.getItem(KEY)))[0]
  const [localBackupLoaded, setLocalBackupLoaded] = useState(hadLocalCopy)
  const [state, applyRemote] = useState<AppState>(load)

  // Si localStorage a été vidé mais qu'IndexedDB existe encore, restaure sa copie.
  useEffect(() => {
    if (localBackupLoaded) return
    void readDeviceBackup()
      .then((backup) => {
        if (backup) applyRemote(backup)
      })
      .catch(() => {})
      .finally(() => setLocalBackupLoaded(true))
  }, [localBackupLoaded])

  useEffect(() => {
    if (!localBackupLoaded) return
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      // quota plein ou mode privé : on ignore silencieusement
    }
    // Deuxième copie locale, transactionnelle et indépendante de localStorage.
    void writeDeviceBackup(state).catch(() => {})
  }, [state, localBackupLoaded])

  const setState = useCallback((updater: Updater) => {
    applyRemote((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      return stampChanges(prev, next, Date.now())
    })
  }, [])

  return [state, setState, applyRemote] as const
}

export function exportState(state: AppState): string {
  return JSON.stringify(state, null, 2)
}
