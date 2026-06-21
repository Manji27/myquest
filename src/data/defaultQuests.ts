import type { Difficulty, QuestDef } from '../types'

/** Récompense XP par niveau de difficulté : plus c'est dur, plus ça rapporte. */
export const DIFFICULTY: Record<
  Difficulty,
  { xp: number; label: string; color: string; dot: string }
> = {
  facile: { xp: 10, label: 'Facile', color: '#22c55e', dot: '🟢' },
  moyen: { xp: 20, label: 'Moyen', color: '#eab308', dot: '🟡' },
  difficile: { xp: 35, label: 'Difficile', color: '#ef4444', dot: '🔴' },
}

export const DIFFICULTIES: Difficulty[] = ['facile', 'moyen', 'difficile']

/** Déduit une difficulté à partir d'un ancien score XP (migration). */
export function difficultyFromXp(xp: number): Difficulty {
  if (xp <= 12) return 'facile'
  if (xp >= 30) return 'difficile'
  return 'moyen'
}

export const QUEST_COLORS = [
  '#f97316', // orange
  '#22c55e', // vert
  '#3b82f6', // bleu
  '#a855f7', // violet
  '#ec4899', // rose
  '#eab308', // jaune
  '#14b8a6', // turquoise
  '#ef4444', // rouge
]

export const QUEST_ICONS = [
  '💪', '🧹', '📚', '🏃', '🧘', '💧', '🥗', '😴',
  '✍️', '🎯', '🎸', '🧠', '🌿', '🛏️', '☎️', '💻',
  '🎨', '🚶', '🙏', '🧺', '🍳', '📵', '🌅', '⭐',
]

/** Fabrique une quête en dérivant l'XP de la difficulté. */
export function mk(
  id: string,
  label: string,
  icon: string,
  difficulty: Difficulty,
  color: string,
): QuestDef {
  return { id, label, icon, difficulty, xp: DIFFICULTY[difficulty].xp, color, days: [0, 1, 2, 3, 4, 5, 6] }
}

export const defaultQuests: QuestDef[] = [
  mk('sport', 'Faire du sport', '💪', 'difficile', '#f97316'),
  mk('menage', 'Faire le ménage', '🧹', 'moyen', '#22c55e'),
  mk('lecture', 'Lire', '📚', 'moyen', '#3b82f6'),
  mk('meditation', 'Méditer', '🧘', 'facile', '#a855f7'),
  mk('eau', 'Boire 2L d\'eau', '💧', 'facile', '#14b8a6'),
  mk('sain', 'Manger sainement', '🥗', 'moyen', '#eab308'),
]
