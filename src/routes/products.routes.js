const express = require('express');
const router = express.Router();
const { productList, addProduct, editProduct, deleteProduct } = require('../controllers/product.controller');
const upload = require('../middlewares/multer.config');
const { authenticateToken, isAdmin } = require('../middlewares/jwt.service');


router.get('/get-product', productList);
router.post('/add-product', authenticateToken, isAdmin, upload.single('image'), addProduct);
router.post('/update-product', authenticateToken, isAdmin, upload.single('image'), editProduct);
router.delete('/delete-product',authenticateToken, isAdmin, deleteProduct);


module.exports = router;
