const express = require('express');
const router = express.Router();
const { login, getMe, setup } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/login', login);
router.post('/setup', setup);
router.get('/me', protect, getMe);

module.exports = router;
