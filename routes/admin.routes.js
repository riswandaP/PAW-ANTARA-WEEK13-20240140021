const express = require('express');
const router = express.Router();
const {
  renderAdminProducts,
  handleCreateProduct,
  handleUpdateProduct,
  handleDeleteProduct,
  handleUpdateOrderStatus,
} = require('../controllers/admin.controller');
const { requireRole } = require('../middlewares/auth.middleware');

// Protect all admin routes
router.use(requireRole('admin'));

router.get('/products', renderAdminProducts);
router.post('/products', handleCreateProduct);
router.post('/products/:id/edit', handleUpdateProduct);
router.post('/products/:id/delete', handleDeleteProduct);
router.post('/orders/:id/status', handleUpdateOrderStatus);

module.exports = router;
