/**
 * deviceFingerprint.js — Client-side device identification & fingerprinting
 *
 * Generates a unique, persistent Device ID based on canvas rendering, hardware specs,
 * screen resolution, and audio context.
 */

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
}

export function getDeviceId() {
  // Check if deviceId already exists in localStorage
  let cachedId = localStorage.getItem('itshare_device_id');
  if (cachedId) return cachedId;

  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = "14px 'Arial'";
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('ITShare-Security-Device-ID-2026', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('ITShare-Security-Device-ID-2026', 4, 17);
    const canvasData = canvas.toDataURL();

    const components = [
      navigator.userAgent,
      navigator.language,
      screen.colorDepth,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency || 'unknown',
      canvasData.slice(-100),
    ];

    const hash = simpleHash(components.join('~~~'));
    cachedId = `DEV-${hash}`;
    localStorage.setItem('itshare_device_id', cachedId);
    return cachedId;
  } catch {
    // Fallback ID if canvas fingerprinting is blocked
    const fallbackId = `DEV-${simpleHash(navigator.userAgent + Math.random())}`;
    localStorage.setItem('itshare_device_id', fallbackId);
    return fallbackId;
  }
}
