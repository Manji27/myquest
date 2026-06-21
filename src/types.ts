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

export type AppState = {
  quests: QuestDef[]
  logs: Record<string, DayLog> // clé = date
  version: number
  /** ids des succès déjà notifiés (pour ne pas re-notifier) */
  seenAchievements?: string[]
  /** horodatage (ms) de la dernière modification — sert à la synchro cloud */
  updatedAt?: number
  /** préférences (rappel quotidien) */
  settings?: {
    reminderEnabled?: boolean
    reminderTime?: string // "HH:MM" heure locale
    tz?: string // fuseau IANA, ex. "Europe/Paris"
  }
}
