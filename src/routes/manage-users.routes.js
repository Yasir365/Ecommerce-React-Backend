const express = require('express');
const router = express.Router();
const { list, toggleUserStatus } = require('../controllers/manage-users.controller');
const { authenticateToken, isAdmin } = require('../middlewares/jwt.middleware');


router.post('/list', authenticateToken, isAdmin, list);
router.get('/toggle-user-status', authenticateToken, isAdmin, toggleUserStatus);


module.exports = router;
