import { defineConfig } from 'vitest/config'

// Config de test isolée : n'inclut PAS les plugins Vite de l'app (Cloudflare,
// PWA…) qui ne fonctionnent pas hors contexte serveur. Les tests portent sur
// la logique pure (dates, périodes, streaks, fusion sync).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
