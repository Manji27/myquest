import type { QuestDef } from '../types'

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

export const defaultQuests: QuestDef[] = [
  { id: 'sport', label: 'Faire du sport', icon: '💪', xp: 30, color: '#f97316' },
  { id: 'menage', label: 'Faire le ménage', icon: '🧹', xp: 15, color: '#22c55e' },
  { id: 'lecture', label: 'Lire', icon: '📚', xp: 20, color: '#3b82f6' },
  { id: 'meditation', label: 'Méditer', icon: '🧘', xp: 15, color: '#a855f7' },
  { id: 'eau', label: 'Boire 2L d\'eau', icon: '💧', xp: 10, color: '#14b8a6' },
  { id: 'sain', label: 'Manger sainement', icon: '🥗', xp: 20, color: '#eab308' },
]
