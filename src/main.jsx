import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// El service worker se registra aquí y no en index.html porque Vite solo
// reescribe la ruta base en los atributos del HTML, no dentro de los scripts:
// '/sw.js' apuntaría a la raíz del dominio y daría 404, así que nunca quedaría
// registrado y Chrome no ofrecería instalar la app.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL })
      .catch(err => console.warn('SW registration failed:', err))
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
