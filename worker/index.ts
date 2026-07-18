import {
  buildPushPayload,
  type PushSubscription,
} from '@block65/webcrypto-web-push'

type ReminderConfig = {
  subscription: PushSubscription
  time: string
  timezone: string
}

type Storage = {
  get<T>(key: string): Promise<T | undefined>
  put<T>(key: string, value: T): Promise<void>
  deleteAlarm(): Promise<void>
  deleteAll(): Promise<void>
  setAlarm(timestamp: number): Promise<void>
}

type DurableState = { storage: Storage }
type ReminderStub = { fetch(request: Request): Promise<Response> }
type ReminderNamespace = {
  idFromName(name: string): unknown
  get(id: unknown): ReminderStub
}

type Env = {
  REMINDERS: ReminderNamespace
  VAPID_PUBLIC_KEY: string
  VAPID_PRIVATE_KEY: string
  VAPID_SUBJECT: string
}

const JSON_HEADERS = { 'Content-Type': 'application/json' }
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS })
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('Origin')
  return origin === new URL(request.url).origin
}

async function reminderId(endpoint: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(endpoint))
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function validTimezone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-GB', { timeZone: timezone }).format()
    return true
  } catch {
    return false
  }
}

function nextOccurrence(time: string, timezone: string, after = Date.now()): number {
  const [targetHour, targetMinute] = time.split(':').map(Number)
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const firstMinute = Math.floor(after / 60_000) * 60_000 + 60_000

  // Recherche la prochaine minute locale correspondante. Cette approche gère
  // aussi les changements d'heure sans maintenir un serveur ou un cron actif.
  for (let offset = 0; offset <= 27 * 60; offset += 1) {
    const candidate = firstMinute + offset * 60_000
    const parts = formatter.formatToParts(candidate)
    const hour = Number(parts.find((part) => part.type === 'hour')?.value)
    const minute = Number(parts.find((part) => part.type === 'minute')?.value)
    if (hour === targetHour && minute === targetMinute) return candidate
  }

  throw new Error('Impossible de calculer la prochaine heure de rappel.')
}

export class ReminderAlarm {
  constructor(
    private readonly state: DurableState,
    private readonly env: Env,
  ) {}

  async fetch(request: Request): Promise<Response> {
    if (request.method === 'DELETE') {
      await this.state.storage.deleteAll()
      return json({ ok: true })
    }

    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
    const url = new URL(request.url)
    const config = await request.json<ReminderConfig>()

    if (url.pathname.endsWith('/test')) {
      const result = await this.send(config.subscription, true)
      return json(result, result.ok ? 200 : 502)
    }

    await this.state.storage.put('config', config)
    await this.state.storage.setAlarm(nextOccurrence(config.time, config.timezone))
    return json({ ok: true, nextAt: nextOccurrence(config.time, config.timezone) })
  }

  async alarm(): Promise<void> {
    const config = await this.state.storage.get<ReminderConfig>('config')
    if (!config) return

    const result = await this.send(config.subscription, false)
    if (result.expired) {
      await this.state.storage.deleteAll()
      return
    }

    await this.state.storage.setAlarm(nextOccurrence(config.time, config.timezone, Date.now() + 60_000))
  }

  private async send(subscription: PushSubscription, test: boolean) {
    const payload = await buildPushPayload(
      {
        data: JSON.stringify({
          title: test ? 'QuestLog — Test réussi' : 'QuestLog — Quêtes en attente',
          body: test
            ? 'Les notifications sont correctement activées sur cet appareil.'
            : "C'est l'heure de progresser. Ouvre QuestLog et accomplis tes quêtes journalières.",
          url: '/',
        }),
        options: { ttl: 60 * 60 },
      },
      subscription,
      {
        subject: this.env.VAPID_SUBJECT,
        publicKey: this.env.VAPID_PUBLIC_KEY,
        privateKey: this.env.VAPID_PRIVATE_KEY,
      },
    )

    const response = await fetch(subscription.endpoint, payload)
    return {
      ok: response.ok,
      expired: response.status === 404 || response.status === 410,
      status: response.status,
    }
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    if (!url.pathname.startsWith('/api/reminders')) return json({ error: 'Not found' }, 404)
    if (!sameOrigin(request)) return json({ error: 'Invalid origin' }, 403)

    let body: ReminderConfig
    try {
      body = await request.clone().json<ReminderConfig>()
    } catch {
      return json({ error: 'Invalid JSON body' }, 400)
    }

    const endpoint = body.subscription?.endpoint
    if (!endpoint) return json({ error: 'Missing push subscription' }, 400)
    if (!TIME_PATTERN.test(body.time) || !validTimezone(body.timezone)) {
      return json({ error: 'Invalid reminder schedule' }, 400)
    }

    const id = env.REMINDERS.idFromName(await reminderId(endpoint))
    const stub = env.REMINDERS.get(id)
    return stub.fetch(new Request(`https://reminder.internal${url.pathname}`, request))
  },
}
