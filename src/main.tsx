import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
