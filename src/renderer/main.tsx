import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App'
import './i18n'
import './styles/global.css'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Brak elementu #root w HTML')

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
