import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import SumApp from './SumApp.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SumApp />
  </StrictMode>,
)
