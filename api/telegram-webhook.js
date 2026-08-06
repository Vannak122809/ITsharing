/**
 * api/telegram-webhook.js — Telegram Bot Webhook Endpoint
 *
 * Receives incoming commands and inline button clicks from Telegram Bot.
 * Commands supported:
 *   /status              — View real-time security stats & active bans
 *   /ban_ip <IP>         — Ban an IP address directly from Telegram
 *   /ban_device <DevID>  — Ban a Device ID directly from Telegram
 *   /ban_account <Email> — Ban a User Account directly from Telegram
 *   /unblock <Target>    — Unblock an IP, Device ID, or Email directly from Telegram
 *   /help                — View available commands
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

async function sendTelegramReply(botToken, chatId, text, inlineKeyboard = null) {
  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        ...(inlineKeyboard ? { reply_markup: inlineKeyboard } : {})
      })
    });
  } catch (e) {
    console.error('[telegram-webhook] Failed to reply:', e);
  }
}

async function answerCallbackQuery(botToken, callbackQueryId, text) {
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: callbackQueryId, text, show_alert: true })
    });
  } catch (e) {}
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN || req.query.token;
  const update = req.body || {};

  try {
    const db = getDb();
    const safeId = (str) => (str || '').toLowerCase().replace(/[^a-zA-Z0-9._-]/g, '_');

    // ── Handle Inline Button Clicks ───────────────────────────────────────────
    if (update.callback_query) {
      const cb = update.callback_query;
      const chatId = cb.message.chat.id;
      const data = cb.data || '';

      const [action, ...args] = data.split(':');
      const target = args.join(':').trim();

      if (action === 'ban_ip' && target) {
        const docId = `ip_${safeId(target)}`;
        await db.collection('blocked_entities').doc(docId).set({
          type: 'ip',
          ip: target,
          blocked: true,
          blockedAt: new Date().toISOString(),
          note: 'Banned via Telegram Bot',
        });
        await answerCallbackQuery(botToken, cb.id, `✅ IP ${target} Banned!`);
        await sendTelegramReply(botToken, chatId, `🚫 <b>IP BANNED</b>\nIP <code>${target}</code> has been blocked.`);
      } else if (action === 'ban_device' && target) {
        const docId = `device_${safeId(target)}`;
        await db.collection('blocked_entities').doc(docId).set({
          type: 'device',
          deviceId: target,
          blocked: true,
          blockedAt: new Date().toISOString(),
          note: 'Banned via Telegram Bot',
        });
        await answerCallbackQuery(botToken, cb.id, `✅ Device ${target} Banned!`);
        await sendTelegramReply(botToken, chatId, `📱 <b>DEVICE BANNED</b>\nDevice ID <code>${target}</code> has been blocked.`);
      } else if (action === 'ban_account' && target) {
        const docId = `email_${safeId(target)}`;
        await db.collection('blocked_entities').doc(docId).set({
          type: 'email',
          email: target.toLowerCase(),
          blocked: true,
          disabled: true,
          blockedAt: new Date().toISOString(),
          note: 'Banned via Telegram Bot',
        });
        await answerCallbackQuery(botToken, cb.id, `✅ Account ${target} Banned!`);
        await sendTelegramReply(botToken, chatId, `👤 <b>ACCOUNT BANNED</b>\nUser Account <code>${target}</code> has been suspended.`);
      } else if (action === 'unblock' && target) {
        // Try unblocking ip, device, or email
        const targetClean = target.toLowerCase().trim();
        await db.collection('blocked_entities').doc(`ip_${safeId(targetClean)}`).delete().catch(() => {});
        await db.collection('blocked_entities').doc(`device_${safeId(targetClean)}`).delete().catch(() => {});
        await db.collection('blocked_entities').doc(`email_${safeId(targetClean)}`).delete().catch(() => {});
        
        await answerCallbackQuery(botToken, cb.id, `✅ Unblocked ${target}!`);
        await sendTelegramReply(botToken, chatId, `✅ <b>UNBLOCKED</b>\nEntity <code>${target}</code> has been unblocked.`);
      } else if (action === 'status') {
        const snapLogs = await db.collection('security_logs').limit(100).get();
        const snapBans = await db.collection('blocked_entities').get();
        
        await sendTelegramReply(botToken, chatId, `
📊 <b>ITShare Security Status</b>

• <b>Total Logs:</b> ${snapLogs.size}
• <b>Active Banned Entities:</b> ${snapBans.size}
• <b>Status:</b> 🟢 Active & Guarding
        `.trim());
      }

      return res.status(200).json({ ok: true });
    }

    // ── Handle Text Commands ──────────────────────────────────────────────────
    const message = update.message;
    if (!message || !message.text) {
      return res.status(200).json({ ok: true });
    }

    const chatId = message.chat.id;
    const text = message.text.trim();

    if (text.startsWith('/start') || text.startsWith('/help')) {
      const helpMsg = `
🛡️ <b>ITShare Security Bot Admin</b>

<b>Available Commands:</b>
• <code>/status</code> — View real-time security stats & active bans
• <code>/ban_ip 175.100.52.181</code> — Ban an IP address
• <code>/ban_device DEV-8F92A1B4</code> — Ban a Device ID
• <code>/ban_account user@gmail.com</code> — Ban a User Account Email
• <code>/unblock target</code> — Unblock an IP, Device ID, or Email

<i>Select a command or type directly in chat.</i>
      `.trim();
      await sendTelegramReply(botToken, chatId, helpMsg);
    } else if (text.startsWith('/status')) {
      const snapLogs = await db.collection('security_logs').get();
      const snapBans = await db.collection('blocked_entities').get();
      const snapAppeals = await db.collection('ban_appeals').get();

      const msg = `
📊 <b>ITShare Security Status</b>

• 🛡️ <b>Total Logged Security Events:</b> ${snapLogs.size}
• 🚫 <b>Active Banned Entities:</b> ${snapBans.size}
• ✉️ <b>Pending Unblock Appeals:</b> ${snapAppeals.size}
• 🟢 <b>Security Guard Status:</b> ACTIVE & ENFORCING
      `.trim();

      await sendTelegramReply(botToken, chatId, msg);
    } else if (text.startsWith('/ban_ip')) {
      const ip = text.replace('/ban_ip', '').trim();
      if (!ip) {
        await sendTelegramReply(botToken, chatId, '⚠️ <i>Usage: /ban_ip 175.100.52.181</i>');
      } else {
        const docId = `ip_${safeId(ip)}`;
        await db.collection('blocked_entities').doc(docId).set({
          type: 'ip',
          ip,
          blocked: true,
          blockedAt: new Date().toISOString(),
          note: 'Banned via Telegram command',
        });
        await sendTelegramReply(botToken, chatId, `🚫 <b>IP BANNED</b>\nIP Address <code>${ip}</code> has been blocked in real-time.`);
      }
    } else if (text.startsWith('/ban_device')) {
      const devId = text.replace('/ban_device', '').trim();
      if (!devId) {
        await sendTelegramReply(botToken, chatId, '⚠️ <i>Usage: /ban_device DEV-1171D4E7</i>');
      } else {
        const docId = `device_${safeId(devId)}`;
        await db.collection('blocked_entities').doc(docId).set({
          type: 'device',
          deviceId: devId,
          blocked: true,
          blockedAt: new Date().toISOString(),
          note: 'Banned via Telegram command',
        });
        await sendTelegramReply(botToken, chatId, `📱 <b>DEVICE BANNED</b>\nDevice ID <code>${devId}</code> has been blocked in real-time.`);
      }
    } else if (text.startsWith('/ban_account')) {
      const email = text.replace('/ban_account', '').trim().toLowerCase();
      if (!email) {
        await sendTelegramReply(botToken, chatId, '⚠️ <i>Usage: /ban_account user@gmail.com</i>');
      } else {
        const docId = `email_${safeId(email)}`;
        await db.collection('blocked_entities').doc(docId).set({
          type: 'email',
          email,
          blocked: true,
          disabled: true,
          blockedAt: new Date().toISOString(),
          note: 'Banned via Telegram command',
        });
        await sendTelegramReply(botToken, chatId, `👤 <b>ACCOUNT BANNED</b>\nUser Account <code>${email}</code> has been suspended.`);
      }
    } else if (text.startsWith('/unblock')) {
      const target = text.replace('/unblock', '').trim().toLowerCase();
      if (!target) {
        await sendTelegramReply(botToken, chatId, '⚠️ <i>Usage: /unblock 175.100.52.181 or /unblock user@gmail.com</i>');
      } else {
        await db.collection('blocked_entities').doc(`ip_${safeId(target)}`).delete().catch(() => {});
        await db.collection('blocked_entities').doc(`device_${safeId(target)}`).delete().catch(() => {});
        await db.collection('blocked_entities').doc(`email_${safeId(target)}`).delete().catch(() => {});

        await sendTelegramReply(botToken, chatId, `✅ <b>UNBLOCKED</b>\nEntity <code>${target}</code> has been unblocked.`);
      }
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[telegram-webhook] Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
