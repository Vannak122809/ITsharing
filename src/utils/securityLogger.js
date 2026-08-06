/**
 * securityLogger.js — Client-side helper to report security events to /api/security-log and Telegram
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
  const telegramToken  = localStorage.getItem('itshare_telegram_token') || '';
  const telegramChatId = localStorage.getItem('itshare_telegram_chat_id') || '';

  const fullMeta = { ...metadata, deviceId, telegramToken, telegramChatId };

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
    // Silent fail
  }

  // Direct Telegram Alert Fallback for Local Dev Mode
  if (telegramToken && telegramChatId) {
    try {
      const { sendTelegramAlert } = await import('./telegramNotify');
      const eventLabel = eventType === 'failed_login'
        ? '🔑 FAILED LOGIN ATTEMPT'
        : eventType === 'brute_force_detected'
        ? '💥 BRUTE FORCE ATTACK'
        : eventType === 'rate_limit_hit'
        ? '⚡ RATE LIMIT EXCEEDED'
        : eventType.toUpperCase().replace(/_/g, ' ');

      const alertText = `
🚨 <b>ITShare Security Alert</b> 🚨

<b>Attacker Action:</b> ${eventLabel}
<b>Status:</b> ⚠️ ACTIVE ATTACKER (NOT BLOCKED)
<b>Target Account:</b> <code>${metadata.email || 'None'}</code>
<b>Device ID:</b> <code>${deviceId}</code>
<b>Location:</b> Local Development Server
<b>Threat Score:</b> ${eventType === 'brute_force_detected' ? 50 : 30} / 100
      `.trim();

      const inlineButtons = [
        [{ text: '📱 Ban Device', callback_data: `ban_device:${deviceId}` }]
      ];
      if (metadata.email) {
        inlineButtons.push([{ text: '👤 Ban Account', callback_data: `ban_account:${metadata.email}` }]);
      }

      await sendTelegramAlert(alertText, { inline_keyboard: inlineButtons }, telegramToken, telegramChatId);
    } catch {
      // Silent fail
    }
  }
}

/** Helper aliases for specific security event logging */
export async function logFailedLogin(email, metadata = {}) {
  return logSecurityEvent('failed_login', { email, ...metadata });
}

export async function logBruteForce(email, metadata = {}) {
  return logSecurityEvent('brute_force_detected', { email, ...metadata });
}

export async function logRateLimit(endpoint, metadata = {}) {
  return logSecurityEvent('rate_limit_hit', { endpoint, ...metadata });
}
