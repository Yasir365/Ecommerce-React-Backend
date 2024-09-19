var express = require('express');
var router = express.Router();
const authRoutes = require('./auth.routes.js');
const productsRoutes = require('./products.routes.js');

router.use('/auth', authRoutes);
router.use('/products', productsRoutes);

module.exports = router;
