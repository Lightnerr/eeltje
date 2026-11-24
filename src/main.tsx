import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Eerst de basis, dan App: zo winnen de css-bestanden van pagina's en componenten van styles.css.
import './styles.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
