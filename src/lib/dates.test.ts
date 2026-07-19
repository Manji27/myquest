import { describe, expect, it } from 'vitest'
import { addDays, keyToDate, lastNDays, toKey, ymdKey } from './date'
import {
  daysRemainingInMonth,
  daysRemainingInWeek,
  migrateContracts,
  monthKey,
  nextMonthKeys,
  nextWeekKeys,
  weekKey,
} from './contracts'

describe('date keys (heure locale)', () => {
  it('toKey formate en YYYY-MM-DD', () => {
    expect(toKey(new Date(2026, 0, 5))).toBe('2026-01-05') // janvier = mois 0
    expect(toKey(new Date(2026, 11, 31))).toBe('2026-12-31')
  })

  it('addDays gère les fins de mois et bissextiles', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01')
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29') // 2024 bissextile
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01') // 2026 non bissextile
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01') // passage d'année
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('keyToDate ∘ toKey est un aller-retour stable', () => {
    for (const k of ['2026-07-19', '2024-02-29', '2026-01-01', '2026-12-31']) {
      expect(toKey(keyToDate(k))).toBe(k)
    }
  })

  it('lastNDays renvoie n jours triés, sans doublon, finissant à end', () => {
    const days = lastNDays(14, '2026-07-19')
    expect(days).toHaveLength(14)
    expect(days.at(-1)).toBe('2026-07-19')
    expect(days[0]).toBe('2026-07-06')
    expect(new Set(days).size).toBe(14)
  })

  it('ymdKey construit une clé cohérente', () => {
    expect(ymdKey(2026, 6, 19)).toBe('2026-07-19') // mois 6 = juillet
  })
})

describe('périodes mensuelles', () => {
  it('monthKey inclut toujours l’année (pas de collision inter-années)', () => {
    expect(monthKey(new Date(2026, 6, 19))).toBe('2026-07')
    expect(monthKey(new Date(2027, 6, 1))).toBe('2027-07')
    expect(monthKey(new Date(2026, 6, 19))).not.toBe(monthKey(new Date(2027, 6, 19)))
  })

  it('daysRemainingInMonth : 0 hors du mois courant, correct sinon', () => {
    const now = new Date(2026, 6, 19) // 19 juillet, 31 jours
    expect(daysRemainingInMonth('2026-07', now)).toBe(12) // 31 - 19
    expect(daysRemainingInMonth('2026-06', now)).toBe(0) // mois passé
    expect(daysRemainingInMonth('2026-08', now)).toBe(0) // mois futur
  })

  it('daysRemainingInMonth gère février bissextile', () => {
    expect(daysRemainingInMonth('2024-02', new Date(2024, 1, 20))).toBe(9) // 29 - 20
    expect(daysRemainingInMonth('2026-02', new Date(2026, 1, 20))).toBe(8) // 28 - 20
  })

  it('nextMonthKeys : mois courant inclus, séquentiel, passage d’année', () => {
    const keys = nextMonthKeys(4, new Date(2026, 10, 15)) // novembre 2026
    expect(keys).toEqual(['2026-11', '2026-12', '2027-01', '2027-02'])
  })
})

describe('périodes hebdomadaires (lundi → dimanche)', () => {
  it('weekKey identifie la semaine par son lundi', () => {
    // 19 juillet 2026 = dimanche → lundi = 13 juillet
    expect(weekKey(new Date(2026, 6, 19))).toBe('w-2026-07-13')
    // 13 juillet 2026 = lundi → lui-même
    expect(weekKey(new Date(2026, 6, 13))).toBe('w-2026-07-13')
    // 20 juillet = lundi suivant
    expect(weekKey(new Date(2026, 6, 20))).toBe('w-2026-07-20')
  })

  it('weekKey inclut l’année (semaine 53 / bascule d’année)', () => {
    // 31 déc 2026 = jeudi → lundi 28 déc 2026
    expect(weekKey(new Date(2026, 11, 31))).toBe('w-2026-12-28')
    // 1 jan 2027 = vendredi → même semaine, lundi 28 déc 2026
    expect(weekKey(new Date(2027, 0, 1))).toBe('w-2026-12-28')
  })

  it('daysRemainingInWeek : lundi=6 … dimanche=0, 0 hors semaine courante', () => {
    expect(daysRemainingInWeek('w-2026-07-13', new Date(2026, 6, 13))).toBe(6) // lundi
    expect(daysRemainingInWeek('w-2026-07-13', new Date(2026, 6, 19))).toBe(0) // dimanche
    expect(daysRemainingInWeek('w-2026-07-13', new Date(2026, 6, 20))).toBe(0) // semaine suivante
  })

  it('nextWeekKeys : 8 semaines consécutives distinctes, semaine courante incluse', () => {
    const keys = nextWeekKeys(8, new Date(2026, 6, 19))
    expect(keys[0]).toBe('w-2026-07-13')
    expect(keys[1]).toBe('w-2026-07-20')
    expect(new Set(keys).size).toBe(8)
    // triées chronologiquement (comparaison de chaîne valide car format fixe)
    expect([...keys].sort()).toEqual(keys)
  })
})

describe('migrateContracts (compat + pas de perte)', () => {
  it('initialise weekly:[] et conserve le contrat mensuel livré', () => {
    const migrated = migrateContracts(undefined)
    expect(Array.isArray(migrated.weekly)).toBe(true)
    expect(migrated.monthly.length).toBeGreaterThan(0)
  })

  it('préserve les contrats existants sans les dupliquer', () => {
    const once = migrateContracts(undefined)
    const twice = migrateContracts(once)
    expect(twice.monthly).toHaveLength(once.monthly.length)
  })
})
