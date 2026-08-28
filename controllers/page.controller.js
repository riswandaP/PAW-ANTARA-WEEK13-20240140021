const productService = require('../services/product.service');
const orderService = require('../services/order.service');

async function renderHome(req, res) {
  try {
    const search = req.query.search || '';
    const category = req.query.category || '';
    const products = await productService.getAllProducts({ search, category });
    const categories = await productService.getCategories();
    const storeName = process.env.STORE_NAME || 'Toko Kita';

    res.render('index', {
      products: products.map((p) => p.toJSON()),
      categories,
      search,
      selectedCategory: category,
      storeName,
      user: req.user || null,
      error: req.query.error || null,
      success: req.query.success || null,
      active: 'katalog',
    });
  } catch (err) {
    res.status(500).send('Gagal memuat halaman: ' + err.message);
  }
}

async function submitOrder(req, res) {
  try {
    let { productId, quantity, buyerName, items } = req.body;
    const userId = req.user ? req.user.id : null;

    // Jika buyerName tidak ada tapi user sedang login, gunakan username user
    if (!buyerName && req.user) {
      buyerName = req.user.username;
    }

    // Parse items jika dikirim sebagai JSON string (misal dari form input hidden)
    if (typeof items === 'string') {
      try {
        items = JSON.parse(items);
      } catch (e) {
        items = [];
      }
    }

    // Format single item fallback jika items array tidak ada
    if ((!items || items.length === 0) && productId && quantity) {
      items = [{ productId: parseInt(productId, 10), quantity: parseInt(quantity, 10) }];
    }

    if (!buyerName || !items || items.length === 0) {
      if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
        return res.status(400).json({ success: false, message: 'Nama pembeli dan item produk wajib diisi' });
      }
      return res.redirect('/?error=' + encodeURIComponent('Nama pembeli dan item produk wajib diisi'));
    }

    // 🛡️ DRY: orderService.createOrder nanganin pengecekan stok,
    // simpan Order + OrderItem multi-item, dan notifikasi Telegram
    const result = await orderService.createOrder({
      userId,
      buyerName,
      items,
    });

    if (!result.success) {
      if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
        return res.status(400).json({ success: false, message: result.message });
      }
      const products = await productService.getAllProducts();
      const categories = await productService.getCategories();
      return res.render('index', {
        products: products.map((p) => p.toJSON()),
        categories,
        search: '',
        selectedCategory: '',
        storeName: process.env.STORE_NAME || 'Toko Kita',
        user: req.user || null,
        error: result.message,
        success: null,
        active: 'katalog',
      });
    }

    if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
      return res.json({
        success: true,
        message: 'Pesanan berhasil dibuat!',
        order: result.order,
        redirectUrl: '/invoices?orderId=' + result.order.id + '&success=Pesanan%20berhasil%20dibuat!',
      });
    }

    res.render('success', {
      storeName: process.env.STORE_NAME || 'Toko Kita',
      order: result.order,
      user: req.user || null,
    });
  } catch (err) {
    if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
      return res.status(500).json({ success: false, message: err.message });
    }
    res.status(500).send('Gagal memproses order: ' + err.message);
  }
}

module.exports = { renderHome, submitOrder };
