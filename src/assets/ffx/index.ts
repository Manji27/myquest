import tabJournal from './tab-journal.png'
import tabProgression from './tab-progression.png'
import tabSouvenirs from './tab-souvenirs.png'

export const ffxAssets = {
  tabJournal,
  tabProgression,
  tabSouvenirs,
} as const

export type FFXAssetName = keyof typeof ffxAssets
