import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { FFXDashboard } from './components/ffx/FFXDashboard'
import { P3RDashboard } from './components/p3r/P3RDashboard'
import { PragmataDashboard } from './components/pragmata/PragmataDashboard'
import { CyberpunkDashboard } from './components/cyberpunk/CyberpunkDashboard'

// Maquettes alternatives, accessibles via ?ffx, ?p3, ?pragmata ou ?cyberpunk (n'altèrent pas l'app)
const params = new URLSearchParams(window.location.search)

function Root() {
  if (params.has('ffx')) return <FFXDashboard />
  if (params.has('p3')) return <P3RDashboard />
  if (params.has('pragmata')) return <PragmataDashboard />
  if (params.has('cyberpunk')) return <CyberpunkDashboard />
  return <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
