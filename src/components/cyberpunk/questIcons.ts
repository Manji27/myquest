import sportIcon from '../../../references/cyberpunk-ui/cyberpunk-icons/quest-sport.png'
import cleaningIcon from '../../../references/cyberpunk-ui/cyberpunk-icons/quest-menage.png'
import readingIcon from '../../../references/cyberpunk-ui/cyberpunk-icons/quest-lecture.png'
import meditationIcon from '../../../references/cyberpunk-ui/cyberpunk-icons/quest-meditation.png'
import hydrationIcon from '../../../references/cyberpunk-ui/cyberpunk-icons/quest-hydratation.png'
import healthyFoodIcon from '../../../references/cyberpunk-ui/cyberpunk-icons/quest-alimentation-saine.png'
import runningIcon from '../../../references/cyberpunk-ui/cyberpunk-icons/quest-course.png'
import sleepIcon from '../../../references/cyberpunk-ui/cyberpunk-icons/quest-sommeil.png'
import writingIcon from '../../../references/cyberpunk-ui/cyberpunk-icons/quest-ecriture.png'
import targetIcon from '../../../references/cyberpunk-ui/cyberpunk-icons/quest-objectif.png'
import guitarIcon from '../../../references/cyberpunk-ui/cyberpunk-icons/quest-guitare.png'
import brainIcon from '../../../references/cyberpunk-ui/cyberpunk-icons/quest-cerveau.png'
import natureIcon from '../../../references/cyberpunk-ui/cyberpunk-icons/quest-nature.png'
import bedIcon from '../../../references/cyberpunk-ui/cyberpunk-icons/quest-lit.png'
import phoneIcon from '../../../references/cyberpunk-ui/cyberpunk-icons/quest-telephone.png'
import computerIcon from '../../../references/cyberpunk-ui/cyberpunk-icons/quest-ordinateur.png'
import paintingIcon from '../../../references/cyberpunk-ui/cyberpunk-icons/quest-peinture.png'
import walkingIcon from '../../../references/cyberpunk-ui/cyberpunk-icons/quest-marche.png'
import gratitudeIcon from '../../../references/cyberpunk-ui/cyberpunk-icons/quest-gratitude.png'
import laundryIcon from '../../../references/cyberpunk-ui/cyberpunk-icons/quest-lessive.png'
import cookingIcon from '../../../references/cyberpunk-ui/cyberpunk-icons/quest-cuisine.png'
import disconnectIcon from '../../../references/cyberpunk-ui/cyberpunk-icons/quest-deconnexion.png'
import sunriseIcon from '../../../references/cyberpunk-ui/cyberpunk-icons/quest-lever-soleil.png'
import starIcon from '../../../references/cyberpunk-ui/cyberpunk-icons/quest-etoile.png'

/**
 * Illustrations cyberpunk des quêtes fournies avec l'application.
 * Une quête personnalisée absente de cette table conserve son emoji.
 */
export const CYBERPUNK_QUEST_ICONS: Readonly<Record<string, string>> = {
  sport: sportIcon,
  menage: cleaningIcon,
  lecture: readingIcon,
  meditation: meditationIcon,
  eau: hydrationIcon,
  sain: healthyFoodIcon,
}

/** Correspondance du sélecteur historique d'emojis vers les nouveaux assets. */
export const CYBERPUNK_ICON_BY_EMOJI: Readonly<Record<string, string>> = {
  '💪': sportIcon,
  '🧹': cleaningIcon,
  '📚': readingIcon,
  '🏃': runningIcon,
  '🧘': meditationIcon,
  '💧': hydrationIcon,
  '🥗': healthyFoodIcon,
  '😴': sleepIcon,
  '✍️': writingIcon,
  '🎯': targetIcon,
  '🎸': guitarIcon,
  '🧠': brainIcon,
  '🌿': natureIcon,
  '🛏️': bedIcon,
  '☎️': phoneIcon,
  '💻': computerIcon,
  '🎨': paintingIcon,
  '🚶': walkingIcon,
  '🙏': gratitudeIcon,
  '🧺': laundryIcon,
  '🍳': cookingIcon,
  '📵': disconnectIcon,
  '🌅': sunriseIcon,
  '⭐': starIcon,
}
