/**
 * api/telegram-test.js — Server-side Telegram Bot test, save, and webhook setup
 */

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { token, chatId, text } = req.body || {};

  if (!token || !chatId) {
    return res.status(400).json({ error: 'Telegram Bot Token and Chat ID are required' });
  }

  const cleanToken = token.trim();
  const cleanChatId = chatId.trim();

  try {
    // 1. Send test message to Telegram via server-side fetch
    const url = `https://api.telegram.org/bot${cleanToken}/sendMessage`;
    const messageText = text || '🚀 <b>ITShare Security Bot Connected!</b>\nYou will now receive live alerts, unblock appeals, and security status reports in this chat.';

    const tgRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: cleanChatId,
        text: messageText,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📊 System Status', callback_data: 'status' },
              { text: '🚫 Blocked List',  callback_data: 'blocked_list' }
            ],
            [
              { text: '✉️ View Appeals', callback_data: 'appeals' }
            ]
          ]
        }
      })
    });

    const tgData = await tgRes.json();

    if (!tgRes.ok || !tgData.ok) {
      return res.status(400).json({
        ok: false,
        error: tgData.description || 'Telegram API rejected token or chat ID. Please verify you started your bot first!'
      });
    }

    // 2. Save settings to Firestore `settings/telegram` document via REST API
    try {
      const PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || 'login-form-49609';
      const saveUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/settings/telegram`;
      await fetch(saveUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            token: { stringValue: cleanToken },
            chatId: { stringValue: cleanChatId },
            updatedAt: { stringValue: new Date().toISOString() }
          }
        })
      });
    } catch (dbErr) {
      console.warn('[telegram-test] Firestore save warning:', dbErr);
    }

    // 3. Register Webhook for Production (itsharing.vercel.app)
    const webhookUrl = `https://itsharing.vercel.app/api/telegram-webhook?token=${cleanToken}`;
    await fetch(`https://api.telegram.org/bot${cleanToken}/setWebhook?url=${encodeURIComponent(webhookUrl)}`);

    // 4. Register Bot Menu Commands with Telegram
    await fetch(`https://api.telegram.org/bot${cleanToken}/setMyCommands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        commands: [
          { command: 'status', description: '📊 Real-time security stats & active ban breakdown' },
          { command: 'blocked_list', description: '🚫 List & unblock active banned entities' },
          { command: 'appeals', description: '✉️ View pending user unblock appeals' },
          { command: 'chat', description: '💬 Live user chat & support message inbox' },
          { command: 'ban_ip', description: '🌐 Ban IP Address (e.g. /ban_ip 175.100.52.181)' },
          { command: 'ban_device', description: '📱 Ban Device ID (e.g. /ban_device DEV-XXX)' },
          { command: 'ban_account', description: '👤 Ban Account Email (e.g. /ban_account email)' },
          { command: 'unblock', description: '🔓 Unblock Target (e.g. /unblock target)' },
          { command: 'help', description: '🛡️ Display command guide & menu' }
        ]
      })
    });

    return res.status(200).json({ ok: true, message: 'Telegram Alert Sent & Settings Saved Successfully!' });
  } catch (err) {
    console.error('[telegram-test] Error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
