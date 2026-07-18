# Activer les rappels push quotidiens

Le code client est déjà en place. Il reste à déployer la partie serveur (≈ 20 min, une fois).
On t'enverra un rappel chaque jour à l'heure choisie **si ta journée n'est pas validée**.

> ⚠️ iOS : les notifications web ne marchent que si l'app est **installée sur l'écran d'accueil** (iOS 16.4+).

## 0. Clés VAPID
Déjà générées. La **publique** va côté app, la **privée** reste secrète côté serveur.
(Je te les ai données dans le chat — ne committe jamais la privée.)

## 1. Variable d'env côté app (Vercel)
Dans Vercel → ton projet → Settings → Environment Variables, ajoute :
```
VITE_VAPID_PUBLIC = <clé publique VAPID>
```
Puis **redéploie** (Deployments → ⋯ → Redeploy), car Vite fige les variables au build.
(En local, c'est déjà dans ton `.env`.)

## 2. Table des abonnements + sécurité
Supabase → SQL Editor → Run :
```sql
create table if not exists public.push_subscriptions (
  endpoint text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now()
);
alter table public.push_subscriptions enable row level security;
create policy "own subscriptions" on public.push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

## 3. Installer le CLI Supabase + lier le projet
```bash
npm i -g supabase          # ou: brew install supabase/tap/supabase
supabase login             # ouvre le navigateur
supabase link --project-ref sefoushbcjqtuntwnhha
```

## 4. Secrets de la fonction
```bash
supabase secrets set \
  VAPID_PUBLIC=<clé publique VAPID> \
  VAPID_PRIVATE=<clé privée VAPID> \
  VAPID_SUBJECT=mailto:marcus.mendy27@gmail.com
```
(`SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont injectés automatiquement.)

## 5. Déployer la fonction
La fonction est dans `supabase/functions/send-reminders/`. On la déploie sans vérif JWT
pour que le planificateur puisse l'appeler :
```bash
supabase functions deploy send-reminders --no-verify-jwt
```

## 6. Planifier l'envoi (toutes les heures)
Supabase → SQL Editor → Run :
```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'questlog-reminders',
  '0 * * * *',  -- chaque heure à :00 (UTC) ; la fonction gère ton fuseau
  $$
  select net.http_post(
    url := 'https://sefoushbcjqtuntwnhha.supabase.co/functions/v1/send-reminders',
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  $$
);
```

## 7. Tester
1. Dans l'app (installée) : onglet **Progression → Rappel quotidien** → active le toggle
   (accepte la demande de permission) → choisis une heure.
2. Test immédiat de la fonction :
   ```bash
   curl -X POST https://sefoushbcjqtuntwnhha.supabase.co/functions/v1/send-reminders
   ```
   Si ta journée n'est pas validée et que l'heure correspond, tu reçois la notif.
   (Pour forcer un test hors heure, règle l'heure de rappel sur l'heure actuelle.)

## Dépannage
- **Rien reçu** : vérifie que tu es connecté, le toggle activé, l'app installée (iOS), et que
  `push_subscriptions` contient bien une ligne (`select * from push_subscriptions;`).
- **Logs de la fonction** : Supabase → Edge Functions → send-reminders → Logs.
- **Désactiver** : repasse le toggle off (supprime l'abonnement de cet appareil).
