/**
 * 🛡️ DRY - AUTHENTICATION & RBAC MIDDLEWARE
 */

function loadSessionUser(req, res, next) {
  res.locals.user = req.session && req.session.user ? req.session.user : null;
  res.locals.storeName = process.env.STORE_NAME || 'Toko Kita';
  res.locals.currentPath = req.path;
  req.user = res.locals.user;
  next();
}

function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
      return res.status(401).json({ success: false, message: 'Silakan login terlebih dahulu' });
    }
    return res.redirect('/login?error=Silakan login terlebih dahulu');
  }
  next();
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
        return res.status(401).json({ success: false, message: 'Silakan login terlebih dahulu' });
      }
      return res.redirect('/login?error=Silakan login terlebih dahulu');
    }

    if (req.session.user.role !== role) {
      if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
        return res.status(403).json({ success: false, message: 'Akses ditolak: Anda tidak memiliki izin untuk halaman ini' });
      }
      return res.status(403).send('Akses ditolak: Halaman ini khusus ' + role);
    }

    next();
  };
}

function redirectIfAuth(req, res, next) {
  if (req.session && req.session.user) {
    if (req.session.user.role === 'admin') {
      return res.redirect('/admin/products');
    }
    return res.redirect('/');
  }
  next();
}

module.exports = {
  loadSessionUser,
  requireAuth,
  requireRole,
  redirectIfAuth,
};
