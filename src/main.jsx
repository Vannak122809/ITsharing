import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import * as Sentry from '@sentry/react'
import App from './App.jsx'
import 'bootstrap/dist/css/bootstrap-grid.min.css'
import './index.css'
import { LanguageProvider } from './LanguageContext.jsx'

// ── Sentry Error Monitoring ─────────────────────────────────────────
// ── Sentry Error Monitoring ─────────────────────────────────────────
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 0.3,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

// ── Service Worker Registration for High-Traffic Static Caching (Prod only) ────
if ('serviceWorker' in navigator && typeof window !== 'undefined') {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // In local dev, unregister any lingering service workers to avoid stale cache issues
    navigator.serviceWorker.getRegistrations().then(regs => {
      for (const reg of regs) reg.unregister();
    });
  } else {
    window.addEventListener('load', () => {
      navigator.serviceWorker?.register('/sw.js').catch(() => {});
    });
  }
}

// ── Transparent Error Boundary Fallback ──────────────────────────────
function ErrorFallback({ error, resetError }) {
  console.error('[App Crash caught by ErrorBoundary]:', error);
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#090d16',
      color: '#f8fafc',
      padding: '24px',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        maxWidth: '560px',
        width: '100%',
        background: 'rgba(30, 41, 59, 0.85)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(239, 68, 68, 0.35)',
        borderRadius: '24px',
        padding: '32px 24px',
        textAlign: 'center',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)'
      }}>
        <div style={{ fontSize: '42px', marginBottom: '12px' }}>⚠️</div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '8px', color: '#f8fafc' }}>
          Application Error
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '16px' }}>
          An unhandled error occurred while rendering the page.
        </p>

        {error?.message && (
          <div style={{
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '12px',
            padding: '12px 14px',
            marginBottom: '20px',
            textAlign: 'left'
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', marginBottom: '4px' }}>
              Error Message:
            </div>
            <code style={{ fontSize: '0.82rem', color: '#fca5a5', wordBreak: 'break-word', fontFamily: 'monospace' }}>
              {error.message}
            </code>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              if (resetError) resetError();
              window.location.reload();
            }}
            style={{
              padding: '11px 22px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              color: '#fff',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
          <button
            onClick={() => {
              localStorage.clear();
              sessionStorage.clear();
              window.location.href = '/';
            }}
            style={{
              padding: '11px 22px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#f87171',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            Clear Cache & Reset
          </button>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={ErrorFallback} onError={(err) => console.error('[ErrorBoundary caught error]:', err)}>
      <BrowserRouter>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </BrowserRouter>
    </Sentry.ErrorBoundary>
  </React.StrictMode>,
)
