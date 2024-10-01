// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { login, register, verifyOTP, forgetPassword, resetPassword, verifyToken, changePassword } = require('../controllers/auth.controller');
const { authenticateToken } = require('../middlewares/jwt.middleware');


router.post('/login', login);
router.post('/register', register);
router.post('/verify-otp', verifyOTP);
router.post('/forget-password', forgetPassword);
router.post('/reset-password', resetPassword);
router.get('/verify-token', verifyToken);
router.post('/change-password', authenticateToken, changePassword);

module.exports = router;
