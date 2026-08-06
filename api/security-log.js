/**
 * api/security-log.js — Server-side security event logger
 *
 * Receives security events from the app (failed logins, rate limit hits,
 * suspicious requests) and logs them to Firestore with:
 *   - Real client IP address (from request headers)
 *   - Geolocation (country, city, region) via ip-api.com (free, no key needed)
 *   - User-Agent / browser fingerprint
 *   - Timestamp
 *   - Event type and metadata
 *
 * This API endpoint is the ONLY way to write to the security_logs Firestore
 * collection. The client never writes directly — all writes are server-validated.
 */

const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${process.env.VITE_FIREBASE_PROJECT_ID || 'login-form-49609'}/databases/(default)/documents/security_logs`;

// ── IP extraction (handles proxies, Cloudflare, Vercel edge) ─────────────────
function getClientIP(req) {
  return (
    req.headers['cf-connecting-ip'] ||          // Cloudflare real IP
    req.headers['x-real-ip'] ||                  // Nginx proxy
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || // Load balancer chain
    req.socket?.remoteAddress ||
    'unknown'
  );
}

// ── Geolocate an IP using ip-api.com (free, 45 req/min, no API key needed) ───
async function geolocate(ip) {
  // Skip private/loopback IPs
  if (!ip || ip === 'unknown' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip === '::1') {
    return { country: 'Local', city: 'Localhost', region: '', isp: 'Local Network', lat: 0, lon: 0 };
  }

  try {
    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,countryCode,region,regionName,city,isp,org,lat,lon,timezone,mobile,proxy,hosting`,
      { signal: AbortSignal.timeout(3000) }
    );
    const data = await res.json();
    if (data.status === 'success') {
      return {
        country:     data.country,
        countryCode: data.countryCode,
        city:        data.city,
        region:      data.regionName,
        isp:         data.isp,
        org:         data.org,
        lat:         data.lat,
        lon:         data.lon,
        timezone:    data.timezone,
        isMobile:    data.mobile,
        isProxy:     data.proxy,       // True if known VPN/proxy/Tor
        isHosting:   data.hosting,     // True if datacenter IP (bot signal)
      };
    }
  } catch {
    // Geolocation failed — don't block the log
  }
  return { country: 'Unknown', city: 'Unknown', region: '' };
}

// ── Check if email is a real registered Firebase account ─────────────────────
// Uses Firebase Auth REST API (sign-in-with-email-exists endpoint)
// Returns true if the account exists in your Firebase project.
async function checkAccountExists(email) {
  if (!email) return false;
  try {
    const apiKey = process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY;
    if (!apiKey) return false;

    // fetchSignInMethodsForEmail — returns [] if no account, ['password'] if exists
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: email, continueUri: 'https://itsharing.vercel.app' }),
        signal: AbortSignal.timeout(3000),
      }
    );
    const data = await res.json();
    // If allProviders or signinMethods has entries, the account exists
    return Array.isArray(data.allProviders) && data.allProviders.length > 0;
  } catch {
    return false;
  }
}

// ── Write a document to Firestore via REST API (no SDK needed server-side) ───
async function writeToFirestore(data) {
  const fields = {};
  for (const [key, val] of Object.entries(data)) {
    if (typeof val === 'string')  fields[key] = { stringValue: val };
    else if (typeof val === 'number') fields[key] = { doubleValue: val };
    else if (typeof val === 'boolean') fields[key] = { booleanValue: val };
    else if (val === null || val === undefined) fields[key] = { nullValue: null };
    else fields[key] = { stringValue: String(val) };
  }

  await fetch(FIRESTORE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });
}

// ── Main handler ──────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Allow only from your own domain
  const origin = req.headers['origin'] || '';
  const allowedOrigins = [
    'https://itsharing.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
  ];
  if (origin && !allowedOrigins.some(o => origin.startsWith(o))) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { eventType, metadata = {} } = req.body || {};

  const VALID_EVENTS = [
    'failed_login',
    'rate_limit_hit',
    'unauthorized_access',
    'suspicious_request',
    'brute_force_detected',
    'blocked_download',
    'admin_access_denied',
  ];

  if (!VALID_EVENTS.includes(eventType)) {
    return res.status(400).json({ error: 'Invalid event type' });
  }

  // Gather data
  const ip        = getClientIP(req);
  const userAgent = req.headers['user-agent'] || 'unknown';
  const geo       = await geolocate(ip);
  const timestamp = new Date().toISOString();

  // Threat scoring
  let threatScore = 0;
  if (geo.isProxy)   threatScore += 40;  // VPN/Tor usage
  if (geo.isHosting) threatScore += 30;  // Datacenter IP = likely bot
  if (eventType === 'brute_force_detected') threatScore += 30;
  if (eventType === 'rate_limit_hit')       threatScore += 10;
  if (eventType === 'failed_login')         threatScore += 15;

  // Check if the targeted email is a real account (for login events)
  let accountExists = false;
  const targetEmail = metadata.email || '';
  if (targetEmail && ['failed_login', 'brute_force_detected'].includes(eventType)) {
    accountExists = await checkAccountExists(targetEmail);
    // Being targeted with a real account email is higher threat
    if (accountExists) threatScore += 20;
  }

  const logEntry = {
    eventType,
    ip,
    userAgent,
    timestamp,
    // Geo
    country:     geo.country     || 'Unknown',
    countryCode: geo.countryCode || '',
    city:        geo.city        || 'Unknown',
    region:      geo.region      || '',
    isp:         geo.isp         || '',
    lat:         geo.lat         || 0,
    lon:         geo.lon         || 0,
    timezone:    geo.timezone    || '',
    isProxy:     geo.isProxy     || false,
    isHosting:   geo.isHosting   || false,
    // Threat
    threatScore,
    // Device & Metadata info
    deviceId:       metadata.deviceId || '',
    metaEmail:      metadata.email   || '',
    metaPage:       metadata.page    || '',
    metaNote:       metadata.note    || '',
    accountExists,  // true = attacker targeted a real registered account
  };

  try {
    await writeToFirestore(logEntry);

    // Send Telegram alert if bot is configured
    let botToken = process.env.TELEGRAM_BOT_TOKEN;
    let chatId   = process.env.TELEGRAM_CHAT_ID;
    const db     = getDb();

    if (!botToken || !chatId) {
      try {
        const tgSnap = await db.collection('settings').doc('telegram').get();
        if (tgSnap.exists) {
          const tgData = tgSnap.data();
          botToken = botToken || tgData.token;
          chatId   = chatId   || tgData.chatId;
        }
      } catch (e) {}
    }

    if (botToken && chatId) {
      const safeId = (str) => (str || '').toLowerCase().replace(/[^a-zA-Z0-9._-]/g, '_');
      let isAlreadyBlocked = false;
      try {
        const [ipSnap, devSnap] = await Promise.all([
          db.collection('blocked_entities').doc(`ip_${safeId(ip)}`).get(),
          metadata.deviceId ? db.collection('blocked_entities').doc(`device_${safeId(metadata.deviceId)}`).get() : Promise.resolve({ exists: false })
        ]);
        if (ipSnap.exists || devSnap.exists) isAlreadyBlocked = true;
      } catch (e) {}

      const eventLabel = eventType === 'failed_login'
        ? '🔑 FAILED LOGIN ATTEMPT'
        : eventType === 'brute_force_detected'
        ? '💥 BRUTE FORCE ATTACK'
        : eventType === 'rate_limit_hit'
        ? '⚡ RATE LIMIT EXCEEDED'
        : eventType.toUpperCase().replace(/_/g, ' ');

      const statusBadge = isAlreadyBlocked ? '🚫 BLOCKED & LOCKED OUT' : '⚠️ ACTIVE ATTACKER (NOT BLOCKED)';

      const text = `
🚨 <b>ITShare Security Alert</b> 🚨

<b>Attacker Action:</b> ${eventLabel}
<b>Status:</b> ${statusBadge}
<b>Target Account:</b> <code>${targetEmail || 'None'}</code> ${accountExists ? '⚠️ <b>(Real Account)</b>' : ''}
<b>Device ID:</b> <code>${metadata.deviceId || 'Unknown'}</code>
<b>Attacker IP:</b> <code>${ip}</code>
<b>Location:</b> ${geo.city || 'Unknown'}, ${geo.country || 'Unknown'} (${geo.isp || 'ISP'})
<b>VPN/Proxy:</b> ${geo.isProxy ? '⚠️ YES' : 'NO'} | <b>Bot:</b> ${geo.isHosting ? '⚠️ YES' : 'NO'}
<b>Threat Score:</b> <b>${threatScore}</b> / 100
      `.trim();

      const inlineButtons = [];
      if (!isAlreadyBlocked) {
        inlineButtons.push([
          { text: '🚫 Ban IP', callback_data: `ban_ip:${ip}` },
          { text: '📱 Ban Device', callback_data: `ban_device:${metadata.deviceId || ''}` }
        ]);
        if (targetEmail) {
          inlineButtons.push([{ text: '👤 Ban Account', callback_data: `ban_account:${targetEmail}` }]);
        }
      } else {
        inlineButtons.push([
          { text: '✅ Unblock IP', callback_data: `unblock:${ip}` },
          { text: '✅ Unblock Device', callback_data: `unblock:${metadata.deviceId || ''}` }
        ]);
      }
      inlineButtons.push([{ text: '📊 System Status', callback_data: 'status' }]);

      fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: inlineButtons }
        })
      }).catch(() => {});
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[security-log] Firestore write failed:', err);
    // Don't expose internal error details
    return res.status(500).json({ error: 'Log write failed' });
  }
}
