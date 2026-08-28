const { Order, OrderItem, Product, User } = require('../models');
const { formatRupiah } = require('../utils/formatRupiah');
const bot = require('../config/telegram');

/**
 * 🛡️ DRY - SERVICE LAYER
 * ============================================================
 * createOrder() menerima BANYAK item sekaligus (multi-order),
 * dipanggil dari 2 jalur masuk berbeda:
 * 1. controllers/page.controller.js -> checkout dari keranjang (web cart)
 * 2. services/gemini.service.js -> AI chat function calling (multi-item)
 * (Notifikasi admin & pengurangan stok tetap cuma ditulis SEKALI di sini)
 * ============================================================
 *
 * @param {Object} params
 * @param {number|null} params.userId - id user yang login (boleh null kalau order dari chat AI / guest)
 * @param {string} params.buyerName
 * @param {Array<{productId:number, quantity:number}>} params.items
 */
async function createOrder({ userId = null, buyerName, items = [], productId = null, quantity = null }) {
  // Support both array of items or single item fallback
  let orderItems = Array.isArray(items) ? [...items] : [];
  if (orderItems.length === 0 && productId && quantity) {
    orderItems.push({ productId: parseInt(productId, 10), quantity: parseInt(quantity, 10) });
  }

  if (!buyerName || !buyerName.trim()) {
    return { success: false, message: 'Nama pembeli wajib diisi' };
  }

  if (!orderItems || orderItems.length === 0) {
    return { success: false, message: 'Tidak ada item produk yang dipesan' };
  }

  // 1. Validasi semua item dulu SEBELUM nyimpen apapun ke DB
  //    (biar gak ada kondisi setengah-tersimpan kalau salah satu item gagal)
  const resolvedItems = [];
  for (const item of orderItems) {
    const pId = parseInt(item.productId, 10);
    const qty = parseInt(item.quantity, 10) || 1;

    if (isNaN(pId) || isNaN(qty) || qty <= 0) {
      return { success: false, message: 'Data produk atau kuantitas tidak valid' };
    }

    const product = await Product.findByPk(pId);

    if (!product) {
      return { success: false, message: `Produk dengan ID #${pId} tidak ditemukan di katalog` };
    }
    if (product.stock < qty) {
      return {
        success: false,
        message: `Stok "${product.name}" tidak cukup. Tersedia: ${product.stock}, diminta: ${qty}`,
      };
    }

    resolvedItems.push({ product, quantity: qty });
  }

  // 2. Hitung total
  const totalAmount = resolvedItems.reduce(
    (sum, { product, quantity }) => sum + product.price * quantity,
    0
  );

  // 3. Simpan Order (header)
  const order = await Order.create({
    userId: userId ? parseInt(userId, 10) : null,
    buyerName: buyerName.trim(),
    totalAmount,
    status: 'pending',
  });

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

  // 🛡️ DRY: notifyAdminNewOrder dipanggil di sini, otomatis
  // ke-trigger baik order dari web maupun dari chat AI
  await notifyAdminNewOrder(order, resolvedItems);

  // Ambil ulang order lengkap dengan relasi items dan product
  const completeOrder = await getOrderById(order.id);

  return { success: true, order: completeOrder, items: resolvedItems };
}

async function notifyAdminNewOrder(order, resolvedItems) {
  const adminChatId = process.env.ADMIN_TELEGRAM_CHAT_ID;

  if (!bot || !adminChatId || adminChatId === 'isi-chat-id-admin') {
    // bot/chat id belum di-setup, skip diam-diam (jangan bikin request gagal cuma gara-gara ini)
    return;
  }

  const itemLines = resolvedItems
    .map(({ product, quantity }) => `• ${product.name} x${quantity} @ ${formatRupiah(product.price)} (Sisa stok: ${product.stock})`)
    .join('\n');

  const text =
    `🛒 *NOTIFIKASI ORDER BARU!*\n` +
    `═══════════════════════\n` +
    `*Order ID:* #${order.id}\n` +
    `*Nama Pembeli:* ${order.buyerName}\n` +
    `*Tanggal:* ${new Date().toLocaleString('id-ID')}\n\n` +
    `*Rincian Produk (${resolvedItems.length} jenis):*\n` +
    `${itemLines}\n\n` +
    `*TOTAL PEMBAYARAN:* ${formatRupiah(order.totalAmount)}\n` +
    `*Status:* Pending ⏳\n` +
    `═══════════════════════`;

  try {
    await bot.sendMessage(adminChatId, text, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('Gagal kirim notifikasi Telegram:', err.message);
  }
}

/**
 * Ambil semua order + item + produk di tiap item, buat ditampilin di
 * tab Invoice (dipake juga di GET /api/orders lewat order.controller.js)
 */
async function getAllOrders() {
  return Order.findAll({
    include: [
      { model: OrderItem, as: 'items', include: [Product] },
      { model: User, attributes: ['id', 'username', 'email', 'role'] },
    ],
    order: [['id', 'DESC']],
  });
}

/**
 * Ambil order berdasarkan userId (untuk customer yang login)
 */
async function getOrdersByUserId(userId) {
  return Order.findAll({
    where: { userId },
    include: [
      { model: OrderItem, as: 'items', include: [Product] },
      { model: User, attributes: ['id', 'username', 'email', 'role'] },
    ],
    order: [['id', 'DESC']],
  });
}

/**
 * Ambil 1 order by id, lengkap sama item & produknya
 */
async function getOrderById(id) {
  return Order.findByPk(id, {
    include: [
      { model: OrderItem, as: 'items', include: [Product] },
      { model: User, attributes: ['id', 'username', 'email', 'role'] },
    ],
  });
}

/**
 * Update status pesanan (khusus Admin)
 */
async function updateOrderStatus(orderId, status) {
  const allowedStatuses = ['pending', 'processing', 'completed', 'cancelled'];
  if (!allowedStatuses.includes(status)) {
    throw new Error(`Status "${status}" tidak valid. Pilihan: ${allowedStatuses.join(', ')}`);
  }

  const order = await Order.findByPk(orderId, {
    include: [{ model: OrderItem, as: 'items', include: [Product] }],
  });

  if (!order) {
    throw new Error(`Pesanan dengan ID #${orderId} tidak ditemukan`);
  }

  const oldStatus = order.status;
  order.status = status;
  await order.save();

  return { success: true, order, oldStatus, newStatus: status };
}

module.exports = {
  createOrder,
  getAllOrders,
  getOrdersByUserId,
  getOrderById,
  updateOrderStatus,
};
