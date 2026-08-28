const productService = require('../services/product.service');
const sendResponse = require('../utils/response');

async function getProducts(req, res) {
  try {
    const products = await productService.getAllProducts();
    return sendResponse(res, { message: 'Berhasil ambil produk', data: products });
  } catch (err) {
    return sendResponse(res, { code: 500, success: false, message: err.message });
  }
}

module.exports = { getProducts };
