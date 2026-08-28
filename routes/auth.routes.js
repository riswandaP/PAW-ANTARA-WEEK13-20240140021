const express = require('express');
const router = express.Router();
const {
  renderLogin,
  handleLogin,
  renderRegister,
  handleRegister,
  handleLogout,
} = require('../controllers/auth.controller');
const { redirectIfAuth, requireAuth } = require('../middlewares/auth.middleware');

router.get('/login', redirectIfAuth, renderLogin);
router.post('/login', redirectIfAuth, handleLogin);

router.get('/register', redirectIfAuth, renderRegister);
router.post('/register', redirectIfAuth, handleRegister);

router.get('/logout', requireAuth, handleLogout);
router.post('/logout', requireAuth, handleLogout);

module.exports = router;
