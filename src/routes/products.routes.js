const express = require('express');
const router = express.Router();
const { productList, addProduct, editProduct, deleteProduct } = require('../controllers/product.controller');
const upload = require('../middlewares/multer.config');
const { authenticateToken, isAdmin } = require('../middlewares/jwt.service');

router.post('/get-product', productList);
router.post('/add-product', authenticateToken, isAdmin, upload, addProduct);
router.post('/update-product', authenticateToken, isAdmin, upload, editProduct);
router.delete('/delete-product', authenticateToken, isAdmin, deleteProduct);

module.exports = router;
