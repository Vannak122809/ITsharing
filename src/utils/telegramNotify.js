/**
 * telegramNotify.js — Telegram Bot Notification & Polling Helper
 *
 * Sends real-time security alerts and processes Telegram commands
 * (/status, /ban_ip, /ban_device, /ban_account, /unblock, /blocked_list, /appeals, /chat).
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

// ── Persistent Master Control Panel Keyboard ──────────────────────────────────
export function getMasterControlKeyboard(extraButtons = []) {
  const masterButtons = [
    [
      { text: '📊 System Status', callback_data: 'status' },
      { text: '🚫 Blocked List',  callback_data: 'blocked_list' }
    ],
    [
      { text: '✉️ Pending Appeals', callback_data: 'appeals' },
      { text: '💬 Live User Chat',  callback_data: 'chat_menu' }
    ],
    [
      { text: '🌐 Ban IP',       callback_data: 'prompt_ban_ip' },
      { text: '📱 Ban Device',   callback_data: 'prompt_ban_device' }
    ],
    [
      { text: '👤 Ban Account',  callback_data: 'prompt_ban_account' },
      { text: '🔓 Unblock Target', callback_data: 'prompt_unblock' }
    ]
  ];

  if (extraButtons && extraButtons.length > 0) {
    return { inline_keyboard: [...extraButtons, ...masterButtons] };
  }
  return { inline_keyboard: masterButtons };
}

/**
 * Send an HTML-formatted message to Telegram Admin Chat
 */
export async function sendTelegramAlert(text, replyMarkup = null, overrideToken = null, overrideChatId = null) {
  const config = getTelegramConfig();
  let token  = String(overrideToken || config.token || '').trim();
  let chatId = String(overrideChatId || config.chatId || '').trim();

  // If token or chatId are missing (e.g. on hosted client), fetch from Firestore settings/telegram document
  if (!token || !chatId) {
    try {
      const PROJECT_ID = 'login-form-49609';
      const res = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/settings/telegram`);
      if (res.ok) {
        const data = await res.json();
        const fields = data.fields || {};
        token  = token  || fields.token?.stringValue || '';
        chatId = chatId || fields.chatId?.stringValue || '';
      }
    } catch (e) {}
  }

  if (!token || !chatId) return { ok: false, error: 'Telegram Bot Token or Chat ID not configured' };

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const keyboard = replyMarkup || getMasterControlKeyboard();

    const payload = {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      reply_markup: keyboard
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
    const url = `https://api.telegram.org/bot${cleanToken}/getUpdates?offset=${lastUpdateId + 1}&limit=10&timeout=0`;
    const res = await fetch(url);
    const data = await res.json();

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
        await sendTelegramAlert(`🚫 <b>IP BANNED IN REAL-TIME</b>\n\n<b>IP Address:</b> <code>${target}</code>\n<b>Status:</b> 🔴 BLOCKED`, null, token, chatId);
      } else if (action === 'ban_device' && target) {
        const docId = `device_${safeId(target)}`;
        await setDoc(doc(db, 'blocked_entities', docId), {
          type: 'device', deviceId: target, blocked: true,
          blockedAt: new Date().toISOString(), note: 'Banned via Telegram Bot'
        });
        await sendTelegramAlert(`📱 <b>DEVICE BANNED IN REAL-TIME</b>\n\n<b>Device ID:</b> <code>${target}</code>\n<b>Status:</b> 🔴 BLOCKED`, null, token, chatId);
      } else if (action === 'ban_account' && target) {
        const docId = `email_${safeId(target)}`;
        await setDoc(doc(db, 'blocked_entities', docId), {
          type: 'email', email: target.toLowerCase(), blocked: true, disabled: true,
          blockedAt: new Date().toISOString(), note: 'Banned via Telegram Bot'
        });
        await sendTelegramAlert(`👤 <b>ACCOUNT BANNED IN REAL-TIME</b>\n\n<b>User Account:</b> <code>${target}</code>\n<b>Status:</b> 🔴 SUSPENDED`, null, token, chatId);
      } else if (action === 'unblock' && target) {
        const clean = target.toLowerCase().trim();
        await deleteDoc(doc(db, 'blocked_entities', `ip_${safeId(clean)}`)).catch(() => {});
        await deleteDoc(doc(db, 'blocked_entities', `device_${safeId(clean)}`)).catch(() => {});
        await deleteDoc(doc(db, 'blocked_entities', `email_${safeId(clean)}`)).catch(() => {});
        await sendTelegramAlert(`✅ <b>ENTITY UNBLOCKED IN REAL-TIME</b>\n\n<b>Target Entity:</b> <code>${target}</code>\n<b>Status:</b> 🟢 RESTORED & ACCESS GRANTED`, null, token, chatId);
      } else if (action === 'prompt_ban_ip') {
        await sendTelegramAlert(`🌐 <b>BAN IP ADDRESS</b>\n\nType or reply with:\n<code>/ban_ip 175.100.52.181</code>`, null, token, chatId);
      } else if (action === 'prompt_ban_device') {
        await sendTelegramAlert(`📱 <b>BAN DEVICE ID</b>\n\nType or reply with:\n<code>/ban_device DEV-8F92A1B4</code>`, null, token, chatId);
      } else if (action === 'prompt_ban_account') {
        await sendTelegramAlert(`👤 <b>BAN USER ACCOUNT</b>\n\nType or reply with:\n<code>/ban_account user@gmail.com</code>`, null, token, chatId);
      } else if (action === 'prompt_unblock') {
        await sendTelegramAlert(`🔓 <b>UNBLOCK TARGET</b>\n\nType or reply with:\n<code>/unblock 175.100.52.181</code> or <code>/unblock user@gmail.com</code>`, null, token, chatId);
      } else if (action === 'status') {
        const [logsSnap, bansSnap, appealsSnap, chatSnap] = await Promise.all([
          getDocs(query(collection(db, 'security_logs'), limit(100))),
          getDocs(collection(db, 'blocked_entities')),
          getDocs(collection(db, 'ban_appeals')),
          getDocs(query(collection(db, 'user_messages'), limit(10)))
        ]);
        const msg = `
📊 <b>ITSHARE REAL-TIME SECURITY DASHBOARD</b>
─────────────────────────────
• 🛡️ <b>Total Security Logs:</b> <code>${logsSnap.docs.length}</code>
• 🚫 <b>Active Banned Entities:</b> <code>${bansSnap.docs.length}</code>
• ✉️ <b>Pending Appeals:</b> <code>${appealsSnap.docs.length}</code>
• 💬 <b>User Chat Messages:</b> <code>${chatSnap.docs.length}</code>
• 🟢 <b>Guard Engine:</b> <b>ACTIVE & GUARDING 24/7</b>
─────────────────────────────
<i>Select an option below to perform real-time management.</i>
        `.trim();
        await sendTelegramAlert(msg, null, token, chatId);
      } else if (action === 'blocked_list') {
        const bansSnap = await getDocs(collection(db, 'blocked_entities'));
        if (bansSnap.empty) {
          await sendTelegramAlert('🟢 <b>No Active Blocked Entities</b>\nYour blocklist is currently empty.', null, token, chatId);
        } else {
          let listText = `🚫 <b>ACTIVE BLOCKED ENTITIES (${bansSnap.docs.length})</b>\n─────────────────────────────\n`;
          const buttons = [];
          bansSnap.docs.forEach(d => {
            const data = d.data();
            const val = data.ip || data.email || data.deviceId || d.id;
            const typeLabel = data.type === 'ip' ? '🌐 IP' : data.type === 'device' ? '📱 Device' : '👤 Account';
            listText += `• ${typeLabel}: <code>${val}</code>\n`;
            buttons.push([{ text: `✅ Unblock ${typeLabel}: ${val}`, callback_data: `unblock:${val}` }]);
          });
          await sendTelegramAlert(listText, getMasterControlKeyboard(buttons.slice(0, 8)), token, chatId);
        }
      } else if (action === 'appeals') {
        const appealsSnap = await getDocs(query(collection(db, 'ban_appeals'), limit(10)));
        if (appealsSnap.empty) {
          await sendTelegramAlert('✉️ <b>No Pending Unblock Appeals</b>', null, token, chatId);
        } else {
          let msgText = `✉️ <b>PENDING UNBLOCK APPEALS (${appealsSnap.docs.length})</b>\n─────────────────────────────\n`;
          const buttons = [];
          appealsSnap.docs.forEach(d => {
            const data = d.data();
            msgText += `• <b>${data.email || 'User'}</b> (${data.deviceId || ''}):\n<i>"${data.appealText}"</i>\n\n`;
            buttons.push([{ text: `✅ Approve Unblock: ${data.email || data.deviceId}`, callback_data: `unblock:${data.email || data.deviceId}` }]);
          });
          await sendTelegramAlert(msgText, getMasterControlKeyboard(buttons.slice(0, 8)), token, chatId);
        }
      } else if (action === 'chat_menu') {
        const chatSnap = await getDocs(query(collection(db, 'user_messages'), limit(10)));
        if (chatSnap.empty) {
          await sendTelegramAlert('💬 <b>LIVE USER CHAT INBOX</b>\n─────────────────────────────\nNo user chat messages found.', null, token, chatId);
        } else {
          let chatText = `💬 <b>LIVE USER CHAT INBOX (${chatSnap.docs.length})</b>\n─────────────────────────────\n`;
          chatSnap.docs.forEach(d => {
            const item = d.data();
            chatText += `• <b>${item.name || item.senderEmail || 'Visitor'}</b>: <i>"${item.text || item.message || ''}"</i>\n`;
          });
          await sendTelegramAlert(chatText, null, token, chatId);
        }
      }
      return;
    }

    // ── Handle Text Commands ──────────────────────────────────────────────────
    const message = update.message;
    if (!message || !message.text) return;

    const chatId = String(message.chat.id);
    let text = message.text.trim().replace(/^(\/[a-zA-Z0-9_]+)@[a-zA-Z0-9_]+/i, '$1');

    if (text.startsWith('/start') || text.startsWith('/help')) {
      const helpMsg = `
🛡️ <b>ITSHARE TELEGRAM BOT COMMANDS LIST</b>
─────────────────────────────
<code>status</code> - Real-time security stats & active bans
<code>blocked_list</code> - List & unblock active banned entities
<code>appeals</code> - View pending user unblock appeals
<code>chat</code> - Live user chat & support message inbox
<code>ban_ip</code> - Ban IP address in real-time (e.g. /ban_ip 175.100.52.181)
<code>ban_device</code> - Ban Device ID in real-time (e.g. /ban_device DEV-XXX)
<code>ban_account</code> - Ban User Account Email in real-time (e.g. /ban_account user@gmail.com)
<code>unblock</code> - Unblock IP, Device ID, or Email (e.g. /unblock target)
<code>help</code> - Display admin command guide and menu
─────────────────────────────
<i>Select any option below to manage your website in real-time!</i>
      `.trim();
      await sendTelegramAlert(helpMsg, null, token, chatId);
    } else if (text.startsWith('/status')) {
      const [logsSnap, bansSnap, appealsSnap, chatSnap] = await Promise.all([
        getDocs(query(collection(db, 'security_logs'), limit(100))),
        getDocs(collection(db, 'blocked_entities')),
        getDocs(collection(db, 'ban_appeals')),
        getDocs(query(collection(db, 'user_messages'), limit(10)))
      ]);
      const statusMsg = `
📊 <b>ITSHARE REAL-TIME SECURITY DASHBOARD</b>
─────────────────────────────
• 🛡️ <b>Total Security Logs:</b> <code>${logsSnap.docs.length}</code>
• 🚫 <b>Active Banned Entities:</b> <code>${bansSnap.docs.length}</code>
• ✉️ <b>Pending Appeals:</b> <code>${appealsSnap.docs.length}</code>
• 💬 <b>User Chat Messages:</b> <code>${chatSnap.docs.length}</code>
• 🟢 <b>Guard Engine:</b> <b>ACTIVE & GUARDING 24/7</b>
─────────────────────────────
<i>Select an option below to perform real-time management.</i>
      `.trim();
      await sendTelegramAlert(statusMsg, null, token, chatId);
    } else if (text.startsWith('/blocked_list')) {
      const bansSnap = await getDocs(collection(db, 'blocked_entities'));
      if (bansSnap.empty) {
        await sendTelegramAlert('🟢 <b>No Active Blocked Entities</b>\nYour blocklist is currently empty.', null, token, chatId);
      } else {
        let listText = `🚫 <b>ACTIVE BLOCKED ENTITIES (${bansSnap.docs.length})</b>\n─────────────────────────────\n`;
        const buttons = [];
        bansSnap.docs.forEach(d => {
          const data = d.data();
          const val = data.ip || data.email || data.deviceId || d.id;
          const typeLabel = data.type === 'ip' ? '🌐 IP' : data.type === 'device' ? '📱 Device' : '👤 Account';
          listText += `• ${typeLabel}: <code>${val}</code>\n`;
          buttons.push([{ text: `✅ Unblock ${typeLabel}: ${val}`, callback_data: `unblock:${val}` }]);
        });
        await sendTelegramAlert(listText, getMasterControlKeyboard(buttons.slice(0, 8)), token, chatId);
      }
    } else if (text.startsWith('/appeals')) {
      const appealsSnap = await getDocs(query(collection(db, 'ban_appeals'), limit(10)));
      if (appealsSnap.empty) {
        await sendTelegramAlert('✉️ <b>No Pending Unblock Appeals</b>', null, token, chatId);
      } else {
        let msgText = `✉️ <b>PENDING UNBLOCK APPEALS (${appealsSnap.docs.length})</b>\n─────────────────────────────\n`;
        const buttons = [];
        appealsSnap.docs.forEach(d => {
          const data = d.data();
          msgText += `• <b>${data.email || 'User'}</b> (${data.deviceId || ''}):\n<i>"${data.appealText}"</i>\n\n`;
          buttons.push([{ text: `✅ Approve Unblock: ${data.email || data.deviceId}`, callback_data: `unblock:${data.email || data.deviceId}` }]);
        });
        await sendTelegramAlert(msgText, getMasterControlKeyboard(buttons.slice(0, 8)), token, chatId);
      }
    } else if (text.startsWith('/chat')) {
      const chatSnap = await getDocs(query(collection(db, 'user_messages'), limit(10)));
      if (chatSnap.empty) {
        await sendTelegramAlert('💬 <b>LIVE USER CHAT INBOX</b>\n─────────────────────────────\nNo user chat messages found.', null, token, chatId);
      } else {
        let chatText = `💬 <b>LIVE USER CHAT INBOX (${chatSnap.docs.length})</b>\n─────────────────────────────\n`;
        chatSnap.docs.forEach(d => {
          const item = d.data();
          chatText += `• <b>${item.name || item.senderEmail || 'Visitor'}</b>: <i>"${item.text || item.message || ''}"</i>\n`;
        });
        await sendTelegramAlert(chatText, null, token, chatId);
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
        await sendTelegramAlert(`🚫 <b>IP BANNED IN REAL-TIME</b>\n\n<b>IP Address:</b> <code>${ip}</code>\n<b>Status:</b> 🔴 BLOCKED`, null, token, chatId);
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
        await sendTelegramAlert(`📱 <b>DEVICE BANNED IN REAL-TIME</b>\n\n<b>Device ID:</b> <code>${devId}</code>\n<b>Status:</b> 🔴 BLOCKED`, null, token, chatId);
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
        await sendTelegramAlert(`👤 <b>ACCOUNT BANNED IN REAL-TIME</b>\n\n<b>User Account:</b> <code>${email}</code>\n<b>Status:</b> 🔴 SUSPENDED`, null, token, chatId);
      }
    } else if (text.startsWith('/unblock')) {
      const target = text.replace('/unblock', '').trim().toLowerCase();
      if (!target) {
        await sendTelegramAlert('⚠️ <i>Usage: /unblock 175.100.52.181 or /unblock user@gmail.com</i>', null, token, chatId);
      } else {
        await deleteDoc(doc(db, 'blocked_entities', `ip_${safeId(target)}`)).catch(() => {});
        await deleteDoc(doc(db, 'blocked_entities', `device_${safeId(target)}`)).catch(() => {});
        await deleteDoc(doc(db, 'blocked_entities', `email_${safeId(target)}`)).catch(() => {});
        await sendTelegramAlert(`✅ <b>ENTITY UNBLOCKED IN REAL-TIME</b>\n\n<b>Target Entity:</b> <code>${target}</code>\n<b>Status:</b> 🟢 RESTORED & ACCESS GRANTED`, null, token, chatId);
      }
    }
  } catch (e) {
    console.error('[telegramNotify] Handle update error:', e);
  }
}
