import {
  buildPushPayload,
  type PushSubscription,
} from '@block65/webcrypto-web-push'
import { createRemoteJWKSet, jwtVerify } from 'jose'

type ReminderConfig = {
  subscription: PushSubscription
  time: string
  timezone: string
  userId: string
}

type Storage = {
  get<T>(key: string): Promise<T | undefined>
  put<T>(key: string, value: T): Promise<void>
  deleteAlarm(): Promise<void>
  deleteAll(): Promise<void>
  setAlarm(timestamp: number): Promise<void>
}

type DurableState = { storage: Storage }
type DurableStub = { fetch(request: Request): Promise<Response> }
type DurableNamespace = {
  idFromName(name: string): unknown
  get(id: unknown): DurableStub
}
type AssetFetcher = { fetch(request: Request): Promise<Response> }

type Env = {
  ASSETS: AssetFetcher
  REMINDERS: DurableNamespace
  SECURITY_GATE: DurableNamespace
  NEON_AUTH_URL: string
  NEON_DATA_API_URL: string
  ACCESS_ALLOWED_EMAIL: string
  POLICY_AUD: string
  TEAM_DOMAIN: string
  ALLOWED_AUTH_EMAILS?: string
  VAPID_PUBLIC_KEY: string
  VAPID_PRIVATE_KEY: string
  VAPID_SUBJECT: string
}

const JSON_HEADERS = {
  'Cache-Control': 'no-store',
  'Content-Type': 'application/json; charset=utf-8',
}
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/
const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/
const MAX_BODY_BYTES = 8_192
const ACCESS_JWKS = createRemoteJWKSet(
  new URL('https://marcus-mendy27.cloudflareaccess.com/cdn-cgi/access/certs'),
)
const SECURITY_HEADERS: Record<string, string> = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "base-uri 'none'",
    "connect-src 'self' https://*.neon.tech",
    "font-src 'self' data: https://fonts.gstatic.com",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "img-src 'self' data: blob:",
    "manifest-src 'self'",
    "object-src 'none'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "worker-src 'self' blob:",
    'upgrade-insecure-requests',
  ].join('; '),
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Permissions-Policy':
    'camera=(), geolocation=(), microphone=(), payment=(), usb=(), browsing-topics=()',
  'Referrer-Policy': 'no-referrer',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
}

function json(body: unknown, status = 200, extraHeaders?: HeadersInit): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...JSON_HEADERS, ...extraHeaders },
  })
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('Origin')
  return origin === new URL(request.url).origin
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
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

  for (let offset = 0; offset <= 27 * 60; offset += 1) {
    const candidate = firstMinute + offset * 60_000
    const parts = formatter.formatToParts(candidate)
    const hour = Number(parts.find((part) => part.type === 'hour')?.value)
    const minute = Number(parts.find((part) => part.type === 'minute')?.value)
    if (hour === targetHour && minute === targetMinute) return candidate
  }

  throw new Error('Impossible de calculer la prochaine heure de rappel.')
}

function decodeBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  const bytes = atob(padded)
  return Uint8Array.from(bytes, (char) => char.charCodeAt(0))
}

function parseJwtPayload(token: string): { sub?: string; exp?: number } | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    return JSON.parse(new TextDecoder().decode(decodeBase64Url(parts[1]))) as {
      sub?: string
      exp?: number
    }
  } catch {
    return null
  }
}

function validSubscription(subscription: PushSubscription | undefined): subscription is PushSubscription {
  const endpoint = subscription?.endpoint
  const p256dh = subscription?.keys?.p256dh
  const auth = subscription?.keys?.auth
  if (!endpoint || !p256dh || !auth) return false
  if (endpoint.length > 2_048 || p256dh.length > 256 || auth.length > 128) return false
  if (!BASE64URL_PATTERN.test(p256dh) || !BASE64URL_PATTERN.test(auth)) return false
  try {
    const url = new URL(endpoint)
    return url.protocol === 'https:'
  } catch {
    return false
  }
}

async function readJson<T>(request: Request): Promise<T> {
  const contentType = request.headers.get('Content-Type') ?? ''
  if (!contentType.toLowerCase().startsWith('application/json')) throw new Error('CONTENT_TYPE')
  const declaredLength = Number(request.headers.get('Content-Length') ?? '0')
  if (declaredLength > MAX_BODY_BYTES) throw new Error('TOO_LARGE')
  const raw = await request.text()
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) throw new Error('TOO_LARGE')
  return JSON.parse(raw) as T
}

async function authenticate(request: Request, env: Env): Promise<string | null> {
  const authorization = request.headers.get('Authorization')
  if (!authorization?.startsWith('Bearer ')) return null
  const token = authorization.slice(7)
  const payload = parseJwtPayload(token)
  if (!payload?.sub || (payload.exp && payload.exp * 1_000 <= Date.now())) return null

  // La Data API vérifie cryptographiquement le JWT avec la configuration Neon.
  const probeUrl = new URL(`${env.NEON_DATA_API_URL.replace(/\/+$/, '')}/states`)
  probeUrl.searchParams.set('select', 'user_id')
  probeUrl.searchParams.set('limit', '0')
  const response = await fetch(probeUrl, {
    headers: {
      Accept: 'application/json',
      Authorization: authorization,
    },
  })
  return response.ok ? payload.sub : null
}

async function rateLimit(
  env: Env,
  key: string,
  limit: number,
  windowMs: number,
): Promise<{ allowed: boolean; retryAfter: number }> {
  const id = env.SECURITY_GATE.idFromName(await sha256(key))
  const response = await env.SECURITY_GATE.get(id).fetch(
    new Request('https://security.internal/limit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ limit, windowMs }),
    }),
  )
  return response.json<{ allowed: boolean; retryAfter: number }>()
}

function withSecurityHeaders(response: Response): Response {
  const secured = new Response(response.body, response)
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) secured.headers.set(name, value)
  return secured
}

async function hasValidAccessIdentity(request: Request, env: Env): Promise<boolean> {
  const hostname = new URL(request.url).hostname
  if (hostname === 'localhost' || hostname === '127.0.0.1') return true

  const token = request.headers.get('Cf-Access-Jwt-Assertion')
  const audiences = env.POLICY_AUD.split(',').map((value) => value.trim()).filter(Boolean)
  if (!token || audiences.length === 0 || !env.TEAM_DOMAIN || !env.ACCESS_ALLOWED_EMAIL) {
    return false
  }

  try {
    const { payload } = await jwtVerify(token, ACCESS_JWKS, {
      algorithms: ['RS256'],
      audience: audiences,
      issuer: env.TEAM_DOMAIN,
    })
    return (
      typeof payload.email === 'string' &&
      payload.email.toLowerCase() === env.ACCESS_ALLOWED_EMAIL.toLowerCase()
    )
  } catch {
    return false
  }
}

export class SecurityGate {
  constructor(private readonly state: DurableState) {}

  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
    const { limit, windowMs } = await request.json<{ limit: number; windowMs: number }>()
    const now = Date.now()
    const window = await this.state.storage.get<{ startedAt: number; count: number }>('window')
    const current =
      !window || now - window.startedAt >= windowMs
        ? { startedAt: now, count: 0 }
        : window
    current.count += 1
    await this.state.storage.put('window', current)
    const retryAfter = Math.max(1, Math.ceil((current.startedAt + windowMs - now) / 1_000))
    return json({ allowed: current.count <= limit, retryAfter })
  }
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

    const nextAt = nextOccurrence(config.time, config.timezone)
    await this.state.storage.put('config', config)
    await this.state.storage.setAlarm(nextAt)
    return json({ ok: true, nextAt })
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

async function handleReminder(request: Request, env: Env): Promise<Response> {
  if (!sameOrigin(request)) return json({ error: 'Invalid origin' }, 403)
  if (request.method !== 'POST' && request.method !== 'DELETE') {
    return json({ error: 'Method not allowed' }, 405, { Allow: 'POST, DELETE' })
  }

  const userId = await authenticate(request, env)
  if (!userId) return json({ error: 'Authentication required' }, 401)

  const isTest = new URL(request.url).pathname.endsWith('/test')
  const quota = await rateLimit(
    env,
    `${userId}:${isTest ? 'test' : 'schedule'}`,
    isTest ? 5 : 30,
    60_000,
  )
  if (!quota.allowed) {
    return json({ error: 'Too many requests' }, 429, { 'Retry-After': String(quota.retryAfter) })
  }

  let body: Omit<ReminderConfig, 'userId'>
  try {
    body = await readJson<Omit<ReminderConfig, 'userId'>>(request)
  } catch (error) {
    const reason = error instanceof Error ? error.message : ''
    if (reason === 'TOO_LARGE') return json({ error: 'Request body too large' }, 413)
    if (reason === 'CONTENT_TYPE') return json({ error: 'JSON content type required' }, 415)
    return json({ error: 'Invalid JSON body' }, 400)
  }

  if (!validSubscription(body.subscription)) {
    return json({ error: 'Invalid push subscription' }, 400)
  }
  if (!TIME_PATTERN.test(body.time) || body.timezone.length > 100 || !validTimezone(body.timezone)) {
    return json({ error: 'Invalid reminder schedule' }, 400)
  }

  const id = env.REMINDERS.idFromName(await sha256(`${userId}\n${body.subscription.endpoint}`))
  const stub = env.REMINDERS.get(id)
  return stub.fetch(
    new Request(`https://reminder.internal${new URL(request.url).pathname}`, {
      method: request.method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, userId }),
    }),
  )
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (!(await hasValidAccessIdentity(request, env))) {
      return withSecurityHeaders(json({ error: 'Access denied' }, 403))
    }

    const url = new URL(request.url)
    if (url.pathname.startsWith('/api/reminders')) {
      return withSecurityHeaders(await handleReminder(request, env))
    }
    if (url.pathname.startsWith('/api/')) {
      return withSecurityHeaders(json({ error: 'Not found' }, 404))
    }
    return withSecurityHeaders(await env.ASSETS.fetch(request))
  },
}
