const productService = require('../services/product.service');
const orderService = require('../services/order.service');

async function renderHome(req, res) {
  try {
    // 🛡️ DRY: fungsi yang sama dipake juga di controllers/product.controller.js
    // (GET /api/products) dan bot/handlers/stok.handler.js (/stok)
    const products = await productService.getAllProducts();
    const storeName = process.env.STORE_NAME || 'Toko Kita';

    res.render('index', {
      products: products.map((p) => p.toJSON()),
      storeName,
      error: null,
    });
  } catch (err) {
    res.status(500).send('Gagal memuat halaman: ' + err.message);
  }
}

async function submitOrder(req, res) {
  try {
    const { productId, quantity, buyerName } = req.body;

    if (!productId || !quantity || !buyerName) {
      return res.redirect('/?error=Semua field wajib diisi');
    }

    // 🛡️ DRY: fungsi yang sama persis nanganin logic cek stok, kurangin stok,
    // simpen order, DAN notifikasi admin (semua di services/order.service.js)
    const result = await orderService.createOrder({
      productId: parseInt(productId, 10),
      quantity: parseInt(quantity, 10),
      buyerName,
    });

    if (!result.success) {
      const products = await productService.getAllProducts();
      return res.render('index', {
        products: products.map((p) => p.toJSON()),
        storeName: process.env.STORE_NAME || 'Toko Kita',
        error: result.message,
      });
    }

    res.render('success', {
      storeName: process.env.STORE_NAME || 'Toko Kita',
      order: result.order,
      product: result.product,
    });
  } catch (err) {
    res.status(500).send('Gagal proses order: ' + err.message);
  }
}

module.exports = { renderHome, submitOrder };
