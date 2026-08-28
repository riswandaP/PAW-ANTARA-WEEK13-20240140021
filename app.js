require('dotenv').config();
const express = require('express');
const session = require('express-session');
const { sequelize } = require('./models');
const startBot = require('./bot/bot');

// Middlewares
const { loadSessionUser } = require('./middlewares/auth.middleware');

// Routes
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const productRoutes = require('./routes/product.routes');
const orderRoutes = require('./routes/order.routes');
const chatRoutes = require('./routes/chat.routes');
const pageRoutes = require('./routes/page.routes');

const app = express();

app.set('view engine', 'ejs');
app.set('views', './views');

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'paw-antara-secret-key-20240140021',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 hari
      httpOnly: true,
    },
  })
);

// Load user session to res.locals for all EJS templates
app.use(loadSessionUser);

// Register Routes
app.use('/', authRoutes);
app.use('/admin', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/chat', chatRoutes);
app.use('/', pageRoutes);

// Error 404 handler
app.use((req, res) => {
  res.status(404).render('index', {
    products: [],
    categories: [],
    search: '',
    selectedCategory: '',
    storeName: process.env.STORE_NAME || 'Toko Kita',
    user: req.user || null,
    error: 'Halaman tidak ditemukan (404)',
    success: null,
    active: '',
  });
});

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log('Koneksi database berhasil');

    await sequelize.sync();
    console.log('Sync model selesai');

    app.listen(PORT, () => {
      console.log(`Server web jalan di http://localhost:${PORT}`);
    });

    startBot();
  } catch (err) {
    console.error('Gagal konek ke database:', err.message);
  }
}

start();
