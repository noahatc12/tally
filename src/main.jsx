import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import './styles/app.css'
import App from './App.jsx'
import { maybeSeedDemo } from './dev/seed.js'

// Opt-in only: `?demo` loads example history, `?reset` clears all data. No-op otherwise.
maybeSeedDemo()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
