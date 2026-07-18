-- Schéma QuestLog pour Neon (Data API + Neon Auth)
-- À coller dans la Console Neon → SQL Editor, une fois le Data API activé.
--
-- Modèle de données identique à l'ancienne version Supabase :
--   states               : un enregistrement JSON par utilisateur (l'état complet de l'app)
--   push_subscriptions   : abonnements aux notifications push
--
-- La sécurité par ligne (RLS) garantit que chaque utilisateur ne voit et ne
-- modifie QUE ses propres lignes. Neon expose le claim JWT « sub » via
-- auth.user_id() (renvoyé en texte).

-- ── États de l'app ────────────────────────────────────────────────────────────
create table if not exists public.states (
  user_id    text primary key,
  state      jsonb not null,
  revision   bigint not null default 1,
  updated_at timestamptz not null default now()
);

alter table public.states
  add column if not exists revision bigint not null default 1;

alter table public.states enable row level security;

drop policy if exists states_owner on public.states;
create policy states_owner on public.states
  for all
  to authenticated
  using (auth.user_id() = user_id)
  with check (auth.user_id() = user_id);

-- ── Historique de récupération ───────────────────────────────────────────────
-- Un instantané maximum par période de 12 h et par utilisateur. L'application
-- conserve les 120 versions les plus récentes : assez pour réparer une erreur
-- logique bien après la fenêtre de restauration du plan gratuit.
create table if not exists public.state_history (
  id          bigint generated always as identity primary key,
  user_id     text not null,
  state       jsonb not null,
  revision    bigint not null,
  captured_at timestamptz not null default now()
);

create index if not exists state_history_owner_date_idx
  on public.state_history (user_id, captured_at desc);

alter table public.state_history enable row level security;

drop policy if exists state_history_owner_read on public.state_history;
drop policy if exists state_history_owner on public.state_history;
create policy state_history_owner on public.state_history
  for all
  to authenticated
  using (auth.user_id() = user_id)
  with check (auth.user_id() = user_id);

-- ── Abonnements push ──────────────────────────────────────────────────────────
create table if not exists public.push_subscriptions (
  endpoint   text primary key,
  user_id    text not null,
  p256dh     text,
  auth       text,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

drop policy if exists push_owner on public.push_subscriptions;
create policy push_owner on public.push_subscriptions
  for all
  to authenticated
  using (auth.user_id() = user_id)
  with check (auth.user_id() = user_id);

-- ── Droits pour le rôle « authenticated » ────────────────────────────────────
-- Normalement couverts par l'option « Grant public schema access » du Data API,
-- mais on les (re)pose ici au cas où les tables sont créées après l'activation.
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.states to authenticated;
grant select, insert, delete on public.state_history to authenticated;
grant select, insert, update, delete on public.push_subscriptions to authenticated;
