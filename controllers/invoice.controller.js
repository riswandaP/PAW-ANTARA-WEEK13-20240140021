const orderService = require('../services/order.service');

async function renderInvoices(req, res) {
  try {
    const storeName = process.env.STORE_NAME || 'Toko Kita';
    const user = req.user || null;
    const statusFilter = req.query.status || '';

    let orders;
    if (user && user.role === 'customer') {
      // Customer hanya melihat pesanan miliknya sendiri
      orders = await orderService.getOrdersByUserId(user.id);
    } else {
      // Admin / Public melihat seluruh order
      orders = await orderService.getAllOrders();
    }

    let ordersJson = orders.map((o) => o.toJSON());

    // Filter status jika ada
    if (statusFilter && statusFilter !== 'all') {
      ordersJson = ordersJson.filter((o) => o.status === statusFilter);
    }

    // Kalkulasi ringkasan untuk admin
    const totalRevenue = ordersJson
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const pendingCount = ordersJson.filter((o) => o.status === 'pending').length;
    const completedCount = ordersJson.filter((o) => o.status === 'completed').length;

    res.render('invoices', {
      orders: ordersJson,
      storeName,
      user,
      statusFilter,
      stats: {
        totalOrders: ordersJson.length,
        totalRevenue,
        pendingCount,
        completedCount,
      },
      error: req.query.error || null,
      success: req.query.success || null,
      highlightId: req.query.orderId || null,
      active: 'invoice',
    });
  } catch (err) {
    res.status(500).send('Gagal memuat invoice: ' + err.message);
  }
}

async function getInvoiceDetail(req, res) {
  try {
    const { id } = req.params;
    const order = await orderService.getOrderById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Invoice tidak ditemukan' });
    }
    return res.json({ success: true, data: order });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { renderInvoices, getInvoiceDetail };
