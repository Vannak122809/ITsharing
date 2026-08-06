/**
 * telegramNotify.js — Telegram Bot Notification Helper
 *
 * Sends real-time security alerts and ban notifications to Telegram Admin Chat.
 */

// Helper to get Telegram credentials from localStorage or env
export function getTelegramConfig() {
  const token  = localStorage.getItem('itshare_telegram_token') || '';
  const chatId = localStorage.getItem('itshare_telegram_chat_id') || '';
  return { token, chatId };
}

export function saveTelegramConfig(token, chatId) {
  if (token)  localStorage.setItem('itshare_telegram_token', token.trim());
  if (chatId) localStorage.setItem('itshare_telegram_chat_id', chatId.trim());
}

/**
 * Send a Markdown-formatted message to Telegram Admin Chat
 */
export async function sendTelegramAlert(text, replyMarkup = null) {
  const { token, chatId } = getTelegramConfig();
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

/**
 * Send an Attack Notification to Telegram with 1-click Ban buttons
 */
export async function sendAttackTelegramNotification({ eventType, ip, deviceId, email, country, threatScore }) {
  const text = `
🚨 <b>ITShare Security Alert</b> 🚨

<b>Event:</b> ${eventType.toUpperCase().replace(/_/g, ' ')}
<b>Target Account:</b> <code>${email || 'None'}</code>
<b>Device ID:</b> <code>${deviceId || 'Unknown'}</code>
<b>Attacker IP:</b> <code>${ip || 'Unknown'}</code> (${country || 'Unknown'})
<b>Threat Score:</b> <b>${threatScore || 0}</b>

<i>Use buttons below or send /ban_ip, /ban_device, /ban_account to lock out attacker.</i>
  `.trim();

  const inlineKeyboard = {
    inline_keyboard: [
      [
        { text: '🚫 Ban IP', callback_data: `ban_ip:${ip}` },
        { text: '📱 Ban Device', callback_data: `ban_device:${deviceId}` }
      ],
      ...(email ? [[{ text: '👤 Ban Account', callback_data: `ban_account:${email}` }]] : []),
      [
        { text: '📊 System Status', callback_data: `status` }
      ]
    ]
  };

  return sendTelegramAlert(text, inlineKeyboard);
}

/**
 * Send a Ban Appeal Notification to Telegram
 */
export async function sendAppealTelegramNotification({ email, deviceId, ip, appealText }) {
  const text = `
✉️ <b>New Unblock Appeal Submitted</b> ✉️

<b>Account Email:</b> <code>${email}</code>
<b>Device ID:</b> <code>${deviceId}</code>
<b>IP Address:</b> <code>${ip}</code>

<b>User Message:</b>
<i>"${appealText}"</i>
  `.trim();

  const inlineKeyboard = {
    inline_keyboard: [
      [
        { text: '✅ Unblock Account', callback_data: `unblock:${email}` },
        { text: '✅ Unblock Device',  callback_data: `unblock:${deviceId}` }
      ]
    ]
  };

  return sendTelegramAlert(text, inlineKeyboard);
}
