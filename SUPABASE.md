# Activer la synchronisation cloud (Supabase)

Une fois ces étapes faites (≈ 10 min, une seule fois), tes données se sauvegardent
en ligne automatiquement et te suivent sur tous tes appareils. Connexion par **lien
magique** envoyé par email — pas de mot de passe.

## 1. Créer le projet

1. Va sur **https://supabase.com** → connecte-toi → **New project**.
2. Donne un nom, un mot de passe de base (note-le), choisis une région proche, **Create**.
3. Attends ~2 min que le projet soit prêt.

## 2. Récupérer les clés

Dans le projet : **Settings → API**, copie :
- **Project URL** → `VITE_SUPABASE_URL`
- **anon public** (clé publique) → `VITE_SUPABASE_ANON_KEY`

> La clé « anon » est conçue pour être publique : l'accès est protégé par les règles
> de sécurité ci-dessous (chacun ne voit que ses propres données).

## 3. Créer la table + la sécurité

**SQL Editor → New query**, colle ceci et **Run** :

```sql
create table if not exists public.states (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.states enable row level security;

create policy "Users manage their own state"
  on public.states for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

## 4. Autoriser les URLs de connexion

**Authentication → URL Configuration** :
- **Site URL** : `http://localhost:5173`
- **Redirect URLs** : ajoute `http://localhost:5173` et (plus tard) l'URL de ton app en ligne.

> L'authentification par email est activée par défaut — rien d'autre à faire.

## 5. Brancher l'app

À la racine du projet, crée un fichier **`.env`** (copie de `.env.example`) :

```
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Puis **redémarre** le serveur (`npm run dev`) — les variables sont lues au démarrage.

## 6. Se connecter

Onglet **Progression → Synchronisation cloud** → saisis ton email → clique le lien reçu.
C'est tout : à partir de là, chaque modification est sauvegardée en ligne, et tu retrouves
tes données en te connectant avec le même email sur n'importe quel appareil.

## En production

Quand tu déploies (voir `DEPLOY.md`), ajoute les **mêmes variables** `VITE_SUPABASE_URL`
et `VITE_SUPABASE_ANON_KEY` dans les réglages d'environnement de Netlify/Vercel, et ajoute
l'URL de l'app dans les **Redirect URLs** de Supabase (étape 4).

## Comment ça gère les conflits ?

À la connexion, l'app **fusionne** tes données locales avec celles du cloud sans rien
perdre (union des quêtes cochées, on garde le texte le plus complet). Ensuite, chaque
changement est poussé automatiquement (~1,5 s après). L'export `.json` reste disponible
comme filet de sécurité supplémentaire.
