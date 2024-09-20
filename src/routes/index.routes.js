var express = require('express');
var router = express.Router();
const authRoutes = require('./auth.routes.js');
const productsRoutes = require('./products.routes.js');
const manageUsersRoutes = require('./manage-users.routes.js');

router.use('/auth', authRoutes);
router.use('/products', productsRoutes);
router.use('/users', manageUsersRoutes);

module.exports = router;
