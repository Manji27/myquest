# QuestLog 🎯

Journal gamifié : chaque jour, accomplis tes quêtes (sport, ménage, lecture…), coche-les,
fais grimper ta **courbe de productivité** et note **le moment positif** de ta journée.
Pensé pour donner envie d'avoir une courbe haute et d'être productif chaque jour.

Fonctionne sur **desktop et mobile** (PWA installable), **100% en local** — aucune donnée n'est envoyée sur un serveur.

## Fonctionnalités

- ⚔️ **Quêtes du jour** personnalisables (icône, couleur, récompense XP) — cochables d'un tap
- 🔋 **Jauge « Puissance du jour »** + messages d'encouragement selon ton avancement
- 📈 **Courbe de productivité** sur 14 jours avec ligne d'objectif (80%), record et moyenne
- 🎉 **Confettis** quand tu franchis ton objectif du jour
- 🏆 **Niveaux + barre d'XP** et 🔥 **série de jours consécutifs** (streak)
- ✨ **Journal du moment positif** + humeur du jour, avec **sauvegarde auto** (indicateur « Enregistré ✓ »)
- 📅 **Navigation entre les jours** (flèches ou clic sur un point de la courbe) pour revoir/compléter l'historique
- 🔒 Données stockées en privé sur ton appareil (localStorage)

## Démarrer

```bash
npm install
npm run dev      # ouvre http://localhost:5173
```

## Build de production

```bash
npm run build    # génère dist/
npm run preview  # prévisualise le build
```

## Installer comme une app

- **iPhone (Safari)** : Partager → « Sur l'écran d'accueil »
- **Android (Chrome)** : menu ⋮ → « Installer l'application »
- **Mac/PC (Chrome/Edge)** : icône d'installation dans la barre d'adresse

### La déployer en ligne (gratuit)

Le dossier `dist/` est statique. Tu peux le déposer sur Netlify, Vercel ou GitHub Pages
en quelques minutes pour y accéder depuis n'importe quel appareil.

## Stack

Vite · React 19 · TypeScript · Tailwind v4 · vite-plugin-pwa · graphiques SVG faits main (zéro lib de charts).

## Structure

```
src/
  App.tsx              orchestration de l'état du jour
  types.ts             modèle de données
  data/defaultQuests   quêtes & palettes par défaut
  lib/
    date.ts            utilitaires de dates locales
    game.ts            score, niveaux, streak, vibes
    storage.ts         persistance localStorage (hook)
  components/
    Header             niveau, XP, streak, date
    PowerGauge         jauge circulaire du jour
    QuestCard          carte de quête animée
    ScoreCurve         courbe SVG lissée 14 jours
    PositiveEvent      journal + humeur
    QuestEditor        gestion des quêtes
    Confetti           explosion de confettis
```
