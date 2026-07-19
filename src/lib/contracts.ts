import type { ContractState, MonthlyContract, WeeklyContract } from '../types'

export const FIRST_CONTACT_CONTRACT: MonthlyContract = {
  id: 'monthly-2026-07-first-contact',
  month: '2026-07',
  title: 'Premier contact',
  description: 'Présente tes services de développeur web à un professionnel, en personne.',
  steps: [
    { id: 'target', label: 'Identifier le professionnel à contacter', completed: false },
    { id: 'pitch', label: 'Préparer un pitch clair de 30 secondes', completed: false },
    { id: 'scout', label: 'Repérer le lieu et choisir le bon moment', completed: false },
    { id: 'contact', label: 'Entrer et présenter tes services en face à face', completed: false },
  ],
}

function cloneContract<T extends MonthlyContract | WeeklyContract>(contract: T): T {
  return {
    ...contract,
    steps: contract.steps.map((step) => ({ ...step })),
  }
}

export function initialContracts(): ContractState {
  return { monthly: [cloneContract(FIRST_CONTACT_CONTRACT)], weekly: [] }
}

/** Ajoute les contrats livrés avec l'app sans écraser la progression existante. */
export function migrateContracts(contracts?: ContractState): ContractState {
  const monthly = contracts?.monthly?.map(cloneContract) ?? []
  if (!monthly.some((contract) => contract.id === FIRST_CONTACT_CONTRACT.id)) {
    monthly.push(cloneContract(FIRST_CONTACT_CONTRACT))
  }
  const weekly = contracts?.weekly?.map(cloneContract) ?? []
  return { monthly, weekly }
}

export function monthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function monthLabel(month: string): string {
  const [year, value] = month.split('-').map(Number)
  const label = new Intl.DateTimeFormat('fr-FR', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, value - 1, 1))
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function daysRemainingInMonth(month: string, now = new Date()): number {
  if (month !== monthKey(now)) return 0
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  return Math.max(lastDay - now.getDate(), 0)
}

/** Lundi (00:00 local) de la semaine contenant `date`. */
function mondayOf(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const offset = (d.getDay() + 6) % 7 // 0 = lundi … 6 = dimanche
  d.setDate(d.getDate() - offset)
  return d
}

/** Clé de semaine basée sur son lundi : `w-YYYY-MM-DD`. */
export function weekKey(date = new Date()): string {
  const m = mondayOf(date)
  return `w-${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}-${String(m.getDate()).padStart(2, '0')}`
}

export function weekLabel(week: string): string {
  const [, year, month, day] = week.split('-').map(Number)
  const monday = new Date(year, month - 1, day)
  const label = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(monday)
  return `Semaine du ${label}`
}

export function daysRemainingInWeek(week: string, now = new Date()): number {
  if (week !== weekKey(now)) return 0
  const offset = (now.getDay() + 6) % 7 // 0 = lundi … 6 = dimanche
  return Math.max(6 - offset, 0) // jours jusqu'à dimanche inclus
}
