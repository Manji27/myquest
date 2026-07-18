import { useCallback, useEffect, useRef } from 'react'
import tabSound from '../../../references/cyberpunk-ui/sounds/tab-sound.wav'
import validationSound from '../../../references/cyberpunk-ui/sounds/validation.wav'
import hoverSound from '../../../references/cyberpunk-ui/sounds/mouse-hover.wav'
import levelUpSound from '../../../references/cyberpunk-ui/sounds/level-up.wav'

type CyberpunkSound = 'tab' | 'validation' | 'hover' | 'levelUp'

const SOUND_SOURCES: Record<CyberpunkSound, string> = {
  tab: tabSound,
  validation: validationSound,
  hover: hoverSound,
  levelUp: levelUpSound,
}

const SOUND_VOLUMES: Record<CyberpunkSound, number> = {
  tab: 0.34,
  validation: 0.46,
  hover: 0.18,
  levelUp: 0.58,
}

/** Précharge les sons de l'interface cyberpunk et les rejoue à la demande. */
export function useCyberpunkSounds() {
  const sounds = useRef<Partial<Record<CyberpunkSound, HTMLAudioElement>>>({})
  const lastHoverAt = useRef(0)

  useEffect(() => {
    const audioBank: Partial<Record<CyberpunkSound, HTMLAudioElement>> = {}

    for (const name of Object.keys(SOUND_SOURCES) as CyberpunkSound[]) {
      const audio = new Audio(SOUND_SOURCES[name])
      audio.preload = 'auto'
      audio.volume = SOUND_VOLUMES[name]
      audioBank[name] = audio
    }

    sounds.current = audioBank

    return () => {
      for (const audio of Object.values(audioBank)) audio?.pause()
      sounds.current = {}
    }
  }, [])

  const play = useCallback((name: CyberpunkSound) => {
    const audio = sounds.current[name]
    if (!audio) return

    audio.currentTime = 0
    void audio.play().catch(() => {
      // Certains navigateurs bloquent l'audio avant la première interaction.
    })
  }, [])

  const playHover = useCallback(() => {
    const now = performance.now()
    if (now - lastHoverAt.current < 90) return
    lastHoverAt.current = now
    play('hover')
  }, [play])

  return {
    playTab: useCallback(() => play('tab'), [play]),
    playValidation: useCallback(() => play('validation'), [play]),
    playHover,
    playLevelUp: useCallback(() => play('levelUp'), [play]),
  }
}
