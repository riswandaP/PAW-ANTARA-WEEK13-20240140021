const bot = require('../config/telegram');

const registerStartHandler = require('./handlers/start.handler');
const registerStokHandler = require('./handlers/stok.handler');

function startBot() {
  if (!bot) {
    console.warn('⚠️  Bot Telegram gak jalan (TELEGRAM_BOT_TOKEN belum diset di .env)');
    return;
  }

  registerStartHandler(bot);
  registerStokHandler(bot);

  bot.on('polling_error', (err) => {
    console.error('Polling error:', err.message);
  });

  console.log('🤖 Bot Telegram aktif (long polling) - mode admin: notifikasi order + cek stok');
}

module.exports = startBot;
