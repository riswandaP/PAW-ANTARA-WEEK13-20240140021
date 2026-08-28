require('dotenv').config();
const { sequelize, Product } = require('../models');

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('Koneksi database berhasil');
    await sequelize.sync();

    const existingProducts = await Product.count();
    if (existingProducts === 0) {
      await Product.bulkCreate([
        {
          name: 'Kaos Polos A',
          description: 'Bahan cotton combed 30s, adem, tersedia warna hitam & putih. Cocok buat harian, harga lebih terjangkau.',
          price: 75000,
          stock: 50,
        },
        {
          name: 'Kaos Polos B',
          description: 'Bahan cotton combed 24s (lebih tebal & premium dari versi A), tersedia warna navy & maroon. Lebih awet, harga sedikit lebih tinggi.',
          price: 95000,
          stock: 30,
        },
        { name: 'Kemeja Flanel', description: 'Motif kotak-kotak, bahan tebal, cocok buat cuaca dingin', price: 150000, stock: 20 },
        { name: 'Celana Chino Slim Fit', description: 'Warna khaki, bahan stretch, nyaman dipake seharian', price: 180000, stock: 15 },
        { name: 'Sepatu Sneakers Canvas', description: 'Cocok buat kasual, tersedia banyak ukuran', price: 220000, stock: 30 },
      ]);
      console.log('Produk dummy berhasil ditambahin (2 varian kaos buat demo perbandingan AI)');
    } else {
      console.log('Produk udah ada, skip supaya gak dobel');
    }

    console.log('\nSeeding selesai ✅');
    console.log('Buka http://localhost:3000 buat coba chat & order.');
    console.log('Coba tanya AI: "bagusan kaos polos A apa B?"');
    console.log('Terus coba: "ya udah aku beli kaos polos B 5 biji atas nama Budi"');
    console.log('Chat /stok ke bot Telegram buat cek stok dari sisi admin.');
    process.exit(0);
  } catch (err) {
    console.error('Gagal seeding:', err.message);
    process.exit(1);
  }
}

seed();
