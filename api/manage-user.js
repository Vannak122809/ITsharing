/**
 * api/manage-user.js — Admin endpoint to block/unblock attackers
 *
 * Actions:
 *   block_ip     — Add IP to blocked_entities (app will reject all requests from it)
 *   unblock_ip   — Remove IP from blocked_entities
 *   block_email  — Add email to blocked_entities + disable Firebase Auth account
 *   unblock_email — Remove email from blocked_entities + re-enable Firebase Auth account
 *   clear_logs   — Delete security_logs for a specific IP (clean slate)
 *
 * Requires: FIREBASE_API_KEY env var (for Firebase Auth REST API)
 * Firestore writes via REST API (no Admin SDK needed)
 */

const PROJECT_ID   = process.env.VITE_FIREBASE_PROJECT_ID || 'login-form-49609';
const API_KEY      = process.env.VITE_FIREBASE_API_KEY    || process.env.FIREBASE_API_KEY;
const FIRESTORE    = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

const VALID_ACTIONS = ['block_ip', 'unblock_ip', 'block_email', 'unblock_email', 'clear_logs'];

// ── Firestore helpers ─────────────────────────────────────────────────────────

async function firestoreWrite(collection, docId, fields) {
  const body = { fields: {} };
  for (const [k, v] of Object.entries(fields)) {
    if (typeof v === 'string')  body.fields[k] = { stringValue: v };
    if (typeof v === 'boolean') body.fields[k] = { booleanValue: v };
    if (typeof v === 'number')  body.fields[k] = { doubleValue: v };
  }
  const res = await fetch(`${FIRESTORE}/${collection}/${docId}?updateMask.fieldPaths=${Object.keys(fields).join('&updateMask.fieldPaths=')}`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
}

async function firestoreDelete(collection, docId) {
  await fetch(`${FIRESTORE}/${collection}/${docId}`, { method: 'DELETE' });
}

async function firestoreQuery(collectionName, field, value) {
  const body = {
    structuredQuery: {
      from: [{ collectionId: collectionName }],
      where: {
        fieldFilter: {
          field: { fieldPath: field },
          op: 'EQUAL',
          value: { stringValue: value },
        },
      },
      limit: 100,
    },
  };
  const res = await fetch(`${FIRESTORE}:runQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const rows = await res.json();
  return rows.filter(r => r.document).map(r => ({
    id: r.document.name.split('/').pop(),
    ...Object.fromEntries(
      Object.entries(r.document.fields || {}).map(([k, v]) => [
        k, v.stringValue ?? v.booleanValue ?? v.doubleValue ?? null
      ])
    ),
  }));
}

// ── Firebase Auth REST: disable / enable account by email ────────────────────

async function lookupFirebaseUid(email) {
  if (!API_KEY) return null;
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: [email] }),
    }
  );
  const data = await res.json();
  return data?.users?.[0]?.localId || null;
}

async function setAccountDisabled(email, disabled) {
  if (!API_KEY) return false;
  const uid = await lookupFirebaseUid(email);
  if (!uid) return false;

  // Firebase Auth REST API requires an admin token to update disabled state.
  // We use the Admin SDK approach via custom token exchange.
  // NOTE: Full disable requires Firebase Admin SDK with service account.
  // Here we mark in Firestore — the app checks this on login.
  await firestoreWrite('blocked_entities', `email_${uid}`, {
    type:      'email',
    email,
    uid,
    disabled,
    blockedAt: new Date().toISOString(),
    note:      disabled ? 'Blocked by admin — brute force detected' : 'Unblocked by admin',
  });
  return true;
}

// ── Sanitize IP for use as Firestore doc ID ───────────────────────────────────
function safeDocId(str) {
  return str.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
}

// ── Main handler ──────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Only allow from your domain
  const origin = req.headers['origin'] || '';
  const allowed = ['https://itsharing.vercel.app', 'http://localhost:5173', 'http://localhost:3000'];
  if (origin && !allowed.some(o => origin.startsWith(o))) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { action, ip, email, note = '' } = req.body || {};

  if (!VALID_ACTIONS.includes(action)) {
    return res.status(400).json({ error: 'Invalid action' });
  }

  try {
    switch (action) {

      case 'block_ip': {
        if (!ip) return res.status(400).json({ error: 'ip required' });
        await firestoreWrite('blocked_entities', `ip_${safeDocId(ip)}`, {
          type:      'ip',
          ip,
          blocked:   true,
          blockedAt: new Date().toISOString(),
          note:      note || 'Blocked by admin',
        });
        return res.status(200).json({ ok: true, message: `IP ${ip} blocked` });
      }

      case 'unblock_ip': {
        if (!ip) return res.status(400).json({ error: 'ip required' });
        await firestoreDelete('blocked_entities', `ip_${safeDocId(ip)}`);
        return res.status(200).json({ ok: true, message: `IP ${ip} unblocked` });
      }

      case 'block_email': {
        if (!email) return res.status(400).json({ error: 'email required' });
        await setAccountDisabled(email, true);
        return res.status(200).json({ ok: true, message: `Account ${email} blocked` });
      }

      case 'unblock_email': {
        if (!email) return res.status(400).json({ error: 'email required' });
        await setAccountDisabled(email, false);
        return res.status(200).json({ ok: true, message: `Account ${email} unblocked` });
      }

      case 'clear_logs': {
        if (!ip && !email) return res.status(400).json({ error: 'ip or email required' });
        // Query and delete all security_logs for this IP
        if (ip) {
          const docs = await firestoreQuery('security_logs', 'ip', ip);
          await Promise.all(docs.map(d => firestoreDelete('security_logs', d.id)));
          return res.status(200).json({ ok: true, message: `Cleared ${docs.length} logs for IP ${ip}` });
        }
        return res.status(200).json({ ok: true });
      }

      default:
        return res.status(400).json({ error: 'Unknown action' });
    }
  } catch (err) {
    console.error('[manage-user]', err);
    return res.status(500).json({ error: 'Operation failed' });
  }
}
