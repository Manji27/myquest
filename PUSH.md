# Rappels push quotidiens

QuestLog utilise les notifications Web Push et une alarme Cloudflare Durable
Object par appareil. Aucun cron n'interroge Neon : la base peut donc continuer
à se mettre en veille.

## Fonctionnement

1. L'utilisateur se connecte dans l'onglet **Progression**.
2. Il active **Rappel quotidien** et accepte la permission système.
3. Il choisit librement une heure puis clique sur **Valider**.
4. Cloudflare programme l'alarme dans le fuseau horaire de l'appareil.
5. Le bouton **Tester** permet de contrôler immédiatement la notification.

Le rappel est reprogrammé chaque jour et tient compte des changements d'heure.
Chaque téléphone ou ordinateur possède son propre abonnement et peut donc
recevoir son rappel.

## Variables Cloudflare

Variable de build :

```text
VITE_VAPID_PUBLIC
```

Secrets Worker :

```text
VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
VAPID_SUBJECT
```

`VAPID_SUBJECT` utilise une adresse de contact au format `mailto:`.

## Compatibilité

- Chrome, Edge, Firefox et les navigateurs Android compatibles Web Push.
- Sur iPhone/iPad, l'application doit être installée sur l'écran d'accueil
  (iOS/iPadOS 16.4 ou supérieur).
- Les notifications doivent être autorisées dans les réglages du système.
