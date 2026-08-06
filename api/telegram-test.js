/**
 * api/telegram-test.js — Server-side Telegram Bot test, save, and webhook setup
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function getDb() {
  if (!getApps().length) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
      : null;

    if (serviceAccount) {
      initializeApp({ credential: cert(serviceAccount) });
    } else {
      initializeApp({ projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'login-form-49609' });
    }
  }
  return getFirestore();
}

export default async function handler(req, res) {
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

    // 2. Save settings to Firestore `settings/telegram` document
    try {
      const db = getDb();
      await db.collection('settings').doc('telegram').set({
        token: cleanToken,
        chatId: cleanChatId,
        updatedAt: new Date().toISOString(),
      });

      // 3. Register Webhook for Production or Delete Webhook for Localhost
      const host = req.headers.host || '';
      const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');

      if (!isLocalhost && host) {
        const webhookUrl = `https://${host}/api/telegram-webhook?token=${cleanToken}`;
        await fetch(`https://api.telegram.org/bot${cleanToken}/setWebhook?url=${encodeURIComponent(webhookUrl)}`);
      } else {
        // Clear dead webhook on localhost so Telegram getUpdates long-polling works 100%
        await fetch(`https://api.telegram.org/bot${cleanToken}/deleteWebhook`);
      }

      // 4. Register Bot Menu Commands with Telegram
      await fetch(`https://api.telegram.org/bot${cleanToken}/setMyCommands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commands: [
            { command: 'status', description: 'View security stats & active bans' },
            { command: 'blocked_list', description: 'List & unblock active bans' },
            { command: 'appeals', description: 'View pending unblock appeals' },
            { command: 'ban_ip', description: 'Ban IP: /ban_ip 175.100.52.181' },
            { command: 'ban_device', description: 'Ban Device: /ban_device DEV-XXX' },
            { command: 'ban_account', description: 'Ban Account: /ban_account email' },
            { command: 'unblock', description: 'Unblock: /unblock target' },
            { command: 'help', description: 'View bot commands menu' }
          ]
        })
      });
    } catch (dbErr) {
      console.warn('[telegram-test] Firestore save warning:', dbErr);
    }

    return res.status(200).json({ ok: true, message: 'Telegram Alert Sent & Settings Saved Successfully!' });
  } catch (err) {
    console.error('[telegram-test] Error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
