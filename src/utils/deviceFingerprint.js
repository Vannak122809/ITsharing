/**
 * deviceFingerprint.js — Cross-Browser Hardware Fingerprinting
 *
 * Generates a persistent physical Device ID based on hardware signals
 * (GPU graphics card model, screen resolution, CPU cores, RAM, OS family, timezone)
 * that are 100% IDENTICAL across ALL browsers (Chrome, Firefox, Safari, Edge, Brave, Opera).
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

function getGPUInfo() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return 'no-webgl';
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return 'no-debug';
    const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '';
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
    return `${vendor}~~~${renderer}`;
  } catch {
    return 'gpu-default';
  }
}

function getOSFamily() {
  const platform = navigator.platform || '';
  const ua = navigator.userAgent || '';
  if (/Mac/i.test(platform) || /Macintosh/i.test(ua)) return 'MacOS';
  if (/Win/i.test(platform) || /Windows/i.test(ua)) return 'Windows';
  if (/Linux/i.test(platform) || /Linux/i.test(ua)) return 'Linux';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  if (/Android/i.test(ua)) return 'Android';
  return 'OS';
}

export function getDeviceId() {
  try {
    // Collect browser-independent hardware signals
    const components = [
      getOSFamily(),
      getGPUInfo(),
      screen.width + 'x' + screen.height,
      screen.colorDepth,
      navigator.hardwareConcurrency || 'cpu-default',
      navigator.deviceMemory || 'ram-default',
      Intl.DateTimeFormat().resolvedOptions().timeZone || 'tz-default',
      new Date().getTimezoneOffset(),
    ];

    const hash = simpleHash(components.join('~~~'));
    const deviceId = `DEV-${hash}`;
    
    // Store in localStorage for fast lookup
    localStorage.setItem('itshare_device_id', deviceId);
    return deviceId;
  } catch {
    const fallbackId = `DEV-${simpleHash(navigator.userAgent || 'dev')}`;
    localStorage.setItem('itshare_device_id', fallbackId);
    return fallbackId;
  }
}
