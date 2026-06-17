import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import * as Sentry from '@sentry/react'
import App from './App.jsx'
import 'bootstrap/dist/css/bootstrap-grid.min.css'
import './index.css'
import { LanguageProvider } from './LanguageContext.jsx'

// ── Sentry Error Monitoring ─────────────────────────────────────────
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || '',
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 0.3,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  enabled: !!import.meta.env.VITE_SENTRY_DSN,
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<div style={{ padding: '40px', textAlign: 'center' }}>
      <h2>Something went wrong</h2>
      <p>Our team has been notified. Please refresh the page.</p>
      <button onClick={() => window.location.reload()} style={{ padding: '10px 24px', borderRadius: '12px', background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer', marginTop: '16px' }}>Refresh</button>
    </div>}>
      <BrowserRouter>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </BrowserRouter>
    </Sentry.ErrorBoundary>
  </React.StrictMode>,
)
