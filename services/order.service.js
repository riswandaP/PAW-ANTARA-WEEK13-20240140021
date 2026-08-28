const { Order, OrderItem, Product } = require('../models');
const { formatRupiah } = require('../utils/formatRupiah');
const bot = require('../config/telegram');

/**
 * 🛡️ DRY - SERVICE LAYER
 * ============================================================
 * createOrder() menerima BANYAK item sekaligus (multi-order),
 * dipanggil dari 2 jalur masuk berbeda:
 * 1. controllers/page.controller.js -> checkout dari keranjang (web form)
 * 2. services/gemini.service.js -> AI chat function calling
 * (Notifikasi admin & pengurangan stok tetap cuma ditulis SEKALI di sini)
 * ============================================================
 *
 * @param {Object} params
 * @param {number|null} params.userId - id user yang login (boleh null kalau order dari chat AI tanpa login)
 * @param {string} params.buyerName
 * @param {Array<{productId:number, quantity:number}>} params.items
 */
async function createOrder({ userId = null, buyerName, items }) {
  if (!items || items.length === 0) {
    return { success: false, message: 'Tidak ada item yang dipesan' };
  }

  // 1. Validasi semua item dulu SEBELUM nyimpen apapun ke DB
  //    (biar gak ada kondisi setengah-tersimpan kalau salah satu item gagal)
  const resolvedItems = [];
  for (const { productId, quantity } of items) {
    const product = await Product.findByPk(productId);

    if (!product) {
      return { success: false, message: `Produk dengan ID ${productId} gak ditemukan` };
    }
    if (product.stock < quantity) {
      return {
        success: false,
        message: `Stok "${product.name}" gak cukup. Tersedia: ${product.stock}, diminta: ${quantity}`,
      };
    }

    resolvedItems.push({ product, quantity });
  }

  // 2. Hitung total
  const totalAmount = resolvedItems.reduce(
    (sum, { product, quantity }) => sum + product.price * quantity,
    0
  );

  // 3. Simpan Order (header)
  const order = await Order.create({ userId, buyerName, totalAmount, status: 'pending' });

  // 4. Simpan tiap OrderItem + kurangin stok masing-masing produk
  for (const { product, quantity } of resolvedItems) {
    await OrderItem.create({
      orderId: order.id,
      productId: product.id,
      quantity,
      priceAtOrder: product.price,
    });

    product.stock -= quantity;
    await product.save();
  }

  // 🛡️ DRY lagi: notifyAdminNewOrder dipanggil di sini, otomatis
  // ke-trigger baik order dari web maupun dari chat AI
  await notifyAdminNewOrder(order, resolvedItems);

  return { success: true, order, items: resolvedItems };
}

async function notifyAdminNewOrder(order, resolvedItems) {
  const adminChatId = process.env.ADMIN_TELEGRAM_CHAT_ID;

  if (!bot || !adminChatId || adminChatId === 'isi-chat-id-admin') {
    // bot/chat id belum di-setup, skip diam-diam (jangan bikin request gagal cuma gara-gara ini)
    return;
  }

  const itemLines = resolvedItems
    .map(({ product, quantity }) => `- ${product.name} x${quantity} (sisa stok: ${product.stock})`)
    .join('\n');

  const text =
    `🛒 *Order Baru!*\n\n` +
    `Order ID: #${order.id}\n` +
    `Atas nama: ${order.buyerName}\n\n` +
    `${itemLines}\n\n` +
    `Total: ${formatRupiah(order.totalAmount)}`;

  try {
    await bot.sendMessage(adminChatId, text, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('Gagal kirim notifikasi Telegram:', err.message);
  }
}

/**
 * Ambil semua order + item + produk di tiap item, buat ditampilin di
 * tab Invoice (dipake juga di GET /api/orders lewat order.controller.js
 * -> 🛡️ DRY, satu query dipake 2 tempat)
 */
async function getAllOrders() {
  return Order.findAll({
    include: [{ model: OrderItem, as: 'items', include: [Product] }],
    order: [['id', 'DESC']],
  });
}

/**
 * Ambil 1 order by id, lengkap sama item & produknya - dipake buat
 * halaman success setelah checkout, dan buat admin liat detail invoice.
 */
async function getOrderById(id) {
  return Order.findByPk(id, {
    include: [{ model: OrderItem, as: 'items', include: [Product] }],
  });
}

module.exports = { createOrder, getAllOrders, getOrderById };
