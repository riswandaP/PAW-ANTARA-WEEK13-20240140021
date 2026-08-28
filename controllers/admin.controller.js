const productService = require('../services/product.service');
const orderService = require('../services/order.service');

async function renderAdminProducts(req, res) {
  try {
    const search = req.query.search || '';
    const category = req.query.category || '';
    const products = await productService.getAllProducts({ search, category });
    const categories = await productService.getCategories();
    const storeName = process.env.STORE_NAME || 'Toko Kita';

    // Summary stats
    const totalProducts = products.length;
    const totalStock = products.reduce((acc, p) => acc + p.stock, 0);
    const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= 10).length;
    const outOfStockCount = products.filter((p) => p.stock === 0).length;

    res.render('admin/products', {
      products: products.map((p) => p.toJSON()),
      categories,
      search,
      category,
      storeName,
      stats: { totalProducts, totalStock, lowStockCount, outOfStockCount },
      error: req.query.error || null,
      success: req.query.success || null,
      active: 'admin-products',
    });
  } catch (err) {
    res.status(500).send('Gagal memuat panel admin: ' + err.message);
  }
}

async function handleCreateProduct(req, res) {
  try {
    const { name, category, description, price, stock } = req.body;
    await productService.createProduct({ name, category, description, price, stock });
    res.redirect('/admin/products?success=Produk baru berhasil ditambahkan!');
  } catch (err) {
    res.redirect('/admin/products?error=' + encodeURIComponent(err.message));
  }
}

async function handleUpdateProduct(req, res) {
  try {
    const { id } = req.params;
    const { name, category, description, price, stock } = req.body;
    await productService.updateProduct(id, { name, category, description, price, stock });
    res.redirect('/admin/products?success=Data produk berhasil diperbarui!');
  } catch (err) {
    res.redirect('/admin/products?error=' + encodeURIComponent(err.message));
  }
}

async function handleDeleteProduct(req, res) {
  try {
    const { id } = req.params;
    await productService.deleteProduct(id);
    res.redirect('/admin/products?success=Produk berhasil dihapus!');
  } catch (err) {
    res.redirect('/admin/products?error=' + encodeURIComponent(err.message));
  }
}

async function handleUpdateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await orderService.updateOrderStatus(id, status);

    if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
      return res.json({ success: true, message: 'Status pesanan berhasil diubah ke ' + status });
    }

    res.redirect('/invoices?success=' + encodeURIComponent('Status pesanan #' + id + ' berhasil diubah menjadi ' + status));
  } catch (err) {
    if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
      return res.status(400).json({ success: false, message: err.message });
    }
    res.redirect('/invoices?error=' + encodeURIComponent(err.message));
  }
}

module.exports = {
  renderAdminProducts,
  handleCreateProduct,
  handleUpdateProduct,
  handleDeleteProduct,
  handleUpdateOrderStatus,
};
