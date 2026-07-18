# Mettre QuestLog en ligne (et sur ton téléphone)

L'app est une PWA statique : le dossier `dist/` (généré par `npm run build`) suffit.
La cible recommandée est Cloudflare Pages.

## Option recommandée — Cloudflare Pages

1. Pousse le dépôt sur un dépôt Git privé.
2. Dans Cloudflare → **Workers & Pages** → **Create** → **Pages**.
3. Connecte le dépôt et utilise :
   - commande de build : `npm run build`
   - dossier de sortie : `dist`
4. Ajoute les variables `VITE_NEON_AUTH_URL` et `VITE_NEON_DATA_API_URL`.
5. Déploie, puis ouvre l'URL générée sur tes appareils.

## Alternatives

Netlify et Vercel restent compatibles. Pour Vercel :

```bash
npm i -g vercel      # une seule fois
npm run build
vercel --prod        # suis les instructions (connexion la 1re fois)
```

> Astuce : tu peux aussi connecter le repo Git à Vercel/Netlify pour un
> redéploiement automatique à chaque `git push`.

## Installer l'app sur ton téléphone

Une fois l'URL ouverte sur ton mobile :

- **iPhone (Safari)** : bouton Partager → « Sur l'écran d'accueil »
- **Android (Chrome)** : menu ⋮ → « Installer l'application »
- **Mac/PC (Chrome/Edge)** : icône d'installation dans la barre d'adresse

L'app s'ouvre alors en plein écran comme une vraie application, et fonctionne hors-ligne.

## Synchronisation des données

Sans les variables Neon, chaque navigateur conserve uniquement sa copie locale.
Une fois Neon configuré selon `NEON.md`, connecte-toi avec le même email sur le
téléphone et le PC : les changements se synchronisent automatiquement.

L'export/import JSON reste disponible pour une récupération manuelle. La sauvegarde
automatique hors site dans Cloudflare R2 sera ajoutée après la création du bucket et
des secrets Cloudflare ; aucune clé privée R2 ne doit être placée dans les variables
`VITE_*`, car celles-ci sont publiques dans le navigateur.

## Ordre de mise en production

1. Créer Neon Auth + Data API et exécuter `neon/schema.sql`.
2. Tester le même compte sur deux navigateurs.
3. Déployer la PWA sur Cloudflare Pages.
4. Créer le bucket R2 privé et brancher la sauvegarde planifiée côté Worker.
