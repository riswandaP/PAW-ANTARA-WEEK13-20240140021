const { Op } = require('sequelize');
const { Product, OrderItem } = require('../models');
const { formatRupiah } = require('../utils/formatRupiah');

/**
 * 🛡️ DRY - SERVICE LAYER
 * ============================================================
 * Semua fungsi di file ini dipanggil dari berbagai tempat:
 * 1. controllers/product.controller.js (REST API / web)
 * 2. controllers/admin.controller.js (Admin CRUD)
 * 3. bot/handlers/stok.handler.js (Bot Telegram /stok)
 * 4. services/gemini.service.js (Gemini AI System Instruction)
 * ============================================================
 */

async function getAllProducts({ search = '', category = '' } = {}) {
  const where = {};

  if (search && search.trim()) {
    where.name = { [Op.iLike]: `%${search.trim()}%` };
  }

  if (category && category.trim() && category !== 'Semua') {
    where.category = category.trim();
  }

  return Product.findAll({
    where,
    order: [['id', 'ASC']],
  });
}

async function getProductById(id) {
  return Product.findByPk(id);
}

async function createProduct({ name, category = 'Umum', description = '', price, stock }) {
  if (!name || price === undefined || stock === undefined) {
    throw new Error('Nama produk, harga, dan stok wajib diisi');
  }

  const parsedPrice = parseInt(price, 10);
  const parsedStock = parseInt(stock, 10);

  if (isNaN(parsedPrice) || parsedPrice < 0) {
    throw new Error('Harga harus berupa angka valid >= 0');
  }

  if (isNaN(parsedStock) || parsedStock < 0) {
    throw new Error('Stok harus berupa angka valid >= 0');
  }

  return Product.create({
    name: name.trim(),
    category: category ? category.trim() : 'Umum',
    description: description ? description.trim() : '',
    price: parsedPrice,
    stock: parsedStock,
  });
}

async function updateProduct(id, { name, category, description, price, stock }) {
  const product = await Product.findByPk(id);
  if (!product) {
    throw new Error(`Produk dengan ID #${id} tidak ditemukan`);
  }

  if (name !== undefined) product.name = name.trim();
  if (category !== undefined) product.category = category.trim();
  if (description !== undefined) product.description = description.trim();

  if (price !== undefined) {
    const parsedPrice = parseInt(price, 10);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      throw new Error('Harga harus berupa angka valid >= 0');
    }
    product.price = parsedPrice;
  }

  if (stock !== undefined) {
    const parsedStock = parseInt(stock, 10);
    if (isNaN(parsedStock) || parsedStock < 0) {
      throw new Error('Stok harus berupa angka valid >= 0');
    }
    product.stock = parsedStock;
  }

  await product.save();
  return product;
}

async function deleteProduct(id) {
  const product = await Product.findByPk(id);
  if (!product) {
    throw new Error(`Produk dengan ID #${id} tidak ditemukan`);
  }

  // Jika produk ada di riwayat order item, cegah error FK dengan menghapus atau handling gracefully
  await OrderItem.destroy({ where: { productId: id } }).catch(() => {});
  await product.destroy();
  return { success: true, message: `Produk "${product.name}" berhasil dihapus` };
}

async function getCategories() {
  const products = await Product.findAll({
    attributes: ['category'],
    group: ['category'],
  });
  return products.map((p) => p.category).filter(Boolean);
}

/**
 * Format daftar produk jadi teks siap kirim - dipake bot Telegram & Gemini
 */
function formatProductListText(products) {
  if (products.length === 0) {
    return 'Belum ada produk tersedia.';
  }

  const lines = products.map((p) => {
    const stockInfo = p.stock > 0 ? `Stok: ${p.stock}` : 'HABIS';
    const cat = p.category ? `[${p.category}] ` : '';
    return `#${p.id} — ${cat}${p.name}\n${formatRupiah(p.price)} | ${stockInfo}\nDeskripsi: ${p.description || '-'}`;
  });

  return lines.join('\n\n');
}

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  formatProductListText,
};
