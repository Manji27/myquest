# Mettre QuestLog en ligne (et sur ton téléphone)

L'app est une PWA statique : le dossier `dist/` (généré par `npm run build`) suffit.
Choisis **une** des deux méthodes ci-dessous.

## Option 1 — Netlify Drop (le plus simple, sans compte CLI)

1. `npm run build` (génère `dist/`)
2. Va sur **https://app.netlify.com/drop**
3. Glisse-dépose le dossier `dist/` dans la page
4. Netlify te donne une URL publique (ex. `https://questlog-xyz.netlify.app`)

## Option 2 — Vercel (CLI, déploiements en une commande)

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

## ⚠️ Important : tes données

Chaque appareil/navigateur a **son propre stockage local** — les données ne se
synchronisent pas automatiquement entre desktop et mobile. Pour transférer :

1. Onglet **Progression → Exporter ma sauvegarde** (télécharge un `.json`)
2. Sur l'autre appareil : **Progression → Importer une sauvegarde**

Pense à exporter régulièrement pour ne rien perdre.
