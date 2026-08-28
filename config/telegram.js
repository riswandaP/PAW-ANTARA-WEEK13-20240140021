require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token || token === 'isi-token-dari-botfather') {
  console.warn('⚠️  TELEGRAM_BOT_TOKEN belum diset di .env, bot Telegram gak bakal jalan');
}

/**
 * `polling: true` artinya bot ini pake LONG POLLING:
 * bot terus-terusan "nanya" ke server Telegram ("ada pesan baru buat aku
 * gak?") tiap beberapa detik, bukan Telegram yang "ngirim" ke kita
 * (itu namanya webhook, butuh server dengan HTTPS publik).
 *
 * Long polling cocok buat development/kelas karena:
 * - Gak butuh domain/HTTPS publik, jalan di localhost aja
 * - Setup simpel, tinggal token doang
 *
 * Kekurangannya: kurang efisien buat skala besar dibanding webhook,
 * biasanya cukup buat development/tugas kuliah tapi bukan produksi
 * skala besar.
 */
const bot = token
  ? new TelegramBot(token, { polling: true })
  : null;

module.exports = bot;
