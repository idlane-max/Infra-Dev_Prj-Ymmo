// frontend/src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom' // <-- Import du routeur
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* On englobe notre App dans le BrowserRouter pour que les URL fonctionnent */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)