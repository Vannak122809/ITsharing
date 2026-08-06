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
              { text: '🕵️‍♂️ Check Registration Date', callback_data: 'check_reg_date' }
            ],
            [
              { text: '🚀 Share ID', switch_inline_query: '' }
            ]
          ]
        }
      })
    });

    // Send persistent bottom Reply Keyboard matching the custom menu
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: cleanChatId,
        text: '👇 <b>Select an option from the main menu below:</b>',
        parse_mode: 'HTML',
        reply_markup: {
          keyboard: [
            [
              { text: '👤 User', request_user: { request_id: 1, user_is_bot: false } },
              { text: '🤖 Bot', request_user: { request_id: 2, user_is_bot: true } }
            ],
            [
              { text: '📢 Channel', request_chat: { request_id: 3, chat_is_channel: true } },
              { text: '👥 Group', request_chat: { request_id: 4, chat_is_channel: false } }
            ],
            [
              { text: '🏠 My Channel', request_chat: { request_id: 5, chat_is_channel: true, bot_is_member: true } },
              { text: '🏠 My Group', request_chat: { request_id: 6, chat_is_channel: false, bot_is_member: true } }
            ],
            [
              { text: '💬 Forum', request_chat: { request_id: 7, chat_is_channel: false, is_forum: true } },
              { text: '💬 My Forum', request_chat: { request_id: 8, chat_is_channel: false, is_forum: true, bot_is_member: true } }
            ]
          ],
          resize_keyboard: true,
          is_persistent: true
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
      const saveUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/settings/telegram?updateMask.fieldPaths=token&updateMask.fieldPaths=chatId&updateMask.fieldPaths=updatedAt`;
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

    // 4. Register Bot Menu Commands with Telegram (Clean BotFather Format)
    await fetch(`https://api.telegram.org/bot${cleanToken}/setMyCommands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        commands: [
          { command: 'status', description: 'Real-time security stats & active bans' },
          { command: 'blocked_list', description: 'List & unblock active banned entities' },
          { command: 'appeals', description: 'View pending user unblock appeals' },
          { command: 'chat', description: 'Live user chat & support message inbox' },
          { command: 'ban_ip', description: 'Ban IP address in real-time' },
          { command: 'ban_device', description: 'Ban Device ID in real-time' },
          { command: 'ban_account', description: 'Ban User Account Email in real-time' },
          { command: 'unblock', description: 'Unblock IP, Device ID, or Email' },
          { command: 'help', description: 'Display admin command guide and menu' }
        ]
      })
    });

    return res.status(200).json({ ok: true, message: 'Telegram Alert Sent & Settings Saved Successfully!' });
  } catch (err) {
    console.error('[telegram-test] Error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
