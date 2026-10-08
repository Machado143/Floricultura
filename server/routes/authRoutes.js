const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { login } = require('../controllers/authController');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Muitas tentativas de login. Tente novamente mais tarde.' }
});

router.post('/login', loginLimiter, login);

module.exports = router;
