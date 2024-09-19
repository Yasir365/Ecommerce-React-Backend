const express = require('express');
const router = express.Router();
const { list, add, edit, remove } = require('../controllers/product.controller');
const { authenticateToken } = require('../middlewares/jwt.service');

router.get('/get-product', list);
router.post('/add-product', add);
router.post('/update', edit);
router.delete('/delete', remove);


module.exports = router;
