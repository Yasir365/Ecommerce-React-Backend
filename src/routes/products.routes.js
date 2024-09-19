const express = require('express');
const router = express.Router();
const { list, add, edit, remove } = require('../controllers/product.controller');
const upload = require('../middlewares/multer.config');
const { authenticateToken } = require('../middlewares/jwt.service');

router.get('/get-product', list);
router.post('/add-product', upload.single('image'), add);
router.post('/update', upload.single('image'), edit);
router.delete('/delete', remove);


module.exports = router;
