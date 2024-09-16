const express = require('express');
const router = express.Router();
const { list, add, edit, remove } = require('../controllers/tickets.controller');

router.get('/list', list);
router.post('/add', add);
router.post('/update', edit);
router.delete('/delete', remove);


module.exports = router;
