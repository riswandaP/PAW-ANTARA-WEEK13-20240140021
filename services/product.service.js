const { Product } = require('../models');
const { formatRupiah } = require('../utils/formatRupiah');

/**
 * 🛡️ DRY - SERVICE LAYER
 * ============================================================
 * Semua fungsi di file ini dipanggil dari 2 tempat beda:
 * 1. controllers/product.controller.js (buat REST API / web)
 * 2. bot/handlers/produk.handler.js   (buat bot Telegram)
 *
 * Tanpa layer ini, query "ambil semua produk" bakal ditulis 2 kali
 * di 2 tempat beda - kalo suatu saat query-nya perlu diubah (misal
 * nambah filter stok), kita harus inget ubah di 2 tempat. Gampang
 * lupa salah satu, jadi sumber bug.
 *
 * Dengan service layer: query cukup ditulis SEKALI di sini,
 * controller & bot handler tinggal MEMANGGIL fungsi ini.
 * ============================================================
 */

async function getAllProducts() {
  return Product.findAll({ order: [['id', 'ASC']] });
}

async function getProductById(id) {
  return Product.findByPk(id);
}

/**
 * Format daftar produk jadi teks siap kirim - dipake bot Telegram
 * buat balesan /produk. Sengaja dipisah dari getAllProducts() biar
 * fungsi query & fungsi format gak nyampur (single responsibility).
 */
function formatProductListText(products) {
  if (products.length === 0) {
    return 'Belum ada produk tersedia.';
  }

  const lines = products.map((p) => {
    const stockInfo = p.stock > 0 ? `Stok: ${p.stock}` : 'HABIS';
    return `#${p.id} — ${p.name}\n${formatRupiah(p.price)} | ${stockInfo}`;
  });

  return lines.join('\n\n');
}

module.exports = { getAllProducts, getProductById, formatProductListText };
