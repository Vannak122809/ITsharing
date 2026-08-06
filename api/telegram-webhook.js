/**
 * api/telegram-webhook.js — Telegram Bot Webhook Endpoint (REST API Powered)
 *
 * Receives incoming commands and inline button clicks from Telegram Bot.
 * Uses Direct Firestore REST API for 100% reliable execution on Vercel without requiring credentials.
 */

const PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || 'login-form-49609';

// ── Firestore REST API Helpers ────────────────────────────────────────────────
async function setBlockedEntityREST(docId, data) {
  const fields = {};
  for (const [k, v] of Object.entries(data)) {
    if (typeof v === 'boolean') fields[k] = { booleanValue: v };
    else fields[k] = { stringValue: String(v) };
  }
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/blocked_entities/${docId}`;
  await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields })
  });
}

async function deleteBlockedEntityREST(docId) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/blocked_entities/${docId}`;
  await fetch(url, { method: 'DELETE' });
}

async function listBlockedEntitiesREST() {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/blocked_entities`;
    const res = await fetch(url);
    const data = await res.json();
    return (data.documents || []).map(doc => {
      const fields = doc.fields || {};
      const obj = { id: doc.name.split('/').pop() };
      for (const [k, v] of Object.entries(fields)) {
        obj[k] = v.stringValue !== undefined ? v.stringValue : v.booleanValue !== undefined ? v.booleanValue : '';
      }
      return obj;
    });
  } catch {
    return [];
  }
}

async function listAppealsREST() {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/ban_appeals?pageSize=10`;
    const res = await fetch(url);
    const data = await res.json();
    return (data.documents || []).map(doc => {
      const fields = doc.fields || {};
      const obj = { id: doc.name.split('/').pop() };
      for (const [k, v] of Object.entries(fields)) {
        obj[k] = v.stringValue !== undefined ? v.stringValue : v.booleanValue !== undefined ? v.booleanValue : '';
      }
      return obj;
    });
  } catch {
    return [];
  }
}

async function listLogsCountREST() {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/security_logs?pageSize=100`;
    const res = await fetch(url);
    const data = await res.json();
    return (data.documents || []).length;
  } catch {
    return 0;
  }
}

// ── Telegram Reply Helpers ────────────────────────────────────────────────────
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

  let botToken = process.env.TELEGRAM_BOT_TOKEN || req.query.token;
  const update = req.body || {};

  try {
    if (!botToken) {
      const tgSettings = await listBlockedEntitiesREST().catch(() => []);
      const tgRes = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/settings/telegram`).catch(() => null);
      if (tgRes && tgRes.ok) {
        const tgData = await tgRes.json();
        botToken = tgData.fields?.token?.stringValue || '';
      }
    }

    if (!botToken) {
      return res.status(400).json({ error: 'Missing Telegram Bot Token' });
    }

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
        await setBlockedEntityREST(docId, {
          type: 'ip', ip: target, blocked: true,
          blockedAt: new Date().toISOString(), note: 'Banned via Telegram Bot'
        });
        await answerCallbackQuery(botToken, cb.id, `✅ IP ${target} Banned!`);
        await sendTelegramReply(botToken, chatId, `🚫 <b>IP BANNED</b>\nIP Address <code>${target}</code> has been blocked in real-time.`);
      } else if (action === 'ban_device' && target) {
        const docId = `device_${safeId(target)}`;
        await setBlockedEntityREST(docId, {
          type: 'device', deviceId: target, blocked: true,
          blockedAt: new Date().toISOString(), note: 'Banned via Telegram Bot'
        });
        await answerCallbackQuery(botToken, cb.id, `✅ Device ${target} Banned!`);
        await sendTelegramReply(botToken, chatId, `📱 <b>DEVICE BANNED</b>\nDevice ID <code>${target}</code> has been blocked in real-time.`);
      } else if (action === 'ban_account' && target) {
        const docId = `email_${safeId(target)}`;
        await setBlockedEntityREST(docId, {
          type: 'email', email: target.toLowerCase(), blocked: true, disabled: true,
          blockedAt: new Date().toISOString(), note: 'Banned via Telegram Bot'
        });
        await answerCallbackQuery(botToken, cb.id, `✅ Account ${target} Banned!`);
        await sendTelegramReply(botToken, chatId, `👤 <b>ACCOUNT BANNED</b>\nUser Account <code>${target}</code> has been suspended.`);
      } else if (action === 'unblock' && target) {
        const clean = target.toLowerCase().trim();
        await deleteBlockedEntityREST(`ip_${safeId(clean)}`);
        await deleteBlockedEntityREST(`device_${safeId(clean)}`);
        await deleteBlockedEntityREST(`email_${safeId(clean)}`);

        await answerCallbackQuery(botToken, cb.id, `✅ Unblocked ${target}!`);
        await sendTelegramReply(botToken, chatId, `✅ <b>UNBLOCKED</b>\nEntity <code>${target}</code> has been unblocked.`);
      } else if (action === 'status') {
        const logsCount = await listLogsCountREST();
        const bansList = await listBlockedEntitiesREST();
        const appealsList = await listAppealsREST();

        await sendTelegramReply(botToken, chatId, `
📊 <b>ITShare Security Status</b>

• 🛡️ <b>Total Logs:</b> ${logsCount}
• 🚫 <b>Active Banned Entities:</b> ${bansList.length}
• ✉️ <b>Pending Appeals:</b> ${appealsList.length}
• 🟢 <b>Security Status:</b> ACTIVE & ENFORCING
        `.trim());
      } else if (action === 'blocked_list') {
        const bansList = await listBlockedEntitiesREST();
        if (!bansList.length) {
          await sendTelegramReply(botToken, chatId, '🟢 <b>No Active Blocked Entities</b>\nYour blocklist is currently empty.');
        } else {
          let listText = `🚫 <b>Active Blocked Entities (${bansList.length})</b>\n\n`;
          const buttons = [];
          bansList.forEach(data => {
            const val = data.ip || data.email || data.deviceId || data.id;
            const typeLabel = data.type === 'ip' ? '🌐 IP' : data.type === 'device' ? '📱 Device' : '👤 Account';
            listText += `• ${typeLabel}: <code>${val}</code>\n`;
            buttons.push([{ text: `✅ Unblock ${typeLabel}: ${val}`, callback_data: `unblock:${val}` }]);
          });
          await sendTelegramReply(botToken, chatId, listText, { inline_keyboard: buttons.slice(0, 10) });
        }
      } else if (action === 'appeals') {
        const appealsList = await listAppealsREST();
        if (!appealsList.length) {
          await sendTelegramReply(botToken, chatId, '✉️ <b>No Pending Unblock Appeals</b>');
        } else {
          let msg = `✉️ <b>Unblock Appeals (${appealsList.length})</b>\n\n`;
          const buttons = [];
          appealsList.forEach(data => {
            msg += `• <b>${data.email || 'User'}</b> (${data.deviceId || ''}):\n<i>"${data.appealText}"</i>\n\n`;
            buttons.push([{ text: `✅ Approve Unblock: ${data.email || data.deviceId}`, callback_data: `unblock:${data.email || data.deviceId}` }]);
          });
          await sendTelegramReply(botToken, chatId, msg, { inline_keyboard: buttons.slice(0, 10) });
        }
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
• <code>/blocked_list</code> — View & unblock active banned entities
• <code>/appeals</code> — View pending user unblock appeals
• <code>/ban_ip 175.100.52.181</code> — Ban an IP address
• <code>/ban_device DEV-8F92A1B4</code> — Ban a Device ID
• <code>/ban_account user@gmail.com</code> — Ban a User Account Email
• <code>/unblock target</code> — Unblock an IP, Device ID, or Email

<i>Select a command or use the Telegram [/] menu.</i>
      `.trim();
      await sendTelegramReply(botToken, chatId, helpMsg);
    } else if (text.startsWith('/status')) {
      const logsCount = await listLogsCountREST();
      const bansList = await listBlockedEntitiesREST();
      const appealsList = await listAppealsREST();

      const msg = `
📊 <b>ITShare Security Status</b>

• 🛡️ <b>Total Logged Security Events:</b> ${logsCount}
• 🚫 <b>Active Banned Entities:</b> ${bansList.length}
• ✉️ <b>Pending Unblock Appeals:</b> ${appealsList.length}
• 🟢 <b>Security Guard Status:</b> ACTIVE & ENFORCING
      `.trim();

      const inlineKeyboard = {
        inline_keyboard: [
          [
            { text: '🚫 View Blocked List', callback_data: 'blocked_list' },
            { text: '✉️ View Appeals',      callback_data: 'appeals' }
          ]
        ]
      };

      await sendTelegramReply(botToken, chatId, msg, inlineKeyboard);
    } else if (text.startsWith('/blocked_list')) {
      const bansList = await listBlockedEntitiesREST();
      if (!bansList.length) {
        await sendTelegramReply(botToken, chatId, '🟢 <b>No Active Blocked Entities</b>\nYour blocklist is currently empty.');
      } else {
        let listText = `🚫 <b>Active Blocked Entities (${bansList.length})</b>\n\n`;
        const buttons = [];
        bansList.forEach(data => {
          const val = data.ip || data.email || data.deviceId || data.id;
          const typeLabel = data.type === 'ip' ? '🌐 IP' : data.type === 'device' ? '📱 Device' : '👤 Account';
          listText += `• ${typeLabel}: <code>${val}</code>\n`;
          buttons.push([{ text: `✅ Unblock ${typeLabel}: ${val}`, callback_data: `unblock:${val}` }]);
        });
        await sendTelegramReply(botToken, chatId, listText, { inline_keyboard: buttons.slice(0, 10) });
      }
    } else if (text.startsWith('/appeals')) {
      const appealsList = await listAppealsREST();
      if (!appealsList.length) {
        await sendTelegramReply(botToken, chatId, '✉️ <b>No Pending Unblock Appeals</b>');
      } else {
        let msg = `✉️ <b>Unblock Appeals (${appealsList.length})</b>\n\n`;
        const buttons = [];
        appealsList.forEach(data => {
          msg += `• <b>${data.email || 'User'}</b> (${data.deviceId || ''}):\n<i>"${data.appealText}"</i>\n\n`;
          buttons.push([{ text: `✅ Approve Unblock: ${data.email || data.deviceId}`, callback_data: `unblock:${data.email || data.deviceId}` }]);
        });
        await sendTelegramReply(botToken, chatId, msg, { inline_keyboard: buttons.slice(0, 10) });
      }
    } else if (text.startsWith('/ban_ip')) {
      const ip = text.replace('/ban_ip', '').trim();
      if (!ip) {
        await sendTelegramReply(botToken, chatId, '⚠️ <i>Usage: /ban_ip 175.100.52.181</i>');
      } else {
        const docId = `ip_${safeId(ip)}`;
        await setBlockedEntityREST(docId, {
          type: 'ip', ip, blocked: true,
          blockedAt: new Date().toISOString(), note: 'Banned via Telegram command'
        });
        await sendTelegramReply(botToken, chatId, `🚫 <b>IP BANNED</b>\nIP Address <code>${ip}</code> has been blocked in real-time.`);
      }
    } else if (text.startsWith('/ban_device')) {
      const devId = text.replace('/ban_device', '').trim();
      if (!devId) {
        await sendTelegramReply(botToken, chatId, '⚠️ <i>Usage: /ban_device DEV-1171D4E7</i>');
      } else {
        const docId = `device_${safeId(devId)}`;
        await setBlockedEntityREST(docId, {
          type: 'device', deviceId: devId, blocked: true,
          blockedAt: new Date().toISOString(), note: 'Banned via Telegram command'
        });
        await sendTelegramReply(botToken, chatId, `📱 <b>DEVICE BANNED</b>\nDevice ID <code>${devId}</code> has been blocked in real-time.`);
      }
    } else if (text.startsWith('/ban_account')) {
      const email = text.replace('/ban_account', '').trim().toLowerCase();
      if (!email) {
        await sendTelegramReply(botToken, chatId, '⚠️ <i>Usage: /ban_account user@gmail.com</i>');
      } else {
        const docId = `email_${safeId(email)}`;
        await setBlockedEntityREST(docId, {
          type: 'email', email, blocked: true, disabled: true,
          blockedAt: new Date().toISOString(), note: 'Banned via Telegram command'
        });
        await sendTelegramReply(botToken, chatId, `👤 <b>ACCOUNT BANNED</b>\nUser Account <code>${email}</code> has been suspended.`);
      }
    } else if (text.startsWith('/unblock')) {
      const target = text.replace('/unblock', '').trim().toLowerCase();
      if (!target) {
        await sendTelegramReply(botToken, chatId, '⚠️ <i>Usage: /unblock 175.100.52.181 or /unblock user@gmail.com</i>');
      } else {
        await deleteBlockedEntityREST(`ip_${safeId(target)}`);
        await deleteBlockedEntityREST(`device_${safeId(target)}`);
        await deleteBlockedEntityREST(`email_${safeId(target)}`);

        await sendTelegramReply(botToken, chatId, `✅ <b>UNBLOCKED</b>\nEntity <code>${target}</code> has been unblocked.`);
      }
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[telegram-webhook] Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
