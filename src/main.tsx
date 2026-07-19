import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App'
import { FFXDashboard } from './components/ffx/FFXDashboard'
import { P3RDashboard } from './components/p3r/P3RDashboard'
import { PragmataDashboard } from './components/pragmata/PragmataDashboard'
import { CyberpunkDashboard } from './components/cyberpunk/CyberpunkDashboard'

// Cyberpunk est l'expérience principale. Les anciennes directions artistiques
// restent accessibles explicitement pour comparaison et maintenance.
const params = new URLSearchParams(window.location.search)

function Root() {
  if (params.has('ffx')) return <FFXDashboard />
  if (params.has('p3')) return <P3RDashboard />
  if (params.has('pragmata')) return <PragmataDashboard />
  if (params.has('classic')) return <App />
  return <CyberpunkDashboard />
}

// PWA : le SW est en mode autoUpdate (skipWaiting + clientsClaim). Ce module
// recharge automatiquement la page dès qu'une nouvelle version prend le
// contrôle — indispensable sur mobile, où l'on ne peut pas vider le cache à la
// main. On vérifie aussi les mises à jour toutes les heures pour les PWA
// installées qui restent ouvertes longtemps.
registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    if (registration) {
      setInterval(() => registration.update(), 60 * 60 * 1000)
    }
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
