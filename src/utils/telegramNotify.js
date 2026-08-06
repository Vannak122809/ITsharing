/**
 * telegramNotify.js — Telegram Bot Notification & Polling Helper
 *
 * Sends real-time security alerts and processes Telegram commands
 * (/status, /ban_ip, /ban_device, /ban_account, /unblock, /blocked_list, /appeals).
 */

import { collection, doc, setDoc, deleteDoc, getDocs, limit, query } from 'firebase/firestore';

// Helper to get Telegram credentials from localStorage or env
export function getTelegramConfig() {
  const token  = localStorage.getItem('itshare_telegram_token') || '';
  const chatId = localStorage.getItem('itshare_telegram_chat_id') || '';
  return { token, chatId };
}

export function saveTelegramConfig(token, chatId) {
  if (token)  localStorage.setItem('itshare_telegram_token', String(token).trim());
  if (chatId) localStorage.setItem('itshare_telegram_chat_id', String(chatId).trim());
}

/**
 * Send an HTML-formatted message to Telegram Admin Chat
 */
export async function sendTelegramAlert(text, replyMarkup = null, overrideToken = null, overrideChatId = null) {
  const config = getTelegramConfig();
  const token  = String(overrideToken || config.token || '').trim();
  const chatId = String(overrideChatId || config.chatId || '').trim();

  if (!token || !chatId) return { ok: false, error: 'Telegram Bot Token or Chat ID not configured' };

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const payload = {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      ...(replyMarkup ? { reply_markup: replyMarkup } : {})
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    return data;
  } catch (err) {
    console.error('[TelegramNotify] Failed to send alert:', err);
    return { ok: false, error: err.message };
  }
}

let lastUpdateId = 0;

const safeId = (str) => (str || '').toLowerCase().replace(/[^a-zA-Z0-9._-]/g, '_');

/**
 * Poll Telegram getUpdates (works on localhost without webhooks!)
 */
export async function pollTelegramUpdates(token, chatId, db) {
  if (!token || !chatId || !db) return;

  try {
    const cleanToken = String(token).trim();
    let url = `https://api.telegram.org/bot${cleanToken}/getUpdates?offset=${lastUpdateId + 1}&limit=10&timeout=0`;
    let res = await fetch(url);
    let data = await res.json();

    if (!data.ok && data.error_code === 409) {
      // Webhook active: clear dead webhook so getUpdates works on localhost
      await fetch(`https://api.telegram.org/bot${cleanToken}/deleteWebhook`).catch(() => {});
      // Retry immediately
      res = await fetch(url);
      data = await res.json();
    }

    if (!data.ok || !data.result || !data.result.length) return;

    for (const update of data.result) {
      lastUpdateId = Math.max(lastUpdateId, update.update_id);
      await handleTelegramUpdate(update, cleanToken, String(chatId).trim(), db);
    }
  } catch (e) {
    // Silent fail polling
  }
}

async function handleTelegramUpdate(update, token, adminChatId, db) {
  try {
    // ── Handle Inline Buttons ─────────────────────────────────────────────────
    if (update.callback_query) {
      const cb = update.callback_query;
      const chatId = String(cb.message.chat.id);
      const data = cb.data || '';

      const [action, ...args] = data.split(':');
      const target = args.join(':').trim();

      if (action === 'ban_ip' && target) {
        const docId = `ip_${safeId(target)}`;
        await setDoc(doc(db, 'blocked_entities', docId), {
          type: 'ip', ip: target, blocked: true,
          blockedAt: new Date().toISOString(), note: 'Banned via Telegram Bot'
        });
        await sendTelegramAlert(`🚫 <b>IP BANNED</b>\nIP Address <code>${target}</code> has been blocked.`, null, token, chatId);
      } else if (action === 'ban_device' && target) {
        const docId = `device_${safeId(target)}`;
        await setDoc(doc(db, 'blocked_entities', docId), {
          type: 'device', deviceId: target, blocked: true,
          blockedAt: new Date().toISOString(), note: 'Banned via Telegram Bot'
        });
        await sendTelegramAlert(`📱 <b>DEVICE BANNED</b>\nDevice ID <code>${target}</code> has been blocked.`, null, token, chatId);
      } else if (action === 'ban_account' && target) {
        const docId = `email_${safeId(target)}`;
        await setDoc(doc(db, 'blocked_entities', docId), {
          type: 'email', email: target.toLowerCase(), blocked: true, disabled: true,
          blockedAt: new Date().toISOString(), note: 'Banned via Telegram Bot'
        });
        await sendTelegramAlert(`👤 <b>ACCOUNT BANNED</b>\nUser Account <code>${target}</code> has been suspended.`, null, token, chatId);
      } else if (action === 'unblock' && target) {
        const clean = target.toLowerCase().trim();
        await deleteDoc(doc(db, 'blocked_entities', `ip_${safeId(clean)}`)).catch(() => {});
        await deleteDoc(doc(db, 'blocked_entities', `device_${safeId(clean)}`)).catch(() => {});
        await deleteDoc(doc(db, 'blocked_entities', `email_${safeId(clean)}`)).catch(() => {});
        await sendTelegramAlert(`✅ <b>UNBLOCKED</b>\nEntity <code>${target}</code> has been unblocked.`, null, token, chatId);
      } else if (action === 'status' || action === 'status:blocked_list' || action === 'status:appeals') {
        if (action === 'status:blocked_list') {
          const bansSnap = await getDocs(collection(db, 'blocked_entities'));
          if (bansSnap.empty) {
            await sendTelegramAlert('🟢 <b>No Active Blocked Entities</b>\nYour blocklist is currently empty.', null, token, chatId);
          } else {
            let listText = `🚫 <b>Active Blocked Entities (${bansSnap.docs.length})</b>\n\n`;
            const buttons = [];
            bansSnap.docs.forEach(d => {
              const data = d.data();
              const val = data.ip || data.email || data.deviceId || d.id;
              const typeLabel = data.type === 'ip' ? '🌐 IP' : data.type === 'device' ? '📱 Device' : '👤 Account';
              listText += `• ${typeLabel}: <code>${val}</code>\n`;
              buttons.push([{ text: `✅ Unblock ${typeLabel}: ${val}`, callback_data: `unblock:${val}` }]);
            });
            await sendTelegramAlert(listText, { inline_keyboard: buttons.slice(0, 10) }, token, chatId);
          }
        } else if (action === 'status:appeals') {
          const appealsSnap = await getDocs(query(collection(db, 'ban_appeals'), limit(10)));
          if (appealsSnap.empty) {
            await sendTelegramAlert('✉️ <b>No Pending Unblock Appeals</b>', null, token, chatId);
          } else {
            let msgText = `✉️ <b>Unblock Appeals (${appealsSnap.docs.length})</b>\n\n`;
            const buttons = [];
            appealsSnap.docs.forEach(d => {
              const data = d.data();
              msgText += `• <b>${data.email || 'User'}</b> (${data.deviceId || ''}):\n<i>"${data.appealText}"</i>\n\n`;
              buttons.push([{ text: `✅ Approve Unblock: ${data.email || data.deviceId}`, callback_data: `unblock:${data.email || data.deviceId}` }]);
            });
            await sendTelegramAlert(msgText, { inline_keyboard: buttons.slice(0, 10) }, token, chatId);
          }
        } else {
          const [logsSnap, bansSnap, appealsSnap] = await Promise.all([
            getDocs(query(collection(db, 'security_logs'), limit(100))),
            getDocs(collection(db, 'blocked_entities')),
            getDocs(collection(db, 'ban_appeals'))
          ]);
          const msg = `
📊 <b>ITShare Security Status</b>

• 🛡️ <b>Total Logs:</b> ${logsSnap.docs.length}
• 🚫 <b>Active Banned Entities:</b> ${bansSnap.docs.length}
• ✉️ <b>Pending Appeals:</b> ${appealsSnap.docs.length}
• 🟢 <b>Security Status:</b> ACTIVE & ENFORCING
          `.trim();
          await sendTelegramAlert(msg, null, token, chatId);
        }
      }
      return;
    }

    // ── Handle Text Commands ──────────────────────────────────────────────────
    const message = update.message;
    if (!message || !message.text) return;

    const chatId = String(message.chat.id);
    let text = message.text.trim().replace(/@[a-zA-Z0-9_]+/i, '');

    if (text.startsWith('/start') || text.startsWith('/help')) {
      const helpMsg = `
🛡️ <b>ITShare Security Bot Admin</b>

<b>Available Commands:</b>
• <code>/status</code> — View security stats & active bans
• <code>/blocked_list</code> — View & unblock active banned entities
• <code>/appeals</code> — View pending user unblock appeals
• <code>/ban_ip 175.100.52.181</code> — Ban an IP address
• <code>/ban_device DEV-8F92A1B4</code> — Ban a Device ID
• <code>/ban_account user@gmail.com</code> — Ban a User Account Email
• <code>/unblock target</code> — Unblock an IP, Device ID, or Email

<i>Type commands directly or use the [/] Telegram menu.</i>
      `.trim();
      await sendTelegramAlert(helpMsg, null, token, chatId);
    } else if (text.startsWith('/status')) {
      const [logsSnap, bansSnap, appealsSnap] = await Promise.all([
        getDocs(query(collection(db, 'security_logs'), limit(100))),
        getDocs(collection(db, 'blocked_entities')),
        getDocs(collection(db, 'ban_appeals'))
      ]);
      const msg = `
📊 <b>ITShare Security Status</b>

• 🛡️ <b>Total Logged Security Events:</b> ${logsSnap.docs.length}
• 🚫 <b>Active Banned Entities:</b> ${bansSnap.docs.length}
• ✉️ <b>Pending Unblock Appeals:</b> ${appealsSnap.docs.length}
• 🟢 <b>Security Guard Status:</b> ACTIVE & ENFORCING
      `.trim();

      const keyboard = {
        inline_keyboard: [
          [
            { text: '🚫 View Blocked List', callback_data: 'status:blocked_list' },
            { text: '✉️ View Appeals',      callback_data: 'status:appeals' }
          ]
        ]
      };
      await sendTelegramAlert(msg, keyboard, token, chatId);
    } else if (text.startsWith('/blocked_list')) {
      const bansSnap = await getDocs(collection(db, 'blocked_entities'));
      if (bansSnap.empty) {
        await sendTelegramAlert('🟢 <b>No Active Blocked Entities</b>\nYour blocklist is currently empty.', null, token, chatId);
      } else {
        let listText = `🚫 <b>Active Blocked Entities (${bansSnap.docs.length})</b>\n\n`;
        const buttons = [];
        bansSnap.docs.forEach(d => {
          const data = d.data();
          const val = data.ip || data.email || data.deviceId || d.id;
          const typeLabel = data.type === 'ip' ? '🌐 IP' : data.type === 'device' ? '📱 Device' : '👤 Account';
          listText += `• ${typeLabel}: <code>${val}</code>\n`;
          buttons.push([{ text: `✅ Unblock ${typeLabel}: ${val}`, callback_data: `unblock:${val}` }]);
        });
        await sendTelegramAlert(listText, { inline_keyboard: buttons.slice(0, 10) }, token, chatId);
      }
    } else if (text.startsWith('/appeals')) {
      const appealsSnap = await getDocs(query(collection(db, 'ban_appeals'), limit(10)));
      if (appealsSnap.empty) {
        await sendTelegramAlert('✉️ <b>No Pending Unblock Appeals</b>', null, token, chatId);
      } else {
        let msgText = `✉️ <b>Unblock Appeals (${appealsSnap.docs.length})</b>\n\n`;
        const buttons = [];
        appealsSnap.docs.forEach(d => {
          const data = d.data();
          msgText += `• <b>${data.email || 'User'}</b> (${data.deviceId || ''}):\n<i>"${data.appealText}"</i>\n\n`;
          buttons.push([{ text: `✅ Approve Unblock: ${data.email || data.deviceId}`, callback_data: `unblock:${data.email || data.deviceId}` }]);
        });
        await sendTelegramAlert(msgText, { inline_keyboard: buttons.slice(0, 10) }, token, chatId);
      }
    } else if (text.startsWith('/ban_ip')) {
      const ip = text.replace('/ban_ip', '').trim();
      if (!ip) {
        await sendTelegramAlert('⚠️ <i>Usage: /ban_ip 175.100.52.181</i>', null, token, chatId);
      } else {
        const docId = `ip_${safeId(ip)}`;
        await setDoc(doc(db, 'blocked_entities', docId), {
          type: 'ip', ip, blocked: true,
          blockedAt: new Date().toISOString(), note: 'Banned via Telegram command'
        });
        await sendTelegramAlert(`🚫 <b>IP BANNED</b>\nIP Address <code>${ip}</code> has been blocked in real-time.`, null, token, chatId);
      }
    } else if (text.startsWith('/ban_device')) {
      const devId = text.replace('/ban_device', '').trim();
      if (!devId) {
        await sendTelegramAlert('⚠️ <i>Usage: /ban_device DEV-1171D4E7</i>', null, token, chatId);
      } else {
        const docId = `device_${safeId(devId)}`;
        await setDoc(doc(db, 'blocked_entities', docId), {
          type: 'device', deviceId: devId, blocked: true,
          blockedAt: new Date().toISOString(), note: 'Banned via Telegram command'
        });
        await sendTelegramAlert(`📱 <b>DEVICE BANNED</b>\nDevice ID <code>${devId}</code> has been blocked in real-time.`, null, token, chatId);
      }
    } else if (text.startsWith('/ban_account')) {
      const email = text.replace('/ban_account', '').trim().toLowerCase();
      if (!email) {
        await sendTelegramAlert('⚠️ <i>Usage: /ban_account user@gmail.com</i>', null, token, chatId);
      } else {
        const docId = `email_${safeId(email)}`;
        await setDoc(doc(db, 'blocked_entities', docId), {
          type: 'email', email, blocked: true, disabled: true,
          blockedAt: new Date().toISOString(), note: 'Banned via Telegram command'
        });
        await sendTelegramAlert(`👤 <b>ACCOUNT BANNED</b>\nUser Account <code>${email}</code> has been suspended.`, null, token, chatId);
      }
    } else if (text.startsWith('/unblock')) {
      const target = text.replace('/unblock', '').trim().toLowerCase();
      if (!target) {
        await sendTelegramAlert('⚠️ <i>Usage: /unblock 175.100.52.181 or /unblock user@gmail.com</i>', null, token, chatId);
      } else {
        await deleteDoc(doc(db, 'blocked_entities', `ip_${safeId(target)}`)).catch(() => {});
        await deleteDoc(doc(db, 'blocked_entities', `device_${safeId(target)}`)).catch(() => {});
        await deleteDoc(doc(db, 'blocked_entities', `email_${safeId(target)}`)).catch(() => {});
        await sendTelegramAlert(`✅ <b>UNBLOCKED</b>\nEntity <code>${target}</code> has been unblocked.`, null, token, chatId);
      }
    }
  } catch (e) {
    console.error('[telegramNotify] Handle update error:', e);
  }
}
