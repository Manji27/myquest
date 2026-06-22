import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { FFXDashboard } from './components/ffx/FFXDashboard'

// Maquette alternative au style FFX, accessible via ?ffx (n'altère pas l'app)
const isFFX = new URLSearchParams(window.location.search).has('ffx')

createRoot(document.getElementById('root')!).render(
  <StrictMode>{isFFX ? <FFXDashboard /> : <App />}</StrictMode>,
)
