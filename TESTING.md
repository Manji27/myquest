# Plan de test QA — QuestLog

Checklist à dérouler avant toute mise en ligne « pour de vrai ». Les tests 🔴 sont
**bloquants** : ne pas mettre en ligne tant qu'ils ne passent pas.

## 1. Intégrité des données & synchro cloud (priorité absolue)
- 🔴 1.1 Persistance locale : saisir des données, rafraîchir (F5), fermer/rouvrir l'onglet, redémarrer le navigateur → données toujours là.
- 🔴 1.2 Connexion lien magique (desktop) : email → « lien envoyé » → clic du lien → connecté, « ✓ Synchronisé ».
- 🔴 1.3 1ʳᵉ connexion appareil A (avec données locales) → push dans le cloud (table `states`).
- 🔴 1.4 Cross-device A→B : connexion sur B vierge, même email → données de A présentes.
- 🔴 1.5 Propagation A→B : modifier sur A → recharger B → modif présente.
- 🔴 1.6 Fusion sans perte : données différentes en local et cloud → union (rien perdu).
- 🔴 1.7 Édition hors-ligne puis reconnexion → push.
- 🔴 1.8 Déconnexion/reconnexion → rien perdu ni dupliqué.
- 🔴 1.9 Sécurité RLS : 2ᵉ compte → ne voit jamais les données du 1ᵉʳ.
- 1.10 Export/import `.json` → restauration fidèle (confirmation avant écrasement).
- 1.11 Indicateurs : « Synchronisation… », « ✓ Synchronisé à HH:MM », erreurs réseau gérées.

## 2. Fonctionnel cœur
- 2.1 Cocher/décocher → XP, jauge, compteur X/Y, courbe.
- 2.2 Niveaux & barre d'XP au bon seuil.
- 2.3 Streak du jour + record (Progression).
- 2.4 Succès : toast + confettis UNE fois (pas de re-notif au refresh).
- 2.5 Quêtes récurrentes : apparition/disparition selon le jour ; jauge/compteur sur les quêtes prévues.
- 2.6 Jour de repos : message dédié si rien de prévu.
- 2.7 Navigation jours : flèches, calendrier (jour/mois/année), clic sur la courbe ; pas de futur.
- 2.8 Édition quête (nom/icône/couleur/difficulté/récurrence), ajout rapide, suppression.
- 2.9 Moment positif : « Valider », badge « ✓ Enregistré » / « Non enregistré » ; Cmd/Ctrl+Entrée.
- 2.10 Souvenirs regroupés par mois ; clic → ouvre le jour.
- 2.11 Stats : taux par quête cohérent avec la récurrence ; journées parfaites correctes.

## 3. Robustesse & cas limites
- 3.1 Premier lancement (vide) → quêtes par défaut, pas de crash.
- 3.2 Zéro quête → pas de division par zéro, carte d'ajout visible.
- 3.3 Texte long + emojis + accents.
- 3.4 Changement de date à minuit → « aujourd'hui » bascule ; historique conservé.
- 3.5 localStorage corrompu → retour aux défauts sans crash.
- 3.6 Spam de clics → pas d'incohérence d'état.

## 4. PWA & déploiement
- 🔴 4.1 Variables d'env présentes en prod (cloud activé, pas « Pas encore configurée »).
- 🔴 4.2 Redirect URLs Supabase : lien magique OK sur l'URL de PROD.
- 4.3 Installable (iOS/Android/desktop) → plein écran avec icône.
- 4.4 Hors-ligne : s'ouvre sans réseau (service worker).
- 4.5 Mise à jour : un nouveau déploiement est pris en compte au rechargement.
  - ⚠️ Vercel bloque les déploiements auto si l'email du commit git n'est pas relié au compte GitHub.
    Configurer `git config user.email` avec l'email (noreply) GitHub.
- 4.6 0 erreur / 0 warning bloquant dans la console en prod.

## 5. UI / UX responsive
- 5.1 Desktop (≥1280px) ET mobile (~390px) : pas de débordement, alignements cohérents.
- 5.2 Zones tactiles + safe-area iPhone.
- 5.3 Modales centrées, fermables (✕ + clic extérieur), scroll interne.
- 5.4 Lisibilité, contrastes, états actif/désactivé.

## 6. Sécurité & confidentialité
- 🔴 6.1 Aucun secret dans le repo (`.env` ignoré, seul `.env.example`).
- 🔴 6.2 RLS actif ; clé `anon` uniquement (jamais `service_role`).
- 6.3 Repo GitHub privé.
