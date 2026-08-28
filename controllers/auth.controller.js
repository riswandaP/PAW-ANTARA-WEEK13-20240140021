const bcrypt = require('bcryptjs');
const { User } = require('../models');

async function renderLogin(req, res) {
  const storeName = process.env.STORE_NAME || 'Toko Kita';
  res.render('auth/login', {
    storeName,
    error: req.query.error || null,
    success: req.query.success || null,
  });
}

async function handleLogin(req, res) {
  try {
    const { usernameOrEmail, password } = req.body;
    const storeName = process.env.STORE_NAME || 'Toko Kita';

    if (!usernameOrEmail || !password) {
      return res.render('auth/login', {
        storeName,
        error: 'Username/Email dan password wajib diisi',
        success: null,
      });
    }

    const { Op } = require('sequelize');
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { username: usernameOrEmail.trim() },
          { email: usernameOrEmail.trim().toLowerCase() },
        ],
      },
    });

    if (!user) {
      return res.render('auth/login', {
        storeName,
        error: 'Akun tidak ditemukan. Periksa kembali username/email Anda.',
        success: null,
      });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.render('auth/login', {
        storeName,
        error: 'Password salah!',
        success: null,
      });
    }

    // Set session user
    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    // Role-based redirection
    if (user.role === 'admin') {
      return res.redirect('/admin/products');
    } else {
      return res.redirect('/');
    }
  } catch (err) {
    res.status(500).render('auth/login', {
      storeName: process.env.STORE_NAME || 'Toko Kita',
      error: 'Terjadi kesalahan sistem: ' + err.message,
      success: null,
    });
  }
}

async function renderRegister(req, res) {
  const storeName = process.env.STORE_NAME || 'Toko Kita';
  res.render('auth/register', {
    storeName,
    error: req.query.error || null,
  });
}

async function handleRegister(req, res) {
  try {
    const { username, email, password } = req.body;
    const storeName = process.env.STORE_NAME || 'Toko Kita';

    if (!username || !email || !password) {
      return res.render('auth/register', {
        storeName,
        error: 'Semua kolom pendaftaran wajib diisi',
      });
    }

    const { Op } = require('sequelize');
    const existing = await User.findOne({
      where: {
        [Op.or]: [{ username: username.trim() }, { email: email.trim().toLowerCase() }],
      },
    });

    if (existing) {
      return res.render('auth/register', {
        storeName,
        error: 'Username atau Email sudah terdaftar. Gunakan yang lain.',
      });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    await User.create({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: 'customer',
    });

    return res.redirect('/login?success=Pendaftaran berhasil! Silakan masuk.');
  } catch (err) {
    res.status(500).render('auth/register', {
      storeName: process.env.STORE_NAME || 'Toko Kita',
      error: 'Gagal mendaftar: ' + err.message,
    });
  }
}

function handleLogout(req, res) {
  req.session.destroy((err) => {
    res.redirect('/');
  });
}

module.exports = {
  renderLogin,
  handleLogin,
  renderRegister,
  handleRegister,
  handleLogout,
};
