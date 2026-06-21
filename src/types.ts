export type QuestDef = {
  id: string
  label: string
  icon: string // emoji
  xp: number
  color: string // tailwind-ish hex accent
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
}
