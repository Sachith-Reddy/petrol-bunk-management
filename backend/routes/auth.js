// ── routes/auth.js ─────────────────────────────────────────────
const router1 = require('express').Router();
const authCtrl = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
router1.post('/login',    authCtrl.login);
router1.post('/register', authCtrl.register);
router1.get('/profile',   verifyToken, authCtrl.getProfile);
module.exports = router1;
