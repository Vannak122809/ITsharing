/**
 * securityLogger.js — Client-side helper to report security events to /api/security-log
 *
 * Usage:
 *   import { logSecurityEvent } from '../utils/securityLogger';
 *   logSecurityEvent('failed_login', { email: 'test@x.com', page: '/login' });
 */

const API_BASE = import.meta.env.DEV ? 'http://localhost:3000' : '';

/**
 * @param {string} eventType - One of the valid event types
 * @param {object} metadata  - Additional context (email, page, etc.)
 */
export async function logSecurityEvent(eventType, metadata = {}) {
  try {
    await fetch(`${API_BASE}/api/security-log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType, metadata }),
    });
  } catch {
    // Logging failure must never crash the app — fire and forget
  }
}

// ── Pre-configured helpers ────────────────────────────────────────────────────

export const logFailedLogin   = (email) => logSecurityEvent('failed_login',         { email, page: '/login' });
export const logRateLimit     = (page)  => logSecurityEvent('rate_limit_hit',        { page });
export const logBruteForce    = (email) => logSecurityEvent('brute_force_detected',  { email, page: '/login' });
export const logUnauthorized  = (page)  => logSecurityEvent('unauthorized_access',   { page });
export const logBlockedDl     = (page)  => logSecurityEvent('blocked_download',      { page });
