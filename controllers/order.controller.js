const orderService = require('../services/order.service');
const sendResponse = require('../utils/response');

// read-only, buat admin/dashboard liat histori order. Pembuatan order
// SELALU lewat form web (controllers/page.controller.js -> submitOrder),
// gak ada endpoint POST order terpisah - biar cuma ada SATU jalur order.
async function getOrders(req, res) {
  try {
    const orders = await orderService.getAllOrders();
    return sendResponse(res, { message: 'Berhasil ambil order', data: orders });
  } catch (err) {
    return sendResponse(res, { code: 500, success: false, message: err.message });
  }
}

module.exports = { getOrders };
