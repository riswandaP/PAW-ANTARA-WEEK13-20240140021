const express = require('express');
const router = express.Router();
const { renderHome, submitOrder } = require('../controllers/page.controller');
const { renderInvoices } = require('../controllers/invoice.controller');

router.get('/', renderHome);
router.post('/order', submitOrder);
router.get('/invoices', renderInvoices);

module.exports = router;
