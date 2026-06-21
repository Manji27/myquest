import { removeSubscription, saveSubscription } from './cloud'

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

/** Désactive les notifications sur cet appareil. */
export async function disablePush(): Promise<void> {
  if (!pushSupported) return
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = await reg?.pushManager.getSubscription()
  if (sub) {
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
