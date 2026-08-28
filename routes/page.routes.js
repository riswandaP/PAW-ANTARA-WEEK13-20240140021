const express = require('express');
const router = express.Router();
const { renderHome, submitOrder } = require('../controllers/page.controller');
const { renderInvoices, getInvoiceDetail } = require('../controllers/invoice.controller');

router.get('/', renderHome);
router.post('/order', submitOrder);
router.get('/invoices', renderInvoices);
router.get('/invoices/:id/json', getInvoiceDetail);

module.exports = router;
