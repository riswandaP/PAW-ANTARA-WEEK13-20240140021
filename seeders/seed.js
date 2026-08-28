require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, Product, User, Order, OrderItem } = require('../models');

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('Koneksi database berhasil');
    
    // Sync model to create/update tables
    await sequelize.sync({ alter: true });
    console.log('Sinkronisasi model selesai');

    // 1. Seed Users (Admin & Customer)
    const existingUsers = await User.count();
    if (existingUsers === 0) {
      const adminPasswordHash = bcrypt.hashSync('admin123', 10);
      const budiPasswordHash = bcrypt.hashSync('budi123', 10);
      const sitiPasswordHash = bcrypt.hashSync('siti123', 10);

      await User.bulkCreate([
        {
          username: 'admin',
          email: 'admin@tokokita.com',
          password: adminPasswordHash,
          role: 'admin',
        },
        {
          username: 'budi',
          email: 'budi@gmail.com',
          password: budiPasswordHash,
          role: 'customer',
        },
        {
          username: 'siti',
          email: 'siti@gmail.com',
          password: sitiPasswordHash,
          role: 'customer',
        },
      ]);
      console.log(' Akun default berhasil dibuat:');
      console.log('   - Admin   : admin / admin123 (Role: admin)');
      console.log('   - Customer: budi / budi123 (Role: customer)');
      console.log('   - Customer: siti / siti123 (Role: customer)');
    } else {
      console.log(' Data user sudah ada, skip seed user');
    }

    // 2. Seed Products (16+ Produk Beragam)
    const currentProductCount = await Product.count();
    if (currentProductCount < 10) {
      await OrderItem.destroy({ where: {} }).catch(() => {});
      await Order.destroy({ where: {} }).catch(() => {});
      await Product.destroy({ where: {} }).catch(() => {});

      const productsData = [
        {
          name: 'Kaos Polos Cotton Combed 30s',
          category: 'Pakaian',
          description: 'Kaos polos katun 30s halus, adem, dan menyerap keringat. Tersedia warna Hitam, Putih, Navy, dan Abu-abu.',
          price: 65000,
          stock: 45,
        },
        {
          name: 'Kaos Polos Heavyweight 24s Premium',
          category: 'Pakaian',
          description: 'Bahan cotton combed 24s tebal, potongan boxy fit modern, tahan lama dan tidak mudah melar.',
          price: 95000,
          stock: 35,
        },
        {
          name: 'Kemeja Flanel Kotak Lengan Panjang',
          category: 'Pakaian',
          description: 'Kemeja flanel katun premium motif tartan kasual. Hangat, nyaman, cocok untuk outfit santai maupun semi-formal.',
          price: 155000,
          stock: 25,
        },
        {
          name: 'Kemeja Oxford Formal Putih',
          category: 'Pakaian',
          description: 'Kemeja bahan katun oxford tahan kusut, slim fit, kerah button-down rapi untuk kerja dan kuliah.',
          price: 165000,
          stock: 20,
        },
        {
          name: 'Hoodie Zipper Fleece Hitam',
          category: 'Jaket & Outer',
          description: 'Hoodie jaket resleting bahan cotton fleece tebal dengan saku kangguru dan tali serut adjustable.',
          price: 195000,
          stock: 30,
        },
        {
          name: 'Jaket Denim Vintage Washed',
          category: 'Jaket & Outer',
          description: 'Jaket jeans denim 14oz klasik dengan aksen washed retro. Kuat dan timeless untuk segala gaya.',
          price: 245000,
          stock: 18,
        },
        {
          name: 'Celana Chino Slim Fit Stretch Khaki',
          category: 'Celana',
          description: 'Celana chino katun twill elastis (stretch) warna khaki, fleksibel dan nyaman dipakai seharian.',
          price: 175000,
          stock: 40,
        },
        {
          name: 'Celana Jeans Regular Fit Dark Blue',
          category: 'Celana',
          description: 'Celana jeans pria potongan regular fit warna biru gelap, bahan denim kokoh dengan jahitan double-stitch.',
          price: 210000,
          stock: 28,
        },
        {
          name: 'Celana Jogger Pants Sporty',
          category: 'Celana',
          description: 'Celana training jogger pinggang karet dengan cuff elastis di pergelangan kaki. Cocok untuk lari dan santai.',
          price: 125000,
          stock: 32,
        },
        {
          name: 'Sepatu Sneakers Canvas Low Top',
          category: 'Sepatu',
          description: 'Sneakers kanvas klasik sol karet vulcanized antiselip. Ringan, fleksibel, cocok untuk hangout harian.',
          price: 220000,
          stock: 24,
        },
        {
          name: 'Sepatu Slip-on Kasual Minimalis',
          category: 'Sepatu',
          description: 'Sepatu slip-on tanpa tali praktis bahan kanvas rajut bernapas dengan insole memory foam empuk.',
          price: 185000,
          stock: 20,
        },
        {
          name: 'Sepatu Running Breathable Mesh',
          category: 'Sepatu',
          description: 'Sepatu olahraga lari ultra-ringan dengan bantalan sol EVA empuk penyerap guncangan.',
          price: 280000,
          stock: 15,
        },
        {
          name: 'Tas Ransel Laptop Waterproof 20L',
          category: 'Aksesoris',
          description: 'Backpack ransel anti-air dengan kompartemen laptop hingga 15.6 inch dan port USB charger eksternal.',
          price: 235000,
          stock: 22,
        },
        {
          name: 'Topi Baseball Bordir Klasik',
          category: 'Aksesoris',
          description: 'Topi katun twill 6-panel dengan strap belakang besi pengatur ukuran. Melindungi dari panas matahari.',
          price: 55000,
          stock: 50,
        },
        {
          name: 'Dompet Kulit Pria Lipat Tiga',
          category: 'Aksesoris',
          description: 'Dompet pria kulit sintetis premium dengan 8 slot kartu, 2 slot uang kertas, dan perlindungan RFID blocker.',
          price: 85000,
          stock: 35,
        },
        {
          name: 'Kacamata Hitam Polarized UV400',
          category: 'Aksesoris',
          description: 'Sunglasses lensa terpolarisasi anti-silau dengan perlindungan sinar UV400 dan frame metal titanium ringan.',
          price: 110000,
          stock: 25,
        },
      ];

      await Product.bulkCreate(productsData);
      console.log(' 16 data produk beragam berhasil di-seed ke database!');
    } else {
      console.log(` Data produk sudah ada (${currentProductCount} produk), skip seeding produk.`);
    }

    console.log('\n=========================================');
    console.log('Seeding Selesai Sukses ');
    console.log('=========================================');
    process.exit(0);
  } catch (err) {
    console.error(' Gagal seeding database:', err.message);
    process.exit(1);
  }
}

seed();
