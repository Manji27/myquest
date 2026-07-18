# Activer la synchronisation cloud (Neon)

Une fois ces étapes faites (≈ 10 min, une seule fois), tes données se sauvegardent
en ligne automatiquement et te suivent sur tous tes appareils. Connexion par **code
envoyé par email** — pas de mot de passe.

> Pourquoi Neon ? Le plan **gratuit** autorise jusqu'à **100 projets** (une base par
> app), avec **Neon Auth** (60 000 utilisateurs/mois) et le **Data API** inclus — idéal
> pour multiplier les petites apps sans payer.

## 1. Créer le projet

1. Va sur **https://neon.com** → connecte-toi → **New Project**.
2. Donne un nom, choisis une région proche, **Create project**.

## 2. Activer Neon Auth

1. Dans le projet : sidebar **Auth**.
2. Active **Neon Auth** (Managed Better Auth).
3. Onglet **Auth → Plugins** : active **Magic Link / Email OTP**.
4. Copie l'**URL du service Auth** → ce sera `VITE_NEON_AUTH_URL`.

## 3. Activer le Data API

1. Sidebar **Data API**.
2. Comme fournisseur JWT, choisis **Neon Auth** (celui activé à l'étape 2).
3. Coche **Grant public schema access**.
4. Clique **Enable Data API**.
5. Copie l'**URL du Data API** (elle se termine par `/rest/v1`) → ce sera `VITE_NEON_DATA_API_URL`.

> ⚠️ Le Data API est incompatible avec « IP Allow » / « Private Networking ». Laisse ces
> options désactivées sur le plan gratuit (c'est le cas par défaut).

## 4. Créer les tables + la sécurité

**SQL Editor**, colle le contenu de **`neon/schema.sql`** (fourni dans le repo) et exécute-le.
Il crée les tables `states`, `state_history` et `push_subscriptions` avec la sécurité par ligne (RLS) :
chaque utilisateur ne peut lire/écrire que ses propres données.

Le script peut aussi être exécuté sur une installation existante : il ajoute la colonne
`revision` sans supprimer les données déjà présentes.

## 5. Brancher l'app

À la racine du projet, dans **`.env`** (copie de `.env.example`), renseigne :

```
VITE_NEON_AUTH_URL=https://xxxxxxxx.auth.neon.tech
VITE_NEON_DATA_API_URL=https://xxxxxxxx.dataapi.neon.tech/rest/v1
```

Puis **redémarre** le serveur (`npm run dev`) — les variables sont lues au démarrage.

## 6. Se connecter

Onglet **Progression → Synchronisation cloud** → saisis ton email → tu reçois un **code**
par email → saisis-le dans l'app. C'est tout : à partir de là, chaque modification est
sauvegardée en ligne, et tu retrouves tes données en te connectant avec le même email sur
n'importe quel appareil.

## En production

Quand tu déploies (voir `DEPLOY.md`), ajoute les **mêmes variables** `VITE_NEON_AUTH_URL`
et `VITE_NEON_DATA_API_URL` dans les réglages d'environnement de Netlify/Vercel.

## Comment ça gère les conflits ?

Avant chaque écriture, l'app récupère la dernière version distante puis fusionne les
changements. Des horloges par quête, journal et étape permettent de synchroniser aussi
les décochages et suppressions. La colonne `revision` empêche deux appareils d'écraser
la même version : en cas de course, l'app relit, fusionne et réessaie.

La synchronisation reprend automatiquement au retour du réseau et lorsque l'app revient
au premier plan. L'application alimente la table `state_history`, qui conserve jusqu'à
120 instantanés espacés d'au moins 12 heures. L'export `.json` reste disponible comme
filet de sécurité supplémentaire.

> Important : cet historique Neon protège contre une erreur applicative, mais ne remplace
> pas la future sauvegarde hors site dans Cloudflare R2.

## Note technique

Toute la dépendance cloud est isolée dans `src/lib/cloud.ts`, via le SDK
`@neondatabase/neon-js` avec l'adaptateur compatible Supabase — le reste de l'app ne connaît
que des fonctions abstraites (`pullState`, `pushState`, `onAuthChange`…).
