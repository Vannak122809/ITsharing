/**
 * api/telegram-webhook.js — Full Featured Telegram Admin Bot Webhook Endpoint
 *
 * Supported Commands & Menu Features:
 *   /status              — 📊 Real-time security stats & active ban breakdown
 *   /blocked_list        — 🚫 Interactive blocked list with 1-click unblock buttons
 *   /appeals             — ✉️ View pending user unblock appeals
 *   /chat                — 💬 Live user chat & support message inbox
 *   /ban_ip <IP>         — 🌐 Ban IP address in real-time
 *   /ban_device <DevID>  — 📱 Ban Device ID in real-time
 *   /ban_account <Email> — 👤 Ban User Account Email in real-time
 *   /unblock <Target>    — 🔓 Unblock any IP, Device ID, or Email
 *   /help                — 🛡️ Master command guide
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

async function listUserMessagesREST() {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/user_messages?pageSize=10`;
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

// ── Telegram Bot Keyboards (Inline & Custom Reply Keyboard) ────────────────────
function getInlineMenuKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '🕵️‍♂️ Check Registration Date', callback_data: 'check_reg_date' }
      ],
      [
        { text: '🚀 Share ID', switch_inline_query: '' }
      ]
    ]
  };
}

function getReplyMenuKeyboard() {
  return {
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
  };
}

function getMasterControlKeyboard(extraButtons = []) {
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

// ── Telegram Reply Helpers ────────────────────────────────────────────────────
async function sendTelegramReply(botToken, chatId, text, inlineKeyboard = null) {
  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const keyboard = inlineKeyboard || getMasterControlKeyboard();

    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: String(chatId),
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_markup: keyboard
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

async function saveTelegramSettingsREST(token, chatId) {
  if (!token || !chatId) return;
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/settings/telegram?updateMask.fieldPaths=token&updateMask.fieldPaths=chatId&updateMask.fieldPaths=updatedAt`;
    await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          token: { stringValue: String(token).trim() },
          chatId: { stringValue: String(chatId).trim() },
          updatedAt: { stringValue: new Date().toISOString() }
        }
      })
    });
  } catch (e) {
    console.warn('[telegram-webhook] Failed to auto-save chatId:', e);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let botToken = process.env.TELEGRAM_BOT_TOKEN || req.query.token;
  const update = req.body || {};

  try {
    if (!botToken) {
      const tgRes = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/settings/telegram`).catch(() => null);
      if (tgRes && tgRes.ok) {
        const tgData = await tgRes.json();
        botToken = tgData.fields?.token?.stringValue || '';
      }
    }

    if (!botToken) {
      return res.status(400).json({ error: 'Missing Telegram Bot Token' });
    }

    const incomingChatId = update.message?.chat?.id || update.callback_query?.message?.chat?.id;
    if (incomingChatId) {
      // Auto-persist active admin chatId so submit-appeal API always works!
      saveTelegramSettingsREST(botToken, incomingChatId).catch(() => {});
    }

    const safeId = (str) => (str || '').toLowerCase().replace(/[^a-zA-Z0-9._-]/g, '_');

    // ── Handle Inline Button Clicks ───────────────────────────────────────────
    if (update.callback_query) {
      const cb = update.callback_query;
      const chatId = String(cb.message.chat.id);
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
        await sendTelegramReply(botToken, chatId, `🚫 <b>IP BANNED IN REAL-TIME</b>\n\n<b>IP Address:</b> <code>${target}</code>\n<b>Status:</b> 🔴 BLOCKED`);
      } else if (action === 'ban_device' && target) {
        const docId = `device_${safeId(target)}`;
        await setBlockedEntityREST(docId, {
          type: 'device', deviceId: target, blocked: true,
          blockedAt: new Date().toISOString(), note: 'Banned via Telegram Bot'
        });
        await answerCallbackQuery(botToken, cb.id, `✅ Device ${target} Banned!`);
        await sendTelegramReply(botToken, chatId, `📱 <b>DEVICE BANNED IN REAL-TIME</b>\n\n<b>Device ID:</b> <code>${target}</code>\n<b>Status:</b> 🔴 BLOCKED`);
      } else if (action === 'ban_account' && target) {
        const docId = `email_${safeId(target)}`;
        await setBlockedEntityREST(docId, {
          type: 'email', email: target.toLowerCase(), blocked: true, disabled: true,
          blockedAt: new Date().toISOString(), note: 'Banned via Telegram Bot'
        });
        await answerCallbackQuery(botToken, cb.id, `✅ Account ${target} Banned!`);
        await sendTelegramReply(botToken, chatId, `👤 <b>ACCOUNT BANNED IN REAL-TIME</b>\n\n<b>User Account:</b> <code>${target}</code>\n<b>Status:</b> 🔴 SUSPENDED`);
      } else if (action === 'unblock' && target) {
        const clean = target.toLowerCase().trim();
        await deleteBlockedEntityREST(`ip_${safeId(clean)}`);
        await deleteBlockedEntityREST(`device_${safeId(clean)}`);
        await deleteBlockedEntityREST(`email_${safeId(clean)}`);

        await answerCallbackQuery(botToken, cb.id, `✅ Unblocked ${target}!`);
        await sendTelegramReply(botToken, chatId, `✅ <b>ENTITY UNBLOCKED IN REAL-TIME</b>\n\n<b>Target Entity:</b> <code>${target}</code>\n<b>Status:</b> 🟢 RESTORED & ACCESS GRANTED`);
      } else if (action === 'prompt_ban_ip') {
        await answerCallbackQuery(botToken, cb.id, 'Enter IP to ban');
        await sendTelegramReply(botToken, chatId, `🌐 <b>BAN IP ADDRESS</b>\n\nType or reply with:\n<code>/ban_ip 175.100.52.181</code>`);
      } else if (action === 'prompt_ban_device') {
        await answerCallbackQuery(botToken, cb.id, 'Enter Device ID to ban');
        await sendTelegramReply(botToken, chatId, `📱 <b>BAN DEVICE ID</b>\n\nType or reply with:\n<code>/ban_device DEV-8F92A1B4</code>`);
      } else if (action === 'prompt_ban_account') {
        await answerCallbackQuery(botToken, cb.id, 'Enter Account Email to ban');
        await sendTelegramReply(botToken, chatId, `👤 <b>BAN USER ACCOUNT</b>\n\nType or reply with:\n<code>/ban_account user@gmail.com</code>`);
      } else if (action === 'prompt_unblock') {
        await answerCallbackQuery(botToken, cb.id, 'Enter Target to unblock');
        await sendTelegramReply(botToken, chatId, `🔓 <b>UNBLOCK TARGET</b>\n\nType or reply with:\n<code>/unblock 175.100.52.181</code> or <code>/unblock user@gmail.com</code>`);
      } else if (action === 'status') {
        const [logsCount, bansList, appealsList, chatList] = await Promise.all([
          listLogsCountREST(),
          listBlockedEntitiesREST(),
          listAppealsREST(),
          listUserMessagesREST()
        ]);

        const statusMsg = `
📊 <b>ITSHARE REAL-TIME SECURITY DASHBOARD</b>
─────────────────────────────
• 🛡️ <b>Total Security Logs:</b> <code>${logsCount}</code>
• 🚫 <b>Active Banned Entities:</b> <code>${bansList.length}</code>
• ✉️ <b>Pending Appeals:</b> <code>${appealsList.length}</code>
• 💬 <b>User Chat Messages:</b> <code>${chatList.length}</code>
• 🟢 <b>Guard Engine:</b> <b>ACTIVE & GUARDING 24/7</b>
─────────────────────────────
<i>Select an option below to perform real-time management.</i>
        `.trim();
        await sendTelegramReply(botToken, chatId, statusMsg);
      } else if (action === 'blocked_list') {
        const bansList = await listBlockedEntitiesREST();
        if (!bansList.length) {
          await sendTelegramReply(botToken, chatId, '🟢 <b>No Active Blocked Entities</b>\nYour blocklist is currently empty.');
        } else {
          let listText = `🚫 <b>ACTIVE BLOCKED ENTITIES (${bansList.length})</b>\n─────────────────────────────\n`;
          const buttons = [];
          bansList.forEach(data => {
            const val = data.ip || data.email || data.deviceId || data.id;
            const typeLabel = data.type === 'ip' ? '🌐 IP' : data.type === 'device' ? '📱 Device' : '👤 Account';
            listText += `• ${typeLabel}: <code>${val}</code>\n`;
            buttons.push([{ text: `✅ Unblock ${typeLabel}: ${val}`, callback_data: `unblock:${val}` }]);
          });
          await sendTelegramReply(botToken, chatId, listText, getMasterControlKeyboard(buttons.slice(0, 8)));
        }
      } else if (action === 'appeals') {
        const appealsList = await listAppealsREST();
        if (!appealsList.length) {
          await sendTelegramReply(botToken, chatId, '✉️ <b>No Pending Unblock Appeals</b>');
        } else {
          let msg = `✉️ <b>PENDING UNBLOCK APPEALS (${appealsList.length})</b>\n─────────────────────────────\n`;
          const buttons = [];
          appealsList.forEach(data => {
            msg += `• <b>${data.email || 'User'}</b> (${data.deviceId || ''}):\n<i>"${data.appealText}"</i>\n\n`;
            buttons.push([{ text: `✅ Approve Unblock: ${data.email || data.deviceId}`, callback_data: `unblock:${data.email || data.deviceId}` }]);
          });
          await sendTelegramReply(botToken, chatId, msg, getMasterControlKeyboard(buttons.slice(0, 8)));
        }
      } else if (action === 'chat_menu') {
        const chatList = await listUserMessagesREST();
        if (!chatList.length) {
          await sendTelegramReply(botToken, chatId, '💬 <b>LIVE USER CHAT INBOX</b>\n─────────────────────────────\nNo user chat messages found.\nVisitors can chat directly from your website!');
        } else {
          let chatText = `💬 <b>LIVE USER CHAT INBOX (${chatList.length})</b>\n─────────────────────────────\n`;
          chatList.forEach(item => {
            chatText += `• <b>${item.name || item.senderEmail || 'Visitor'}</b>: <i>"${item.text || item.message || ''}"</i>\n`;
          });
          await sendTelegramReply(botToken, chatId, chatText);
        }
      } else if (action === 'check_reg_date') {
        const userId = cb.from.id;
        const firstName = cb.from.first_name || 'User';
        await answerCallbackQuery(botToken, cb.id, '🕵️‍♂️ Checking Registration Date...');

        let estDate = '2023 - Present';
        if (userId < 100000000) estDate = '2013 - 2015';
        else if (userId < 300000000) estDate = '2015 - 2017';
        else if (userId < 800000000) estDate = '2017 - 2019';
        else if (userId < 1300000000) estDate = '2019 - 2021';
        else if (userId < 2000000000) estDate = '2021 - 2023';

        const infoMsg = `
🕵️‍♂️ <b>TELEGRAM ACCOUNT REGISTRATION INFO</b>
─────────────────────────────
• 👤 <b>Name:</b> ${firstName}
• 🆔 <b>Telegram User ID:</b> <code>${userId}</code>
• 📅 <b>Estimated Registration Date:</b> <code>${estDate}</code>
─────────────────────────────
        `.trim();
        await sendTelegramReply(botToken, chatId, infoMsg);
      }

      return res.status(200).json({ ok: true });
    }

    // ── Handle User / Chat Shared Button Triggers ─────────────────────────────
    if (message.user_shared) {
      const shared = message.user_shared;
      const sharedMsg = `
👤 <b>USER / BOT SELECTION RECEIVED</b>
─────────────────────────────
• <b>Request ID:</b> <code>${shared.request_id}</code>
• <b>Selected User ID:</b> <code>${shared.user_id}</code>
─────────────────────────────
      `.trim();
      await sendTelegramReply(botToken, chatId, sharedMsg);
      return res.status(200).json({ ok: true });
    }

    if (message.chat_shared) {
      const shared = message.chat_shared;
      const sharedMsg = `
📢 <b>CHANNEL / GROUP / FORUM SELECTION RECEIVED</b>
─────────────────────────────
• <b>Request ID:</b> <code>${shared.request_id}</code>
• <b>Selected Chat ID:</b> <code>${shared.chat_id}</code>
─────────────────────────────
      `.trim();
      await sendTelegramReply(botToken, chatId, sharedMsg);
      return res.status(200).json({ ok: true });
    }

    // ── Handle Text Commands ──────────────────────────────────────────────────
    const message = update.message;
    if (!message || !message.text) {
      return res.status(200).json({ ok: true });
    }

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
<code>ban_ip</code> - Ban IP address in real-time
<code>ban_device</code> - Ban Device ID in real-time
<code>ban_account</code> - Ban User Account Email in real-time
<code>unblock</code> - Unblock IP, Device ID, or Email
─────────────────────────────
<i>Select an option below or use the bottom keyboard menu!</i>
      `.trim();
      await sendTelegramReply(botToken, chatId, helpMsg, getInlineMenuKeyboard());
      await sendTelegramReply(botToken, chatId, '👇 <b>Main Navigation Menu:</b>', getReplyMenuKeyboard());
    } else if (text.startsWith('/status')) {
      const [logsCount, bansList, appealsList, chatList] = await Promise.all([
        listLogsCountREST(),
        listBlockedEntitiesREST(),
        listAppealsREST(),
        listUserMessagesREST()
      ]);

      const statusMsg = `
📊 <b>ITSHARE REAL-TIME SECURITY DASHBOARD</b>
─────────────────────────────
• 🛡️ <b>Total Security Logs:</b> <code>${logsCount}</code>
• 🚫 <b>Active Banned Entities:</b> <code>${bansList.length}</code>
• ✉️ <b>Pending Appeals:</b> <code>${appealsList.length}</code>
• 💬 <b>User Chat Messages:</b> <code>${chatList.length}</code>
• 🟢 <b>Guard Engine:</b> <b>ACTIVE & GUARDING 24/7</b>
─────────────────────────────
<i>Select an option below to perform real-time management.</i>
      `.trim();
      await sendTelegramReply(botToken, chatId, statusMsg);
    } else if (text.startsWith('/blocked_list')) {
      const bansList = await listBlockedEntitiesREST();
      if (!bansList.length) {
        await sendTelegramReply(botToken, chatId, '🟢 <b>No Active Blocked Entities</b>\nYour blocklist is currently empty.');
      } else {
        let listText = `🚫 <b>ACTIVE BLOCKED ENTITIES (${bansList.length})</b>\n─────────────────────────────\n`;
        const buttons = [];
        bansList.forEach(data => {
          const val = data.ip || data.email || data.deviceId || data.id;
          const typeLabel = data.type === 'ip' ? '🌐 IP' : data.type === 'device' ? '📱 Device' : '👤 Account';
          listText += `• ${typeLabel}: <code>${val}</code>\n`;
          buttons.push([{ text: `✅ Unblock ${typeLabel}: ${val}`, callback_data: `unblock:${val}` }]);
        });
        await sendTelegramReply(botToken, chatId, listText, getMasterControlKeyboard(buttons.slice(0, 8)));
      }
    } else if (text.startsWith('/appeals')) {
      const appealsList = await listAppealsREST();
      if (!appealsList.length) {
        await sendTelegramReply(botToken, chatId, '✉️ <b>No Pending Unblock Appeals</b>');
      } else {
        let msg = `✉️ <b>PENDING UNBLOCK APPEALS (${appealsList.length})</b>\n─────────────────────────────\n`;
        const buttons = [];
        appealsList.forEach(data => {
          msg += `• <b>${data.email || 'User'}</b> (${data.deviceId || ''}):\n<i>"${data.appealText}"</i>\n\n`;
          buttons.push([{ text: `✅ Approve Unblock: ${data.email || data.deviceId}`, callback_data: `unblock:${data.email || data.deviceId}` }]);
        });
        await sendTelegramReply(botToken, chatId, msg, getMasterControlKeyboard(buttons.slice(0, 8)));
      }
    } else if (text.startsWith('/chat')) {
      const chatList = await listUserMessagesREST();
      if (!chatList.length) {
        await sendTelegramReply(botToken, chatId, '💬 <b>LIVE USER CHAT INBOX</b>\n─────────────────────────────\nNo user chat messages found.\nVisitors can chat directly from your website!');
      } else {
        let chatText = `💬 <b>LIVE USER CHAT INBOX (${chatList.length})</b>\n─────────────────────────────\n`;
        chatList.forEach(item => {
          chatText += `• <b>${item.name || item.senderEmail || 'Visitor'}</b>: <i>"${item.text || item.message || ''}"</i>\n`;
        });
        await sendTelegramReply(botToken, chatId, chatText);
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
        await sendTelegramReply(botToken, chatId, `🚫 <b>IP BANNED IN REAL-TIME</b>\n\n<b>IP Address:</b> <code>${ip}</code>\n<b>Status:</b> 🔴 BLOCKED`);
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
        await sendTelegramReply(botToken, chatId, `📱 <b>DEVICE BANNED IN REAL-TIME</b>\n\n<b>Device ID:</b> <code>${devId}</code>\n<b>Status:</b> 🔴 BLOCKED`);
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
        await sendTelegramReply(botToken, chatId, `👤 <b>ACCOUNT BANNED IN REAL-TIME</b>\n\n<b>User Account:</b> <code>${email}</code>\n<b>Status:</b> 🔴 SUSPENDED`);
      }
    } else if (text.startsWith('/unblock')) {
      const target = text.replace('/unblock', '').trim().toLowerCase();
      if (!target) {
        await sendTelegramReply(botToken, chatId, '⚠️ <i>Usage: /unblock 175.100.52.181 or /unblock user@gmail.com</i>');
      } else {
        await deleteBlockedEntityREST(`ip_${safeId(target)}`);
        await deleteBlockedEntityREST(`device_${safeId(target)}`);
        await deleteBlockedEntityREST(`email_${safeId(target)}`);

        await sendTelegramReply(botToken, chatId, `✅ <b>ENTITY UNBLOCKED IN REAL-TIME</b>\n\n<b>Target Entity:</b> <code>${target}</code>\n<b>Status:</b> 🟢 RESTORED & ACCESS GRANTED`);
      }
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[telegram-webhook] Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
