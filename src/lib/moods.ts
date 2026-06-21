/** Émojis d'humeur, index 1-5 (1 = négatif, 5 = très positif). */
export const MOODS = ['😞', '😕', '😐', '🙂', '😄']

export function moodEmoji(mood?: number): string | null {
  if (!mood || mood < 1 || mood > MOODS.length) return null
  return MOODS[mood - 1]
}
