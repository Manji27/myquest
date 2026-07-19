import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import { CyberpunkDashboard } from './components/cyberpunk/CyberpunkDashboard'

// Cyberpunk est l'expérience principale (chargée d'emblée). Les anciennes
// directions artistiques ne servent qu'en debug via query param : on les
// charge à la demande (lazy) pour ne pas alourdir le bundle mobile principal.
const FFXDashboard = lazy(() => import('./components/ffx/FFXDashboard').then((m) => ({ default: m.FFXDashboard })))
const P3RDashboard = lazy(() => import('./components/p3r/P3RDashboard').then((m) => ({ default: m.P3RDashboard })))
const PragmataDashboard = lazy(() => import('./components/pragmata/PragmataDashboard').then((m) => ({ default: m.PragmataDashboard })))
const App = lazy(() => import('./App'))

const params = new URLSearchParams(window.location.search)

function Root() {
  const alt = params.has('ffx') ? <FFXDashboard />
    : params.has('p3') ? <P3RDashboard />
    : params.has('pragmata') ? <PragmataDashboard />
    : params.has('classic') ? <App />
    : null
  if (alt) return <Suspense fallback={null}>{alt}</Suspense>
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
