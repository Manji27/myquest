import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // port figé : l'URL localhost reste http://localhost:5173 (stable en dev)
  server: { port: 5173, strictPort: true },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'push-handler.js'],
      // importe le handler de notifications push dans le service worker généré
      workbox: { importScripts: ['push-handler.js'] },
      manifest: {
        name: 'QuestLog — Journal & Quêtes',
        short_name: 'QuestLog',
        description: 'Ton journal gamifié : accomplis tes quêtes du jour et fais grimper ta courbe.',
        theme_color: '#0b1020',
        background_color: '#0b1020',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml' },
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
