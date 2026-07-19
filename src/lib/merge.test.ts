import { describe, expect, it } from 'vitest'
import type { AppState, QuestDef } from '../types'
import { mergeStates } from './merge'

function quest(id: string): QuestDef {
  return { id, label: id, icon: '⭐', color: '#fff', xp: 20, difficulty: 'moyen' }
}

function base(partial: Partial<AppState>): AppState {
  return { quests: [], logs: {}, version: 1, ...partial }
}

describe('mergeStates — pas de perte de données', () => {
  it('conserve une quête présente sur un seul côté (horloges réelles)', () => {
    // Comme dans l'app : chaque création estampille une horloge de champ.
    const a = base({ quests: [quest('a')], sync: { clocks: { 'quest:a': '0000000000001:devA' } }, updatedAt: 1 })
    const b = base({ quests: [quest('b')], sync: { clocks: { 'quest:b': '0000000000002:devB' } }, updatedAt: 2 })
    const merged = mergeStates(a, b)
    expect(merged.quests.map((q) => q.id).sort()).toEqual(['a', 'b'])
  })

  it('conserve un jour de log présent sur un seul côté', () => {
    const a = base({ logs: { '2026-07-18': { date: '2026-07-18', completed: ['a'], positiveEvent: '' } }, updatedAt: 1 })
    const b = base({ logs: { '2026-07-19': { date: '2026-07-19', completed: ['b'], positiveEvent: '' } }, updatedAt: 2 })
    const merged = mergeStates(a, b)
    expect(Object.keys(merged.logs).sort()).toEqual(['2026-07-18', '2026-07-19'])
  })

  it('AUCUNE validation perdue : sans horloge, une complétion sur un seul côté survit (union)', () => {
    const a = base({ logs: { d: { date: 'd', completed: ['a'], positiveEvent: '' } }, updatedAt: 1 })
    const b = base({ logs: { d: { date: 'd', completed: [], positiveEvent: '' } }, updatedAt: 2 })
    const merged = mergeStates(a, b)
    expect(merged.logs['d'].completed).toContain('a')
  })
})

describe('mergeStates — LWW par horloge de champ', () => {
  it('l’horloge la plus récente gagne pour une complétion en conflit', () => {
    const a = base({
      logs: { d: { date: 'd', completed: ['a'], positiveEvent: '' } },
      sync: { clocks: { 'log:d:completed:a': '0000000000002:devA' } },
      updatedAt: 1,
    })
    const b = base({
      logs: { d: { date: 'd', completed: [], positiveEvent: '' } },
      sync: { clocks: { 'log:d:completed:a': '0000000000009:devB' } },
      updatedAt: 1,
    })
    // b décoche plus tard → a doit être décochée dans la fusion
    const merged = mergeStates(a, b)
    expect(merged.logs['d'].completed).not.toContain('a')
  })
})

describe('mergeStates — idempotence', () => {
  it('fusionner un état avec lui-même ne change ni quêtes ni logs', () => {
    const s = base({
      quests: [quest('a'), quest('b')],
      logs: { d: { date: 'd', completed: ['a'], positiveEvent: 'ok' } },
      updatedAt: 5,
    })
    const merged = mergeStates(s, s)
    expect(merged.quests.map((q) => q.id).sort()).toEqual(['a', 'b'])
    expect(merged.logs['d'].completed).toEqual(['a'])
    expect(merged.logs['d'].positiveEvent).toBe('ok')
  })
})

describe('mergeStates — contrats (mensuel ET hebdo)', () => {
  it('fusionne les deux cadences sans perdre un contrat hebdo', () => {
    const weeklyA = { id: 'weekly-1', week: 'w-2026-07-13', title: 'A', description: 'x', steps: [], completedAt: undefined }
    const weeklyB = { id: 'weekly-2', week: 'w-2026-07-20', title: 'B', description: 'y', steps: [], completedAt: undefined }
    const a = base({ contracts: { monthly: [], weekly: [weeklyA] }, sync: { clocks: { 'contract:weekly-1': '0000000000001:devA' } }, updatedAt: 1 })
    const b = base({ contracts: { monthly: [], weekly: [weeklyB] }, sync: { clocks: { 'contract:weekly-2': '0000000000002:devB' } }, updatedAt: 2 })
    const merged = mergeStates(a, b)
    expect(merged.contracts?.weekly.map((c) => c.id).sort()).toEqual(['weekly-1', 'weekly-2'])
  })
})
