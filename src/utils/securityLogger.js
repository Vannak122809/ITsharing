/**
 * securityLogger.js — Client-side helper to report security events to /api/security-log
 *
 * Usage:
 *   import { logSecurityEvent } from '../utils/securityLogger';
 *   logSecurityEvent('failed_login', { email: 'test@x.com', page: '/login' });
 */

import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { getDeviceId } from './deviceFingerprint';

/**
 * @param {string} eventType - One of the valid event types
 * @param {object} metadata  - Additional context (email, page, etc.)
 */
export async function logSecurityEvent(eventType, metadata = {}) {
  const deviceId = getDeviceId();
  const fullMeta = { ...metadata, deviceId };

  try {
    const res = await fetch('/api/security-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType, metadata: fullMeta }),
    });
    if (res.ok) return;
  } catch {
    // API endpoint unavailable (e.g. running in local Vite dev mode)
  }

  // Fallback: log directly to Firestore security_logs collection
  try {
    await addDoc(collection(db, 'security_logs'), {
      eventType,
      ip: '127.0.0.1 (Dev)',
      country: 'Localhost',
      countryCode: 'KH',
      city: 'Local Dev',
      isp: 'Local Development Server',
      threatScore: eventType === 'brute_force_detected' ? 50 : 15,
      timestamp: new Date().toISOString(),
      deviceId,
      metaEmail: metadata.email || '',
      metaPage: metadata.page || '',
      metaNote: metadata.note || '',
    });
  } catch {
    // Silent fail if both fail — logging must never break app execution
  }
}

// ── Pre-configured helpers ────────────────────────────────────────────────────

export const logFailedLogin   = (email) => logSecurityEvent('failed_login',         { email, page: '/login' });
export const logRateLimit     = (page)  => logSecurityEvent('rate_limit_hit',        { page });
export const logBruteForce    = (email) => logSecurityEvent('brute_force_detected',  { email, page: '/login' });
export const logUnauthorized  = (page)  => logSecurityEvent('unauthorized_access',   { page });
export const logBlockedDl     = (page)  => logSecurityEvent('blocked_download',      { page });
