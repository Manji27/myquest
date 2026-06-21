/** Renvoie la date locale au format YYYY-MM-DD (pas d'UTC, on respecte le fuseau). */
export function toKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayKey(): string {
  return toKey(new Date())
}

export function keyToDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(key: string, n: number): string {
  const d = keyToDate(key)
  d.setDate(d.getDate() + n)
  return toKey(d)
}

/** Liste des n dernières clés de jours, du plus ancien (gauche) au plus récent (droite). */
export function lastNDays(n: number, end: string = todayKey()): string[] {
  const out: string[] = []
  for (let i = n - 1; i >= 0; i--) out.push(addDays(end, -i))
  return out
}

const WEEKDAYS = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam']
const MONTHS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]

export function weekdayShort(key: string): string {
  return WEEKDAYS[keyToDate(key).getDay()]
}

export function prettyDate(key: string): string {
  const d = keyToDate(key)
  const wd = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'][d.getDay()]
  return `${wd} ${d.getDate()} ${MONTHS[d.getMonth()]}`
}
