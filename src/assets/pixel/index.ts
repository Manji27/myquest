import flame from './flame.png'
import gear from './gear.png'
import calendar from './calendar.png'
import book from './book.png'
import trophy from './trophy.png'
import scroll from './scroll.png'
import arrow from './arrow.png'
import check from './check.png'
import muscle from './muscle.png'
import broom from './broom.png'
import books from './books.png'

export const pixel = {
  flame,
  gear,
  calendar,
  book,
  trophy,
  scroll,
  arrow,
  check,
  muscle,
  broom,
  books,
} as const

export type PixelName = keyof typeof pixel

/** Emojis des quêtes par défaut qui ont un asset pixel dédié. */
export const PIXEL_BY_EMOJI: Record<string, PixelName> = {
  '💪': 'muscle',
  '🧹': 'broom',
  '📚': 'books',
}
