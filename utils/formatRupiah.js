/**
 * 🛡️ DRY: fungsi kecil ini dipake di MINIMAL 3 tempat beda -
 * services/product.service.js, services/order.service.js, dan
 * bot/handlers/*.js. Daripada nulis `.toLocaleString('id-ID')` berulang
 * di tiap file, cukup satu fungsi di sini.
 */
function formatRupiah(amount) {
  return 'Rp' + Number(amount).toLocaleString('id-ID');
}

module.exports = { formatRupiah };
