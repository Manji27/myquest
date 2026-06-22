import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { FFXDashboard } from './components/ffx/FFXDashboard'
import { P3RDashboard } from './components/p3r/P3RDashboard'

// Maquettes alternatives, accessibles via ?ffx ou ?p3 (n'altèrent pas l'app)
const params = new URLSearchParams(window.location.search)

function Root() {
  if (params.has('ffx')) return <FFXDashboard />
  if (params.has('p3')) return <P3RDashboard />
  return <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
