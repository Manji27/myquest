import { PIXEL_BY_EMOJI, pixel, type PixelName } from '../assets/pixel'

type Props = {
  name: PixelName
  size?: number
  className?: string
  alt?: string
}

/** Affiche un asset pixel art avec rendu net (pas de lissage). */
export function PixelIcon({ name, size = 24, className = '', alt = '' }: Props) {
  return (
    <img
      src={pixel[name]}
      width={size}
      height={size}
      alt={alt}
      draggable={false}
      className={className}
      style={{ imageRendering: 'pixelated', objectFit: 'contain' }}
    />
  )
}

/**
 * Glyphe d'une quête : asset pixel si l'emoji en a un, sinon l'emoji tel quel.
 * Garde le système d'emojis tout en sublimant les quêtes par défaut.
 */
export function QuestGlyph({ icon, size = 28 }: { icon: string; size?: number }) {
  const px = PIXEL_BY_EMOJI[icon]
  if (px) return <PixelIcon name={px} size={size} alt="" />
  return <span style={{ fontSize: size * 0.85, lineHeight: 1 }}>{icon}</span>
}
