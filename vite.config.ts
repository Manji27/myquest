import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  // port figé : l'URL localhost reste http://localhost:5173 (stable en dev)
  server: { port: 5173, strictPort: true },
  plugins: [react(), tailwindcss(), VitePWA({
    registerType: 'autoUpdate',
    // On enregistre le SW nous-mêmes via `virtual:pwa-register` dans main.tsx
    // (auto-reload + update périodique). Sans ça, le plugin injecte un
    // registerSW.js minimal qui n'a aucune logique de rechargement.
    injectRegister: false,
    includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'push-handler.js'],
    // importe le handler de notifications push dans le service worker généré
    workbox: {
      // Active le nouveau SW immédiatement, sans attendre un message du client.
      // Indispensable pour sortir les clients déjà installés (mobile) du
      // deadlock : l'ancien registerSW.js minimal n'envoie jamais SKIP_WAITING,
      // donc sans skipWaiting inconditionnel le nouveau SW reste en « waiting ».
      skipWaiting: true,
      clientsClaim: true,
      importScripts: ['push-handler.js'],
      // L'application installée doit embarquer ses visuels. Sans ces motifs,
      // Workbox ne précachait que le JS/CSS/HTML et les icônes dépendaient
      // d'une requête réseau à chaque ouverture de la PWA.
      globPatterns: [
        '**/*.{js,css,html,svg}',
        'assets/**/*.{png,webp,wav}',
      ],
      cleanupOutdatedCaches: true,
    },
    manifest: {
      name: 'QuestLog — Journal & Quêtes',
      short_name: 'QuestLog',
      description: 'Ton journal cyberpunk gamifié : accomplis tes quêtes et développe ta progression.',
      theme_color: '#060e13',
      background_color: '#060e13',
      display: 'standalone',
      orientation: 'portrait',
      start_url: '/',
      icons: [
        { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml' },
        { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
        { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
  }), cloudflare()],
})
