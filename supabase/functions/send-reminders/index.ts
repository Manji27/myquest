// Edge Function : envoie un rappel push aux utilisateurs dont la journée n'est pas
// validée, à leur heure de rappel. Déclenchée chaque heure par pg_cron.
//
// Secrets nécessaires (supabase secrets set ...) :
//   VAPID_PUBLIC, VAPID_PRIVATE, VAPID_SUBJECT (ex: mailto:toi@email.com)
// Variables injectées automatiquement par Supabase :
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'npm:@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@questlog.app',
  Deno.env.get('VAPID_PUBLIC')!,
  Deno.env.get('VAPID_PRIVATE')!,
)

Deno.serve(async () => {
  const now = new Date()
  const { data: subs, error } = await supabase.from('push_subscriptions').select('*')
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })

  let sent = 0
  for (const sub of subs ?? []) {
    try {
      const { data: row } = await supabase
        .from('states')
        .select('state')
        .eq('user_id', sub.user_id)
        .maybeSingle()
      const st: any = row?.state
      const settings = st?.settings
      if (!settings?.reminderEnabled || !settings.reminderTime) continue

      const tz = settings.tz || 'UTC'
      // heure locale actuelle de l'utilisateur
      const hh = Number(
        new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', hour12: false }).format(now),
      )
      const reminderHour = Number(String(settings.reminderTime).split(':')[0])
      if (hh !== reminderHour) continue // on n'envoie qu'à l'heure du rappel

      // clé du jour (date locale)
      const todayKey = new Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(now)
      const log = st?.logs?.[todayKey]
      if (log && Array.isArray(log.completed) && log.completed.length > 0) continue // déjà actif

      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({
          title: 'QuestLog ⚔️',
          body: "Ta journée n'est pas encore validée — go ! 💪",
          url: '/',
        }),
      )
      sent++
    } catch (e: any) {
      // abonnement expiré → on le supprime
      if (e?.statusCode === 404 || e?.statusCode === 410) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
      }
    }
  }

  return new Response(JSON.stringify({ sent }), { headers: { 'Content-Type': 'application/json' } })
})
