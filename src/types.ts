export type Difficulty = 'facile' | 'moyen' | 'difficile'

export type QuestDef = {
  id: string
  label: string
  icon: string // emoji
  difficulty: Difficulty
  xp: number // dérivé de la difficulté (DIFFICULTY[difficulty].xp)
  color: string // tailwind-ish hex accent
  /** jours de la semaine où la quête apparaît (0=dim..6=sam). Absent = tous les jours. */
  days?: number[]
}

export type DayLog = {
  /** YYYY-MM-DD (date locale) */
  date: string
  /** ids des quêtes accomplies ce jour-là */
  completed: string[]
  /** l'évènement positif marquant du jour */
  positiveEvent: string
  /** humeur 1-5, optionnelle */
  mood?: number
}

export type ContractStep = {
  id: string
  label: string
  completed: boolean
}

export type MonthlyContract = {
  id: string
  /** Mois concerné au format YYYY-MM. */
  month: string
  title: string
  description: string
  steps: ContractStep[]
  completedAt?: string
}

export type WeeklyContract = {
  id: string
  /** Semaine concernée, identifiée par son lundi : `w-YYYY-MM-DD`. */
  week: string
  title: string
  description: string
  steps: ContractStep[]
  completedAt?: string
}

export type ContractState = {
  monthly: MonthlyContract[]
  weekly: WeeklyContract[]
}

export type AppState = {
  quests: QuestDef[]
  logs: Record<string, DayLog> // clé = date
  version: number
  /** Missions personnelles exigeantes, séparées des succès automatiques. */
  contracts?: ContractState
  /** ids des succès déjà notifiés (pour ne pas re-notifier) */
  seenAchievements?: string[]
  /** horodatage (ms) de la dernière modification — sert à la synchro cloud */
  updatedAt?: number
  /**
   * Horloges de synchronisation par champ.
   * Elles permettent de propager aussi les suppressions/décochages sans confondre
   * une absence volontaire avec une donnée ancienne.
   */
  sync?: {
    clocks: Record<string, string>
  }
  /** préférences (rappel quotidien) */
  settings?: {
    reminderEnabled?: boolean
    reminderTime?: string // "HH:MM" heure locale
    tz?: string // fuseau IANA, ex. "Europe/Paris"
  }
}
