import type { Stats } from './stats'

export type Achievement = {
  id: string
  icon: string
  title: string
  desc: string
  target: number
  /** valeur actuelle de progression (comparée à target) */
  value: (s: Stats) => number
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_quest', icon: '🌱', title: 'Premier pas', desc: 'Accomplis ta première quête', target: 1, value: (s) => s.totalQuestsCompleted },
  { id: 'quests_25', icon: '✅', title: 'Sur la lancée', desc: 'Accomplis 25 quêtes', target: 25, value: (s) => s.totalQuestsCompleted },
  { id: 'quests_100', icon: '💪', title: 'Machine à quêtes', desc: 'Accomplis 100 quêtes', target: 100, value: (s) => s.totalQuestsCompleted },
  { id: 'quests_500', icon: '🦾', title: 'Inarrêtable', desc: 'Accomplis 500 quêtes', target: 500, value: (s) => s.totalQuestsCompleted },

  { id: 'perfect_1', icon: '🏆', title: 'Journée parfaite', desc: 'Accomplis toutes tes quêtes en un jour', target: 1, value: (s) => s.perfectDays },
  { id: 'perfect_7', icon: '🌟', title: 'Semaine en or', desc: '7 journées parfaites', target: 7, value: (s) => s.perfectDays },

  { id: 'streak_3', icon: '🔥', title: 'En rythme', desc: '3 jours d\'affilée', target: 3, value: (s) => s.bestStreak },
  { id: 'streak_7', icon: '🔥', title: 'Semaine de feu', desc: '7 jours d\'affilée', target: 7, value: (s) => s.bestStreak },
  { id: 'streak_30', icon: '🌋', title: 'Un mois entier', desc: '30 jours d\'affilée', target: 30, value: (s) => s.bestStreak },

  { id: 'xp_100', icon: '⚡', title: 'Étincelle', desc: 'Atteins 100 XP', target: 100, value: (s) => s.totalXp },
  { id: 'xp_1000', icon: '🔆', title: 'Pleine puissance', desc: 'Atteins 1000 XP', target: 1000, value: (s) => s.totalXp },
  { id: 'level_5', icon: '⭐', title: 'Niveau 5', desc: 'Atteins le niveau 5', target: 5, value: (s) => s.level },
  { id: 'level_10', icon: '👑', title: 'Niveau 10', desc: 'Atteins le niveau 10', target: 10, value: (s) => s.level },

  { id: 'journal_1', icon: '✨', title: 'Première pensée', desc: 'Note ton premier moment positif', target: 1, value: (s) => s.daysJournaled },
  { id: 'journal_30', icon: '📖', title: 'Mémoire vive', desc: '30 moments positifs notés', target: 30, value: (s) => s.daysJournaled },
]

export function isUnlocked(a: Achievement, s: Stats): boolean {
  return a.value(s) >= a.target
}

export function unlockedIds(s: Stats): string[] {
  return ACHIEVEMENTS.filter((a) => isUnlocked(a, s)).map((a) => a.id)
}
