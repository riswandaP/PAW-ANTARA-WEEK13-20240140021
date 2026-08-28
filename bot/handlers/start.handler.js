function registerStartHandler(bot) {
  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const adminChatId = process.env.ADMIN_TELEGRAM_CHAT_ID;
    const storeName = process.env.STORE_NAME || 'Toko Kita';

    if (String(chatId) !== String(adminChatId)) {
      bot.sendMessage(
        chatId,
        `Halo! Bot ini khusus buat admin ${storeName}. Kalo mau belanja, silakan kunjungi halaman web toko ya 🙂`
      );
      return;
    }

    const text = [
      `👋 Halo Admin! Bot ${storeName} siap jalan.`,
      '',
      'Perintah yang bisa dipake:',
      '/stok - cek stok semua produk saat ini',
      '',
      'Kamu juga bakal otomatis dapet notifikasi ke sini tiap ada order baru dari web.',
    ].join('\n');

    bot.sendMessage(chatId, text);
  });
}

module.exports = registerStartHandler;
