import type { ReactNode } from 'react'
import './lifepath-card.css'

/**
 * Carte façon écran « V's Lifepath » de Cyberpunk 2077.
 * Deux états fidèles au jeu :
 * - débloquée  → cadre « sélectionné » : bord gauche épais, barre rouge à
 *   droite qui dépasse en haut et se biseaute en bas, coin bas-droit coupé,
 *   halo rouge, description saumon dessous ;
 * - verrouillée → cadre « normal » : flancs discrets, ligne basse vive,
 *   médaillon vertical centré en bas, même coupe diagonale.
 * `art` accueillera plus tard une image (placeholder icône en attendant).
 */
export function LifepathCard({
  title,
  desc,
  unlocked,
  art,
  progress,
}: {
  title: string
  desc: string
  unlocked: boolean
  art: ReactNode
  /** progression `[valeur, cible]` affichée sur les cartes verrouillées */
  progress?: [number, number]
}) {
  return (
    <div className={`lpc ${unlocked ? 'lpc-unlocked' : 'lpc-locked'}`}>
      <div className="lpc-title">{title}</div>
      <div className="lpc-card">
        <div className="lpc-frame" />
        <div className="lpc-body">
          <div className="lpc-art">{art}</div>
          {!unlocked && progress && (
            <div className="lpc-progress">
              <div className="track">
                <div
                  className="fill"
                  style={{ width: `${Math.min((progress[0] / progress[1]) * 100, 100)}%` }}
                />
              </div>
              <div className="count">
                {Math.min(progress[0], progress[1])} / {progress[1]}
              </div>
            </div>
          )}
        </div>
        {unlocked ? <div className="lpc-bar" /> : <div className="lpc-tick" />}
        <div className="lpc-cursor" />
      </div>
      <div className="lpc-desc">{desc}</div>
    </div>
  )
}
