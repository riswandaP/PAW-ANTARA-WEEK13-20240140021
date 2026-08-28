const productService = require('../../services/product.service');

/**
 * Perintah /stok cuma bakal dibales kalo yang chat itu ADMIN
 * (chat ID-nya cocok sama ADMIN_TELEGRAM_CHAT_ID di .env). Kalo bukan,
 * bot diem aja (gak bales apa-apa) - biar orang random yang nemu bot ini
 * gak bisa ngintip data stok toko.
 */
function registerStokHandler(bot) {
  bot.onText(/\/stok/, async (msg) => {
    const chatId = msg.chat.id;
    const adminChatId = process.env.ADMIN_TELEGRAM_CHAT_ID;

    if (String(chatId) !== String(adminChatId)) {
      // sengaja gak dibales sama sekali ke non-admin
      return;
    }

    try {
      // 🛡️ DRY: fungsi yang SAMA PERSIS dipake di
      // controllers/product.controller.js (GET /api/products) dan
      // controllers/page.controller.js (render halaman web katalog)
      const products = await productService.getAllProducts();
      const text = productService.formatProductListText(products);

      bot.sendMessage(chatId, `📦 Stok saat ini:\n\n${text}`);
    } catch (err) {
      bot.sendMessage(chatId, 'Gagal ambil data stok. Coba lagi ya.');
      console.error('Error /stok:', err.message);
    }
  });
}

module.exports = registerStokHandler;
