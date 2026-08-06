/**
 * api/submit-appeal.js — Serverless Endpoint for User Unblock Appeals
 *
 * Saves appeal record to Firestore `ban_appeals` and dispatches real-time Telegram Alert to Admin Bot.
 */

const PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || 'login-form-49609';

async function getSettingsTelegramREST() {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/settings/telegram`;
    const res = await fetch(url);
    if (!res.ok) return { token: '', chatId: '' };
    const data = await res.json();
    const fields = data.fields || {};
    return {
      token: fields.token?.stringValue || '',
      chatId: fields.chatId?.stringValue || ''
    };
  } catch {
    return { token: '', chatId: '' };
  }
}

async function addBanAppealREST(appealData) {
  const fields = {};
  for (const [k, v] of Object.entries(appealData)) {
    fields[k] = { stringValue: String(v) };
  }
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/ban_appeals`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields })
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { email, deviceId, ip, blockType, appealText } = req.body || {};
    if (!appealText || !appealText.trim()) {
      return res.status(400).json({ error: 'Appeal text is required' });
    }

    const targetEmail = email || 'Unknown User';
    const textReason  = appealText.trim();
    const targetDev   = deviceId || 'Unknown Device';
    const targetIP    = ip || 'Unknown IP';
    const typeLabel   = blockType || 'account';

    // 1. Save Appeal Record in Firestore
    await addBanAppealREST({
      email: targetEmail,
      deviceId: targetDev,
      ip: targetIP,
      blockType: typeLabel,
      appealText: textReason,
      status: 'pending',
      timestamp: new Date().toISOString()
    }).catch(() => {});

    // 2. Fetch Telegram Credentials from Firestore Settings or Env
    let botToken = process.env.TELEGRAM_BOT_TOKEN;
    let chatId   = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      const tgConfig = await getSettingsTelegramREST();
      botToken = botToken || tgConfig.token;
      chatId   = chatId   || tgConfig.chatId;
    }

    // 3. Dispatch Real-time Telegram Alert to Admin Bot
    if (botToken && chatId) {
      const alertMsg = `
✉️ <b>NEW UNBLOCK APPEAL SUBMITTED</b>
─────────────────────────────
• 👤 <b>User Account:</b> <code>${targetEmail}</code>
• 📱 <b>Device ID:</b> <code>${targetDev}</code>
• 🌐 <b>IP Address:</b> <code>${targetIP}</code>
• 🚫 <b>Block Type:</b> <code>${typeLabel.toUpperCase()}</code>

<b>Submitted Reason:</b>
<i>"${textReason}"</i>
─────────────────────────────
<i>Click an option below to unblock or manage appeals in real-time.</i>
      `.trim();

      const masterButtons = [
        [
          { text: `✅ Approve Unblock: ${targetEmail}`, callback_data: `unblock:${targetEmail}` }
        ],
        [
          { text: '📊 System Status', callback_data: 'status' },
          { text: '🚫 Blocked List',  callback_data: 'blocked_list' }
        ],
        [
          { text: '✉️ Pending Appeals', callback_data: 'appeals' },
          { text: '💬 Live User Chat',  callback_data: 'chat_menu' }
        ]
      ];

      fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: String(chatId),
          text: alertMsg,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
          reply_markup: { inline_keyboard: masterButtons }
        })
      }).catch(() => {});
    }

    return res.status(200).json({ ok: true, message: 'Appeal submitted successfully' });
  } catch (err) {
    console.error('[submit-appeal] Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
