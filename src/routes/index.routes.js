var express = require('express');
var router = express.Router();
const authRoutes = require('./auth.routes.js');
const ticketsRoutes = require('./tickets.routes.js');
const { authenticateToken } = require('../middlewares/jwt.service');

router.use('/auth', authRoutes);
router.use('/tickets', authenticateToken, ticketsRoutes);

module.exports = router;
