/**
 * rateLimiter.js — Client-side rate limiting utility
 *
 * Prevents abuse of sensitive actions (login attempts, downloads, AI generation).
 * Uses in-memory storage (resets on page refresh) for simplicity.
 * For persistent limits, replace the Map with localStorage.
 */

const actionLog = new Map(); // action → [timestamp, ...]

/**
 * Check if an action is allowed under the rate limit.
 * @param {string} action   - Unique action name e.g. "login", "download", "ai_generate"
 * @param {number} max      - Max allowed calls within the window
 * @param {number} windowMs - Time window in milliseconds
 * @returns {{ allowed: boolean, retryAfterMs: number }}
 */
export function checkRateLimit(action, max, windowMs) {
  const now = Date.now();
  const timestamps = actionLog.get(action) || [];

  // Remove timestamps outside the window
  const recent = timestamps.filter(ts => now - ts < windowMs);

  if (recent.length >= max) {
    // Calculate when the oldest entry will expire
    const oldest = Math.min(...recent);
    const retryAfterMs = windowMs - (now - oldest);
    return { allowed: false, retryAfterMs };
  }

  // Record this attempt
  recent.push(now);
  actionLog.set(action, recent);
  return { allowed: true, retryAfterMs: 0 };
}

/**
 * Format a millisecond delay into a human-readable string.
 * e.g. 65000 → "1m 5s"
 */
export function formatRetryTime(ms) {
  const totalSec = Math.ceil(ms / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

// ── Pre-configured rate limit profiles ────────────────────────────────────────

/** Login attempts: max 5 per 60 seconds */
export const checkLoginLimit = (userId = 'anon') =>
  checkRateLimit(`login:${userId}`, 5, 60_000);

/** File download: max 20 per 60 seconds per user */
export const checkDownloadLimit = (userId = 'anon') =>
  checkRateLimit(`download:${userId}`, 20, 60_000);

/** AI text generation: max 3 per 30 seconds */
export const checkAILimit = (userId = 'anon') =>
  checkRateLimit(`ai:${userId}`, 3, 30_000);

/** File upload: max 10 per hour */
export const checkUploadLimit = (userId = 'anon') =>
  checkRateLimit(`upload:${userId}`, 10, 3_600_000);
