import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.argv[2];
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || process.argv[3];

if (!BOT_TOKEN || !CHAT_ID) {
  console.log(`
Usage:
  node scripts/create-telegram-menu.mjs <BOT_TOKEN> <CHAT_ID>

Or set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in .env
`);
  process.exit(1);
}

async function createMenu() {
  console.log('🚀 Sending Inline Keyboard & Reply Keyboard Menu to Telegram...');

  // 1. Send Inline Keyboard Message
  const res1 = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: '🤖 <b>Telegram Interactive Bot Menu</b>',
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

  const data1 = await res1.json();
  console.log('Inline Keyboard Result:', data1);

  // 2. Send Custom Persistent Reply Keyboard
  const res2 = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: '👇 <b>Select an item from the menu keyboard below:</b>',
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

  const data2 = await res2.json();
  console.log('Reply Keyboard Result:', data2);

  if (data1.ok && data2.ok) {
    console.log('✅ Telegram Bot Menu successfully sent and registered!');
  } else {
    console.error('❌ Failed to send menu. Verify Bot Token and Chat ID.');
  }
}

createMenu();
