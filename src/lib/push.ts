import { getCloudAccessToken, removeSubscription, saveSubscription } from './cloud'

const VAPID = import.meta.env.VITE_VAPID_PUBLIC as string | undefined

export const pushSupported =
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window &&
  !!VAPID

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

/** L'utilisateur est-il déjà abonné aux notifications sur cet appareil ? */
export async function isPushEnabled(): Promise<boolean> {
  if (!pushSupported) return false
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = await reg?.pushManager.getSubscription()
  return !!sub && Notification.permission === 'granted'
}

/** Active les notifications : permission → abonnement → enregistrement côté serveur. */
export async function enablePush(uid: string): Promise<{ ok: boolean; reason?: string }> {
  if (!pushSupported) return { ok: false, reason: 'Notifications non supportées sur cet appareil.' }
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') return { ok: false, reason: 'Permission refusée.' }
  const reg = await navigator.serviceWorker.ready
  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID!) as BufferSource,
    })
  }
  await saveSubscription(uid, sub.toJSON())
  return { ok: true }
}

type ReminderSchedule = { time: string; timezone: string }

async function currentSubscription(): Promise<PushSubscription | null> {
  const reg = await navigator.serviceWorker.ready
  return reg.pushManager.getSubscription()
}

async function callReminderApi(path: string, method: 'POST' | 'DELETE', schedule: ReminderSchedule) {
  const subscription = await currentSubscription()
  if (!subscription) throw new Error("L'abonnement aux notifications est introuvable.")
  const accessToken = await getCloudAccessToken()
  const response = await fetch(path, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      subscription: subscription.toJSON(),
      time: schedule.time,
      timezone: schedule.timezone,
    }),
  })
  if (!response.ok) {
    const data = await response.json().catch(() => null) as { error?: string } | null
    throw new Error(data?.error ?? `Erreur notifications (${response.status})`)
  }
}

/** Programme ou déplace le rappel quotidien de cet appareil. */
export async function schedulePush(time: string, timezone: string): Promise<void> {
  await callReminderApi('/api/reminders', 'POST', { time, timezone })
}

/** Envoie immédiatement une notification de contrôle. */
export async function testPush(time: string, timezone: string): Promise<void> {
  await callReminderApi('/api/reminders/test', 'POST', { time, timezone })
}

/** Désactive les notifications sur cet appareil. */
export async function disablePush(time = '20:00', timezone = localTimezone()): Promise<void> {
  if (!pushSupported) return
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = await reg?.pushManager.getSubscription()
  if (sub) {
    await callReminderApi('/api/reminders', 'DELETE', { time, timezone })
    await removeSubscription(sub.endpoint)
    await sub.unsubscribe()
  }
}

export function localTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return 'UTC'
  }
}
